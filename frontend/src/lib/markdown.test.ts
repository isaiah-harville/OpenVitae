import { describe, expect, test } from "bun:test";
import { markdown } from "./markdown";

describe("markdown", () => {
  test("renders formatting while removing executable HTML and unsafe links", () => {
    const html = markdown("**Hello** <script>alert(1)</script> [bad](javascript:alert(1))");
    expect(html).toContain("<strong>Hello</strong>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });
});
