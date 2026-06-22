import { ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteConfig } from "@/lib/api";

export function ContactBlock({ profile }: { profile: SiteConfig["profile"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {profile.email && (
        <Button asChild variant="outline" size="sm">
          <a href={`mailto:${profile.email}`}>
            <Mail className="size-4" /> {profile.email}
          </a>
        </Button>
      )}
      {profile.links?.map((l) => (
        <Button asChild key={l.url} variant="ghost" size="sm">
          <a href={l.url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> {l.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
