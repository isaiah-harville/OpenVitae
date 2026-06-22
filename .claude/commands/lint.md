---
description: Run linters and formatters for both the backend (ruff) and frontend (Biome)
---

Format and lint the whole repo, the same way CI does:

**Backend** (in `backend/`):
- `uv run ruff format .`
- `uv run ruff check --fix .`

**Frontend** (in `frontend/`, with bun on PATH — `export PATH="$HOME/.bun/bin:$PATH"`):
- `bunx biome check --write .`

Then report what changed. To check without writing (CI parity): `uv run ruff format --check .`
and `bunx biome ci .` in their respective dirs.
