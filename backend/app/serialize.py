"""API views of rows that carry stored files, with their keys turned into signed URLs."""

from .models import Attachment, BlogPost, Talk
from .schemas import AttachmentOut, BlogPostOut, TalkBase, TalkOut
from .storage import presigned_url


def attachment_out(attachment: Attachment) -> AttachmentOut:
    url = presigned_url(attachment.key)
    preview = presigned_url(attachment.preview_key)
    if preview is None and attachment.content_type.startswith("image/"):
        preview = url
    return AttachmentOut(
        id=attachment.id,
        filename=attachment.filename,
        content_type=attachment.content_type,
        size=attachment.size,
        url=url,
        download_url=presigned_url(attachment.key, download_as=attachment.filename),
        preview_url=preview,
    )


def talk_out(talk: Talk) -> TalkOut:
    return TalkOut(
        **{field: getattr(talk, field) for field in TalkBase.model_fields},
        id=talk.id,
        file_url=presigned_url(talk.file_key),
        file_preview_url=presigned_url(talk.file_preview_key),
        video_url=presigned_url(talk.video_key),
        attachments=[attachment_out(a) for a in talk.attachments],
    )


def blog_post_out(post: BlogPost) -> BlogPostOut:
    fields = BlogPostOut.model_fields.keys() - {"attachments"}
    return BlogPostOut(
        **{field: getattr(post, field) for field in fields},
        attachments=[attachment_out(a) for a in post.attachments],
    )
