import { serverApi } from "$lib/server-api";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch }) => ({
  config: await serverApi.config(fetch).catch(() => null),
  publicContent: await Promise.all([
    serverApi
      .publications(fetch, new URLSearchParams({ limit: "1" }))
      .then((items) => items.length)
      .catch(() => 0),
    serverApi
      .blog(fetch)
      .then((items) => items.length)
      .catch(() => 0),
  ]).then(([publications, posts]) => ({ publications, posts })),
});
