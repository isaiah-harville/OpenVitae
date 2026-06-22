"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReloadProps } from "@/components/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Tag } from "@/lib/api";
import { api } from "@/lib/client";

export function TagManager({ tags, reload }: { tags: Tag[] } & ReloadProps) {
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    try {
      await api.createTag(name.trim());
      setName("");
      await reload();
      toast.success("Tag added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>Used to categorize and filter publications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
          {tags.map((t) => (
            <Badge key={t.id} variant="secondary" className="gap-1">
              {t.name}
              <button
                type="button"
                aria-label={`Delete ${t.name}`}
                onClick={async () => {
                  await api.deleteTag(t.id);
                  await reload();
                }}
              >
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
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
