import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/lib/api";

export function TagPicker({
  tags,
  selected,
  onChange,
}: {
  tags: Tag[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">No tags yet — add some first.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const on = selected.includes(t.id);
        const style = t.color
          ? on
            ? { backgroundColor: t.color, borderColor: t.color, color: "#fff" }
            : { borderColor: t.color, color: t.color }
          : undefined;
        return (
          <Badge
            key={t.id}
            variant={on ? "default" : "outline"}
            className="cursor-pointer"
            style={style}
            onClick={() =>
              onChange(on ? selected.filter((id) => id !== t.id) : [...selected, t.id])
            }
          >
            {t.name}
          </Badge>
        );
      })}
    </div>
  );
}
