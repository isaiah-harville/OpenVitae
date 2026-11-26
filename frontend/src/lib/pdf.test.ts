import { expect, test } from "bun:test";
import { fitScale } from "./pdf.ts";

test("pages fit the viewer without cropping on either axis", () => {
  expect(fitScale({ width: 960, height: 540 }, { width: 480, height: 1000 })).toBe(0.5);
  expect(fitScale({ width: 612, height: 792 }, { width: 1200, height: 396 })).toBe(0.5);
});
