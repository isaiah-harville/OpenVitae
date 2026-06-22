import { ExternalLink, FileText, Mail } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPublications, getSiteConfig, type Publication, type SiteConfig } from "@/lib/api";

export const dynamic = "force-dynamic";

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

function PublicationCard({ pub }: { pub: Publication }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-2">
        <h3 className="font-semibold leading-snug">{pub.title}</h3>
        <p className="text-sm text-muted-foreground">
          {[pub.authors, pub.venue, pub.year].filter(Boolean).join(" · ")}
        </p>
        {pub.abstract && <p className="text-sm leading-relaxed">{pub.abstract}</p>}
        {pub.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pub.tags.map((t) => (
              <Badge key={t.id} variant="secondary">
                {t.name}
              </Badge>
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

export default async function Home() {
  let config: SiteConfig;
  let pubs: Publication[] = [];
  try {
    config = await getSiteConfig();
  } catch {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">OpenVitae</h1>
        <p className="mt-2 text-muted-foreground">
          The backend isn&apos;t reachable yet. Once it&apos;s up, configure your site at{" "}
          <Link className="underline" href="/admin">
            /admin
          </Link>
          .
        </p>
      </main>
    );
  }

  const features = config.features || {};
  const profile = config.profile || {};
  if (features.publications !== false) {
    try {
      pubs = await getPublications();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            {profile.name || "OpenVitae"}
          </span>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <section className="flex flex-wrap items-center gap-6">
          {features.headshot !== false && (
            <Avatar className="size-28 ring-2 ring-primary ring-offset-2 ring-offset-background">
              {config.headshot_url && (
                <AvatarImage src={config.headshot_url} alt={profile.name || "Headshot"} />
              )}
              <AvatarFallback className="text-xl">{initials(profile.name || "")}</AvatarFallback>
            </Avatar>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {profile.name || "Your Name"}
            </h1>
            {profile.title && <p className="text-lg font-medium text-primary">{profile.title}</p>}
            {profile.location && (
              <p className="text-sm text-muted-foreground">{profile.location}</p>
            )}
          </div>
        </section>

        {features.about !== false && profile.bio && (
          <section className="mt-12">
            <SectionHeading>About</SectionHeading>
            <p className="leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {features.publications !== false && (
          <section className="mt-12">
            <SectionHeading>Publications</SectionHeading>
            {pubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No publications yet.</p>
            ) : (
              <div className="space-y-3">
                {pubs.map((p) => (
                  <PublicationCard key={p.id} pub={p} />
                ))}
              </div>
            )}
          </section>
        )}

        {features.contact !== false && (profile.email || (profile.links?.length ?? 0) > 0) && (
          <section className="mt-12">
            <SectionHeading>Contact</SectionHeading>
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
          </section>
        )}

        <Separator className="mt-16" />
        <footer className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Powered by OpenVitae</span>
          <Link href="/admin" className="hover:text-foreground">
            Admin
          </Link>
        </footer>
      </main>
    </div>
  );
}
