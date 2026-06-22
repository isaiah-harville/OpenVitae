"""Parse/fetch publications from external sources (BibTeX, ORCID, Crossref).

Pure data mapping — no DB access. Each function returns a list of plain dicts
matching the Publication fields the import router knows how to persist:
``title, authors, venue, year, doi, url, abstract``.
"""

import json
import re
import urllib.error
import urllib.parse
import urllib.request

import bibtexparser
from bibtexparser.bparser import BibTexParser
from bibtexparser.customization import convert_to_unicode
from fastapi import HTTPException

ORCID_API = "https://pub.orcid.org/v3.0"
CROSSREF_API = "https://api.crossref.org/works/"
ORCID_RE = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$")

ParsedPub = dict[str, str | int | None]


# ---------- shared helpers ----------
def _clean(value: str | None) -> str | None:
    if not value:
        return None
    text = value.replace("{", "").replace("}", "").replace("\n", " ").strip()
    text = re.sub(r"\s+", " ", text)
    return text or None


def _format_authors(raw: str | None) -> str | None:
    """Normalize a BibTeX-style ``A and B and C`` list into ``First Last, …``."""
    if not raw:
        return None
    names = []
    for part in re.split(r"\s+and\s+", raw.replace("\n", " ")):
        part = part.strip()
        if not part:
            continue
        if "," in part:
            last, first = part.split(",", 1)
            names.append(f"{first.strip()} {last.strip()}".strip())
        else:
            names.append(part)
    return ", ".join(n for n in names if n) or None


def _year(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"\d{4}", value)
    return int(match.group()) if match else None


def _fetch_json(url: str, *, timeout: int = 10) -> dict:
    req = urllib.request.Request(
        url, headers={"Accept": "application/json", "User-Agent": "OpenVitae"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 (fixed hosts)
        return json.loads(resp.read())


# ---------- BibTeX ----------
def parse_bibtex(text: str) -> list[ParsedPub]:
    """Parse a BibTeX string into publication dicts."""
    parser = BibTexParser(common_strings=True, ignore_nonstandard_types=False)
    parser.customization = convert_to_unicode
    try:
        db = bibtexparser.loads(text, parser=parser)
    except Exception as exc:  # malformed input
        raise HTTPException(status_code=400, detail="Could not parse BibTeX") from exc

    return [_map_bibtex_entry(e) for e in db.entries]


def _map_bibtex_entry(entry: dict) -> ParsedPub:
    doi = _clean(entry.get("doi"))
    venue = entry.get("journal") or entry.get("booktitle") or entry.get("publisher")
    return {
        "title": _clean(entry.get("title")),
        "authors": _format_authors(entry.get("author")),
        "venue": _clean(venue),
        "year": _year(entry.get("year")),
        "doi": doi,
        "url": _clean(entry.get("url")) or (f"https://doi.org/{doi}" if doi else None),
        "abstract": _clean(entry.get("abstract")),
    }


# ---------- ORCID ----------
def fetch_orcid_works(orcid: str, *, enrich: bool = True, max_enrich: int = 60) -> list[ParsedPub]:
    """Fetch a researcher's works from the public ORCID API.

    Summaries carry title/year/venue/doi but not authors, so when ``enrich`` is
    set we backfill authors/venue from Crossref for works that expose a DOI
    (capped at ``max_enrich`` lookups to bound the request time).
    """
    orcid = orcid.strip()
    if not ORCID_RE.match(orcid):
        raise HTTPException(
            status_code=400, detail="Invalid ORCID iD (expected 0000-0000-0000-0000)"
        )

    try:
        data = _fetch_json(f"{ORCID_API}/{orcid}/works")
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise HTTPException(status_code=404, detail="ORCID record not found") from exc
        raise HTTPException(status_code=502, detail="ORCID request failed") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="ORCID request failed") from exc

    results: list[ParsedPub] = []
    enriched = 0
    for group in data.get("group", []):
        summaries = group.get("work-summary") or []
        if not summaries:
            continue
        item = _map_orcid_summary(summaries[0])
        if not item.get("title"):
            continue
        if enrich and item.get("doi") and enriched < max_enrich:
            meta = lookup_doi(str(item["doi"]))
            if meta:
                item["authors"] = item.get("authors") or meta.get("authors")
                item["venue"] = item.get("venue") or meta.get("venue")
                enriched += 1
        results.append(item)
    return results


def _map_orcid_summary(summary: dict) -> ParsedPub:
    title = (((summary.get("title") or {}).get("title")) or {}).get("value")
    year = (((summary.get("publication-date") or {}).get("year")) or {}).get("value")
    venue = (summary.get("journal-title") or {}).get("value")
    url = (summary.get("url") or {}).get("value")

    doi = None
    for ext in (summary.get("external-ids") or {}).get("external-id") or []:
        if (ext.get("external-id-type") or "").lower() == "doi":
            doi = ext.get("external-id-value")
            url = url or (ext.get("external-id-url") or {}).get("value")
            break

    return {
        "title": _clean(title),
        "authors": None,
        "venue": _clean(venue),
        "year": int(year) if year and str(year).isdigit() else None,
        "doi": doi,
        "url": url or (f"https://doi.org/{doi}" if doi else None),
        "abstract": None,
    }


# ---------- Crossref (DOI lookup) ----------
def _crossref_message(doi: str) -> dict | None:
    try:
        data = _fetch_json(f"{CROSSREF_API}{urllib.parse.quote(doi.strip())}", timeout=8)
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None
    return data.get("message") or None


def _crossref_authors(msg: dict) -> str | None:
    names = [
        f"{a.get('given', '')} {a.get('family', '')}".strip() for a in (msg.get("author") or [])
    ]
    return ", ".join(n for n in names if n) or None


def _strip_html(text: str | None) -> str | None:
    """Crossref abstracts come back as JATS markup; flatten to plain text."""
    if not text:
        return None
    return _clean(re.sub(r"<[^>]+>", " ", text))


def lookup_doi(doi: str) -> dict | None:
    """Best-effort metadata (authors, venue) for a DOI — used to enrich imports."""
    msg = _crossref_message(doi)
    if not msg:
        return None
    return {"authors": _crossref_authors(msg), "venue": (msg.get("container-title") or [None])[0]}


def fetch_doi(doi: str) -> ParsedPub | None:
    """Full publication metadata for a single DOI via Crossref."""
    msg = _crossref_message(doi)
    if not msg:
        return None
    parts = (msg.get("issued") or {}).get("date-parts") or []
    year = parts[0][0] if parts and parts[0] else None
    return {
        "title": _clean((msg.get("title") or [None])[0]),
        "authors": _crossref_authors(msg),
        "venue": _clean((msg.get("container-title") or [None])[0]),
        "year": year if isinstance(year, int) else None,
        "doi": msg.get("DOI") or doi.strip(),
        "url": msg.get("URL") or f"https://doi.org/{doi.strip()}",
        "abstract": _strip_html(msg.get("abstract")),
    }
