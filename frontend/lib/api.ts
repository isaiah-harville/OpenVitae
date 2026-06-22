// API base URLs.
//  - SERVER_API_URL: used in React Server Components (inside Docker network).
//  - NEXT_PUBLIC_API_URL: used in the browser (client components).
export const SERVER_API_URL =
  process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Tag = { id: number; name: string; slug: string };

export type Publication = {
  id: number;
  title: string;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
  abstract?: string | null;
  doi?: string | null;
  url?: string | null;
  sort_order: number;
  created_at: string;
  tags: Tag[];
  file_url?: string | null;
};

export type SiteConfig = {
  profile: {
    name?: string;
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
export const getPublications = (tag?: string) =>
  getJSON<Publication[]>(SERVER_API_URL, `/api/publications${tag ? `?tag=${tag}` : ""}`);

// ---- Client-side auth helper ----
export function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("ov_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
