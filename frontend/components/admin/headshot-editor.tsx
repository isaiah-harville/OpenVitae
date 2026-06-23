"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HeadshotCropper } from "@/components/admin/headshot-cropper";
import type { EditorProps } from "@/components/admin/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client";

export function HeadshotEditor({ config, setConfig }: EditorProps) {
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);

  async function uploadCropped(blob: Blob) {
    setBusy(true);
    try {
      const file = new File([blob], "headshot.jpg", { type: "image/jpeg" });
      const { headshot_url } = await api.uploadHeadshot(file);
      setConfig({ ...config, headshot_url });
      setPicked(null);
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
        <CardDescription>Crop and zoom to frame your photo before saving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {picked ? (
          <HeadshotCropper
            file={picked}
            busy={busy}
            onCancel={() => setPicked(null)}
            onCropped={uploadCropped}
          />
        ) : (
          <div className="flex items-center gap-4">
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
              onChange={(e) => {
                if (e.target.files?.[0]) setPicked(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
