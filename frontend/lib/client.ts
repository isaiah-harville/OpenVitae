"use client";

import {
  type Project,
  PUBLIC_API_URL,
  type Publication,
  type SiteConfig,
  type Tag,
  type Talk,
} from "./api";

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
  reorderPublications: (ids: number[]) =>
    jsonReq<Publication[]>("/api/publications/reorder", "PUT", { ids }),

  listTalks: () => req<Talk[]>("/api/talks", {}, false),
  createTalk: (body: Record<string, unknown>) => jsonReq<Talk>("/api/talks", "POST", body),
  updateTalk: (id: number, body: Record<string, unknown>) =>
    jsonReq<Talk>(`/api/talks/${id}`, "PUT", body),
  deleteTalk: (id: number) => req<void>(`/api/talks/${id}`, { method: "DELETE" }),

  listProjects: () => req<Project[]>("/api/projects", {}, false),
  createProject: (body: Record<string, unknown>) => jsonReq<Project>("/api/projects", "POST", body),
  updateProject: (id: number, body: Record<string, unknown>) =>
    jsonReq<Project>(`/api/projects/${id}`, "PUT", body),
  deleteProject: (id: number) => req<void>(`/api/projects/${id}`, { method: "DELETE" }),

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

  // Backup downloads a zip; restore uploads one.
  async downloadBackup(): Promise<Blob> {
    const headers = new Headers();
    if (token()) headers.set("Authorization", `Bearer ${token()}`);
    const res = await fetch(`${PUBLIC_API_URL}/api/backup`, { headers });
    if (!res.ok) throw new Error(`Backup failed (${res.status})`);
    return res.blob();
  },
  restoreBackup: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<{ status: string }>("/api/restore", { method: "POST", body: fd });
  },
};
