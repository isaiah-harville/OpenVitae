"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ColorInput } from "@/components/admin/color-input";
import { Field } from "@/components/admin/field";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Skill } from "@/lib/api";
import { api } from "@/lib/client";

const DEFAULT_COLOR = "#6366f1";

export function SkillManager({ skills, reload }: { skills: Skill[] } & ReloadProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  async function add() {
    if (!name.trim()) return;
    try {
      await api.createSkill({ name: name.trim(), category: category.trim() || null, color });
      setName("");
      setCategory("");
      await reload();
      toast.success("Skill added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function recolor(skill: Skill, value: string) {
    try {
      await api.updateSkill(skill.id, { color: value });
      await reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function move(index: number, delta: number) {
    const next = [...skills];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await api.reorderSkills(next.map((s) => s.id));
      await reload();
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          {skills.length} total · enable the Skills section under Profile → Features. Skills can be
          attached to projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {skills.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <ColorInput
                  label={`Color for ${s.name}`}
                  value={s.color || DEFAULT_COLOR}
                  onChange={(value) => recolor(s, value)}
                />
                <span className="font-medium">{s.name}</span>
                {s.category && <span className="text-sm text-muted-foreground">{s.category}</span>}
              </div>
              <div className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move down"
                  disabled={i === skills.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${s.name}`}
                  onClick={async () => {
                    await api.deleteSkill(s.id);
                    await reload();
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <ColorInput
            label="New skill color"
            value={color}
            onChange={setColor}
            className="mb-0.5 size-9"
          />
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input
                placeholder="e.g. Python"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
            </Field>
            <Field label="Category (optional)">
              <Input
                placeholder="e.g. Languages"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
            </Field>
          </div>
        </div>
        <Button onClick={add}>
          <Plus className="size-4" /> Add skill
        </Button>
      </CardContent>
    </Card>
  );
}
