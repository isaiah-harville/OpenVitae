import io
import json
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Publication, SiteConfig, User
from ..pub_import import ParsedPub, fetch_doi, fetch_orcid_works, parse_bibtex
from ..schemas import BibtexImportRequest, DoiImportRequest, ImportResult, OrcidImportRequest
from ..security import get_current_user
from ..storage import delete_object, presigned_url, upload_fileobj

router = APIRouter(prefix="/api/import", tags=["import"])


def _norm_title(title: str) -> str:
    return " ".join(title.lower().split())


def _persist_pubs(db: Session, parsed: list[ParsedPub]) -> ImportResult:
    """Create publications from parsed dicts, skipping ones that already exist
    (matched by DOI or normalized title, including duplicates within the batch)."""
    existing = db.query(Publication.title, Publication.doi).all()
    seen_dois = {p.doi.lower() for p in existing if p.doi}
    seen_titles = {_norm_title(p.title) for p in existing if p.title}

    created: list[str] = []
    skipped = 0
    for item in parsed:
        title = item.get("title")
        if not title:
            skipped += 1
            continue
        title = str(title)
        doi = str(item["doi"]).lower() if item.get("doi") else None
        norm = _norm_title(title)
        if (doi and doi in seen_dois) or norm in seen_titles:
            skipped += 1
            continue

        db.add(
            Publication(
                title=title,
                authors=item.get("authors"),
                venue=item.get("venue"),
                year=item.get("year"),
                doi=item.get("doi"),
                url=item.get("url"),
                abstract=item.get("abstract"),
            )
        )
        if doi:
            seen_dois.add(doi)
        seen_titles.add(norm)
        created.append(title)

    db.commit()
    return ImportResult(created=len(created), skipped=skipped, titles=created)


@router.post("/bibtex", response_model=ImportResult)
def import_bibtex(
    payload: BibtexImportRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Bulk-import publications from a BibTeX document."""
    return _persist_pubs(db, parse_bibtex(payload.bibtex))


@router.post("/orcid", response_model=ImportResult)
def import_orcid(
    payload: OrcidImportRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Bulk-import publications from a public ORCID record."""
    works = fetch_orcid_works(payload.orcid, enrich=payload.enrich)
    return _persist_pubs(db, works)


@router.post("/doi", response_model=ImportResult)
def import_doi(
    payload: DoiImportRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Import a single publication by DOI (metadata via Crossref)."""
    pub = fetch_doi(payload.doi)
    if pub is None:
        raise HTTPException(status_code=404, detail="DOI not found")
    return _persist_pubs(db, [pub])


GITHUB_API = "https://api.github.com/users/"


def _fetch_github_user(username: str) -> dict:
    req = urllib.request.Request(
        f"{GITHUB_API}{username}",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "OpenVitae"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:  # noqa: S310 (fixed host)
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise HTTPException(status_code=404, detail="GitHub user not found") from exc
        raise HTTPException(status_code=502, detail="GitHub request failed") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="GitHub request failed") from exc


def _fetch_profile_readme(username: str) -> str | None:
    """Fetch the profile README (the special <user>/<user> repo), if any."""
    req = urllib.request.Request(
        f"https://api.github.com/repos/{username}/{username}/readme",
        headers={"Accept": "application/vnd.github.raw", "User-Agent": "OpenVitae"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:  # noqa: S310 (fixed host)
            text = resp.read().decode("utf-8").strip()
            return text or None
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


@router.get("/github/{username}")
def import_github(username: str, _: User = Depends(get_current_user)):
    """Map a public GitHub profile into OpenVitae profile fields (no mutation)."""
    u = _fetch_github_user(username)

    links = []
    blog = (u.get("blog") or "").strip()
    if blog:
        links.append({"label": "Website", "url": blog if "://" in blog else f"https://{blog}"})

    socials = [{"platform": "github", "url": u.get("html_url")}]
    if u.get("twitter_username"):
        socials.append({"platform": "x", "url": f"https://x.com/{u['twitter_username']}"})

    # Prefer the rich profile README (Markdown) over the one-line bio when present.
    bio = _fetch_profile_readme(username) or u.get("bio")

    return {
        "name": u.get("name") or u.get("login"),
        "bio": bio,
        "location": u.get("location"),
        "links": links,
        "socials": socials,
        "avatar_url": u.get("avatar_url"),
    }


@router.post("/github/{username}/headshot")
def import_github_headshot(
    username: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Download the GitHub avatar and store it as the site headshot."""
    avatar_url = _fetch_github_user(username).get("avatar_url")
    if not avatar_url:
        raise HTTPException(status_code=404, detail="No avatar on that profile")

    # avatar_url is supplied by the GitHub API (avatars.githubusercontent.com), not the
    # caller, so this is not an open SSRF vector.
    req = urllib.request.Request(avatar_url, headers={"User-Agent": "OpenVitae"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:  # noqa: S310
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg")
    except (urllib.error.URLError, TimeoutError) as exc:
        raise HTTPException(status_code=502, detail="Could not fetch avatar") from exc

    config = db.get(SiteConfig, 1)
    if config is None:
        config = SiteConfig(id=1, profile={}, theme={}, features={})
        db.add(config)
    if config.headshot_key:
        delete_object(config.headshot_key)

    key = upload_fileobj(io.BytesIO(data), content_type, "headshots", "github-avatar.png")
    config.headshot_key = key
    db.commit()
    return {"headshot_url": presigned_url(key)}
