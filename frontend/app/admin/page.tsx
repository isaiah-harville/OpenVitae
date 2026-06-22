"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, isAuthed, logout } from "@/lib/client";
import type { Publication, SiteConfig, Tag } from "@/lib/api";

const THEME_COLORS: { key: string; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
];

const FEATURE_KEYS: { key: string; label: string }[] = [
  { key: "about", label: "About section" },
  { key: "publications", label: "Publications section" },
  { key: "contact", label: "Contact section" },
  { key: "headshot", label: "Show headshot" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [msg, setMsg] = useState("");

  const reload = useCallback(async () => {
    const [c, t, p] = await Promise.all([api.getConfig(), api.listTags(), api.listPublications()]);
    setConfig(c);
    setTags(t);
    setPubs(p);
  }, []);

  useEffect(() => {
    if (!isAuthed()) {
      router.push("/admin/login");
      return;
    }
    reload().catch((e) => setMsg(String(e)));
  }, [router, reload]);

  if (!config) return <div className="admin">Loading…</div>;

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div className="admin">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>OpenVitae Admin</h1>
        <div className="row">
          <a href="/" target="_blank" rel="noreferrer">
            View site
          </a>
          <button
            className="secondary"
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      {msg && <p className="muted">{msg}</p>}

      <ProfileEditor config={config} setConfig={setConfig} onSave={flash} />
      <HeadshotEditor config={config} setConfig={setConfig} onSave={flash} />
      <ThemeEditor config={config} setConfig={setConfig} onSave={flash} />
      <FeatureEditor config={config} setConfig={setConfig} onSave={flash} />
      <TagManager tags={tags} reload={reload} onSave={flash} />
      <PublicationManager pubs={pubs} tags={tags} reload={reload} onSave={flash} />
    </div>
  );
}

type EditorProps = {
  config: SiteConfig;
  setConfig: (c: SiteConfig) => void;
  onSave: (msg: string) => void;
};

function ProfileEditor({ config, setConfig, onSave }: EditorProps) {
  const [p, setP] = useState(config.profile || {});
  const links = p.links || [];

  async function save() {
    const updated = await api.updateConfig({ profile: p });
    setConfig(updated);
    onSave("Profile saved");
  }

  return (
    <section className="card">
      <h2>Profile</h2>
      <label>Name</label>
      <input value={p.name || ""} onChange={(e) => setP({ ...p, name: e.target.value })} />
      <label>Title</label>
      <input value={p.title || ""} onChange={(e) => setP({ ...p, title: e.target.value })} />
      <label>Location</label>
      <input value={p.location || ""} onChange={(e) => setP({ ...p, location: e.target.value })} />
      <label>Email</label>
      <input value={p.email || ""} onChange={(e) => setP({ ...p, email: e.target.value })} />
      <label>Bio</label>
      <textarea rows={4} value={p.bio || ""} onChange={(e) => setP({ ...p, bio: e.target.value })} />

      <label>Links</label>
      {links.map((l, i) => (
        <div className="row" key={i} style={{ marginBottom: "0.4rem" }}>
          <input
            placeholder="Label"
            value={l.label}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], label: e.target.value };
              setP({ ...p, links: next });
            }}
          />
          <input
            placeholder="https://…"
            value={l.url}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], url: e.target.value };
              setP({ ...p, links: next });
            }}
          />
          <button
            className="danger"
            type="button"
            onClick={() => setP({ ...p, links: links.filter((_, j) => j !== i) })}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        className="secondary"
        type="button"
        onClick={() => setP({ ...p, links: [...links, { label: "", url: "" }] })}
      >
        + Add link
      </button>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={save}>Save profile</button>
      </div>
    </section>
  );
}

function HeadshotEditor({ config, setConfig, onSave }: EditorProps) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const { headshot_url } = await api.uploadHeadshot(file);
      setConfig({ ...config, headshot_url });
      onSave("Headshot updated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Headshot</h2>
      <div className="row">
        {config.headshot_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="headshot" src={config.headshot_url} alt="Headshot" />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
    </section>
  );
}

function ThemeEditor({ config, setConfig, onSave }: EditorProps) {
  const [theme, setTheme] = useState<Record<string, string>>(config.theme || {});

  async function save() {
    const updated = await api.updateConfig({ theme });
    setConfig(updated);
    onSave("Theme saved (reload the public site to see it)");
  }

  return (
    <section className="card">
      <h2>Color palette</h2>
      {THEME_COLORS.map(({ key, label }) => (
        <div className="row" key={key} style={{ marginBottom: "0.4rem" }}>
          <label style={{ margin: 0, width: 120 }}>{label}</label>
          <input
            type="color"
            style={{ width: 60, padding: 2 }}
            value={theme[key] || "#000000"}
            onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
          />
          <input
            style={{ width: 120 }}
            value={theme[key] || ""}
            onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
          />
        </div>
      ))}
      <label>Font family</label>
      <input value={theme.font || ""} onChange={(e) => setTheme({ ...theme, font: e.target.value })} />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={save}>Save palette</button>
      </div>
    </section>
  );
}

function FeatureEditor({ config, setConfig, onSave }: EditorProps) {
  const [features, setFeatures] = useState<Record<string, boolean>>(config.features || {});

  async function save() {
    const updated = await api.updateConfig({ features });
    setConfig(updated);
    onSave("Features saved");
  }

  return (
    <section className="card">
      <h2>Features</h2>
      {FEATURE_KEYS.map(({ key, label }) => (
        <div className="toggle" key={key}>
          <input
            type="checkbox"
            id={`feat-${key}`}
            checked={features[key] !== false}
            onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
          />
          <label htmlFor={`feat-${key}`} style={{ margin: 0 }}>
            {label}
          </label>
        </div>
      ))}
      <div style={{ marginTop: "1rem" }}>
        <button onClick={save}>Save features</button>
      </div>
    </section>
  );
}

function TagManager({
  tags,
  reload,
  onSave,
}: {
  tags: Tag[];
  reload: () => Promise<void>;
  onSave: (msg: string) => void;
}) {
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    await api.createTag(name.trim());
    setName("");
    await reload();
    onSave("Tag added");
  }

  return (
    <section className="card">
      <h2>Tags</h2>
      <div className="row">
        {tags.map((t) => (
          <span className="tag" key={t.id}>
            {t.name}{" "}
            <button
              className="danger"
              style={{ padding: "0 0.3rem", marginLeft: 4 }}
              onClick={async () => {
                await api.deleteTag(t.id);
                await reload();
              }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="row" style={{ marginTop: "0.75rem" }}>
        <input placeholder="New tag" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={add}>Add tag</button>
      </div>
    </section>
  );
}

const EMPTY_PUB = {
  title: "",
  authors: "",
  venue: "",
  year: "",
  abstract: "",
  doi: "",
  url: "",
  tag_ids: [] as number[],
};

function PublicationManager({
  pubs,
  tags,
  reload,
  onSave,
}: {
  pubs: Publication[];
  tags: Tag[];
  reload: () => Promise<void>;
  onSave: (msg: string) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_PUB });

  async function create() {
    if (!form.title.trim()) return;
    await api.createPublication({
      ...form,
      year: form.year ? Number(form.year) : null,
    });
    setForm({ ...EMPTY_PUB });
    await reload();
    onSave("Publication added");
  }

  return (
    <section className="card">
      <h2>Publications</h2>

      {pubs.map((pub) => (
        <PublicationRow key={pub.id} pub={pub} tags={tags} reload={reload} onSave={onSave} />
      ))}

      <h3>Add publication</h3>
      <label>Title</label>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Authors</label>
          <input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} />
        </div>
        <div style={{ width: 90 }}>
          <label>Year</label>
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
        </div>
      </div>
      <label>Venue</label>
      <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
      <label>Abstract</label>
      <textarea
        rows={3}
        value={form.abstract}
        onChange={(e) => setForm({ ...form, abstract: e.target.value })}
      />
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>DOI</label>
          <input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label>URL</label>
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
      </div>
      <TagPicker
        tags={tags}
        selected={form.tag_ids}
        onChange={(ids) => setForm({ ...form, tag_ids: ids })}
      />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={create}>Add publication</button>
      </div>
    </section>
  );
}

function PublicationRow({
  pub,
  tags,
  reload,
  onSave,
}: {
  pub: Publication;
  tags: Tag[];
  reload: () => Promise<void>;
  onSave: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const selected = pub.tags.map((t) => t.id);

  async function setTags(ids: number[]) {
    await api.updatePublication(pub.id, { tag_ids: ids });
    await reload();
  }

  async function uploadPdf(file: File) {
    setBusy(true);
    try {
      await api.uploadPaper(pub.id, file);
      await reload();
      onSave("PDF uploaded");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pub">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{pub.title}</strong>
        <button
          className="danger"
          onClick={async () => {
            if (confirm("Delete this publication?")) {
              await api.deletePublication(pub.id);
              await reload();
            }
          }}
        >
          Delete
        </button>
      </div>
      <p className="pub-meta">{[pub.authors, pub.venue, pub.year].filter(Boolean).join(" · ")}</p>
      <TagPicker tags={tags} selected={selected} onChange={setTags} />
      <div className="row" style={{ marginTop: "0.5rem" }}>
        {pub.file_url && (
          <a href={pub.file_url} target="_blank" rel="noreferrer">
            Current PDF
          </a>
        )}
        <input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0])}
        />
      </div>
    </div>
  );
}

function TagPicker({
  tags,
  selected,
  onChange,
}: {
  tags: Tag[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  return (
    <div className="row" style={{ marginTop: "0.5rem" }}>
      {tags.length === 0 && <span className="muted">No tags yet — add some above.</span>}
      {tags.map((t) => {
        const on = selected.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            className={on ? "" : "secondary"}
            style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
            onClick={() =>
              onChange(on ? selected.filter((id) => id !== t.id) : [...selected, t.id])
            }
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
