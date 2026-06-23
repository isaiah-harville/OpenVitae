import { ArrowLeft, Code, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { ScreenshotGallery } from "@/components/public/screenshot-gallery";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { TagChip } from "@/components/public/tag-chip";
import { Button } from "@/components/ui/button";
import { getProject, getSiteConfig, type Project } from "@/lib/api";

export const dynamic = "force-dynamic";

async function load(slug: string): Promise<Project | null> {
  try {
    return await getProject(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await load(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.description || undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, config] = await Promise.all([load(slug), getSiteConfig().catch(() => null)]);
  if (!project) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader name={config?.profile?.name} />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <header className="mt-6 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-lg text-muted-foreground">{project.description}</p>
          )}
          {(project.tags.length > 0 || project.skills.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <TagChip key={t.id} tag={t} />
              ))}
              {project.skills.map((s) => (
                <TagChip key={s.id} tag={s} />
              ))}
            </div>
          )}
          {(project.url || project.source_url) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {project.url && (
                <Button asChild size="sm">
                  <a href={project.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Visit
                  </a>
                </Button>
              )}
              {project.source_url && (
                <Button asChild size="sm" variant="outline">
                  <a href={project.source_url} target="_blank" rel="noreferrer">
                    <Code className="size-4" /> Source
                  </a>
                </Button>
              )}
            </div>
          )}
        </header>

        {project.screenshot_urls.length > 0 && (
          <div className="mt-8">
            <ScreenshotGallery urls={project.screenshot_urls} />
          </div>
        )}

        {project.content && (
          <div className="mt-8">
            <Markdown>{project.content}</Markdown>
          </div>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}
