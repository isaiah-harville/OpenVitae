"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { PublicationImport } from "@/components/admin/publication-import";
import { PublicationRow } from "@/components/admin/publication-row";
import { TagPicker } from "@/components/admin/tag-picker";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Publication, Tag } from "@/lib/api";
import { api } from "@/lib/client";

const EMPTY_PUB = {
  title: "",
  authors: "",
  venue: "",
  year: "",
  abstract: "",
  doi: "",
  url: "",
  tag_ids: [] as number[],
};

export function PublicationManager({
  pubs,
  tags,
  reload,
}: {
  pubs: Publication[];
  tags: Tag[];
} & ReloadProps) {
  const [form, setForm] = useState({ ...EMPTY_PUB });

  async function create() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await api.createPublication({ ...form, year: form.year ? Number(form.year) : null });
      setForm({ ...EMPTY_PUB });
      await reload();
      toast.success("Publication added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...pubs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await api.reorderPublications(next.map((p) => p.id));
      await reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <>
      <PublicationImport reload={reload} />

      <Card>
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>
            {pubs.length} total · star to feature, arrows to reorder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pubs.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          {pubs.map((pub, i) => (
            <PublicationRow
              key={pub.id}
              pub={pub}
              tags={tags}
              reload={reload}
              onMove={(dir) => move(i, dir)}
              isFirst={i === 0}
              isLast={i === pubs.length - 1}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add publication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Authors">
              <Input
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
              />
            </Field>
            <Field label="Year">
              <Input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </Field>
          <Field label="Abstract">
            <Textarea
              rows={3}
              value={form.abstract}
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="DOI">
              <Input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} />
            </Field>
            <Field label="URL">
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </Field>
          </div>
          <div>
            <Label className="mb-2 block">Tags</Label>
            <TagPicker
              tags={tags}
              selected={form.tag_ids}
              onChange={(ids) => setForm({ ...form, tag_ids: ids })}
            />
          </div>
          <Button onClick={create}>
            <Plus className="size-4" /> Add publication
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
