"use client";

import { ChevronDown, ChevronUp, Pencil, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { SkillPicker } from "@/components/admin/skill-picker";
import { TagPicker } from "@/components/admin/tag-picker";
import { TagChip } from "@/components/public/tag-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project, Skill, Tag } from "@/lib/api";
import { api } from "@/lib/client";

export function ProjectRow({
  project,
  tags,
  skills,
  reload,
  onMove,
  isFirst,
  isLast,
}: {
  project: Project;
  tags: Tag[];
  skills: Skill[];
  reload: () => Promise<void>;
  onMove?: (delta: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({
    name: project.name,
    description: project.description || "",
    content: project.content || "",
    url: project.url || "",
    source_url: project.source_url || "",
  });
  const [tagIds, setTagIds] = useState<number[]>(project.tags.map((t) => t.id));
  const [skillIds, setSkillIds] = useState<number[]>(project.skills.map((s) => s.id));

  async function save() {
    try {
      await api.updateProject(project.id, { ...draft, tag_ids: tagIds, skill_ids: skillIds });
      await reload();
      setEditing(false);
      toast.success("Project updated");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function addScreenshot(file: File) {
    setUploading(true);
    try {
      await api.uploadProjectScreenshot(project.id, file);
      await reload();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setUploading(false);
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
        <Field label="Short description">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>
        <Field label="Detail page (Markdown)">
          <Textarea
            rows={5}
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            className="max-h-[60vh] resize-y field-sizing-fixed"
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
        <Field label="Tags">
          <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
        </Field>
        <Field label="Skills">
          <SkillPicker skills={skills} selected={skillIds} onChange={setSkillIds} />
        </Field>

        <Field label="Screenshots">
          <div className="flex flex-wrap gap-2">
            {project.screenshot_urls.map((url, i) => (
              <div key={url} className="group relative">
                <img
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  className="size-20 rounded-md border object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove screenshot"
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white"
                  onClick={async () => {
                    await api.deleteProjectScreenshot(project.id, i);
                    await reload();
                  }}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addScreenshot(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> {uploading ? "Uploading…" : "Add screenshot"}
          </Button>
        </Field>

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
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{project.name}</p>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        {(project.tags.length > 0 || project.skills.length > 0) && (
          <div className="flex flex-wrap gap-1 pt-1">
            {project.tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
            {project.skills.map((s) => (
              <TagChip key={s.id} tag={s} />
            ))}
          </div>
        )}
        {project.screenshot_urls.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {project.screenshot_urls.length} screenshot
            {project.screenshot_urls.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <div className="flex shrink-0">
        {onMove && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={isFirst}
              onClick={() => onMove(-1)}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={isLast}
              onClick={() => onMove(1)}
            >
              <ChevronDown className="size-4" />
            </Button>
          </>
        )}
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
