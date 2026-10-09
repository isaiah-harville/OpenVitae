import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server-api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent, params }) => {
  const { config } = await parent();
  if (config?.features.blog !== true) error(404, "Blog is disabled");
  const post = await serverApi.blogPost(fetch, params.slug).catch(() => null);
  if (!post) error(404, "Blog post not found");
  return { post };
};
