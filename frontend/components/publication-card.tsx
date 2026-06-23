import { ExternalLink, FileText, Star } from "lucide-react";
import { TagChip } from "@/components/public/tag-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Publication } from "@/lib/api";

export function PublicationCard({ pub }: { pub: Publication }) {
  return (
    <Card className="surface-card">
      <CardContent className="space-y-2">
        <h3 className="flex items-start gap-1.5 font-semibold leading-snug">
          {pub.featured && <Star className="mt-1 size-3.5 shrink-0 fill-primary text-primary" />}
          {pub.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {[pub.authors, pub.venue, pub.year].filter(Boolean).join(" · ")}
        </p>
        {pub.abstract && <p className="text-sm leading-relaxed">{pub.abstract}</p>}
        {pub.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pub.tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </div>
        )}
        {(pub.file_url || pub.doi || pub.url) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {pub.file_url && (
              <Button asChild size="sm" variant="outline">
                <a href={pub.file_url} target="_blank" rel="noreferrer">
                  <FileText className="size-4" /> PDF
                </a>
              </Button>
            )}
            {pub.doi && (
              <Button asChild size="sm" variant="ghost">
                <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> DOI
                </a>
              </Button>
            )}
            {pub.url && (
              <Button asChild size="sm" variant="ghost">
                <a href={pub.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Link
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
