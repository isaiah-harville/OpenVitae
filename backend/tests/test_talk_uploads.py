"""Direct-to-storage uploads for talk slides, recordings, and attachments."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app import previews, serialize
from app.database import get_db
from app.main import app
from app.models import Attachment, Talk
from app.routers import uploads
from app.security import get_current_user

TYPES = {"pdf": "application/pdf", "mp4": "video/mp4", "png": "image/png", "zip": "application/zip"}


@pytest.fixture
def talk():
    return Talk(id=7, title="Orbits", sort_order=0, file_key=None, video_key=None)


@pytest.fixture
def storage(monkeypatch):
    state = {"objects": {}, "deleted": []}
    monkeypatch.setattr(uploads, "presigned_put", lambda key, ctype, size: f"https://s3.test/{key}")
    monkeypatch.setattr(
        uploads,
        "object_head",
        lambda key: (
            (state["objects"][key], TYPES[key.rsplit(".", 1)[-1]])
            if key in state["objects"]
            else None
        ),
    )
    for module in (uploads, previews):
        monkeypatch.setattr(module, "delete_object", lambda key: state["deleted"].append(key))
    monkeypatch.setattr(previews, "store_pdf_preview", lambda key: f"previews/{key[-10:]}.webp")
    monkeypatch.setattr(
        serialize,
        "presigned_url",
        lambda key, download_as=None: (
            key and f"https://s3.test/{key}" + (download_as and "?dl" or "")
        ),
    )
    return state


@pytest.fixture
def client(talk, storage):
    db = MagicMock()
    db.get.side_effect = lambda model, ident: talk if ident == talk.id else None
    db.query.return_value.filter_by.return_value.count.return_value = 2
    db.refresh.side_effect = lambda row: setattr(row, "id", row.id or 31)
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


def test_pdf_slides_get_a_preview_and_lose_it_on_removal(client, talk, storage):
    key = ticket(client, "slides", filename="deck.pdf", content_type="application/pdf").json()[
        "key"
    ]
    storage["objects"][key] = 2048

    uploaded = client.post("/api/uploads/talks/7/slides", json={"key": key}).json()
    preview = talk.file_preview_key
    assert preview and uploaded["file_preview_url"] == f"https://s3.test/{preview}"

    removed = client.delete("/api/uploads/talks/7/slides").json()
    assert removed["file_preview_url"] is None
    assert storage["deleted"] == [preview, key]


def attach(client, storage, filename, content_type, owner="blog-posts"):
    body = {"filename": filename, "content_type": content_type, "size": 4096}
    key = client.post(f"/api/uploads/attachments/{owner}/7/upload-url", json=body).json()["key"]
    storage["objects"][key] = 4096
    return client.post(
        f"/api/uploads/attachments/{owner}/7", json={"key": key, "filename": filename}
    )


def test_attaching_a_pdf_records_it_with_a_preview_and_download_link(client, storage):
    response = attach(client, storage, "handout.pdf", "application/pdf")
    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "handout.pdf"
    assert body["content_type"] == "application/pdf" and body["size"] == 4096
    assert body["preview_url"].endswith(".webp")
    assert body["download_url"].endswith("?dl")


def test_image_attachments_preview_as_themselves(client, storage):
    body = attach(client, storage, "diagram.png", "image/png", owner="talks").json()
    assert body["preview_url"] == body["url"]


def test_other_attachments_have_no_preview(client, storage):
    assert attach(client, storage, "code.zip", "application/zip").json()["preview_url"] is None


@pytest.mark.parametrize("content_type", ["text/html", "image/svg+xml", "application/x-sh"])
def test_attachments_refuse_types_a_browser_could_run(client, content_type):
    body = {"filename": "x", "content_type": content_type, "size": 1}
    response = client.post("/api/uploads/attachments/talks/7/upload-url", json=body)
    assert response.status_code == 400


def test_attachment_complete_only_accepts_attachment_keys(client, storage):
    storage["objects"]["talks/" + "d" * 32 + ".pdf"] = 10
    response = client.post(
        "/api/uploads/attachments/talks/7",
        json={"key": "talks/" + "d" * 32 + ".pdf", "filename": "a.pdf"},
    )
    assert response.status_code == 400


def test_deleting_an_attachment_removes_file_and_preview(client, storage):
    row = Attachment(id=5, key="attachments/k.pdf", preview_key="previews/p.webp")
    client.app.dependency_overrides[get_db]().get.side_effect = lambda model, ident: row
    assert client.delete("/api/uploads/attachments/5").status_code == 204
    assert storage["deleted"] == ["attachments/k.pdf", "previews/p.webp"]
