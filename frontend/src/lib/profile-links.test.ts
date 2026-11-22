import { expect, test } from "bun:test";
import { platformName, profileLinks } from "./profile-links";

test("socials render with readable platform names before custom links", () => {
  expect(
    profileLinks({
      socials: [
        { platform: "github", url: "https://github.com/me" },
        { platform: "linkedin", url: "https://linkedin.com/in/me" },
      ],
      links: [{ label: "Lab", url: "https://lab.example" }],
    }),
  ).toEqual([
    { label: "GitHub", url: "https://github.com/me" },
    { label: "LinkedIn", url: "https://linkedin.com/in/me" },
    { label: "Lab", url: "https://lab.example" },
  ]);
});

test("empty entries are skipped and unknown platforms are capitalized", () => {
  expect(
    profileLinks({
      socials: [
        { platform: "github", url: "" },
        { platform: "substack", url: "https://me.substack.com" },
      ],
      links: [{ label: "", url: "https://me.example" }],
    }),
  ).toEqual([
    { label: "Substack", url: "https://me.substack.com" },
    { label: "https://me.example", url: "https://me.example" },
  ]);
  expect(profileLinks({})).toEqual([]);
  expect(platformName(" Scholar ")).toBe("Google Scholar");
});
