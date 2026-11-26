# OpenVitae

A config-driven CV website and publication manager for academics, researchers, and
professionals. Run your own personal site: edit content, upload a headshot, recolor the
theme, manage your papers with tags, and toggle features — all from a `/admin` dashboard.

## Architecture

| Service    | Tech                          | Purpose                                            |
| ---------- | ----------------------------- | -------------------------------------------------- |
| `frontend` | SvelteKit 3, Sivir UI, Tailwind v4 | Public CV site + `/admin` dashboard |
| `api`      | FastAPI (Python 3.12, uv)     | Auth, site config, publications/tags, file uploads |
| `db`       | PostgreSQL 17                 | Relational data                                    |
| `s3`       | SeaweedFS (S3-compatible)     | Object storage for headshots, screenshots & PDFs   |

The public site is **config-driven**: a single `SiteConfig` record (profile, theme
palette, feature flags) plus publications and tags fully describe what renders. The admin
edits that config; the frontend renders it.

```
Browser ──> frontend (SvelteKit) ──SSR──> api (FastAPI) ──> Postgres
   │                                          │
   └──── presigned URLs ──> S3 store <────────┘
```

## Quick start (Docker)

```bash
cp .env.example .env          # then edit secrets (JWT_SECRET, ADMIN_PASSWORD, ...)
docker compose up -d --build
```

| URL                              | What                          |
| -------------------------------- | ----------------------------- |
| http://localhost:3000            | Public CV site                |
| http://localhost:3000/admin      | Admin dashboard (login)       |
| http://localhost:8000/docs       | API docs (OpenAPI/Swagger)    |
| http://localhost:9000            | S3 API (presigned file links) |

On first boot the API seeds an admin user and a default site config from your `.env`:

- **Email:** `ADMIN_EMAIL` (default `admin@openvitae.local`)
- **Password:** `ADMIN_PASSWORD` (default `changeme` — change this!)

Reset everything (including the database and uploads): `docker compose down -v`.

> **Upgrading from a MinIO-based install (before v1.1.0)?** MinIO no longer publishes
> images, so object storage is now SeaweedFS on a new `s3data` volume. Download a backup
> from **Admin → Data** before upgrading and restore it afterwards to bring your uploads
> across. The old `miniodata` volume is left untouched.

## Configuration

All config is via environment variables — see [.env.example](.env.example). Key ones:

- `JWT_SECRET` — **set a long random string in production.**
- `API_TOKEN` — optional admin token for automation such as the MCP server.
- `TALK_VIDEO_MAX_MB` / `TALK_SLIDES_MAX_MB` — upload limits for talk recordings and
  slides (default 4096 and 200).
- `ATTACHMENT_MAX_MB` — upload limit for each file attached to a talk or blog post
  (default 500).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded on first run only.
- `S3_PUBLIC_ENDPOINT_URL` — the S3 endpoint the *browser* can reach (used to sign
  download URLs). Behind a real domain, set this to your public object-storage URL.
- `SERVER_API_URL` — internal API origin used by SvelteKit at request time. Browser
  requests use the same-origin `/api/*` proxy.


## Features

- 🔐 Admin login (JWT). Auth is isolated behind one dependency so it can later be swapped
  for an external OIDC provider (e.g. Keycloak) — tracked in the issues.
- 📝 Edit profile (name, title, bio, location, contact links).
- 🖼️ Upload a headshot.
- 🎨 Change the site color palette (and font) live.
- 📚 Manage publications: title, authors, venue, year, abstract, DOI, URL, PDF upload.
- 📥 Import publications from a **BibTeX** file, an **ORCID** record, or a single **DOI**
  (metadata via Crossref; author lists filled in by DOI). Duplicates are skipped.
- 🏷️ Tag publications and filter by tag.
- 🎤 List talks with uploaded slides (PDF/PPTX) and recordings (MP4/WebM/MOV) that play
  inline. Uploads go straight from the browser to object storage, so large videos work
  behind proxies with small body limits; the S3 endpoint must allow CORS `GET`s and `PUT`s
  from the site (SeaweedFS does by default).
- 📎 Attach any number of files to a talk or a blog post: handouts, code, documents,
  images, audio, or the original `.pptx` next to a PDF export. Visitors download them
  from the talk card or under the post.
- 🖥️ View PDFs on the site. Talk slides, attached PDFs, and publication PDFs open in a
  built-in viewer with page thumbnails, arrow-key navigation, full screen, and download.
  PDF slides and attachments get a first-page preview image, rendered when they are
  uploaded. PowerPoint and Keynote files can't be shown in a browser, so they are
  download-only.
- 🧩 Build the homepage and additional pages from draggable, responsive blocks in **Admin → Pages**. Edit headings, text, images, buttons, page URLs, and navigation visibility. Preview before saving. Existing sites keep their current homepage until a builder layout is published.
- ✍️ Write draft and published Markdown posts in **Admin → Blog**. The built-in `/blog` listing and post pages appear when **Show blog on the public site** is enabled. Drafts stay private, and backups include posts.
- 🎚️ Toggle legacy homepage sections and the hero portrait.
- 🤖 Let an LLM edit the site: the [MCP server](mcp-server/README.md) exposes profile,
  theme, pages, projects (with screenshots), publications, talks, and blog tools to
  Claude or any other MCP client, authenticated with an `API_TOKEN`.

## Roadmap

Tracked in [GitHub issues](../../issues). Highlights: Helm chart for Kubernetes,
database migrations (Alembic), pluggable OIDC/Keycloak auth, automated tests & CI.


## Kubernetes (Helm)

A Helm chart lives in [`helm/openvitae`](helm/openvitae). It deploys the api and
frontend plus an optional in-cluster Postgres and S3 store (SeaweedFS) (StatefulSets with PVCs, so
data survives restarts and upgrades), with ingress and external-DB/S3 support.

```sh
helm install openvitae ./helm/openvitae \
  --namespace openvitae --create-namespace \
  --set auth.jwtSecret=$(openssl rand -hex 32) \
  --set global.storageClass=longhorn   # optional; omit for the cluster default
```

See the [chart README](helm/openvitae/README.md) for ingress, the object-storage
URL gotcha, Longhorn notes, and data-persistence details.

## Local development (without Docker)

**Backend** (uses [uv](https://docs.astral.sh/uv/)):

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000   # needs Postgres + S3 reachable
```

**Frontend** (uses [bun](https://bun.sh/)):

```bash
cd frontend
bun install
bun run dev
```

You still need Postgres and S3 storage running — the simplest path is
`docker compose up -d db s3` and point the backend's `.env` at `localhost`.


## License

[MIT](LICENSE) — free to use, modify, and distribute, with
attribution.
