import Link from "next/link";

export function SiteFooter() {
  return (
    <>
      <hr className="mt-16 border-border" />
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
    </>
  );
}
