import { expect, test } from "bun:test";
import { showBlog, showPublications } from "./public-content";

test("publications stay hidden until one is imported", () => {
  expect(showPublications(0)).toBe(false);
  expect(showPublications(1)).toBe(true);
});

test("blog stays hidden until an enabled blog has a published post", () => {
  expect(showBlog(true, 0)).toBe(false);
  expect(showBlog(true, 1)).toBe(true);
  expect(showBlog(false, 1)).toBe(false);
});
