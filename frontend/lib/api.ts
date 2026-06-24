// API base URLs.
//  - SERVER_API_URL: used in React Server Components to call the API directly over the
//    internal network (read at request time on the server).
//  - PUBLIC_API_URL: used in the browser. Defaults to "" (same-origin), so client calls
//    hit /api/* and are proxied at runtime by app/api/[...path]/route.ts. This is why the
//    prebuilt frontend image needs no baked API URL. Set NEXT_PUBLIC_API_URL
//    only to bypass the proxy and call an absolute API origin directly.
export const SERVER_API_URL =
  process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
  };
  theme: Record<string, string>;
  features: Record<string, boolean>;
  headshot_url?: string | null;
  updated_at?: string | null;
};

async function getJSON<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}

// ---- Server-side fetchers (RSC) ----
export const getSiteConfig = () => getJSON<SiteConfig>(SERVER_API_URL, "/api/site/config");
export const getPublications = (params?: {
  tag?: string;
  featured?: boolean;
  sort?: string;
  limit?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.tag) q.set("tag", params.tag);
  if (params?.featured) q.set("featured", "true");
  if (params?.sort) q.set("sort", params.sort);
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return getJSON<Publication[]>(SERVER_API_URL, `/api/publications${qs ? `?${qs}` : ""}`);
};
export const getTalks = () => getJSON<Talk[]>(SERVER_API_URL, "/api/talks");
export const getProjects = () => getJSON<Project[]>(SERVER_API_URL, "/api/projects");
export const getProject = (slug: string) =>
  getJSON<Project>(SERVER_API_URL, `/api/projects/${encodeURIComponent(slug)}`);
export const getTags = () => getJSON<Tag[]>(SERVER_API_URL, "/api/tags");
export const getSkills = () => getJSON<Skill[]>(SERVER_API_URL, "/api/skills");

/**
 * Title for the browser tab and shared-link metadata (OpenGraph): explicit siteName,
 * else the profile name, else the product default. On-site UI labels stay "OpenVitae".
 */
export function siteName(config: Pick<SiteConfig, "profile"> | null | undefined): string {
  return config?.profile?.siteName?.trim() || config?.profile?.name?.trim() || "OpenVitae";
}

// ---- Client-side auth helper ----
export function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("ov_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
