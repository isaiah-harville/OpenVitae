import { expect, test } from "bun:test";
import { blogDate } from "./blog";

test("published dates render in UTC regardless of reader timezone", () => {
  expect(blogDate("2026-10-09T23:30:00Z")).toBe("October 9, 2026");
});

test("unpublished posts have no public date", () => {
  expect(blogDate(null)).toBe("Draft");
});
