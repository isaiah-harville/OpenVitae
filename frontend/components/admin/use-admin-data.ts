"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project, Publication, SiteConfig, Tag, Talk } from "@/lib/api";
import { api, isAuthed } from "@/lib/client";

export function useAdminData(onUnauthed: () => void) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const reload = useCallback(async () => {
    const [c, t, p, tk, pr] = await Promise.all([
      api.getConfig(),
      api.listTags(),
      api.listPublications(),
      api.listTalks(),
      api.listProjects(),
    ]);
    setConfig(c);
    setTags(t);
    setPubs(p);
    setTalks(tk);
    setProjects(pr);
  }, []);

  useEffect(() => {
    if (!isAuthed()) {
      onUnauthed();
      return;
    }
    reload().catch((e) => toast.error(String(e)));
  }, [onUnauthed, reload]);

  return { config, setConfig, tags, pubs, talks, projects, reload };
}
