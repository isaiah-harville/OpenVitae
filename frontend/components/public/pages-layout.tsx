"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { SiteFooter } from "@/components/public/site-footer";
import { cn } from "@/lib/utils";

export type Section = { value: string; label: string; content: ReactNode };

export function PagesLayout({
  name,
  hero,
  sections,
}: {
  name?: string;
  hero: ReactNode;
  sections: Section[];
}) {
  const [active, setActive] = useState(sections[0]?.value);
  const current = sections.find((s) => s.value === active) ?? sections[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <span className="font-semibold tracking-tight">{name || "OpenVitae"}</span>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {sections.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setActive(s.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active === s.value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        {hero}
        <div className="mt-10">{current?.content}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
