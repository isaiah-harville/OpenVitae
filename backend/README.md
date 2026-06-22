# OpenVitae Backend

FastAPI service for OpenVitae: auth, config-driven site definition, publications &
tags, and file uploads to S3-compatible object storage (MinIO).

## Develop

```bash
uv sync                       # install deps into .venv
cp ../.env.example ../.env    # configure (or rely on docker-compose env)
uv run uvicorn app.main:app --reload --port 8000
```

Interactive API docs at http://localhost:8000/docs.

Managed with [uv](https://docs.astral.sh/uv/). See the repo root README for the full
Docker-based workflow.
