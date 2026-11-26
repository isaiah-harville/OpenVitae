"""First-page thumbnails for uploaded PDFs, so cards can show a deck without loading it."""

import io
import logging
import tempfile

import pypdfium2 as pdfium

from .storage import delete_object, download_to, new_key, put_bytes

log = logging.getLogger(__name__)

PREVIEW_WIDTH = 1280
# Tall pages (posters, receipts) are cropped to this height rather than rendered whole.
MAX_PREVIEW_HEIGHT = 2400


def render_first_page(pdf: bytes | io.IOBase) -> bytes:
    """Render page 1 of a PDF as a WebP image. Raises pdfium.PdfiumError on a bad file."""
    document = pdfium.PdfDocument(pdf)
    try:
        page = document[0]
        scale = PREVIEW_WIDTH / max(page.get_width(), 1)
        crop_bottom = max(page.get_height() * scale - MAX_PREVIEW_HEIGHT, 0) / scale
        image = page.render(scale=scale, crop=(0, crop_bottom, 0, 0)).to_pil()
        out = io.BytesIO()
        image.convert("RGB").save(out, "WEBP", quality=82)
        return out.getvalue()
    finally:
        document.close()


def store_pdf_preview(key: str) -> str | None:
    """Render the stored PDF at key and store its preview; return the preview's key.

    Returns None when the object is missing or is not a readable PDF: the file is
    still usable, it just has no thumbnail.
    """
    with tempfile.TemporaryFile() as spool:
        if download_to(key, spool) is None:
            return None
        spool.seek(0)
        try:
            image = render_first_page(spool)
        except pdfium.PdfiumError:
            log.warning("Could not render a preview for %s", key)
            return None
    preview_key = new_key("previews", "preview.webp")
    put_bytes(preview_key, image, "image/webp")
    return preview_key


def replace_preview(old_key: str | None, file_key: str | None, content_type: str) -> str | None:
    """Drop an old preview and render a new one when the new file is a PDF."""
    if old_key:
        delete_object(old_key)
    if file_key and content_type == "application/pdf":
        return store_pdf_preview(file_key)
    return None
