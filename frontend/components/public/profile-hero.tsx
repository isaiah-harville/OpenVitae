import { MapPin } from "lucide-react";
import { SocialIcon } from "@/components/social-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { SiteConfig } from "@/lib/api";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "OV"
  );
}

export function ProfileHero({
  profile,
  headshotUrl,
  showHeadshot,
}: {
  profile: SiteConfig["profile"];
  headshotUrl?: string | null;
  showHeadshot: boolean;
}) {
  const socials = profile.socials ?? [];
  return (
    <section className="flex flex-wrap items-center gap-6">
      {showHeadshot && (
        <Avatar className="size-24 ring-1 ring-border">
          {headshotUrl && <AvatarImage src={headshotUrl} alt={profile.name || "Headshot"} />}
          <AvatarFallback className="text-xl">{initials(profile.name || "")}</AvatarFallback>
        </Avatar>
      )}
      <div className="space-y-1.5">
        <h1 className="text-4xl font-bold tracking-tight">{profile.name || "Your Name"}</h1>
        {profile.title && <p className="text-lg text-muted-foreground">{profile.title}</p>}
        {profile.location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {profile.location}
          </p>
        )}
        {socials.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {socials.map((s) => (
              <Button
                key={`${s.platform}-${s.url}`}
                asChild
                variant="outline"
                size="icon"
                className="size-9 transition-colors hover:text-primary"
              >
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.platform}
                  title={s.platform}
                >
                  <SocialIcon platform={s.platform} className="size-4" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
