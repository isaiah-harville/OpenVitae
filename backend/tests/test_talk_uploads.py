"""Direct-to-storage uploads for talk slides and recordings."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import Talk
from app.routers import uploads
from app.security import get_current_user


@pytest.fixture
def talk():
    return Talk(id=7, title="Orbits", sort_order=0, file_key=None, video_key=None)


@pytest.fixture
def storage(monkeypatch):
    state = {"objects": {}, "deleted": []}
    monkeypatch.setattr(uploads, "presigned_put", lambda key, ctype, size: f"https://s3.test/{key}")
    monkeypatch.setattr(uploads, "object_size", lambda key: state["objects"].get(key))
    monkeypatch.setattr(uploads, "delete_object", lambda key: state["deleted"].append(key))
    monkeypatch.setattr(uploads, "presigned_url", lambda key: key and f"https://s3.test/{key}")
    return state


@pytest.fixture
def client(talk, storage):
    db = MagicMock()
    db.get.side_effect = lambda model, ident: talk if ident == talk.id else None
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: object()
    yield TestClient(app)
    app.dependency_overrides.clear()


def ticket(client, kind="video", **overrides):
    body = {"filename": "Talk.MP4", "content_type": "video/mp4", "size": 1024, **overrides}
    return client.post(f"/api/uploads/talks/7/{kind}/upload-url", json=body)


def test_video_ticket_signs_a_fresh_key(client):
    response = ticket(client)
    assert response.status_code == 200
    body = response.json()
    assert body["key"].startswith("talk-videos/") and body["key"].endswith(".mp4")
    assert body["upload_url"] == f"https://s3.test/{body['key']}"
    assert body["headers"] == {"Content-Type": "video/mp4"}


@pytest.mark.parametrize(
    ("kind", "overrides", "detail"),
    [
        ("video", {"content_type": "application/pdf"}, "MP4, WebM, or MOV"),
        ("slides", {"content_type": "video/mp4"}, "PDF or slide deck"),
        ("video", {"size": 10 * 1024**4}, "must be under"),
    ],
)
def test_ticket_rejects_wrong_type_or_size(client, kind, overrides, detail):
    response = ticket(client, kind, **overrides)
    assert response.status_code == 400
    assert detail in response.json()["detail"]


def test_ticket_for_missing_talk_is_404(client):
    body = {"filename": "a.pdf", "content_type": "application/pdf", "size": 1}
    assert client.post("/api/uploads/talks/99/slides/upload-url", json=body).status_code == 404


def test_complete_attaches_and_replaces_previous(client, talk, storage):
    talk.video_key = "talk-videos/" + "a" * 32 + ".mp4"
    key = ticket(client).json()["key"]
    storage["objects"][key] = 1024

    response = client.post("/api/uploads/talks/7/video", json={"key": key})

    assert response.status_code == 200
    assert talk.video_key == key
    assert response.json()["video_url"] == f"https://s3.test/{key}"
    assert storage["deleted"] == ["talk-videos/" + "a" * 32 + ".mp4"]


def test_complete_rejects_keys_it_did_not_mint(client, storage):
    storage["objects"]["headshots/x.png"] = 10
    for key in ["headshots/x.png", "talks/" + "b" * 32 + ".pdf", "talk-videos/../x.mp4"]:
        response = client.post("/api/uploads/talks/7/video", json={"key": key})
        assert response.status_code == 400


def test_complete_requires_the_upload_to_exist(client):
    key = ticket(client).json()["key"]
    response = client.post("/api/uploads/talks/7/video", json={"key": key})
    assert response.status_code == 400
    assert "PUT the file first" in response.json()["detail"]


def test_delete_clears_slides(client, talk, storage):
    talk.file_key = "talks/" + "c" * 32 + ".pdf"
    response = client.delete("/api/uploads/talks/7/slides")
    assert response.status_code == 200
    assert talk.file_key is None and response.json()["file_url"] is None
    assert storage["deleted"] == ["talks/" + "c" * 32 + ".pdf"]
