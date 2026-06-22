"use client";

import { Download } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client";

export function DataManager({ reload }: ReloadProps) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function download() {
    setBusy(true);
    try {
      const blob = await api.downloadBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openvitae-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function restore(file: File) {
    if (!confirm("Restore will REPLACE all current site data. Continue?")) return;
    setBusy(true);
    try {
      await api.restoreBackup(file);
      await reload();
      toast.success("Site restored from backup");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup &amp; restore</CardTitle>
        <CardDescription>
          Export a single .zip with your config, publications, talks, projects, and uploaded files.
          Restore re-applies it if something goes wrong.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={download} disabled={busy}>
          <Download className="size-4" /> Download backup
        </Button>
        <div className="space-y-2">
          <Label>Restore from backup</Label>
          <Input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            className="max-w-sm"
            onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
          />
          <p className="text-sm text-destructive">This replaces all current data.</p>
        </div>
      </CardContent>
    </Card>
  );
}
