"""First-page thumbnails rendered from real PDFs."""

import io

import pypdfium2 as pdfium
import pytest
from PIL import Image

from app.previews import MAX_PREVIEW_HEIGHT, PREVIEW_WIDTH, render_first_page


def pdf(*sizes: tuple[float, float]) -> bytes:
    document = pdfium.PdfDocument.new()
    for width, height in sizes:
        document.new_page(width, height)
    out = io.BytesIO()
    document.save(out)
    return out.getvalue()


def test_preview_is_a_webp_of_the_first_page_at_card_width():
    image = Image.open(io.BytesIO(render_first_page(pdf((960, 540), (100, 100)))))
    assert image.format == "WEBP"
    assert image.size == (PREVIEW_WIDTH, 720)


def test_very_tall_first_pages_are_cropped():
    image = Image.open(io.BytesIO(render_first_page(pdf((100, 10_000)))))
    assert image.size == (PREVIEW_WIDTH, MAX_PREVIEW_HEIGHT)


def test_a_file_that_is_not_a_pdf_raises():
    with pytest.raises(pdfium.PdfiumError):
        render_first_page(b"not a pdf")
