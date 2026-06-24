"use client";

import {
  type Project,
  PUBLIC_API_URL,
  type Publication,
  type SiteConfig,
  type Skill,
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
  getAuthMode: () => req<{ mode: "jwt" | "proxy" }>("/api/auth/mode", {}, false),

  getConfig: () => req<SiteConfig>("/api/site/config", {}, false),
  updateConfig: (body: Partial<Pick<SiteConfig, "profile" | "theme" | "features">>) =>
    jsonReq<SiteConfig>("/api/site/config", "PUT", body),

  listTags: () => req<Tag[]>("/api/tags", {}, false),
  createTag: (name: string, color?: string | null) =>
    jsonReq<Tag>("/api/tags", "POST", { name, color }),
  updateTag: (id: number, body: { name?: string; color?: string | null }) =>
    jsonReq<Tag>(`/api/tags/${id}`, "PUT", body),
  deleteTag: (id: number) => req<void>(`/api/tags/${id}`, { method: "DELETE" }),

  listSkills: () => req<Skill[]>("/api/skills", {}, false),
  createSkill: (body: Record<string, unknown>) => jsonReq<Skill>("/api/skills", "POST", body),
  updateSkill: (id: number, body: Record<string, unknown>) =>
    jsonReq<Skill>(`/api/skills/${id}`, "PUT", body),
  deleteSkill: (id: number) => req<void>(`/api/skills/${id}`, { method: "DELETE" }),
  reorderSkills: (ids: number[]) => jsonReq<Skill[]>("/api/skills/reorder", "PUT", { ids }),

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
  reorderTalks: (ids: number[]) => jsonReq<Talk[]>("/api/talks/reorder", "PUT", { ids }),

  listProjects: () => req<Project[]>("/api/projects", {}, false),
  createProject: (body: Record<string, unknown>) => jsonReq<Project>("/api/projects", "POST", body),
  updateProject: (id: number, body: Record<string, unknown>) =>
    jsonReq<Project>(`/api/projects/${id}`, "PUT", body),
  deleteProject: (id: number) => req<void>(`/api/projects/${id}`, { method: "DELETE" }),
  reorderProjects: (ids: number[]) => jsonReq<Project[]>("/api/projects/reorder", "PUT", { ids }),
  uploadProjectScreenshot: (projectId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<{ screenshot_urls: string[] }>(`/api/uploads/projects/${projectId}/screenshots`, {
      method: "POST",
      body: fd,
    });
  },
  deleteProjectScreenshot: (projectId: number, index: number) =>
    req<{ screenshot_urls: string[] }>(
      `/api/uploads/projects/${projectId}/screenshots?index=${index}`,
      { method: "DELETE" },
    ),

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
  uploadTalkFile: (talkId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<{ file_url: string }>(`/api/uploads/talks/${talkId}/file`, {
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

  importGithub: (username: string) =>
    req<GithubImportResult>(`/api/import/github/${encodeURIComponent(username)}`),
  importGithubHeadshot: (username: string) =>
    req<{ headshot_url: string }>(`/api/import/github/${encodeURIComponent(username)}/headshot`, {
      method: "POST",
    }),

  importBibtex: (bibtex: string) => jsonReq<ImportResult>("/api/import/bibtex", "POST", { bibtex }),
  importOrcid: (orcid: string, enrich = true) =>
    jsonReq<ImportResult>("/api/import/orcid", "POST", { orcid, enrich }),
  importDoi: (doi: string) => jsonReq<ImportResult>("/api/import/doi", "POST", { doi }),
};

export type GithubImportResult = {
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  links: { label: string; url: string }[];
  socials: { platform: string; url: string }[];
  avatar_url?: string | null;
};

export type ImportResult = {
  created: number;
  skipped: number;
  titles: string[];
};
