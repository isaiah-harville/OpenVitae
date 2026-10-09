import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server-api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { config } = await parent();
  if (config?.features.blog !== true) error(404, "Blog is disabled");
  const posts = await serverApi.blog(fetch);
  return { posts };
};
