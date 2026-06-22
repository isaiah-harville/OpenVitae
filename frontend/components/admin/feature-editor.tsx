"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { EditorProps } from "@/components/admin/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client";

const FEATURE_KEYS: { key: string; label: string; hint: string }[] = [
  { key: "about", label: "About section", hint: "Show your bio." },
  { key: "publications", label: "Publications", hint: "Show the publications list." },
  { key: "talks", label: "Talks", hint: "Show the talks section." },
  { key: "projects", label: "Projects", hint: "Show the personal projects section." },
  { key: "contact", label: "Contact", hint: "Show email and links." },
  { key: "headshot", label: "Headshot", hint: "Show your photo." },
];

export function FeatureEditor({ config, setConfig }: EditorProps) {
  const [features, setFeatures] = useState<Record<string, boolean>>(config.features || {});
  const [saving, setSaving] = useState(false);

  async function toggle(key: string, value: boolean) {
    const next = { ...features, [key]: value };
    setFeatures(next);
    setSaving(true);
    try {
      const updated = await api.updateConfig({ features: next });
      setConfig(updated);
      toast.success("Features updated");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <CardDescription>Toggle sections of your public site on or off.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {FEATURE_KEYS.map(({ key, label, hint }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <Label htmlFor={`feat-${key}`}>{label}</Label>
              <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
            <Switch
              id={`feat-${key}`}
              checked={features[key] !== false}
              disabled={saving}
              onCheckedChange={(v) => toggle(key, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
