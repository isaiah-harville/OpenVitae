import { expect, test } from "bun:test";
import { defaultPages, migratePages, moveBlock, pagePath, reservedSlug } from "./pages";

test("saved reactive pages can be copied for editing", () => {
  const saved = new Proxy(defaultPages({ projects: true }), {});
  const editable = migratePages(saved, false);
  expect(editable).toEqual(saved);
  editable.pages[0].title = "Edited home";
  expect(saved.pages[0].title).toBe("Home");
});

test("legacy home pages gain movable education and links blocks without reordering existing blocks", () => {
  const saved = defaultPages(
    {},
    {
      skills: 0,
      projects: 1,
      talks: 0,
      hasBio: true,
      hasContact: true,
      hasLinks: false,
      hasEducation: false,
    },
  );
  saved.version = 1;
  const originalTypes = saved.pages[0].blocks.map((block) => block.type);
  const migrated = migratePages(saved, true);
  expect(migrated.version).toBe(2);
  expect(migrated.pages[0].blocks.map((block) => block.type)).toEqual([
    ...originalTypes,
    "education",
    "links",
  ]);
  expect(saved.pages[0].blocks.map((block) => block.type)).toEqual(originalTypes);
  expect(migratePages(saved, true).pages[0].blocks.map((block) => block.id)).toEqual(
    migrated.pages[0].blocks.map((block) => block.id),
  );
  migrated.pages[0].blocks.splice(-2);
  expect(
    migratePages(migrated, true).pages[0].blocks.some((block) =>
      ["links", "education"].includes(block.type),
    ),
  ).toBe(false);
});

test("existing site starts with its visible homepage blocks", () => {
  const pages = defaultPages({ about: true, publications: false, projects: true });
  expect(pages.pages[0].blocks.map((block) => block.type)).toEqual([
    "hero",
    "about",
    "projects",
    "talks",
    "contact",
  ]);
});

test("builder starts with only sections that an existing site currently displays", () => {
  const pages = defaultPages(
    {},
    {
      skills: 2,
      projects: 0,
      talks: 0,
      hasBio: true,
      hasContact: false,
      hasLinks: false,
      hasEducation: false,
    },
  );
  expect(pages.pages[0].blocks.map((block) => block.type)).toEqual([
    "hero",
    "about",
    "skills",
    "publications",
  ]);
});

test("reserved and malformed page slugs cannot shadow system routes", () => {
  expect(reservedSlug("admin")).toBe(true);
  expect(reservedSlug("projects")).toBe(true);
  expect(reservedSlug("my-work")).toBe(false);
  expect(reservedSlug("My Work")).toBe(true);
});

test("block movement preserves order at bounds", () => {
  expect(moveBlock(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
  expect(moveBlock(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
  expect(moveBlock(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
});

test("homepage and custom pages use stable paths", () => {
  expect(pagePath("home")).toBe("/");
  expect(pagePath("research")).toBe("/research");
});
