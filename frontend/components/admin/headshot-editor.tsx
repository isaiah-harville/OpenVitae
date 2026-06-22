"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { EditorProps } from "@/components/admin/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client";

export function HeadshotEditor({ config, setConfig }: EditorProps) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const { headshot_url } = await api.uploadHeadshot(file);
      setConfig({ ...config, headshot_url });
      toast.success("Headshot updated");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Headshot</CardTitle>
        <CardDescription>A square image works best.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-20">
          {config.headshot_url && <AvatarImage src={config.headshot_url} alt="Headshot" />}
          <AvatarFallback>
            <Upload className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Input
          type="file"
          accept="image/*"
          disabled={busy}
          className="max-w-xs"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </CardContent>
    </Card>
  );
}
