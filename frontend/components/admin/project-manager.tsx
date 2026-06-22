"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { ProjectRow } from "@/components/admin/project-row";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/api";
import { api } from "@/lib/client";

const EMPTY_PROJECT = { name: "", description: "", url: "", source_url: "" };

export function ProjectManager({ projects, reload }: { projects: Project[] } & ReloadProps) {
  const [form, setForm] = useState({ ...EMPTY_PROJECT });

  async function create() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await api.createProject(form);
      setForm({ ...EMPTY_PROJECT });
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
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} reload={reload} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
          <Button onClick={create}>
            <Plus className="size-4" /> Add project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
