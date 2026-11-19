import { defineEnvVars } from "@sveltejs/kit/env";

const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
  SERVER_API_URL: {
    schema: optional,
    description: "Backend base URL for server-side loads. Falls back to API_INTERNAL_URL.",
  },
  API_INTERNAL_URL: {
    schema: optional,
    description: "Backend base URL for the /api proxy. Falls back to SERVER_API_URL.",
  },
});
