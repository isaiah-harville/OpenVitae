import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/lib/api";

function href(tag: string | undefined, sort: string): string {
  const q = new URLSearchParams();
  if (tag) q.set("tag", tag);
  if (sort !== "date_desc") q.set("sort", sort);
  const qs = q.toString();
  return `/publications${qs ? `?${qs}` : ""}`;
}

export function PublicationFilters({
  tags,
  activeTag,
  activeSort,
}: {
  tags: Tag[];
  activeTag?: string;
  activeSort: string;
}) {
  return (
    <div className="mb-6 space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={href(undefined, activeSort)}>
            <Badge variant={activeTag ? "outline" : "default"} className="cursor-pointer">
              All
            </Badge>
          </Link>
          {tags.map((t) => (
            <Link key={t.id} href={href(t.slug, activeSort)}>
              <Badge
                variant={activeTag === t.slug ? "default" : "outline"}
                className="cursor-pointer"
              >
                {t.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        <Button asChild size="sm" variant={activeSort === "date_desc" ? "default" : "outline"}>
          <Link href={href(activeTag, "date_desc")}>Newest</Link>
        </Button>
        <Button asChild size="sm" variant={activeSort === "date_asc" ? "default" : "outline"}>
          <Link href={href(activeTag, "date_asc")}>Oldest</Link>
        </Button>
      </div>
    </div>
  );
}
