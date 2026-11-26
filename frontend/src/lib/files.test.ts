import { describe, expect, test } from "bun:test";
import { extension, fileKind, fileType, formatBytes, viewable } from "./files.ts";

describe("files", () => {
  test("extension ignores signed-URL query strings and dots in folders", () => {
    expect(extension("https://s3.test/talks/abc.PDF?X-Amz-Signature=1.2")).toBe("pdf");
    expect(extension("/v1.2/README")).toBe("");
  });

  test("file type falls back to the extension when the browser gives none", () => {
    expect(fileType({ name: "notes.md", type: "" })).toBe("text/markdown");
    expect(fileType({ name: "deck.key", type: "" })).toBe("application/octet-stream");
    expect(fileType({ name: "a.pdf", type: "application/pdf" })).toBe("application/pdf");
    expect(fileType({ name: "Talk.MOV", type: "" })).toBe("video/quicktime");
    expect(fileType({ name: "deck.pptx", type: "application/octet-stream" })).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
  });

  test("kinds group content types the way the viewer treats them", () => {
    expect(fileKind("application/pdf")).toBe("pdf");
    expect(
      fileKind("application/vnd.openxmlformats-officedocument.presentationml.presentation"),
    ).toBe("deck");
    expect(fileKind("application/zip")).toBe("archive");
    expect(fileKind("text/csv")).toBe("document");
    expect(viewable("pdf") && viewable("image") && !viewable("deck")).toBe(true);
  });

  test("sizes read like a file browser", () => {
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    expect(formatBytes(340 * 1024)).toBe("340 KB");
  });
});
