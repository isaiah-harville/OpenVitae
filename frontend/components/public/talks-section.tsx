import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Talk } from "@/lib/api";

export function TalksList({ talks }: { talks: Talk[] }) {
  if (talks.length === 0) return <p className="text-sm text-muted-foreground">No talks yet.</p>;
  return (
    <div className="space-y-3">
      {talks.map((talk) => (
        <Card key={talk.id}>
          <CardContent className="space-y-1">
            <h3 className="font-semibold leading-snug">{talk.title}</h3>
            <p className="text-sm text-muted-foreground">
              {[talk.event, talk.location, talk.event_date].filter(Boolean).join(" · ")}
            </p>
            {talk.description && <p className="text-sm leading-relaxed">{talk.description}</p>}
            {talk.url && (
              <Button asChild size="sm" variant="outline" className="mt-1">
                <a href={talk.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Slides / video
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
