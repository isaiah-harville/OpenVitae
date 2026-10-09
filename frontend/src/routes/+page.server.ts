import { serverApi } from "$lib/server-api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { config } = await parent();
  const features = config?.features ?? {};
  const [publications, talks, projects, skills] = await Promise.all([
    features.publications !== false
      ? serverApi.publications(fetch, new URLSearchParams({ limit: "6" })).catch(() => [])
      : [],
    features.talks !== false ? serverApi.talks(fetch).catch(() => []) : [],
    features.projects !== false ? serverApi.projects(fetch).catch(() => []) : [],
    features.skills !== false ? serverApi.skills(fetch).catch(() => []) : [],
  ]);
  return { publications, talks, projects, skills };
};
