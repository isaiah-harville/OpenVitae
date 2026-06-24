"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project, Publication, SiteConfig, Skill, Tag, Talk } from "@/lib/api";
import { api, isAuthed } from "@/lib/client";

export function useAdminData(onUnauthed: () => void) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const reload = useCallback(async () => {
    const [c, t, p, tk, pr, sk] = await Promise.all([
      api.getConfig(),
      api.listTags(),
      api.listPublications(),
      api.listTalks(),
      api.listProjects(),
      api.listSkills(),
    ]);
    setConfig(c);
    setTags(t);
    setPubs(p);
    setTalks(tk);
    setProjects(pr);
    setSkills(sk);
  }, []);

  useEffect(() => {
    // In proxy (forward-auth) mode the reverse proxy handles auth — there's no local
    // token, so don't gate on one. Otherwise require a stored JWT.
    api
      .getAuthMode()
      .then(({ mode }) => {
        if (mode !== "proxy" && !isAuthed()) {
          onUnauthed();
          return;
        }
        return reload();
      })
      .catch((e) => toast.error(String(e)));
  }, [onUnauthed, reload]);

  return { config, setConfig, tags, pubs, talks, projects, skills, reload };
}
