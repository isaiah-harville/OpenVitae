import json

import pytest
import respx
from mcp.server.mcpserver.exceptions import ToolError

from openvitae_mcp import server
from openvitae_mcp.client import OpenVitaeClient, Settings

BASE = "http://ov.test/api"


@pytest.fixture
def api():
    with respx.mock(base_url=BASE, assert_all_called=False) as mock:
        server.set_client(OpenVitaeClient(Settings(url="http://ov.test", api_token="tok")))
        yield mock
    server.set_client(None)


def test_update_profile_merges_and_sends_token(api):
    api.get("/site/config").respond(json={"profile": {"name": "A", "title": "Old"}})
    put = api.put("/site/config").respond(json={"profile": {"name": "A", "title": "New"}})

    result = server.update_profile({"title": "New"})

    assert result == {"name": "A", "title": "New"}
    sent = put.calls.last.request
    assert json.loads(sent.content) == {"profile": {"name": "A", "title": "New"}}
    assert sent.headers["authorization"] == "Bearer tok"


def test_update_theme_replace_drops_keys(api):
    api.get("/site/config").respond(json={"theme": {"palette": "blue", "layout": "pages"}})
    put = api.put("/site/config").respond(json={"theme": {"palette": "teal"}})

    server.update_theme({"palette": "teal"}, replace=True)

    assert json.loads(put.calls.last.request.content) == {"theme": {"palette": "teal"}}


def test_update_project_rejects_unknown_fields(api):
    with pytest.raises(ToolError, match="Unknown field"):
        server.update_project(1, {"nmae": "typo"})


def test_api_errors_become_tool_errors(api):
    api.delete("/projects/9").respond(404, json={"detail": "Project not found"})
    with pytest.raises(ToolError, match="Project not found"):
        server.delete_project(9)


def test_auth_proxy_redirect_is_explained(api):
    api.get("/projects").respond(302, headers={"location": "https://sso.test/login"})
    with pytest.raises(ToolError, match="auth proxy"):
        server.list_projects()


def test_screenshot_upload_from_file(api, tmp_path):
    image = tmp_path / "shot.png"
    image.write_bytes(b"\x89PNG\r\n\x1a\nfake")
    upload = api.post("/uploads/projects/3/screenshots").respond(
        json={"screenshot_urls": ["https://s3.test/a.png"]}
    )

    result = server.add_project_screenshot(3, str(image))

    assert result == {"screenshot_urls": ["https://s3.test/a.png"]}
    body = upload.calls.last.request.content
    assert b'filename="shot.png"' in body and b"image/png" in body


def test_screenshot_rejects_non_images(api, tmp_path):
    doc = tmp_path / "notes.txt"
    doc.write_text("hi")
    with pytest.raises(ToolError, match="jpeg, png, webp, or gif"):
        server.add_project_screenshot(3, str(doc))


def test_password_login_when_no_token():
    with respx.mock(base_url=BASE) as mock:
        login = mock.post("/auth/login").respond(
            json={"access_token": "jwt", "token_type": "bearer"}
        )
        route = mock.get("/site/config").respond(json={"profile": {}})
        client = OpenVitaeClient(Settings(url="http://ov.test", email="a@b.c", password="pw"))

        client.get("/site/config")

        assert route.calls.last.request.headers["authorization"] == "Bearer jwt"
        assert login.calls.last.request.content == b"username=a%40b.c&password=pw"


def test_settings_from_env(monkeypatch):
    monkeypatch.setenv("OPENVITAE_URL", "https://cv.test/")
    monkeypatch.setenv("OPENVITAE_HEADERS", '{"X-Test": "1"}')
    monkeypatch.delenv("OPENVITAE_API_TOKEN", raising=False)
    settings = Settings.from_env()
    assert settings.url == "https://cv.test"
    assert settings.extra_headers == {"X-Test": "1"}
    assert settings.api_token is None


@pytest.mark.anyio
async def test_tools_are_registered():
    names = {tool.name for tool in await server.mcp.list_tools()}
    assert {"get_site_config", "create_project", "add_project_screenshot"} <= names


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_talk_video_upload_streams_to_storage(api, tmp_path):
    video = tmp_path / "keynote.mov"
    video.write_bytes(b"\x00" * 2048)
    ticket = api.post("/uploads/talks/4/video/upload-url").respond(
        json={
            "upload_url": "https://s3.test/openvitae/talk-videos/k.mov?sig=1",
            "key": "talk-videos/k.mov",
            "headers": {"Content-Type": "video/quicktime"},
        }
    )
    put = api.route(method="PUT", host="s3.test", path="/openvitae/talk-videos/k.mov").respond(200)
    done = api.post("/uploads/talks/4/video").respond(json={"id": 4, "video_url": "u"})

    result = server.upload_talk_video(4, str(video))

    assert result == {"id": 4, "video_url": "u"}
    assert json.loads(ticket.calls.last.request.content) == {
        "filename": "keynote.mov",
        "content_type": "video/quicktime",
        "size": 2048,
    }
    sent = put.calls.last.request
    assert sent.headers["content-type"] == "video/quicktime"
    assert sent.headers["content-length"] == "2048"
    assert "authorization" not in sent.headers
    assert json.loads(done.calls.last.request.content) == {"key": "talk-videos/k.mov"}


def test_remove_talk_attachment_validates_kind(api):
    with pytest.raises(ToolError, match="slides"):
        server.remove_talk_attachment(4, "audio")


def test_attach_file_uploads_to_storage_then_registers(api, tmp_path):
    notes = tmp_path / "handout.docx"
    notes.write_bytes(b"\x00" * 512)
    ticket = api.post("/uploads/attachments/talks/4/upload-url").respond(
        json={
            "upload_url": "https://s3.test/openvitae/attachments/k.docx?sig=1",
            "key": "attachments/k.docx",
            "headers": {"Content-Type": "application/x"},
        }
    )
    put = api.route(method="PUT", host="s3.test", path="/openvitae/attachments/k.docx").respond(200)
    done = api.post("/uploads/attachments/talks/4").respond(
        json={"id": 7, "filename": "handout.docx"}
    )

    result = server.attach_file("talks", 4, str(notes))

    assert result == {"id": 7, "filename": "handout.docx"}
    assert json.loads(ticket.calls.last.request.content) == {
        "filename": "handout.docx",
        "content_type": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "size": 512,
    }
    assert put.calls.last.request.headers["content-length"] == "512"
    assert json.loads(done.calls.last.request.content) == {
        "key": "attachments/k.docx",
        "filename": "handout.docx",
    }


def test_attach_file_validates_owner(api):
    with pytest.raises(ToolError, match="blog-posts"):
        server.attach_file("projects", 1, "x.zip")


def test_remove_attachment_deletes_by_id(api):
    route = api.delete("/uploads/attachments/7").respond(204)
    assert server.remove_attachment(7) == "Removed attachment 7"
    assert route.called
