"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { ProjectRow } from "@/components/admin/project-row";
import { SkillPicker } from "@/components/admin/skill-picker";
import { TagPicker } from "@/components/admin/tag-picker";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project, Skill, Tag } from "@/lib/api";
import { api } from "@/lib/client";

const EMPTY_PROJECT = { name: "", description: "", content: "", url: "", source_url: "" };

export function ProjectManager({
  projects,
  tags,
  skills,
  reload,
}: { projects: Project[]; tags: Tag[]; skills: Skill[] } & ReloadProps) {
  const [form, setForm] = useState({ ...EMPTY_PROJECT });
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [skillIds, setSkillIds] = useState<number[]>([]);

  async function move(index: number, delta: number) {
    const next = [...projects];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await api.reorderProjects(next.map((p) => p.id));
      await reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function create() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await api.createProject({ ...form, tag_ids: tagIds, skill_ids: skillIds });
      setForm({ ...EMPTY_PROJECT });
      setTagIds([]);
      setSkillIds([]);
      await reload();
      toast.success("Project added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal projects</CardTitle>
          <CardDescription>
            {projects.length} total · enable the Projects section under Profile → Features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          {projects.map((project, i) => (
            <ProjectRow
              key={project.id}
              project={project}
              tags={tags}
              skills={skills}
              reload={reload}
              onMove={(delta) => move(i, delta)}
              isFirst={i === 0}
              isLast={i === projects.length - 1}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add project</CardTitle>
          <CardDescription>
            Add screenshots and a detail page after creating the project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Short description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Detail page (Markdown, optional)">
            <Textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="max-h-[60vh] resize-y field-sizing-fixed"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="URL">
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </Field>
            <Field label="Source URL">
              <Input
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Tags">
            <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
          </Field>
          <Field label="Skills">
            <SkillPicker skills={skills} selected={skillIds} onChange={setSkillIds} />
          </Field>
          <Button onClick={create}>
            <Plus className="size-4" /> Add project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
