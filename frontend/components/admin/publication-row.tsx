"use client";

import { ArrowDown, ArrowUp, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { TagPicker } from "@/components/admin/tag-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Publication, Tag } from "@/lib/api";
import { api } from "@/lib/client";

export function PublicationRow({
  pub,
  tags,
  reload,
  onMove,
  isFirst,
  isLast,
}: {
  pub: Publication;
  tags: Tag[];
  reload: () => Promise<void>;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    title: pub.title,
    authors: pub.authors || "",
    venue: pub.venue || "",
    year: pub.year ? String(pub.year) : "",
    abstract: pub.abstract || "",
    doi: pub.doi || "",
    url: pub.url || "",
    tag_ids: pub.tags.map((t) => t.id),
  });

  async function patch(body: Record<string, unknown>) {
    await api.updatePublication(pub.id, body);
    await reload();
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await patch({ ...draft, year: draft.year ? Number(draft.year) : null });
      toast.success("Publication updated");
      setEditing(false);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadPdf(file: File) {
    setBusy(true);
    try {
      await api.uploadPaper(pub.id, file);
      await reload();
      toast.success("PDF uploaded");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border p-3">
        <Field label="Title">
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Authors">
            <Input
              value={draft.authors}
              onChange={(e) => setDraft({ ...draft, authors: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <Input
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Venue">
          <Input
            value={draft.venue}
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
        </Field>
        <Field label="Abstract">
          <Textarea
            rows={3}
            value={draft.abstract}
            onChange={(e) => setDraft({ ...draft, abstract: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="DOI">
            <Input
              value={draft.doi}
              onChange={(e) => setDraft({ ...draft, doi: e.target.value })}
            />
          </Field>
          <Field label="URL">
            <Input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </Field>
        </div>
        <div>
          <Label className="mb-2 block">Tags</Label>
          <TagPicker
            tags={tags}
            selected={draft.tag_ids}
            onChange={(ids) => setDraft({ ...draft, tag_ids: ids })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={saveEdit} disabled={busy}>
            Save
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium">
            {pub.featured && <Star className="size-3.5 fill-primary text-primary" />}
            {pub.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {[pub.authors, pub.venue, pub.year].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={pub.featured ? "Unfeature" : "Feature"}
            title={pub.featured ? "Unfeature" : "Feature"}
            onClick={() => patch({ featured: !pub.featured })}
          >
            <Star className={`size-4 ${pub.featured ? "fill-primary text-primary" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Move up"
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Move down"
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete"
            onClick={async () => {
              if (confirm("Delete this publication?")) {
                await api.deletePublication(pub.id);
                await reload();
              }
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
      {pub.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pub.tags.map((t) => (
            <Badge key={t.id} variant="secondary">
              {t.name}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        {pub.file_url && (
          <Button asChild variant="outline" size="sm">
            <a href={pub.file_url} target="_blank" rel="noreferrer">
              Current PDF
            </a>
          </Button>
        )}
        <Input
          type="file"
          accept="application/pdf"
          disabled={busy}
          className="max-w-xs"
          onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])}
        />
      </div>
    </div>
  );
}
