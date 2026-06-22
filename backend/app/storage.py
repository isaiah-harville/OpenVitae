import uuid

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from .config import get_settings

settings = get_settings()


def _client(endpoint_url: str | None = None):
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url or settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4"),
    )


def ensure_bucket() -> None:
    client = _client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        client.create_bucket(Bucket=settings.s3_bucket)


def upload_fileobj(fileobj, content_type: str, prefix: str, filename: str) -> str:
    """Upload a file object and return its storage key."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    key = f"{prefix}/{uuid.uuid4().hex}.{ext}"
    _client().upload_fileobj(
        fileobj, settings.s3_bucket, key, ExtraArgs={"ContentType": content_type}
    )
    return key


def delete_object(key: str) -> None:
    try:
        _client().delete_object(Bucket=settings.s3_bucket, Key=key)
    except ClientError:
        pass


def presigned_url(key: str | None) -> str | None:
    """Generate a presigned GET URL using the browser-reachable endpoint."""
    if not key:
        return None
    return _client(settings.s3_public_endpoint_url).generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=settings.presigned_url_expire_seconds,
    )
