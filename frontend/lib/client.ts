"use client";

import { PUBLIC_API_URL, type Publication, type SiteConfig, type Tag } from "./api";

function token(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("ov_token") : null;
}

export function isAuthed(): boolean {
  return !!token();
}

export function logout() {
  localStorage.removeItem("ov_token");
}

async function req<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (auth && token()) headers.set("Authorization", `Bearer ${token()}`);
  const res = await fetch(`${PUBLIC_API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    logout();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

function jsonReq<T>(path: string, method: string, body: unknown): Promise<T> {
  return req<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const api = {
  getConfig: () => req<SiteConfig>("/api/site/config", {}, false),
  updateConfig: (body: Partial<Pick<SiteConfig, "profile" | "theme" | "features">>) =>
    jsonReq<SiteConfig>("/api/site/config", "PUT", body),

  listTags: () => req<Tag[]>("/api/tags", {}, false),
  createTag: (name: string) => jsonReq<Tag>("/api/tags", "POST", { name }),
  deleteTag: (id: number) => req<void>(`/api/tags/${id}`, { method: "DELETE" }),

  listPublications: () => req<Publication[]>("/api/publications", {}, false),
  createPublication: (body: Record<string, unknown>) =>
    jsonReq<Publication>("/api/publications", "POST", body),
  updatePublication: (id: number, body: Record<string, unknown>) =>
    jsonReq<Publication>(`/api/publications/${id}`, "PUT", body),
  deletePublication: (id: number) => req<void>(`/api/publications/${id}`, { method: "DELETE" }),

  uploadHeadshot: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<{ headshot_url: string }>("/api/uploads/headshot", { method: "POST", body: fd });
  },
  uploadPaper: (pubId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<{ file_url: string }>(`/api/uploads/publications/${pubId}/file`, {
      method: "POST",
      body: fd,
    });
  },
};
