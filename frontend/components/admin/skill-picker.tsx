import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/lib/api";

export function SkillPicker({
  skills,
  selected,
  onChange,
}: {
  skills: Skill[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No skills yet — add some under the Skills tab.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => {
        const on = selected.includes(s.id);
        const style = s.color
          ? on
            ? { backgroundColor: s.color, borderColor: s.color, color: "#fff" }
            : { borderColor: s.color, color: s.color }
          : undefined;
        return (
          <Badge
            key={s.id}
            variant={on ? "default" : "outline"}
            className="cursor-pointer"
            style={style}
            onClick={() =>
              onChange(on ? selected.filter((id) => id !== s.id) : [...selected, s.id])
            }
          >
            {s.name}
          </Badge>
        );
      })}
    </div>
  );
}
