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
