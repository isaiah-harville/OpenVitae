import pytest
from pydantic import ValidationError

from app.page_schema import PageDocument


def page(slug="home", blocks=None):
    return {"id": slug, "slug": slug, "title": slug, "inNav": True, "blocks": blocks or []}


def test_valid_home_and_custom_page():
    document = PageDocument.model_validate({"version": 1, "pages": [page(), page("research")]})
    assert [item.slug for item in document.pages] == ["home", "research"]


@pytest.mark.parametrize(
    "slug", ["admin", "api", "projects", "publications", "My Page", "bad/path"]
)
def test_reserved_or_malformed_slug_is_rejected(slug):
    with pytest.raises(ValidationError):
        PageDocument.model_validate({"version": 1, "pages": [page(), page(slug)]})


def test_duplicate_block_ids_are_rejected():
    block = {"id": "one", "type": "text", "width": 1, "heading": "Hi", "eyebrow": "", "text": ""}
    with pytest.raises(ValidationError):
        PageDocument.model_validate({"version": 1, "pages": [page(blocks=[block, block])]})


@pytest.mark.parametrize("change", [{"type": "script"}, {"buttonUrl": "javascript:alert(1)"}])
def test_unsupported_block_or_unsafe_button_is_rejected(change):
    block = {
        "id": "one",
        "type": "custom",
        "width": 1,
        "heading": "Hi",
        "eyebrow": "",
        "text": "",
        **change,
    }
    with pytest.raises(ValidationError):
        PageDocument.model_validate({"version": 1, "pages": [page(blocks=[block])]})
