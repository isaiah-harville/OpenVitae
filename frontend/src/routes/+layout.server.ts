import { serverApi } from "$lib/server-api";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch }) => ({
  config: await serverApi.config(fetch).catch(() => null),
});
