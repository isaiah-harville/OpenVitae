"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { EditorProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client";
import { DEFAULT_PALETTE, PALETTES, type ThemeConfig } from "@/lib/palettes";

export function AppearanceEditor({ config, setConfig }: EditorProps) {
  const [theme, setTheme] = useState<ThemeConfig>((config.theme as ThemeConfig) || {});
  const [saving, setSaving] = useState(false);
  const selected = theme.palette || DEFAULT_PALETTE;

  function previewPalette(id: string) {
    document.documentElement.setAttribute("data-palette", id);
    setTheme((t) => ({ ...t, palette: id }));
  }
  function previewCustom(hex: string | undefined) {
    const root = document.documentElement;
    if (hex) {
      root.style.setProperty("--primary", hex);
      root.style.setProperty("--ring", hex);
      root.style.setProperty("--primary-foreground", "#ffffff");
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--primary-foreground");
    }
    setTheme((t) => ({ ...t, customPrimary: hex }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateConfig({ theme });
      setConfig(updated);
      toast.success("Appearance saved — reload the public site to see it");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Pick a palette — each works in light and dark mode. Visitors can switch mode with the
          toggle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-2 block">Palette</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PALETTES.map((pal) => (
              <button
                key={pal.id}
                type="button"
                onClick={() => previewPalette(pal.id)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent ${
                  selected === pal.id ? "border-primary ring-2 ring-ring" : "border-border"
                }`}
              >
                <span
                  className="size-5 shrink-0 rounded-full border"
                  style={{ background: pal.swatch }}
                />
                {pal.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Default mode for new visitors</Label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={(theme.defaultMode || "system") === m ? "default" : "outline"}
                onClick={() => setTheme((t) => ({ ...t, defaultMode: m }))}
                className="capitalize"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Advanced: custom accent color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              className="h-10 w-14 p-1"
              value={theme.customPrimary || "#000000"}
              onChange={(e) => previewCustom(e.target.value)}
            />
            <Input
              className="max-w-40"
              placeholder="#3b82f6"
              value={theme.customPrimary || ""}
              onChange={(e) => previewCustom(e.target.value || undefined)}
            />
            {theme.customPrimary && (
              <Button variant="ghost" size="sm" onClick={() => previewCustom(undefined)}>
                Clear
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Overrides the palette&apos;s primary color when set.
          </p>
        </div>

        <Button onClick={save} disabled={saving}>
          Save appearance
        </Button>
      </CardContent>
    </Card>
  );
}
