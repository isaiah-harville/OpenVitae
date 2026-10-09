import { serverApi } from "$lib/server-api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, url }) => {
  const tag = url.searchParams.get("tag") ?? "";
  const sort = url.searchParams.get("sort") === "date_asc" ? "date_asc" : "date_desc";
  const params = new URLSearchParams({ sort });
  if (tag) params.set("tag", tag);
  const [publications, tags] = await Promise.all([
    serverApi.publications(fetch, params).catch(() => []),
    serverApi.tags(fetch).catch(() => []),
  ]);
  return { publications, tags, tag, sort };
};
