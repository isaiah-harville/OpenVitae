import { getPublications, getSiteConfig, type Publication, type SiteConfig } from "@/lib/api";

export const dynamic = "force-dynamic";

function Publications({ pubs }: { pubs: Publication[] }) {
  if (pubs.length === 0) return <p className="muted">No publications yet.</p>;
  return (
    <>
      {pubs.map((p) => (
        <div className="pub" key={p.id}>
          <p className="pub-title">{p.title}</p>
          <p className="pub-meta">
            {[p.authors, p.venue, p.year].filter(Boolean).join(" · ")}
          </p>
          {p.abstract && <p>{p.abstract}</p>}
          <div>
            {p.tags.map((t) => (
              <span className="tag" key={t.id}>
                {t.name}
              </span>
            ))}
          </div>
          <div className="links" style={{ marginTop: "0.4rem" }}>
            {p.file_url && (
              <a href={p.file_url} target="_blank" rel="noreferrer">
                PDF
              </a>
            )}
            {p.doi && (
              <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">
                DOI
              </a>
            )}
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer">
                Link
              </a>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

export default async function Home() {
  let config: SiteConfig;
  let pubs: Publication[] = [];
  try {
    config = await getSiteConfig();
  } catch {
    return (
      <main className="container">
        <h1>OpenVitae</h1>
        <p className="muted">
          The backend is not reachable yet. Once it&apos;s up, configure your site at{" "}
          <a href="/admin">/admin</a>.
        </p>
      </main>
    );
  }

  const features = config.features || {};
  const profile = config.profile || {};
  if (features.publications !== false) {
    try {
      pubs = await getPublications();
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="container">
      <header className="header">
        {features.headshot !== false && config.headshot_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="headshot" src={config.headshot_url} alt={profile.name || "Headshot"} />
        )}
        <div>
          <h1 className="name">{profile.name || "Your Name"}</h1>
          {profile.title && <p className="title">{profile.title}</p>}
          {profile.location && <p className="muted">{profile.location}</p>}
        </div>
      </header>

      {features.about !== false && profile.bio && (
        <section className="section">
          <h2>About</h2>
          <p>{profile.bio}</p>
        </section>
      )}

      {features.publications !== false && (
        <section className="section">
          <h2>Publications</h2>
          <Publications pubs={pubs} />
        </section>
      )}

      {features.contact !== false && (profile.email || (profile.links?.length ?? 0) > 0) && (
        <section className="section">
          <h2>Contact</h2>
          {profile.email && (
            <p>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </p>
          )}
          <div className="links">
            {profile.links?.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
