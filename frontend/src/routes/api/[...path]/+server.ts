import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

const strip = new Set([
  "host",
  "connection",
  "content-length",
  "content-encoding",
  "transfer-encoding",
]);

const proxy: RequestHandler = async ({ request, params, url, fetch }) => {
  const base = (env.API_INTERNAL_URL || env.SERVER_API_URL || "http://localhost:8000").replace(
    /\/$/,
    "",
  );
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!strip.has(key.toLowerCase())) headers.set(key, value);
  });
  const upstream = await fetch(`${base}/api/${params.path}${url.search}`, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  });
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!strip.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
