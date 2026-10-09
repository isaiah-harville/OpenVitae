"""Blog publishing behavior against an isolated Postgres database."""

import io
import json
import os
import zipfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import get_db
from app.main import app
from app.models import BlogPost, SiteConfig
from app.security import get_current_user


def test_blog_posts_follow_site_setting_and_publication_state():
    url = os.getenv("TEST_DATABASE_URL")
    if not url or "test" not in url.split("/")[-1]:
        pytest.skip("TEST_DATABASE_URL must name a Postgres test database")
    engine = create_engine(url)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    try:
        session.query(BlogPost).delete()
        config = session.get(SiteConfig, 1)
        if config is None:
            config = SiteConfig(id=1, profile={}, theme={}, features={"blog": False})
            session.add(config)
        else:
            config.features = {**config.features, "blog": False}
        session.flush()
        app.dependency_overrides[get_db] = lambda: session
        app.dependency_overrides[get_current_user] = lambda: object()
        client = TestClient(app)
        created = client.post(
            "/api/blog/posts",
            json={"title": "First post", "excerpt": "Intro", "content": "# Hello"},
        )
        assert created.status_code == 201
        post = created.json()
        assert post["slug"] == "first-post" and not post["published"]
        second = client.post(
            "/api/blog/posts", json={"title": "First post", "content": "Unpublished"}
        )
        assert second.status_code == 201
        assert second.json()["slug"] == "first-post-2"
        assert len(client.get("/api/blog/posts").json()) == 2
        backup_bytes = client.get("/api/backup").content
        with zipfile.ZipFile(io.BytesIO(backup_bytes)) as archive:
            backed_up = json.loads(archive.read("data.json"))
        assert backed_up["version"] == 3
        assert len(backed_up["blog_posts"]) == 2
        assert client.get("/api/blog").status_code == 404
        config.features = {**config.features, "blog": True}
        session.commit()
        assert client.get("/api/blog").json() == []
        assert client.get("/api/blog/first-post").status_code == 404
        assert client.post("/api/blog/posts", json={"title": "   "}).status_code == 422
        published = client.put(
            f"/api/blog/posts/{post['id']}", json={"published": True, "title": "New title"}
        )
        assert published.status_code == 200
        assert published.json()["slug"] == "first-post"
        assert published.json()["published_at"]
        public_posts = client.get("/api/blog").json()
        assert len(public_posts) == 1
        assert "content" not in public_posts[0]
        assert client.get("/api/blog/first-post").status_code == 200
        assert (
            client.put(f"/api/blog/posts/{post['id']}", json={"published": False}).status_code
            == 200
        )
        assert client.get("/api/blog/first-post").status_code == 404
        restored = client.post(
            "/api/restore", files={"file": ("site.zip", backup_bytes, "application/zip")}
        )
        assert restored.status_code == 200
        assert len(client.get("/api/blog/posts").json()) == 2
    finally:
        app.dependency_overrides.clear()
        session.close()
        transaction.rollback()
        connection.close()
        engine.dispose()
