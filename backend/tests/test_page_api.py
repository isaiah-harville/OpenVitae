"""Page document API round trip against an isolated Postgres test database."""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import get_db
from app.main import app
from app.models import SiteConfig
from app.security import get_current_user


def test_page_config_round_trip_and_rejects_reserved_slug():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is required for the Postgres page API test")
    if "test" not in url.split("/")[-1]:
        pytest.skip("TEST_DATABASE_URL must name a test database")
    engine = create_engine(url)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    try:
        config = session.get(SiteConfig, 1)
        if config is None:
            config = SiteConfig(id=1, profile={}, theme={}, features={})
            session.add(config)
        config.pages = None
        session.flush()
        app.dependency_overrides[get_db] = lambda: session
        app.dependency_overrides[get_current_user] = lambda: object()
        client = TestClient(app)
        assert client.get("/api/site/config").json()["pages"] is None
        home = {"id": "home", "slug": "home", "title": "Home", "inNav": True, "blocks": []}
        research = {
            "id": "research",
            "slug": "research",
            "title": "Research",
            "inNav": True,
            "blocks": [],
        }
        document = {"version": 1, "pages": [home, research]}
        response = client.put("/api/site/config", json={"pages": document})
        assert response.status_code == 200
        assert client.get("/api/site/config").json()["pages"] == document
        research["slug"] = "admin"
        assert client.put("/api/site/config", json={"pages": document}).status_code == 422
    finally:
        app.dependency_overrides.clear()
        session.close()
        transaction.rollback()
        connection.close()
        engine.dispose()
