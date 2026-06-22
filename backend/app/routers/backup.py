import io
import json
import zipfile
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Publication, SiteConfig, Tag, Talk, User
from ..security import get_current_user
from ..storage import download_bytes, put_bytes

router = APIRouter(prefix="/api", tags=["backup"])

BACKUP_VERSION = 1


def _iso(value):
    if isinstance(value, datetime | date):
        return value.isoformat()
    return value


@router.get("/backup")
def export_backup(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Export the whole site as a self-contained .zip (data.json + assets/)."""
    config = db.get(SiteConfig, 1)
    tags = db.query(Tag).all()
    pubs = db.query(Publication).all()
    talks = db.query(Talk).all()
    projects = db.query(Project).all()

    asset_keys: list[str] = []
    if config and config.headshot_key:
        asset_keys.append(config.headshot_key)
    asset_keys += [p.file_key for p in pubs if p.file_key]

    data = {
        "version": BACKUP_VERSION,
        "exported_at": datetime.now(UTC).isoformat(),
        "site_config": {
            "profile": config.profile if config else {},
            "theme": config.theme if config else {},
            "features": config.features if config else {},
            "headshot_key": config.headshot_key if config else None,
        },
        "tags": [{"name": t.name, "slug": t.slug} for t in tags],
        "publications": [
            {
                "title": p.title,
                "authors": p.authors,
                "venue": p.venue,
                "year": p.year,
                "abstract": p.abstract,
                "doi": p.doi,
                "url": p.url,
                "featured": p.featured,
                "sort_order": p.sort_order,
                "file_key": p.file_key,
                "tag_slugs": [t.slug for t in p.tags],
            }
            for p in pubs
        ],
        "talks": [
            {
                "title": t.title,
                "event": t.event,
                "location": t.location,
                "event_date": _iso(t.event_date),
                "url": t.url,
                "description": t.description,
                "sort_order": t.sort_order,
            }
            for t in talks
        ],
        "projects": [
            {
                "name": pr.name,
                "description": pr.description,
                "url": pr.url,
                "source_url": pr.source_url,
                "sort_order": pr.sort_order,
            }
            for pr in projects
        ],
        "assets": [],
    }

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for key in asset_keys:
            fetched = download_bytes(key)
            if fetched is None:
                continue
            content, content_type = fetched
            zf.writestr(f"assets/{key}", content)
            data["assets"].append({"key": key, "content_type": content_type})
        zf.writestr("data.json", json.dumps(data, indent=2))

    buffer.seek(0)
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="openvitae-backup-{stamp}.zip"'},
    )


@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Restore from a backup .zip, replacing all current site data."""
    try:
        raw = await file.read()
        zf = zipfile.ZipFile(io.BytesIO(raw))
        data = json.loads(zf.read("data.json"))
    except (zipfile.BadZipFile, KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid backup file") from exc

    if data.get("version") != BACKUP_VERSION:
        raise HTTPException(status_code=400, detail="Unsupported backup version")

    # Wipe existing content (publications/talks/projects/tags) and reset config.
    db.query(Publication).delete()
    db.query(Talk).delete()
    db.query(Project).delete()
    db.query(Tag).delete()
    db.flush()

    # Re-upload assets, preserving their original keys.
    for asset in data.get("assets", []):
        content = zf.read(f"assets/{asset['key']}")
        put_bytes(asset["key"], content, asset.get("content_type", "application/octet-stream"))

    # Tags (slug -> Tag).
    tags_by_slug: dict[str, Tag] = {}
    for t in data.get("tags", []):
        tag = Tag(name=t["name"], slug=t["slug"])
        db.add(tag)
        tags_by_slug[t["slug"]] = tag

    for p in data.get("publications", []):
        slugs = p.pop("tag_slugs", [])
        pub = Publication(**{k: v for k, v in p.items()})
        pub.tags = [tags_by_slug[s] for s in slugs if s in tags_by_slug]
        db.add(pub)

    for t in data.get("talks", []):
        ed = t.get("event_date")
        db.add(Talk(**{**t, "event_date": date.fromisoformat(ed) if ed else None}))

    for pr in data.get("projects", []):
        db.add(Project(**pr))

    config = db.get(SiteConfig, 1)
    if config is None:
        config = SiteConfig(id=1)
        db.add(config)
    sc = data.get("site_config", {})
    config.profile = sc.get("profile", {})
    config.theme = sc.get("theme", {})
    config.features = sc.get("features", {})
    config.headshot_key = sc.get("headshot_key")

    db.commit()
    return {"status": "restored"}
