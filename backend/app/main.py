from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import SessionLocal
from .db_migrate import run_migrations
from .routers import auth, backup, projects, publications, site, tags, talks, uploads
from .seed import seed
from .storage import ensure_bucket

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bring the schema up to date via Alembic (replaces create_all).
    run_migrations()
    try:
        ensure_bucket()
    except Exception as exc:  # storage may not be ready yet; log and continue
        print(f"[startup] object storage not ready: {exc}")
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(site.router)
app.include_router(tags.router)
app.include_router(publications.router)
app.include_router(talks.router)
app.include_router(projects.router)
app.include_router(uploads.router)
app.include_router(backup.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "app": settings.app_name}
