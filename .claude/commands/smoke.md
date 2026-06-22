---
description: End-to-end smoke test of the running API (auth, config, tags, publications, upload)
---

Exercise the API against the running stack (`http://localhost:8000`). Get a token first,
then run the authed calls:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_EMAIL:-admin@openvitae.local}&password=${ADMIN_PASSWORD:-changeme}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```

Then verify, reporting pass/fail for each:
- `GET /api/health` → `{"status":"ok"}`
- `GET /api/site/config` (public) returns profile/theme/features
- `POST /api/tags` (authed) creates a tag
- `POST /api/publications` (authed) creates a publication with `tag_ids`
- `GET /api/publications` (public) lists it
- `POST /api/uploads/headshot` (authed, multipart image) returns a presigned `headshot_url`
- `PUT /api/site/config` (authed) updates the theme palette

Also confirm the frontend renders: `curl -s http://localhost:3000/ | grep -o 'data-palette="[a-z]*"'`.
