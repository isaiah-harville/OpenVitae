"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Talk } from "@/lib/api";
import { api } from "@/lib/client";

export function TalkRow({ talk, reload }: { talk: Talk; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: talk.title,
    event: talk.event || "",
    location: talk.location || "",
    event_date: talk.event_date || "",
    url: talk.url || "",
    description: talk.description || "",
  });

  async function save() {
    try {
      await api.updateTalk(talk.id, { ...draft, event_date: draft.event_date || null });
      await reload();
      setEditing(false);
      toast.success("Talk updated");
    } catch (e) {
      toast.error(String(e));
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Event">
            <Input
              value={draft.event}
              onChange={(e) => setDraft({ ...draft, event: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={draft.event_date}
              onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Location">
            <Input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </Field>
          <Field label="URL">
            <Input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
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
      <div className="min-w-0">
        <p className="font-medium">{talk.title}</p>
        <p className="text-sm text-muted-foreground">
          {[talk.event, talk.location, talk.event_date].filter(Boolean).join(" · ")}
        </p>
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
            if (confirm("Delete this talk?")) {
              await api.deleteTalk(talk.id);
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
