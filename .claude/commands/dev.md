---
description: Build and start the full OpenVitae stack with Docker, then verify it's healthy
---

Bring up the whole stack and confirm it works:

1. If `.env` doesn't exist, `cp .env.example .env`.
2. `docker compose up -d --build`.
3. Wait for health, then verify:
   - API: `curl -s --retry 20 --retry-connrefused --retry-delay 1 http://localhost:8000/api/health`
   - Frontend: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` (expect 200)
4. Report the URLs: site `http://localhost:3000`, admin `http://localhost:3000/admin`,
   API docs `http://localhost:8000/docs`, MinIO console `http://localhost:9001`.
5. If the API container is restarting, show `docker compose logs api | tail -30`.

Default admin login comes from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
