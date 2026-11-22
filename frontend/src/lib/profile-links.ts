import type { SiteConfig } from "./api.ts";

type Profile = SiteConfig["profile"];
export type ProfileLink = { label: string; url: string };

// Display names for the platforms people usually type in the Social links editor.
const PLATFORM_NAMES: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  linkedin: "LinkedIn",
  x: "X",
  twitter: "X",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  scholar: "Google Scholar",
  "google-scholar": "Google Scholar",
  googlescholar: "Google Scholar",
  orcid: "ORCID",
  researchgate: "ResearchGate",
  youtube: "YouTube",
  huggingface: "Hugging Face",
  "hugging-face": "Hugging Face",
};

export function platformName(platform: string): string {
  const key = platform.trim().toLowerCase();
  if (PLATFORM_NAMES[key]) return PLATFORM_NAMES[key];
  return key ? key[0].toUpperCase() + key.slice(1) : "Link";
}

/** Social profiles first, then custom links; entries without a URL are skipped. */
export function profileLinks(profile: Pick<Profile, "links" | "socials">): ProfileLink[] {
  const socials = (profile.socials ?? []).map((social) => ({
    label: platformName(social.platform),
    url: social.url,
  }));
  const links = (profile.links ?? []).map((link) => ({
    label: link.label || link.url,
    url: link.url,
  }));
  return [...socials, ...links].filter((link) => link.url?.trim());
}
