import type { SiteConfig } from "$lib/api";
import { serverApi } from "$lib/server-api";

export async function loadPageContent(fetcher: typeof fetch, config: SiteConfig | null) {
  const features = config?.features ?? {};
  const builder = Boolean(config?.pages);
  const [publications, talks, projects, skills] = await Promise.all([
    builder || features.publications !== false
      ? serverApi.publications(fetcher, new URLSearchParams({ limit: "6" })).catch(() => [])
      : [],
    builder || features.talks !== false ? serverApi.talks(fetcher).catch(() => []) : [],
    builder || features.projects !== false ? serverApi.projects(fetcher).catch(() => []) : [],
    builder || features.skills !== false ? serverApi.skills(fetcher).catch(() => []) : [],
  ]);
  return { publications, talks, projects, skills };
}
