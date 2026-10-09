import { env } from "$env/dynamic/private";
import type { Project, Publication, SiteConfig, Skill, Tag, Talk } from "$lib/api";

const base = () =>
  (env.SERVER_API_URL || env.API_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "");

async function get<T>(fetcher: typeof fetch, path: string): Promise<T> {
  const response = await fetcher(`${base()}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

export const serverApi = {
  config: (f: typeof fetch) => get<SiteConfig>(f, "/api/site/config"),
  publications: (f: typeof fetch, params = new URLSearchParams()) =>
    get<Publication[]>(f, `/api/publications?${params}`),
  talks: (f: typeof fetch) => get<Talk[]>(f, "/api/talks"),
  projects: (f: typeof fetch) => get<Project[]>(f, "/api/projects"),
  project: (f: typeof fetch, slug: string) =>
    get<Project>(f, `/api/projects/${encodeURIComponent(slug)}`),
  tags: (f: typeof fetch) => get<Tag[]>(f, "/api/tags"),
  skills: (f: typeof fetch) => get<Skill[]>(f, "/api/skills"),
};
