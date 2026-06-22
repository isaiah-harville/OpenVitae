import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader({ name }: { name?: string }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight transition-colors hover:text-primary"
        >
          {name || "OpenVitae"}
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
