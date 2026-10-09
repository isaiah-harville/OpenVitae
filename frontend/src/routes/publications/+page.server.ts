import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server-api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, url, parent }) => {
  const { publicContent } = await parent();
  if (publicContent.publications === 0) error(404, "No publications yet");
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
