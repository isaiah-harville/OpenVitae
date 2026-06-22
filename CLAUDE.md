# OpenVitae — notes for Claude

Config-driven CV website + publication manager. A public, config-driven CV site and a
`/admin` dashboard, backed by an API and object storage.

## Architecture

- **frontend/** — Next.js 15 (App Router, TS). Public site + `/admin`. Package manager: **bun**.
- **backend/** — FastAPI (Python 3.12). Package manager: **uv**.
- **db** — PostgreSQL 17. **minio** — S3-compatible object storage (headshots, paper PDFs).
- Orchestrated by **`compose.yml`** (note: `compose.yml`, not `docker-compose.yml`).
- The public site is fully described by `SiteConfig` (profile, theme, feature flags) +
  publications + tags. The admin edits config; the frontend renders it.

## Toolchain conventions (important)

- **Python → uv.** Use `uv add` / `uv run`. Do **not** create a `requirements.txt` or use pip.
- **Node → bun.** Use `bun add` / `bun run`. Do **not** use npm/yarn/pnpm. Commit `bun.lock`.
- **Lint/format:** ruff (backend), Biome (frontend). Run before committing.
- **shadcn/ui:** components in `frontend/components/ui` are vendored. Add more with
  `bunx shadcn@latest add <name>` — don't hand-write them.

## Gotchas / decisions

- **Auth hashing uses `bcrypt` directly, not `passlib`.** passlib 1.7.4 crashes with
  bcrypt 4.x on startup. Don't reintroduce passlib.
- **Auth is isolated** behind `get_current_user` + the login endpoint so it can later be
  swapped for OIDC/Keycloak (issue #9). Keep that seam clean.
- **Object storage has two endpoints:** `S3_ENDPOINT_URL` (backend ↔ minio, internal) and
  `S3_PUBLIC_ENDPOINT_URL` (used to sign URLs the browser opens). Don't conflate them.
- **Theme model:** `SiteConfig.theme = { palette, defaultMode, customPrimary? }`. Palette
  *colors* live in `frontend/app/globals.css` under `[data-palette="…"]` (+ `.dark[...]`
  variants). Light/dark is a per-visitor toggle via next-themes; the saved palette is
  applied server-side via `data-palette` on `<html>`.
- **DB schema is created with `Base.metadata.create_all` on startup** — no migrations yet
  (Alembic is issue #6). Changing models won't migrate existing tables.
- **Frontend talks to the API via two base URLs:** `NEXT_PUBLIC_API_URL` (browser, baked at
  build) and `SERVER_API_URL` (SSR over the compose network, `http://api:8000`).
- B008 is ignored in ruff because FastAPI uses `Depends()/File()/Query()` as defaults.

## Running

See README for full instructions. Quick: `cp .env.example .env && docker compose up -d --build`.
Frontend `:3000`, API `:8000` (`/docs`), MinIO console `:9001`. Reset all data:
`docker compose down -v`.

## Workflow

- Commit with conventional-commit messages and the `Co-Authored-By` trailer.
- Work happens on the `init` branch (main is the default/PR target).
- Roadmap and future work are tracked as GitHub issues (#3–#12). Helm chart is #8.

## License

PolyForm Noncommercial 1.0.0 — free for noncommercial use; commercial use not permitted.
For *software* this is the right pick (CC BY-NC is for content). Keep new code under it.
