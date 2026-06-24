import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TagChip } from "@/components/public/tag-chip";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/lib/api";

export function ProjectsList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects yet.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.slug}`}
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="surface-card h-full overflow-hidden transition-colors group-hover:border-primary/50">
            {project.screenshot_urls[0] && (
              <img
                src={project.screenshot_urls[0]}
                alt=""
                className="aspect-video w-full object-cover"
              />
            )}
            <CardContent className="space-y-2">
              <h3 className="flex items-center gap-1 font-semibold leading-snug">
                {project.name}
                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              {project.description && (
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              )}
              {(project.tags.length > 0 || project.skills.length > 0) && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {project.tags.map((t) => (
                    <TagChip key={t.id} tag={t} />
                  ))}
                  {project.skills.map((s) => (
                    <TagChip key={s.id} tag={s} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
