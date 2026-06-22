"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/api";
import { api } from "@/lib/client";

export function ProjectRow({ project, reload }: { project: Project; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: project.name,
    description: project.description || "",
    url: project.url || "",
    source_url: project.source_url || "",
  });

  async function save() {
    try {
      await api.updateProject(project.id, draft);
      await reload();
      setEditing(false);
      toast.success("Project updated");
    } catch (e) {
      toast.error(String(e));
    }
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border p-3">
        <Field label="Name">
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="URL">
            <Input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </Field>
          <Field label="Source URL">
            <Input
              value={draft.source_url}
              onChange={(e) => setDraft({ ...draft, source_url: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>Save</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="font-medium">{project.name}</p>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>
      <div className="flex shrink-0">
        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete"
          onClick={async () => {
            if (confirm("Delete this project?")) {
              await api.deleteProject(project.id);
              await reload();
            }
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
