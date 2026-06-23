"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AppearanceEditor } from "@/components/admin/appearance-editor";
import { DataManager } from "@/components/admin/data-manager";
import { FeatureEditor } from "@/components/admin/feature-editor";
import { HeadshotEditor } from "@/components/admin/headshot-editor";
import { ProfileEditor } from "@/components/admin/profile-editor";
import { ProjectManager } from "@/components/admin/project-manager";
import { PublicationManager } from "@/components/admin/publication-manager";
import { SkillManager } from "@/components/admin/skill-manager";
import { TagManager } from "@/components/admin/tag-manager";
import { TalkManager } from "@/components/admin/talk-manager";
import { useAdminData } from "@/components/admin/use-admin-data";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logout } from "@/lib/client";

export default function AdminDashboard() {
  const router = useRouter();
  const onUnauthed = useCallback(() => router.push("/admin/login"), [router]);
  const { config, setConfig, tags, pubs, talks, projects, skills, reload } =
    useAdminData(onUnauthed);

  if (!config) {
    return <div className="mx-auto max-w-3xl px-5 py-16 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">OpenVitae Admin</h1>
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <Button asChild variant="outline" size="sm">
            <a href="/" target="_blank" rel="noreferrer">
              View site
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 w-full max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="talks">Talks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileEditor config={config} setConfig={setConfig} />
          <HeadshotEditor config={config} setConfig={setConfig} />
          <FeatureEditor config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceEditor config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="publications">
          <PublicationManager pubs={pubs} tags={tags} reload={reload} />
        </TabsContent>

        <TabsContent value="talks">
          <TalkManager talks={talks} reload={reload} />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectManager projects={projects} tags={tags} skills={skills} reload={reload} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillManager skills={skills} reload={reload} />
        </TabsContent>

        <TabsContent value="tags">
          <TagManager tags={tags} reload={reload} />
        </TabsContent>

        <TabsContent value="data">
          <DataManager reload={reload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
