"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ColorInput } from "@/components/admin/color-input";
import type { ReloadProps } from "@/components/admin/types";
import { TagChip } from "@/components/public/tag-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Tag } from "@/lib/api";
import { api } from "@/lib/client";

const DEFAULT_COLOR = "#6366f1";

export function TagManager({ tags, reload }: { tags: Tag[] } & ReloadProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  async function add() {
    if (!name.trim()) return;
    try {
      await api.createTag(name.trim(), color);
      setName("");
      await reload();
      toast.success("Tag added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function recolor(tag: Tag, value: string) {
    try {
      await api.updateTag(tag.id, { color: value });
      await reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>
          Categorize and filter publications and projects. Pick a color for each tag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <ColorInput
                label={`Color for ${t.name}`}
                value={t.color || DEFAULT_COLOR}
                onChange={(value) => recolor(t, value)}
              />
              <TagChip tag={t} />
              <button
                type="button"
                aria-label={`Delete ${t.name}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  await api.deleteTag(t.id);
                  await reload();
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ColorInput label="New tag color" value={color} onChange={setColor} className="size-9" />
          <Input
            placeholder="New tag"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="max-w-xs"
          />
          <Button onClick={add}>Add tag</Button>
        </div>
      </CardContent>
    </Card>
  );
}
