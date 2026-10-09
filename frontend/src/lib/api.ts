export type Tag = { id: number; name: string; slug: string; color?: string | null };

export type Skill = {
  id: number;
  name: string;
  slug: string;
  category?: string | null;
  color?: string | null;
  sort_order: number;
};

export type Publication = {
  id: number;
  title: string;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
  abstract?: string | null;
  doi?: string | null;
  url?: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  tags: Tag[];
  file_url?: string | null;
};

export type Talk = {
  id: number;
  title: string;
  event?: string | null;
  location?: string | null;
  event_date?: string | null;
  url?: string | null;
  description?: string | null;
  sort_order: number;
  file_url?: string | null;
};

export type Project = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  source_url?: string | null;
  sort_order: number;
  tags: Tag[];
  skills: Skill[];
  screenshot_urls: string[];
};

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export type BlogPostSummary = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "published_at">;

export type SiteConfig = {
  profile: {
    name?: string;
    siteName?: string;
    title?: string;
    bio?: string;
    location?: string;
    email?: string;
    links?: { label: string; url: string }[];
    socials?: { platform: string; url: string }[];
    education?: {
      institution: string;
      degree: string;
      concentration: string;
      startYear: string;
      endYear: string;
    }[];
  };
  theme: Record<string, string>;
  features: Record<string, boolean>;
  pages: PageDocument | null;
  headshot_url?: string | null;
  updated_at?: string | null;
};

/**
 * Title for the browser tab and shared-link metadata (OpenGraph): explicit siteName,
 * else the profile name, else the product default. On-site UI labels stay "OpenVitae".
 */
export function siteName(config: Pick<SiteConfig, "profile"> | null | undefined): string {
  return config?.profile?.siteName?.trim() || config?.profile?.name?.trim() || "OpenVitae";
}

import type { PageDocument } from "./pages";
