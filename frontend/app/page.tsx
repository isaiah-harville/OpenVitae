import { ArrowRight, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { ProfileHero } from "@/components/public/profile-hero";
import { ProjectsSection } from "@/components/public/projects-section";
import { SectionHeading } from "@/components/public/section-heading";
import { SiteHeader } from "@/components/public/site-header";
import { TalksSection } from "@/components/public/talks-section";
import { PublicationCard } from "@/components/publication-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getProjects,
  getPublications,
  getSiteConfig,
  getTalks,
  type Project,
  type Publication,
  type SiteConfig,
  type Talk,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 5;

export default async function Home() {
  let config: SiteConfig;
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

  const [pubs, talks, projects] = await Promise.all([
    features.publications !== false
      ? getPublications({ limit: PREVIEW_LIMIT + 1 }).catch(() => [] as Publication[])
      : Promise.resolve([] as Publication[]),
    features.talks !== false ? getTalks().catch(() => [] as Talk[]) : Promise.resolve([] as Talk[]),
    features.projects !== false
      ? getProjects().catch(() => [] as Project[])
      : Promise.resolve([] as Project[]),
  ]);

  const hasMorePubs = pubs.length > PREVIEW_LIMIT;
  const previewPubs = pubs.slice(0, PREVIEW_LIMIT);

  return (
    <div className="min-h-screen">
      <SiteHeader name={profile.name} />

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <ProfileHero
          profile={profile}
          headshotUrl={config.headshot_url}
          showHeadshot={features.headshot !== false}
        />

        {features.about !== false && profile.bio && (
          <section className="mt-12">
            <SectionHeading>About</SectionHeading>
            <Markdown>{profile.bio}</Markdown>
          </section>
        )}

        {features.publications !== false && (
          <section className="mt-12">
            <SectionHeading>Publications</SectionHeading>
            {previewPubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No publications yet.</p>
            ) : (
              <div className="space-y-3">
                {previewPubs.map((p) => (
                  <PublicationCard key={p.id} pub={p} />
                ))}
              </div>
            )}
            {hasMorePubs && (
              <Button asChild variant="ghost" className="mt-3">
                <Link href="/publications">
                  View all publications <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </section>
        )}

        {features.talks !== false && <TalksSection talks={talks} />}
        {features.projects !== false && <ProjectsSection projects={projects} />}

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
          <span>
            Powered by{" "}
            <a
              href="https://github.com/isaiah-harville/OpenVitae"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              OpenVitae
            </a>
          </span>
          <Link href="/admin" className="hover:text-foreground">
            Admin
          </Link>
        </footer>
      </main>
    </div>
  );
}
