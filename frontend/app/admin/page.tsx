"use client";

import { LogOut, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Publication, SiteConfig, Tag } from "@/lib/api";
import { api, isAuthed, logout } from "@/lib/client";
import { DEFAULT_PALETTE, PALETTES, type ThemeConfig } from "@/lib/palettes";

const FEATURE_KEYS: { key: string; label: string; hint: string }[] = [
  { key: "about", label: "About section", hint: "Show your bio." },
  { key: "publications", label: "Publications", hint: "Show the publications list." },
  { key: "contact", label: "Contact", hint: "Show email and links." },
  { key: "headshot", label: "Headshot", hint: "Show your photo." },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);

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
    reload().catch((e) => toast.error(String(e)));
  }, [router, reload]);

  if (!config) {
    return <div className="mx-auto max-w-3xl px-5 py-16 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">OpenVitae Admin</h1>
        <div className="flex items-center gap-2">
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
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileEditor config={config} setConfig={setConfig} />
          <HeadshotEditor config={config} setConfig={setConfig} />
          <FeatureEditor config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceEditor config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="publications" className="space-y-6">
          <TagManager tags={tags} reload={reload} />
          <PublicationManager pubs={pubs} tags={tags} reload={reload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type EditorProps = {
  config: SiteConfig;
  setConfig: (c: SiteConfig) => void;
};

function ProfileEditor({ config, setConfig }: EditorProps) {
  const [p, setP] = useState(config.profile || {});
  const links = p.links || [];
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateConfig({ profile: p });
      setConfig(updated);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your name, title, and contact details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={p.name || ""} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </Field>
          <Field label="Title">
            <Input value={p.title || ""} onChange={(e) => setP({ ...p, title: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input
              value={p.location || ""}
              onChange={(e) => setP({ ...p, location: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input value={p.email || ""} onChange={(e) => setP({ ...p, email: e.target.value })} />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea
            rows={4}
            value={p.bio || ""}
            onChange={(e) => setP({ ...p, bio: e.target.value })}
          />
        </Field>

        <div className="space-y-2">
          <Label>Links</Label>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Label"
                value={l.label}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...next[i], label: e.target.value };
                  setP({ ...p, links: next });
                }}
              />
              <Input
                placeholder="https://…"
                value={l.url}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...next[i], url: e.target.value };
                  setP({ ...p, links: next });
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setP({ ...p, links: links.filter((_, j) => j !== i) })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setP({ ...p, links: [...links, { label: "", url: "" }] })}
          >
            <Plus className="size-4" /> Add link
          </Button>
        </div>

        <Button onClick={save} disabled={saving}>
          Save profile
        </Button>
      </CardContent>
    </Card>
  );
}

function HeadshotEditor({ config, setConfig }: EditorProps) {
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const { headshot_url } = await api.uploadHeadshot(file);
      setConfig({ ...config, headshot_url });
      toast.success("Headshot updated");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Headshot</CardTitle>
        <CardDescription>A square image works best.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-20">
          {config.headshot_url && <AvatarImage src={config.headshot_url} alt="Headshot" />}
          <AvatarFallback>
            <Upload className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Input
          type="file"
          accept="image/*"
          disabled={busy}
          className="max-w-xs"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </CardContent>
    </Card>
  );
}

function FeatureEditor({ config, setConfig }: EditorProps) {
  const [features, setFeatures] = useState<Record<string, boolean>>(config.features || {});
  const [saving, setSaving] = useState(false);

  async function toggle(key: string, value: boolean) {
    const next = { ...features, [key]: value };
    setFeatures(next);
    setSaving(true);
    try {
      const updated = await api.updateConfig({ features: next });
      setConfig(updated);
      toast.success("Features updated");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <CardDescription>Toggle sections of your public site on or off.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {FEATURE_KEYS.map(({ key, label, hint }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <Label htmlFor={`feat-${key}`}>{label}</Label>
              <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
            <Switch
              id={`feat-${key}`}
              checked={features[key] !== false}
              disabled={saving}
              onCheckedChange={(v) => toggle(key, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AppearanceEditor({ config, setConfig }: EditorProps) {
  const [theme, setTheme] = useState<ThemeConfig>((config.theme as ThemeConfig) || {});
  const [saving, setSaving] = useState(false);
  const selected = theme.palette || DEFAULT_PALETTE;

  // Live-preview the palette / custom color on the current page.
  function previewPalette(id: string) {
    document.documentElement.setAttribute("data-palette", id);
    setTheme((t) => ({ ...t, palette: id }));
  }
  function previewCustom(hex: string | undefined) {
    const root = document.documentElement;
    if (hex) {
      root.style.setProperty("--primary", hex);
      root.style.setProperty("--ring", hex);
      root.style.setProperty("--primary-foreground", "#ffffff");
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--primary-foreground");
    }
    setTheme((t) => ({ ...t, customPrimary: hex }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateConfig({ theme });
      setConfig(updated);
      toast.success("Appearance saved");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Pick a palette — each works in light and dark mode. Visitors can switch mode with the
          toggle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-2 block">Palette</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => previewPalette(p.id)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent ${
                  selected === p.id ? "border-primary ring-2 ring-ring" : "border-border"
                }`}
              >
                <span
                  className="size-5 shrink-0 rounded-full border"
                  style={{ background: p.swatch }}
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Default mode for new visitors</Label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={(theme.defaultMode || "system") === m ? "default" : "outline"}
                onClick={() => setTheme((t) => ({ ...t, defaultMode: m }))}
                className="capitalize"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Advanced: custom accent color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              className="h-10 w-14 p-1"
              value={theme.customPrimary || "#000000"}
              onChange={(e) => previewCustom(e.target.value)}
            />
            <Input
              className="max-w-40"
              placeholder="#3b82f6"
              value={theme.customPrimary || ""}
              onChange={(e) => previewCustom(e.target.value || undefined)}
            />
            {theme.customPrimary && (
              <Button variant="ghost" size="sm" onClick={() => previewCustom(undefined)}>
                Clear
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Overrides the palette&apos;s primary color when set.
          </p>
        </div>

        <Button onClick={save} disabled={saving}>
          Save appearance
        </Button>
      </CardContent>
    </Card>
  );
}

function TagManager({ tags, reload }: { tags: Tag[]; reload: () => Promise<void> }) {
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    try {
      await api.createTag(name.trim());
      setName("");
      await reload();
      toast.success("Tag added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>Used to categorize and filter publications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags yet.</p>}
          {tags.map((t) => (
            <Badge key={t.id} variant="secondary" className="gap-1">
              {t.name}
              <button
                type="button"
                aria-label={`Delete ${t.name}`}
                onClick={async () => {
                  await api.deleteTag(t.id);
                  await reload();
                }}
              >
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New tag"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="max-w-xs"
          />
          <Button onClick={add}>Add tag</Button>
        </div>
      </CardContent>
    </Card>
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
}: {
  pubs: Publication[];
  tags: Tag[];
  reload: () => Promise<void>;
}) {
  const [form, setForm] = useState({ ...EMPTY_PUB });

  async function create() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await api.createPublication({ ...form, year: form.year ? Number(form.year) : null });
      setForm({ ...EMPTY_PUB });
      await reload();
      toast.success("Publication added");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>{pubs.length} total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pubs.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          {pubs.map((pub) => (
            <PublicationRow key={pub.id} pub={pub} tags={tags} reload={reload} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add publication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Authors">
              <Input
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
              />
            </Field>
            <Field label="Year">
              <Input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </Field>
          <Field label="Abstract">
            <Textarea
              rows={3}
              value={form.abstract}
              onChange={(e) => setForm({ ...form, abstract: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="DOI">
              <Input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} />
            </Field>
            <Field label="URL">
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </Field>
          </div>
          <div>
            <Label className="mb-2 block">Tags</Label>
            <TagPicker
              tags={tags}
              selected={form.tag_ids}
              onChange={(ids) => setForm({ ...form, tag_ids: ids })}
            />
          </div>
          <Button onClick={create}>
            <Plus className="size-4" /> Add publication
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

function PublicationRow({
  pub,
  tags,
  reload,
}: {
  pub: Publication;
  tags: Tag[];
  reload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const selected = pub.tags.map((t) => t.id);

  async function setPubTags(ids: number[]) {
    await api.updatePublication(pub.id, { tag_ids: ids });
    await reload();
  }

  async function uploadPdf(file: File) {
    setBusy(true);
    try {
      await api.uploadPaper(pub.id, file);
      await reload();
      toast.success("PDF uploaded");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{pub.title}</p>
          <p className="text-sm text-muted-foreground">
            {[pub.authors, pub.venue, pub.year].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            if (confirm("Delete this publication?")) {
              await api.deletePublication(pub.id);
              await reload();
            }
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      <div className="mt-2">
        <TagPicker tags={tags} selected={selected} onChange={setPubTags} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        {pub.file_url && (
          <Button asChild variant="outline" size="sm">
            <a href={pub.file_url} target="_blank" rel="noreferrer">
              Current PDF
            </a>
          </Button>
        )}
        <Input
          type="file"
          accept="application/pdf"
          disabled={busy}
          className="max-w-xs"
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
  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">No tags yet — add some first.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const on = selected.includes(t.id);
        return (
          <Badge
            key={t.id}
            variant={on ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() =>
              onChange(on ? selected.filter((id) => id !== t.id) : [...selected, t.id])
            }
          >
            {t.name}
          </Badge>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
