"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import type { EditorProps } from "@/components/admin/types";
import { SocialIcon } from "@/components/social-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client";
import { SOCIAL_PLATFORMS } from "@/lib/socials";

export function ProfileEditor({ config, setConfig }: EditorProps) {
  const [p, setP] = useState(config.profile || {});
  const links = p.links || [];
  const socials = p.socials || [];
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateConfig({ profile: p });
      setConfig(updated);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your name, title, and contact details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={p.name || ""} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </Field>
          <Field label="Title">
            <Input value={p.title || ""} onChange={(e) => setP({ ...p, title: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input
              value={p.location || ""}
              onChange={(e) => setP({ ...p, location: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input value={p.email || ""} onChange={(e) => setP({ ...p, email: e.target.value })} />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea
            rows={4}
            value={p.bio || ""}
            onChange={(e) => setP({ ...p, bio: e.target.value })}
          />
        </Field>

        <div className="space-y-2">
          <Label>Links</Label>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Label"
                value={l.label}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...next[i], label: e.target.value };
                  setP({ ...p, links: next });
                }}
              />
              <Input
                placeholder="https://…"
                value={l.url}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...next[i], url: e.target.value };
                  setP({ ...p, links: next });
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setP({ ...p, links: links.filter((_, j) => j !== i) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setP({ ...p, links: [...links, { label: "", url: "" }] })}
          >
            <Plus className="size-4" /> Add link
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Social links</Label>
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Select
                value={s.platform}
                onValueChange={(platform) => {
                  const next = [...socials];
                  next[i] = { ...next[i], platform };
                  setP({ ...p, socials: next });
                }}
              >
                <SelectTrigger className="w-44 shrink-0">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((plat) => (
                    <SelectItem key={plat.id} value={plat.id}>
                      <SocialIcon platform={plat.id} className="size-4" />
                      {plat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={
                  SOCIAL_PLATFORMS.find((plat) => plat.id === s.platform)?.placeholder ||
                  "https://…"
                }
                value={s.url}
                onChange={(e) => {
                  const next = [...socials];
                  next[i] = { ...next[i], url: e.target.value };
                  setP({ ...p, socials: next });
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setP({ ...p, socials: socials.filter((_, j) => j !== i) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setP({ ...p, socials: [...socials, { platform: "github", url: "" }] })}
          >
            <Plus className="size-4" /> Add social link
          </Button>
        </div>

        <Button onClick={save} disabled={saving}>
          Save profile
        </Button>
      </CardContent>
    </Card>
  );
}
