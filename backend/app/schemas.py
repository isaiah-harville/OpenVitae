from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


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
    sort_order: int | None = None
    tag_ids: list[int] | None = None


class PublicationOut(PublicationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    tags: list[TagOut] = []
    file_url: str | None = None
