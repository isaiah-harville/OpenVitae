"""Validated public page structure stored in the site config."""

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

BlockType = Literal[
    "hero",
    "about",
    "text",
    "image",
    "imageText",
    "custom",
    "skills",
    "publications",
    "projects",
    "talks",
    "education",
    "links",
    "contact",
]
RESERVED_SLUGS = {"admin", "api", "blog", "projects", "publications", "home", "healthz"}


class PageBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    type: BlockType
    width: Literal[1, 2]
    heading: str = Field(max_length=200)
    eyebrow: str = Field(max_length=100)
    text: str = Field(max_length=20000)
    imageKey: str | None = Field(default=None, max_length=512, pattern=r"^page-images/[\w./-]+$")
    imageAlt: str | None = Field(default=None, max_length=300)
    imagePosition: Literal["left", "right"] | None = None
    buttonLabel: str | None = Field(default=None, max_length=100)
    buttonUrl: str | None = Field(default=None, max_length=2048)

    @model_validator(mode="after")
    def validate_button(self):
        if self.buttonUrl and not (
            self.buttonUrl.startswith("/")
            and not self.buttonUrl.startswith("//")
            or self.buttonUrl.startswith("https://")
            or self.buttonUrl.startswith("mailto:")
        ):
            raise ValueError("buttonUrl must be a relative path, https:// URL, or mailto: link")
        return self


class SitePage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    slug: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    inNav: bool
    blocks: list[PageBlock] = Field(max_length=50)


class PageDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: Literal[1, 2]
    pages: list[SitePage] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def validate_pages(self):
        slugs = [page.slug for page in self.pages]
        ids = [page.id for page in self.pages]
        if len(set(slugs)) != len(slugs) or len(set(ids)) != len(ids):
            raise ValueError("Page slugs and IDs must be unique")
        if slugs.count("home") != 1 or self.pages[0].slug != "home" or self.pages[0].id != "home":
            raise ValueError("The homepage must be the first page")
        for page in self.pages:
            if page.slug != "home" and (
                page.slug in RESERVED_SLUGS
                or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", page.slug)
            ):
                raise ValueError(f"Invalid or reserved page slug: {page.slug}")
            block_ids = [block.id for block in page.blocks]
            if len(set(block_ids)) != len(block_ids):
                raise ValueError(f"Block IDs must be unique on page {page.slug}")
        return self
