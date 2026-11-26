from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from .page_schema import PageDocument


# ---- Shared ----
class ReorderRequest(BaseModel):
    """Ordered list of ids; index becomes the new sort_order."""

    ids: list[int]


# ---- Auth ----
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    is_admin: bool


class AuthMode(BaseModel):
    """How the admin UI should authenticate: built-in JWT login or a forward-auth proxy."""

    mode: str  # "jwt" | "proxy"


# ---- Site config ----
class SiteConfigBase(BaseModel):
    profile: dict = {}
    theme: dict = {}
    features: dict = {}
    pages: PageDocument | None = None


class SiteConfigUpdate(BaseModel):
    profile: dict | None = None
    theme: dict | None = None
    features: dict | None = None
    pages: PageDocument | None = None


class SiteConfigOut(SiteConfigBase):
    model_config = ConfigDict(from_attributes=True)
    headshot_url: str | None = None
    updated_at: datetime | None = None


# ---- Blog ----
BlogTitle = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=512)]


class BlogPostCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: BlogTitle
    excerpt: str = Field(default="", max_length=1000)
    content: str = Field(default="", max_length=100000)
    published: bool = False


class BlogPostUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: BlogTitle | None = None
    excerpt: str | None = Field(default=None, max_length=1000)
    content: str | None = Field(default=None, max_length=100000)
    published: bool | None = None


class AttachmentOut(BaseModel):
    """A downloadable file. url opens it in the browser; download_url saves it."""

    id: int
    filename: str
    content_type: str
    size: int
    url: str
    download_url: str
    preview_url: str | None = None


class BlogPostOut(BlogPostCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    published_at: datetime | None = None
    created_at: datetime
    attachments: list[AttachmentOut] = []


class BlogPostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    excerpt: str
    published_at: datetime


# ---- Tags ----
class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    color: str | None = None


class TagCreate(BaseModel):
    name: str
    color: str | None = None


class TagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


# ---- Publications ----
class PublicationBase(BaseModel):
    title: str
    authors: str | None = None
    venue: str | None = None
    year: int | None = None
    abstract: str | None = None
    doi: str | None = None
    url: str | None = None
    featured: bool = False
    sort_order: int = 0


class PublicationCreate(PublicationBase):
    tag_ids: list[int] = []


class PublicationUpdate(BaseModel):
    title: str | None = None
    authors: str | None = None
    venue: str | None = None
    year: int | None = None
    abstract: str | None = None
    doi: str | None = None
    url: str | None = None
    featured: bool | None = None
    sort_order: int | None = None
    tag_ids: list[int] | None = None


class PublicationOut(PublicationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    tags: list[TagOut] = []
    file_url: str | None = None


# ---- Publication import ----
class BibtexImportRequest(BaseModel):
    bibtex: str


class OrcidImportRequest(BaseModel):
    orcid: str
    enrich: bool = True


class DoiImportRequest(BaseModel):
    doi: str


class ImportResult(BaseModel):
    """Outcome of a bulk publication import."""

    created: int
    skipped: int
    titles: list[str] = []


# ---- Talks ----
class TalkBase(BaseModel):
    title: str
    event: str | None = None
    location: str | None = None
    event_date: date | None = None
    url: str | None = None
    description: str | None = None
    sort_order: int = 0


class TalkCreate(TalkBase):
    pass


class TalkUpdate(BaseModel):
    title: str | None = None
    event: str | None = None
    location: str | None = None
    event_date: date | None = None
    url: str | None = None
    description: str | None = None
    sort_order: int | None = None


class TalkOut(TalkBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    file_url: str | None = None
    file_preview_url: str | None = None
    video_url: str | None = None
    attachments: list[AttachmentOut] = []


class UploadRequest(BaseModel):
    """Ask for a one-time URL to upload a file straight to storage."""

    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=255)
    size: int = Field(gt=0)


class UploadTicket(BaseModel):
    upload_url: str
    key: str
    # Headers the PUT must send unchanged; they are part of the signature.
    headers: dict[str, str]


class UploadComplete(BaseModel):
    key: str = Field(min_length=1, max_length=512)


class AttachmentComplete(UploadComplete):
    filename: str = Field(min_length=1, max_length=255)


# ---- Skills ----
class SkillBase(BaseModel):
    name: str
    category: str | None = None
    color: str | None = None
    sort_order: int = 0


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    color: str | None = None
    sort_order: int | None = None


class SkillOut(SkillBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str


# ---- Projects ----
class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    content: str | None = None
    url: str | None = None
    source_url: str | None = None
    sort_order: int = 0


class ProjectCreate(ProjectBase):
    tag_ids: list[int] = []
    skill_ids: list[int] = []


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    content: str | None = None
    url: str | None = None
    source_url: str | None = None
    sort_order: int | None = None
    tag_ids: list[int] | None = None
    skill_ids: list[int] | None = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    tags: list[TagOut] = []
    skills: list[SkillOut] = []
    screenshot_urls: list[str] = []
