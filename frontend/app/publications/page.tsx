import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PublicationFilters } from "@/components/public/publication-filters";
import { SectionHeading } from "@/components/public/section-heading";
import { SiteHeader } from "@/components/public/site-header";
import { PublicationCard } from "@/components/publication-card";
import { getPublications, getSiteConfig, getTags, type Publication, type Tag } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;
  const sort = sp.sort === "date_asc" ? "date_asc" : "date_desc";

  let name: string | undefined;
  let tags: Tag[] = [];
  let pubs: Publication[] = [];
  try {
    const [config, allTags, list] = await Promise.all([
      getSiteConfig(),
      getTags(),
      getPublications({ tag, sort }),
    ]);
    name = config.profile?.name;
    tags = allTags;
    pubs = list;
  } catch {
    /* backend down — render empties */
  }

  return (
    <div className="min-h-screen">
      <SiteHeader name={name} />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <SectionHeading>All publications</SectionHeading>
        <PublicationFilters tags={tags} activeTag={tag} activeSort={sort} />
        {pubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No publications found.</p>
        ) : (
          <div className="space-y-3">
            {pubs.map((p) => (
              <PublicationCard key={p.id} pub={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
