import { loadPageContent } from "$lib/server/page-content";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { config } = await parent();
  return loadPageContent(fetch, config);
};
