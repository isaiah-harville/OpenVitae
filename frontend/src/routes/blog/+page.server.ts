import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server-api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { config, publicContent } = await parent();
  if (config?.features.blog !== true || publicContent.posts === 0)
    error(404, "Blog has no published posts");
  const posts = await serverApi.blog(fetch);
  return { posts };
};
