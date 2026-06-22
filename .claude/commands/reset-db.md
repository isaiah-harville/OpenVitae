---
description: Wipe Postgres + MinIO volumes and re-seed a fresh OpenVitae from scratch
---

Reset all persisted state (DESTRUCTIVE — deletes the DB and all uploads):

1. `docker compose down -v` (removes the `pgdata` and `miniodata` volumes).
2. `docker compose up -d --build`.
3. Wait for the API health endpoint, which re-seeds the admin user and default
   `SiteConfig` from `.env` on first boot.

Use this when models change (there are no migrations yet — `create_all` only), or to get
a clean demo state.
