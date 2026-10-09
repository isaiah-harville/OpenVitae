import { error } from "@sveltejs/kit";
import { loadPageContent } from "$lib/server/page-content";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent, params }) => {
  const { config } = await parent();
  const page = config?.pages?.pages.find((item) => item.slug === params.slug);
  if (!page) error(404, "Page not found");
  return { page, ...(await loadPageContent(fetch, config)) };
};
