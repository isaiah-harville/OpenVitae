"""Thin HTTP client for the OpenVitae API, configured from the environment."""

from __future__ import annotations

import json
import mimetypes
import os
import tempfile
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024
FILE_TYPES = {
    ".pdf": "application/pdf",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".key": "application/vnd.apple.keynote",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".csv": "text/csv",
    ".json": "application/json",
    ".ipynb": "application/x-ipynb+json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".zip": "application/zip",
    ".gz": "application/gzip",
    ".tgz": "application/gzip",
    ".tar": "application/x-tar",
}


class OpenVitaeError(RuntimeError):
    """An API call failed; the message carries the status and the API's detail."""


@dataclass
class Settings:
    """Connection settings. See the README for what each variable does."""

    url: str
    api_token: str | None = None
    email: str | None = None
    password: str | None = None
    extra_headers: dict[str, str] = field(default_factory=dict)
    timeout: float = 30.0

    @classmethod
    def from_env(cls) -> Settings:
        url = os.environ.get("OPENVITAE_URL", "http://localhost:8000").rstrip("/")
        raw_headers = os.environ.get("OPENVITAE_HEADERS", "").strip()
        headers: dict[str, str] = {}
        if raw_headers:
            parsed = json.loads(raw_headers)
            if not isinstance(parsed, dict):
                raise ValueError("OPENVITAE_HEADERS must be a JSON object")
            headers = {str(k): str(v) for k, v in parsed.items()}
        return cls(
            url=url,
            api_token=os.environ.get("OPENVITAE_API_TOKEN") or None,
            email=os.environ.get("OPENVITAE_EMAIL") or None,
            password=os.environ.get("OPENVITAE_PASSWORD") or None,
            extra_headers=headers,
        )


class OpenVitaeClient:
    """Calls the OpenVitae REST API. Every path is relative to `/api`."""

    def __init__(self, settings: Settings, transport: httpx.BaseTransport | None = None):
        self.settings = settings
        self._http = httpx.Client(
            base_url=f"{settings.url}/api",
            headers=settings.extra_headers,
            timeout=settings.timeout,
            transport=transport,
            follow_redirects=False,
        )
        self._bearer: str | None = settings.api_token

    # ---- plumbing ----
    def _auth_headers(self) -> dict[str, str]:
        if self._bearer is None and self.settings.email and self.settings.password:
            self._bearer = self._login()
        return {"Authorization": f"Bearer {self._bearer}"} if self._bearer else {}

    def _login(self) -> str:
        # OAuth2 password flow: form fields, with the email as the username.
        response = self._http.post(
            "/auth/login",
            data={"username": self.settings.email, "password": self.settings.password},
        )
        _raise_for(response)
        return response.json()["access_token"]

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        headers = {**kwargs.pop("headers", {}), **self._auth_headers()}
        response = self._http.request(method, path, headers=headers, **kwargs)
        _raise_for(response)
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    def get(self, path: str, **kwargs: Any) -> Any:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> Any:
        return self.request("POST", path, **kwargs)

    def put(self, path: str, **kwargs: Any) -> Any:
        return self.request("PUT", path, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> Any:
        return self.request("DELETE", path, **kwargs)

    # ---- files ----
    def load_image(self, source: str) -> tuple[str, bytes, str]:
        """Read an image from a local path or an http(s) URL as (filename, bytes, type)."""
        if source.startswith(("http://", "https://")):
            with httpx.Client(timeout=self.settings.timeout, follow_redirects=True) as http:
                response = http.get(source)
            _raise_for(response)
            content = response.content
            content_type = response.headers.get("content-type", "").split(";")[0].strip()
            name = Path(httpx.URL(source).path).name or "image"
        else:
            path = Path(source).expanduser()
            if not path.is_file():
                raise OpenVitaeError(f"No such file: {path}")
            content = path.read_bytes()
            content_type = mimetypes.guess_type(path.name)[0] or ""
            name = path.name
        if content_type not in IMAGE_TYPES:
            guessed = mimetypes.guess_type(name)[0] or ""
            content_type = guessed if guessed in IMAGE_TYPES else content_type
        if content_type not in IMAGE_TYPES:
            raise OpenVitaeError(
                f"{source} is {content_type or 'an unknown type'}; use jpeg, png, webp, or gif"
            )
        if len(content) > MAX_IMAGE_BYTES:
            raise OpenVitaeError(f"{source} is larger than 8 MB")
        return name, content, content_type

    def upload_image(self, path: str, source: str) -> Any:
        name, content, content_type = self.load_image(source)
        return self.post(path, files={"file": (name, content, content_type)})

    # ---- talk attachments (direct-to-storage uploads) ----
    @contextmanager
    def _local_file(self, source: str):
        """Yield (path, filename) for a local path, or for a URL streamed to a temp file."""
        if not source.startswith(("http://", "https://")):
            path = Path(source).expanduser()
            if not path.is_file():
                raise OpenVitaeError(f"No such file: {path}")
            yield path, path.name
            return
        name = Path(httpx.URL(source).path).name or "attachment"
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / name
            with httpx.stream("GET", source, follow_redirects=True, timeout=None) as response:
                _raise_for(response)
                with path.open("wb") as out:
                    for chunk in response.iter_bytes(1024 * 1024):
                        out.write(chunk)
            yield path, name

    def _put_to_storage(self, ticket_path: str, path: Path, name: str) -> str:
        """Get a signed upload URL from the API, PUT the file to it, and return its key."""
        content_type = FILE_TYPES.get(path.suffix.lower()) or mimetypes.guess_type(name)[0]
        if not content_type:
            raise OpenVitaeError(f"Cannot tell the file type of {name}")
        size = path.stat().st_size
        ticket = self.post(
            ticket_path,
            json={"filename": name, "content_type": content_type, "size": size},
        )
        with path.open("rb") as body:
            response = httpx.put(
                ticket["upload_url"],
                content=body,
                headers={**ticket["headers"], "Content-Length": str(size)},
                timeout=None,
            )
        _raise_for(response)
        return ticket["key"]

    def upload_talk_attachment(self, talk_id: int, kind: str, source: str) -> Any:
        """Upload slides or a video for a talk straight to object storage, then attach it."""
        with self._local_file(source) as (path, name):
            key = self._put_to_storage(f"/uploads/talks/{talk_id}/{kind}/upload-url", path, name)
            return self.post(f"/uploads/talks/{talk_id}/{kind}", json={"key": key})

    def attach_file(self, owner: str, owner_id: int, source: str) -> Any:
        """Upload a file straight to object storage and attach it to a talk or blog post."""
        base = f"/uploads/attachments/{owner}/{owner_id}"
        with self._local_file(source) as (path, name):
            key = self._put_to_storage(f"{base}/upload-url", path, name)
            return self.post(base, json={"key": key, "filename": name})


def _raise_for(response: httpx.Response) -> None:
    if response.is_success:
        return
    if response.is_redirect:
        location = response.headers.get("location", "")
        raise OpenVitaeError(
            f"HTTP {response.status_code} redirect to {location}. An auth proxy is probably "
            "in front of the API; point OPENVITAE_URL at the API directly or pass the "
            "headers it needs with OPENVITAE_HEADERS."
        )
    try:
        detail = response.json().get("detail", response.text)
    except ValueError:
        detail = response.text
    raise OpenVitaeError(f"HTTP {response.status_code} {response.request.url}: {detail}")
