"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { TalkRow } from "@/components/admin/talk-row";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Talk } from "@/lib/api";
import { api } from "@/lib/client";

const EMPTY_TALK = {
  title: "",
  event: "",
  location: "",
  event_date: "",
  url: "",
  description: "",
};

export function TalkManager({ talks, reload }: { talks: Talk[] } & ReloadProps) {
  const [form, setForm] = useState({ ...EMPTY_TALK });

  async function move(index: number, delta: number) {
    const next = [...talks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await api.reorderTalks(next.map((t) => t.id));
      await reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function create() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await api.createTalk({ ...form, event_date: form.event_date || null });
      setForm({ ...EMPTY_TALK });
      await reload();
      toast.success("Talk added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Talks</CardTitle>
          <CardDescription>
            {talks.length} total · enable the Talks section under Profile → Features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {talks.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          {talks.map((talk, i) => (
            <TalkRow
              key={talk.id}
              talk={talk}
              reload={reload}
              onMove={(delta) => move(i, delta)}
              isFirst={i === 0}
              isLast={i === talks.length - 1}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add talk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event">
              <Input
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field label="URL (slides / video)">
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Button onClick={create}>
            <Plus className="size-4" /> Add talk
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
