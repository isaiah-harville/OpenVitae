import type { NextRequest } from "next/server";

// Runtime reverse proxy: the browser calls the API same-origin at /api/*, and this
// handler forwards to the internal API service. The target is read from the environment
// at REQUEST time (not baked at build), so a single prebuilt frontend image can be
// pointed at any API by setting the env var at container runtime. See issue #14.
export const dynamic = "force-dynamic";

function apiBase(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.SERVER_API_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

// Hop-by-hop / encoding headers we must not forward verbatim.
const STRIP = new Set([
  "host",
  "connection",
  "content-length",
  "content-encoding",
  "transfer-encoding",
]);

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const target = `${apiBase()}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const init: RequestInit = {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  };

  const upstream = await fetch(target, init);

  const respHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) respHeaders.set(key, value);
  });

  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
