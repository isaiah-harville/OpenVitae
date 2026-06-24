import { TagChip } from "@/components/public/tag-chip";
import type { Skill } from "@/lib/api";

export function SkillsList({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">No skills yet.</p>;
  }

  // Group by category, preserving the admin's manual order; uncategorized last.
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const key = skill.category?.trim() || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(skill);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return 0;
  });

  return (
    <div className="space-y-5">
      {ordered.map(([category, items]) => (
        <div key={category || "_"} className="space-y-2">
          {category && <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>}
          <div className="flex flex-wrap gap-1.5">
            {items.map((s) => (
              <TagChip key={s.id} tag={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
