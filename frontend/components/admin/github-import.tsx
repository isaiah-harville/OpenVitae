"use client";

import { useState } from "react";
import { SiGithub } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type GithubImportResult } from "@/lib/client";

export function GithubImport({
  onProfile,
  onHeadshot,
}: {
  onProfile: (result: GithubImportResult) => void;
  onHeadshot: (url: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!username.trim()) return;
    setBusy(true);
    try {
      const result = await api.importGithub(username.trim());
      onProfile(result);
      toast.success("Imported from GitHub — review and save");
      try {
        const { headshot_url } = await api.importGithubHeadshot(username.trim());
        onHeadshot(headshot_url);
      } catch {
        /* avatar is best-effort */
      }
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <Label>Import from GitHub</Label>
      <div className="flex gap-2">
        <Input
          placeholder="github username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          className="max-w-xs"
        />
        <Button variant="secondary" onClick={run} disabled={busy}>
          <SiGithub className="size-4" /> Import
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Fills name, bio, location, links, and your avatar. Review, then save the profile.
      </p>
    </div>
  );
}
