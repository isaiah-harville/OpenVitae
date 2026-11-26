export type FileKind =
  | "pdf"
  | "deck"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "other";

const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odp: "application/vnd.oasis.opendocument.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  epub: "application/epub+zip",
  zip: "application/zip",
  gz: "application/gzip",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

/** What the attachment picker accepts: every type the API allows. */
export const ATTACHMENT_ACCEPT = Object.keys(EXTENSION_TYPES)
  .map((ext) => `.${ext}`)
  .join(",");

export function extension(name: string): string {
  const path = name.split(/[?#]/)[0];
  const dot = path.lastIndexOf(".");
  return dot > path.lastIndexOf("/") && dot >= 0 ? path.slice(dot + 1).toLowerCase() : "";
}

/** The browser's MIME type, or one guessed from the extension when it has none. */
export function fileType(file: Pick<File, "name" | "type">): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  return EXTENSION_TYPES[extension(file.name)] ?? "application/octet-stream";
}

export function fileKind(contentType: string): FileKind {
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("presentation") || contentType === "application/vnd.ms-powerpoint")
    return "deck";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (/zip|gzip/.test(contentType)) return "archive";
  if (/word|sheet|excel|opendocument|epub|^text\//.test(contentType)) return "document";
  return "other";
}

/** Kinds the built-in viewer can show; everything else is download-only. */
export function viewable(kind: FileKind): boolean {
  return kind === "pdf" || kind === "image" || kind === "video" || kind === "audio";
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB"];
  let value = size / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
