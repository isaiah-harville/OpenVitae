import { describe, expect, test } from "bun:test";
import { markdown } from "./markdown";

describe("markdown", () => {
  test("keeps centered badge groups without allowing arbitrary styles", () => {
    const html = markdown(
      '<div align="center" style="position:fixed"><img src="https://img.shields.io/badge/Python"/></div>',
    );
    expect(html).toContain('<div align="center">');
    expect(html).toContain('src="https://img.shields.io/badge/Python"');
    expect(html).not.toContain("style=");
  });

  test("renders formatting while removing executable HTML and unsafe links", () => {
    const html = markdown("**Hello** <script>alert(1)</script> [bad](javascript:alert(1))");
    expect(html).toContain("<strong>Hello</strong>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });
});
