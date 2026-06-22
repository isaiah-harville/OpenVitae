# OpenVitae

A config-driven CV website and publication manager for academics, researchers, and
professionals. Run your own personal site: edit content, upload a headshot, recolor the
theme, manage your papers with tags, and toggle features — all from a `/admin` dashboard.

## Architecture

| Service    | Tech                          | Purpose                                            |
| ---------- | ----------------------------- | -------------------------------------------------- |
| `frontend` | Next.js 15 (App Router, TS)   | Public config-driven CV site + `/admin` dashboard  |
| `api`      | FastAPI (Python 3.12, uv)     | Auth, site config, publications/tags, file uploads |
| `db`       | PostgreSQL 17                 | Relational data                                    |
| `minio`    | MinIO (S3-compatible)         | Object storage for headshots & paper PDFs          |

The public site is **config-driven**: a single `SiteConfig` record (profile, theme
palette, feature flags) plus publications and tags fully describe what renders. The admin
edits that config; the frontend renders it.

```
Browser ──> frontend (Next.js) ──SSR──> api (FastAPI) ──> Postgres
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
- `NEXT_PUBLIC_API_URL` — baked into the frontend at build time; the browser uses it to
  reach the API.


## Features

- 🔐 Admin login (JWT). Auth is isolated behind one dependency so it can later be swapped
  for an external OIDC provider (e.g. Keycloak) — tracked in the issues.
- 📝 Edit profile (name, title, bio, location, contact links).
- 🖼️ Upload a headshot.
- 🎨 Change the site color palette (and font) live.
- 📚 Manage publications: title, authors, venue, year, abstract, DOI, URL, PDF upload.
- 🏷️ Tag publications and filter by tag.
- 🎚️ Toggle site features (about / publications / contact / headshot sections).

## Roadmap

Tracked in [GitHub issues](../../issues). Highlights: Helm chart for Kubernetes,
database migrations (Alembic), pluggable OIDC/Keycloak auth, automated tests & CI.


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