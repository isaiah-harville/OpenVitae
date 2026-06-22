import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { ContactBlock } from "@/components/public/contact-block";
import { ProfileHero } from "@/components/public/profile-hero";
import { ProjectsList } from "@/components/public/projects-section";
import { PublicationsPreview } from "@/components/public/publications-preview";
import { SectionHeading } from "@/components/public/section-heading";
import { type Section, SectionTabs } from "@/components/public/section-tabs";
import { SiteHeader } from "@/components/public/site-header";
import { TalksList } from "@/components/public/talks-section";
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
import { DEFAULT_LAYOUT, type ThemeConfig } from "@/lib/palettes";

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
  const layout = (config.theme as ThemeConfig)?.layout || DEFAULT_LAYOUT;

  const [pubs, talks, projects] = await Promise.all([
    features.publications !== false
      ? getPublications({ limit: PREVIEW_LIMIT + 1 }).catch(() => [] as Publication[])
      : Promise.resolve([] as Publication[]),
    features.talks !== false ? getTalks().catch(() => [] as Talk[]) : Promise.resolve([] as Talk[]),
    features.projects !== false
      ? getProjects().catch(() => [] as Project[])
      : Promise.resolve([] as Project[]),
  ]);

  // Build the enabled sections once; render them stacked (linear) or as tabs (pages).
  const sections: Section[] = [];
  if (features.about !== false && profile.bio) {
    sections.push({ value: "about", label: "About", content: <Markdown>{profile.bio}</Markdown> });
  }
  if (features.publications !== false) {
    sections.push({
      value: "publications",
      label: "Publications",
      content: (
        <PublicationsPreview
          pubs={pubs.slice(0, PREVIEW_LIMIT)}
          hasMore={pubs.length > PREVIEW_LIMIT}
        />
      ),
    });
  }
  if (features.talks !== false && talks.length > 0) {
    sections.push({ value: "talks", label: "Talks", content: <TalksList talks={talks} /> });
  }
  if (features.projects !== false && projects.length > 0) {
    sections.push({
      value: "projects",
      label: "Projects",
      content: <ProjectsList projects={projects} />,
    });
  }
  if (features.contact !== false && (profile.email || (profile.links?.length ?? 0) > 0)) {
    sections.push({
      value: "contact",
      label: "Contact",
      content: <ContactBlock profile={profile} />,
    });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader name={profile.name} />

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <ProfileHero
          profile={profile}
          headshotUrl={config.headshot_url}
          showHeadshot={features.headshot !== false}
        />

        {layout === "pages" ? (
          <SectionTabs sections={sections} />
        ) : (
          sections.map((s) => (
            <section key={s.value} className="mt-12">
              <SectionHeading>{s.label}</SectionHeading>
              {s.content}
            </section>
          ))
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
