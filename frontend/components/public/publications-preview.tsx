import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PublicationCard } from "@/components/publication-card";
import { Button } from "@/components/ui/button";
import type { Publication } from "@/lib/api";

export function PublicationsPreview({ pubs, hasMore }: { pubs: Publication[]; hasMore: boolean }) {
  if (pubs.length === 0) {
    return <p className="text-sm text-muted-foreground">No publications yet.</p>;
  }
  return (
    <div>
      <div className="space-y-3">
        {pubs.map((p) => (
          <PublicationCard key={p.id} pub={p} />
        ))}
      </div>
      {hasMore && (
        <Button asChild variant="ghost" className="mt-3">
          <Link href="/publications">
            View all publications <ArrowRight className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
