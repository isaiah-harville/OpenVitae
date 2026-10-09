# OpenVitae

A config-driven CV website and publication manager for academics, researchers, and
professionals. Run your own personal site: edit content, upload a headshot, recolor the
theme, manage your papers with tags, and toggle features — all from a `/admin` dashboard.

## Architecture

| Service    | Tech                          | Purpose                                            |
| ---------- | ----------------------------- | -------------------------------------------------- |
| `frontend` | SvelteKit 2, Sivir UI, Tailwind v4 | Public CV site + `/admin` dashboard |
| `api`      | FastAPI (Python 3.12, uv)     | Auth, site config, publications/tags, file uploads |
| `db`       | PostgreSQL 17                 | Relational data                                    |
| `minio`    | MinIO (S3-compatible)         | Object storage for headshots & paper PDFs          |

The public site is **config-driven**: a single `SiteConfig` record (profile, theme
palette, feature flags) plus publications and tags fully describe what renders. The admin
edits that config; the frontend renders it.

```
Browser ──> frontend (SvelteKit) ──SSR──> api (FastAPI) ──> Postgres
   │                                          │
   └──── presigned URLs ──> MinIO <───────────┘
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
| http://localhost:9001            | MinIO console                 |

On first boot the API seeds an admin user and a default site config from your `.env`:

- **Email:** `ADMIN_EMAIL` (default `admin@openvitae.local`)
- **Password:** `ADMIN_PASSWORD` (default `changeme` — change this!)

Reset everything (including the database and uploads): `docker compose down -v`.

## Configuration

All config is via environment variables — see [.env.example](.env.example). Key ones:

- `JWT_SECRET` — **set a long random string in production.**
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded on first run only.
- `S3_PUBLIC_ENDPOINT_URL` — the MinIO/S3 endpoint the *browser* can reach (used to sign
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
- 🧩 Build the homepage and additional pages from draggable, responsive blocks in **Admin → Pages**. Edit headings, text, images, buttons, page URLs, and navigation visibility. Preview before saving. Existing sites keep their current homepage until a builder layout is published.
- 🎚️ Toggle legacy homepage sections and the hero portrait.

## Roadmap

Tracked in [GitHub issues](../../issues). Highlights: Helm chart for Kubernetes,
database migrations (Alembic), pluggable OIDC/Keycloak auth, automated tests & CI.


## Kubernetes (Helm)

A Helm chart lives in [`helm/openvitae`](helm/openvitae). It deploys the api and
frontend plus an optional in-cluster Postgres and MinIO (StatefulSets with PVCs, so
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
uv run uvicorn app.main:app --reload --port 8000   # needs Postgres + MinIO reachable
```

**Frontend** (uses [bun](https://bun.sh/)):

```bash
cd frontend
bun install
bun run dev
```

You still need Postgres and MinIO running — the simplest path is
`docker compose up -d db minio` and point the backend's `.env` at `localhost`.


## License

[MIT](LICENSE) — free to use, modify, and distribute, with
attribution.
