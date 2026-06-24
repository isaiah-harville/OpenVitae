import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { ContactBlock } from "@/components/public/contact-block";
import { PagesLayout, type Section } from "@/components/public/pages-layout";
import { ProfileHero } from "@/components/public/profile-hero";
import { ProjectsList } from "@/components/public/projects-section";
import { PublicationsPreview } from "@/components/public/publications-preview";
import { SectionHeading } from "@/components/public/section-heading";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { SkillsList } from "@/components/public/skills-section";
import { TalksList } from "@/components/public/talks-section";
import {
  getProjects,
  getPublications,
  getSiteConfig,
  getSkills,
  getTalks,
  type Project,
  type Publication,
  type SiteConfig,
  type Skill,
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

  const [pubs, talks, projects, skills] = await Promise.all([
    features.publications !== false
      ? getPublications({ limit: PREVIEW_LIMIT + 1 }).catch(() => [] as Publication[])
      : Promise.resolve([] as Publication[]),
    features.talks !== false ? getTalks().catch(() => [] as Talk[]) : Promise.resolve([] as Talk[]),
    features.projects !== false
      ? getProjects().catch(() => [] as Project[])
      : Promise.resolve([] as Project[]),
    features.skills !== false
      ? getSkills().catch(() => [] as Skill[])
      : Promise.resolve([] as Skill[]),
  ]);

  // Build the enabled sections once; render them stacked (linear) or via the
  // navbar-driven pages layout.
  const sections: Section[] = [];
  const showSkills = features.skills !== false && skills.length > 0;
  if (features.about !== false && (profile.bio || showSkills)) {
    // Skills render beneath the bio as one combined "About" section (even in pages mode).
    sections.push({
      value: "about",
      label: "About",
      content: (
        <div className="space-y-8">
          {profile.bio && <Markdown>{profile.bio}</Markdown>}
          {showSkills && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Skills
              </h3>
              <SkillsList skills={skills} />
            </div>
          )}
        </div>
      ),
    });
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

  const hero = (
    <ProfileHero
      profile={profile}
      headshotUrl={config.headshot_url}
      showHeadshot={features.headshot !== false}
    />
  );

  if (layout === "pages") {
    return <PagesLayout name={profile.name} hero={hero} sections={sections} />;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader name={profile.name} />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-14">
        {hero}
        <div className="mt-16 space-y-16">
          {sections.map((s) => (
            <section key={s.value}>
              <SectionHeading>{s.label}</SectionHeading>
              {s.content}
            </section>
          ))}
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
