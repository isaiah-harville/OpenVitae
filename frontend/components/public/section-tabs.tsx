"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Section = { value: string; label: string; content: ReactNode };

export function SectionTabs({ sections }: { sections: Section[] }) {
  if (sections.length === 0) return null;
  return (
    <Tabs defaultValue={sections[0].value} className="mt-10">
      <TabsList className="flex-wrap">
        {sections.map((s) => (
          <TabsTrigger key={s.value} value={s.value}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((s) => (
        <TabsContent key={s.value} value={s.value} className="mt-6">
          {s.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
