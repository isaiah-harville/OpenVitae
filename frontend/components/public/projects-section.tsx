import { Code, ExternalLink } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/lib/api";

export function ProjectsSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  return (
    <section className="mt-12">
      <SectionHeading>Projects</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="space-y-2">
              <h3 className="font-semibold leading-snug">{project.name}</h3>
              {project.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              )}
              {(project.url || project.source_url) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {project.url && (
                    <Button asChild size="sm" variant="outline">
                      <a href={project.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" /> Visit
                      </a>
                    </Button>
                  )}
                  {project.source_url && (
                    <Button asChild size="sm" variant="ghost">
                      <a href={project.source_url} target="_blank" rel="noreferrer">
                        <Code className="size-4" /> Source
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
