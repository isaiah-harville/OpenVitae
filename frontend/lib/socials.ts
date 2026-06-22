// Known social/academic platforms an OpenVitae profile can link to. Stored in
// SiteConfig.profile.socials as { platform: <id>, url }. Icons are mapped by id in
// components/social-icon.tsx.

export type SocialPlatform = { id: string; name: string; placeholder: string };

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: "github", name: "GitHub", placeholder: "https://github.com/username" },
  { id: "x", name: "X", placeholder: "https://x.com/username" },
  { id: "linkedin", name: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  {
    id: "scholar",
    name: "Google Scholar",
    placeholder: "https://scholar.google.com/citations?user=…",
  },
  { id: "orcid", name: "ORCID", placeholder: "https://orcid.org/0000-0000-0000-0000" },
  { id: "mastodon", name: "Mastodon", placeholder: "https://mastodon.social/@username" },
  { id: "bluesky", name: "Bluesky", placeholder: "https://bsky.app/profile/username" },
  { id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@username" },
  { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/username" },
  { id: "website", name: "Website", placeholder: "https://example.com" },
];

export type Social = { platform: string; url: string };

export function platformName(id: string): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)?.name ?? id;
}
