import { expect, test } from "bun:test";
import { attachmentType } from "./client";

test("talk attachments keep the browser type or fall back to the extension", () => {
  expect(attachmentType({ name: "talk.mp4", type: "video/mp4" })).toBe("video/mp4");
  expect(attachmentType({ name: "Talk.MOV", type: "" })).toBe("video/quicktime");
  expect(attachmentType({ name: "deck.pptx", type: "" })).toBe(
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  );
  expect(attachmentType({ name: "notes", type: "" })).toBe("application/octet-stream");
});
