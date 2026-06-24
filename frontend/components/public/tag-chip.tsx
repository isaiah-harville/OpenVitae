import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/lib/api";

/** A tag chip that honors the tag's configured color (falls back to a neutral outline). */
export function TagChip({
  tag,
  className,
}: {
  tag: Pick<Tag, "name" | "color">;
  className?: string;
}) {
  const style = tag.color ? { borderColor: tag.color, color: tag.color } : undefined;
  return (
    <Badge variant="outline" className={className} style={style}>
      {tag.name}
    </Badge>
  );
}
