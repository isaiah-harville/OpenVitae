import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader({ name }: { name?: string }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {name || "OpenVitae"}
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
