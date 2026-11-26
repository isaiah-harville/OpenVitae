import type { PDFDocumentLoadingTask, PDFPageProxy, RenderTask } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");
let pdfjs: Promise<PdfJs> | undefined;

/** Load pdf.js (and its worker) on first use only, so pages without a PDF never pay for it. */
function library(): Promise<PdfJs> {
  pdfjs ??= Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjs;
}

export async function openPdf(url: string): Promise<PDFDocumentLoadingTask> {
  const lib = await library();
  return lib.getDocument({ url });
}

/** Scale that fits a page inside a box without cropping. */
export function fitScale(
  page: { width: number; height: number },
  box: { width: number; height: number },
): number {
  return Math.max(Math.min(box.width / page.width, box.height / page.height), 0.01);
}

/** Draw a page into canvas so it fits box, sharp on high-density screens. */
export function drawPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  box: { width: number; height: number },
): RenderTask {
  const scale = fitScale(page.getViewport({ scale: 1 }), box);
  const ratio = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: scale * ratio });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(viewport.width / ratio)}px`;
  canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
  return page.render({ canvas, viewport });
}
