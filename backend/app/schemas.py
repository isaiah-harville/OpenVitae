from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr


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


# ---- Site config ----
class SiteConfigBase(BaseModel):
    profile: dict = {}
    theme: dict = {}
    features: dict = {}


class SiteConfigUpdate(BaseModel):
    profile: dict | None = None
    theme: dict | None = None
    features: dict | None = None


class SiteConfigOut(SiteConfigBase):
    model_config = ConfigDict(from_attributes=True)
    headshot_url: str | None = None
    updated_at: datetime | None = None


# ---- Tags ----
class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str


class TagCreate(BaseModel):
    name: str


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


# ---- Projects ----
class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    url: str | None = None
    source_url: str | None = None
    sort_order: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    url: str | None = None
    source_url: str | None = None
    sort_order: int | None = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
