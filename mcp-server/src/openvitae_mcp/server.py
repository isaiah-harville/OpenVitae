"""OpenVitae MCP server: lets an LLM client read and edit an OpenVitae site via its API."""

from __future__ import annotations

import argparse
from typing import Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations

from .client import OpenVitaeClient, OpenVitaeError, Settings

INSTRUCTIONS = """\
Tools for editing an OpenVitae site: a config-driven personal CV / portfolio.

What renders publicly is the site config plus content collections:
- profile: name, siteName, title, bio (Markdown, inline HTML allowed), location, email,
  links [{label, url}], socials [{platform, url}] (platform: github, linkedin, x,
  bluesky, mastodon, scholar, orcid, ...), education [{institution, degree,
  concentration, startYear, endYear}].
- theme: palette (neutral, blue, violet, rose, red, orange, green, teal),
  defaultMode (light|dark|system), layout (linear|pages), customPrimary (optional hex).
- features: booleans that show or hide sections: about, contact, headshot,
  publications, talks, projects, skills, blog.
- pages: optional page-builder document ({version, pages:[{id, slug, title, inNav,
  blocks:[...]}]}). Read it with get_site_config before changing it; the first page
  must be the homepage (id and slug "home").
- Collections: projects (with screenshots, tags, skills), skills, tags,
  publications, talks (with uploaded slides and video), blog posts.

Guidance:
- Read before writing. update_* config tools merge keys into the existing object;
  pass replace=true only when you mean to drop keys.
- Project `description` is a one-line summary shown on cards; `content` is Markdown for
  the project's detail page.
- Screenshots are uploaded from a local file path or an http(s) URL (jpeg, png, webp,
  gif; under 8 MB). The first screenshot is the project's cover image.
- Every write goes live on the public site immediately. Confirm destructive changes
  (deletes, replacing pages) with the user first.
"""

mcp = MCPServer(name="openvitae", title="OpenVitae", instructions=INSTRUCTIONS)
_client: OpenVitaeClient | None = None

READ = ToolAnnotations(readOnlyHint=True, openWorldHint=False)
WRITE = ToolAnnotations(readOnlyHint=False, destructiveHint=False, openWorldHint=False)
DESTRUCTIVE = ToolAnnotations(readOnlyHint=False, destructiveHint=True, openWorldHint=False)


def client() -> OpenVitaeClient:
    global _client
    if _client is None:
        _client = OpenVitaeClient(Settings.from_env())
    return _client


def set_client(value: OpenVitaeClient | None) -> None:
    """Swap the API client (used by tests)."""
    global _client
    _client = value


def call(method: str, path: str, **kwargs: Any) -> Any:
    try:
        return client().request(method, path, **kwargs)
    except OpenVitaeError as exc:
        raise ToolError(str(exc)) from exc


def _clean(fields: dict[str, Any], allowed: set[str]) -> dict[str, Any]:
    unknown = set(fields) - allowed
    if unknown:
        raise ToolError(
            f"Unknown field(s): {', '.join(sorted(unknown))}. Allowed: {sorted(allowed)}"
        )
    return fields


# ---------------------------------------------------------------- site config
@mcp.tool(annotations=READ)
def get_site_config() -> dict:
    """Return the full site config: profile, theme, features, pages, headshot_url."""
    return call("GET", "/site/config")


def _merge_section(section: str, changes: dict[str, Any], replace: bool) -> dict:
    current = call("GET", "/site/config")
    value = changes if replace else {**(current.get(section) or {}), **changes}
    return call("PUT", "/site/config", json={section: value})[section]


@mcp.tool(annotations=WRITE)
def update_profile(changes: dict[str, Any], replace: bool = False) -> dict:
    """Merge `changes` into the profile (name, siteName, title, bio, location, email,
    links, socials, education). Lists such as links are replaced whole, so send the
    complete list. Returns the saved profile."""
    return _merge_section("profile", changes, replace)


@mcp.tool(annotations=WRITE)
def update_theme(changes: dict[str, Any], replace: bool = False) -> dict:
    """Merge `changes` into the theme (palette, defaultMode, layout, customPrimary)."""
    return _merge_section("theme", changes, replace)


@mcp.tool(annotations=WRITE)
def update_features(changes: dict[str, bool], replace: bool = False) -> dict:
    """Turn public sections on or off, e.g. {"projects": true, "blog": false}."""
    return _merge_section("features", changes, replace)


@mcp.tool(annotations=DESTRUCTIVE)
def set_pages(pages: dict[str, Any]) -> dict:
    """Replace the page-builder document ({version, pages}). Fetch it with
    get_site_config first and send the whole edited document back."""
    return call("PUT", "/site/config", json={"pages": pages})["pages"]


@mcp.tool(annotations=WRITE)
def upload_headshot(source: str) -> dict:
    """Upload the profile headshot from a local file path or an http(s) image URL."""
    try:
        return client().upload_image("/uploads/headshot", source)
    except OpenVitaeError as exc:
        raise ToolError(str(exc)) from exc


# ---------------------------------------------------------------- projects
PROJECT_FIELDS = {
    "name",
    "description",
    "content",
    "url",
    "source_url",
    "sort_order",
    "tag_ids",
    "skill_ids",
}


def _summarize_project(project: dict) -> dict:
    return {
        **{k: project.get(k) for k in ("id", "slug", "name", "description", "url", "source_url")},
        "sort_order": project.get("sort_order"),
        "skills": [s["name"] for s in project.get("skills", [])],
        "tags": [t["name"] for t in project.get("tags", [])],
        "screenshot_count": len(project.get("screenshot_urls", [])),
        "has_content": bool(project.get("content")),
    }


@mcp.tool(annotations=READ)
def list_projects() -> list[dict]:
    """List projects in display order (summaries; use get_project for full content)."""
    return [_summarize_project(p) for p in call("GET", "/projects")]


@mcp.tool(annotations=READ)
def get_project(slug: str) -> dict:
    """Return one project, including its Markdown content and screenshot URLs."""
    return call("GET", f"/projects/{slug}")


@mcp.tool(annotations=WRITE)
def create_project(
    name: str,
    description: str | None = None,
    content: str | None = None,
    url: str | None = None,
    source_url: str | None = None,
    skill_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
) -> dict:
    """Create a project. `url` is the live site or docs, `source_url` the repository.
    New projects go first; use reorder_projects to place them."""
    payload = {
        "name": name,
        "description": description,
        "content": content,
        "url": url,
        "source_url": source_url,
        "skill_ids": skill_ids or [],
        "tag_ids": tag_ids or [],
    }
    return _summarize_project(call("POST", "/projects", json=payload))


@mcp.tool(annotations=WRITE)
def update_project(project_id: int, fields: dict[str, Any]) -> dict:
    """Update a project. `fields` may hold name, description, content, url, source_url,
    sort_order, tag_ids, skill_ids. Only the keys you pass change."""
    payload = _clean(fields, PROJECT_FIELDS)
    return _summarize_project(call("PUT", f"/projects/{project_id}", json=payload))


@mcp.tool(annotations=WRITE)
def reorder_projects(project_ids: list[int]) -> list[dict]:
    """Set the display order: pass every project id, first to last."""
    return [
        _summarize_project(p) for p in call("PUT", "/projects/reorder", json={"ids": project_ids})
    ]


@mcp.tool(annotations=DESTRUCTIVE)
def delete_project(project_id: int) -> str:
    """Delete a project and its screenshots."""
    call("DELETE", f"/projects/{project_id}")
    return f"Deleted project {project_id}"


@mcp.tool(annotations=WRITE)
def add_project_screenshot(project_id: int, source: str) -> dict:
    """Append a screenshot to a project from a local file path or an http(s) image URL.
    Returns the project's screenshot URLs in order."""
    try:
        return client().upload_image(f"/uploads/projects/{project_id}/screenshots", source)
    except OpenVitaeError as exc:
        raise ToolError(str(exc)) from exc


@mcp.tool(annotations=DESTRUCTIVE)
def remove_project_screenshot(project_id: int, index: int) -> dict:
    """Remove the screenshot at zero-based `index` from a project."""
    return call("DELETE", f"/uploads/projects/{project_id}/screenshots", params={"index": index})


# ---------------------------------------------------------------- skills & tags
@mcp.tool(annotations=READ)
def list_skills() -> list[dict]:
    """List skills (id, name, category, color) in display order."""
    return call("GET", "/skills")


@mcp.tool(annotations=WRITE)
def create_skill(name: str, category: str | None = None, color: str | None = None) -> dict:
    """Create a skill. `color` is an optional hex accent."""
    return call("POST", "/skills", json={"name": name, "category": category, "color": color})


@mcp.tool(annotations=WRITE)
def update_skill(skill_id: int, fields: dict[str, Any]) -> dict:
    """Update a skill's name, category, color, or sort_order."""
    payload = _clean(fields, {"name", "category", "color", "sort_order"})
    return call("PUT", f"/skills/{skill_id}", json=payload)


@mcp.tool(annotations=DESTRUCTIVE)
def delete_skill(skill_id: int) -> str:
    """Delete a skill (it is removed from every project that used it)."""
    call("DELETE", f"/skills/{skill_id}")
    return f"Deleted skill {skill_id}"


@mcp.tool(annotations=READ)
def list_tags() -> list[dict]:
    """List tags used to group publications and projects."""
    return call("GET", "/tags")


@mcp.tool(annotations=WRITE)
def create_tag(name: str, color: str | None = None) -> dict:
    """Create a tag."""
    return call("POST", "/tags", json={"name": name, "color": color})


@mcp.tool(annotations=DESTRUCTIVE)
def delete_tag(tag_id: int) -> str:
    """Delete a tag."""
    call("DELETE", f"/tags/{tag_id}")
    return f"Deleted tag {tag_id}"


# ---------------------------------------------------------------- publications
PUBLICATION_FIELDS = {
    "title",
    "authors",
    "venue",
    "year",
    "abstract",
    "doi",
    "url",
    "featured",
    "sort_order",
    "tag_ids",
}


@mcp.tool(annotations=READ)
def list_publications() -> list[dict]:
    """List publications."""
    return call("GET", "/publications")


@mcp.tool(annotations=WRITE)
def create_publication(fields: dict[str, Any]) -> dict:
    """Create a publication. `fields` needs title and may hold authors, venue, year,
    abstract, doi, url, featured, sort_order, tag_ids."""
    payload = _clean(fields, PUBLICATION_FIELDS)
    if not payload.get("title"):
        raise ToolError("title is required")
    return call("POST", "/publications", json=payload)


@mcp.tool(annotations=WRITE)
def update_publication(publication_id: int, fields: dict[str, Any]) -> dict:
    """Update a publication; only the keys you pass change."""
    return call("PUT", f"/publications/{publication_id}", json=_clean(fields, PUBLICATION_FIELDS))


@mcp.tool(annotations=DESTRUCTIVE)
def delete_publication(publication_id: int) -> str:
    """Delete a publication."""
    call("DELETE", f"/publications/{publication_id}")
    return f"Deleted publication {publication_id}"


@mcp.tool(annotations=WRITE)
def import_publication_by_doi(doi: str) -> dict:
    """Import one publication's metadata from Crossref by DOI (duplicates are skipped)."""
    return call("POST", "/import/doi", json={"doi": doi})


@mcp.tool(annotations=WRITE)
def import_publications_bibtex(bibtex: str) -> dict:
    """Import publications from BibTeX text (duplicates are skipped)."""
    return call("POST", "/import/bibtex", json={"bibtex": bibtex})


# ---------------------------------------------------------------- talks
TALK_FIELDS = {"title", "event", "location", "event_date", "url", "description", "sort_order"}


@mcp.tool(annotations=READ)
def list_talks() -> list[dict]:
    """List talks."""
    return call("GET", "/talks")


@mcp.tool(annotations=WRITE)
def create_talk(fields: dict[str, Any]) -> dict:
    """Create a talk. `fields` needs title and may hold event, location,
    event_date (YYYY-MM-DD), url, description, sort_order."""
    payload = _clean(fields, TALK_FIELDS)
    if not payload.get("title"):
        raise ToolError("title is required")
    return call("POST", "/talks", json=payload)


@mcp.tool(annotations=WRITE)
def update_talk(talk_id: int, fields: dict[str, Any]) -> dict:
    """Update a talk; only the keys you pass change."""
    return call("PUT", f"/talks/{talk_id}", json=_clean(fields, TALK_FIELDS))


@mcp.tool(annotations=DESTRUCTIVE)
def delete_talk(talk_id: int) -> str:
    """Delete a talk."""
    call("DELETE", f"/talks/{talk_id}")
    return f"Deleted talk {talk_id}"


def _attach(talk_id: int, kind: str, source: str) -> dict:
    try:
        return client().upload_talk_attachment(talk_id, kind, source)
    except OpenVitaeError as exc:
        raise ToolError(str(exc)) from exc


@mcp.tool(annotations=WRITE)
def upload_talk_slides(talk_id: int, source: str) -> dict:
    """Attach slides (PDF, PPT/PPTX, or ODP) to a talk from a local path or an http(s)
    URL, replacing any existing slides. Returns the updated talk."""
    return _attach(talk_id, "slides", source)


@mcp.tool(annotations=WRITE)
def upload_talk_video(talk_id: int, source: str) -> dict:
    """Attach a recording (MP4, WebM, or MOV) to a talk from a local path or an http(s)
    URL, replacing any existing video. It plays inline on the public site. Large files
    are fine: they stream straight to object storage."""
    return _attach(talk_id, "video", source)


@mcp.tool(annotations=DESTRUCTIVE)
def remove_talk_attachment(talk_id: int, kind: str) -> dict:
    """Remove a talk's "slides" or "video"."""
    if kind not in {"slides", "video"}:
        raise ToolError('kind must be "slides" or "video"')
    return call("DELETE", f"/uploads/talks/{talk_id}/{kind}")


ATTACHMENT_OWNERS = {"talks", "blog-posts"}


@mcp.tool(annotations=WRITE)
def attach_file(owner: str, owner_id: int, source: str) -> dict:
    """Attach a file (handout, code archive, original deck, image, document) to a talk
    or blog post from a local path or an http(s) URL. owner is "talks" or "blog-posts".
    Adds to the existing attachments. Returns the attachment, including its id, which
    remove_attachment takes."""
    if owner not in ATTACHMENT_OWNERS:
        raise ToolError('owner must be "talks" or "blog-posts"')
    try:
        return client().attach_file(owner, owner_id, source)
    except OpenVitaeError as exc:
        raise ToolError(str(exc)) from exc


@mcp.tool(annotations=DESTRUCTIVE)
def remove_attachment(attachment_id: int) -> str:
    """Remove a file attached to a talk or blog post by its attachment id."""
    call("DELETE", f"/uploads/attachments/{attachment_id}")
    return f"Removed attachment {attachment_id}"


# ---------------------------------------------------------------- blog
BLOG_FIELDS = {"title", "excerpt", "content", "published"}


@mcp.tool(annotations=READ)
def list_blog_posts() -> list[dict]:
    """List all blog posts, drafts included."""
    return call("GET", "/blog/posts")


@mcp.tool(annotations=WRITE)
def create_blog_post(
    title: str, content: str = "", excerpt: str = "", published: bool = False
) -> dict:
    """Create a Markdown blog post. Leave published=false to save a private draft."""
    payload = {"title": title, "content": content, "excerpt": excerpt, "published": published}
    return call("POST", "/blog/posts", json=payload)


@mcp.tool(annotations=WRITE)
def update_blog_post(post_id: int, fields: dict[str, Any]) -> dict:
    """Update a blog post's title, excerpt, content, or published flag."""
    return call("PUT", f"/blog/posts/{post_id}", json=_clean(fields, BLOG_FIELDS))


@mcp.tool(annotations=DESTRUCTIVE)
def delete_blog_post(post_id: int) -> str:
    """Delete a blog post."""
    call("DELETE", f"/blog/posts/{post_id}")
    return f"Deleted blog post {post_id}"


# ---------------------------------------------------------------- entry point
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--transport",
        choices=["stdio", "streamable-http"],
        default="stdio",
        help="stdio (default) for local clients; streamable-http to serve over HTTP",
    )
    args = parser.parse_args()
    mcp.run(args.transport)


if __name__ == "__main__":
    main()
