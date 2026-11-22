<script lang="ts">
  import { untrack } from 'svelte';
  import { Button, Card } from '@sivir-ui/svelte';
  import { Plus, Trash2 } from 'lucide-svelte';
  import type { SiteConfig } from '#lib/api.ts';
  import { api } from '#lib/client.ts';
  import Field from './Field.svelte';
  let { config, updated, report }: { config: SiteConfig; updated: (config: SiteConfig) => void; report: (message: string, error?: boolean) => void } = $props();
  let profile = $state(untrack(() => ({ ...config.profile, links: [...(config.profile.links || [])], socials: [...(config.profile.socials || [])], education: [...(config.profile.education || [])] })));
  let busy = $state(false);
  async function save() {
    busy = true;
    try { updated(await api.updateConfig({ profile })); report('Profile saved'); }
    catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
  async function importGithub(username: string) {
    if (!username.trim()) return;
    busy = true;
    try {
      const result = await api.importGithub(username.trim());
      profile = { ...profile, name: result.name || profile.name, bio: result.bio || profile.bio, location: result.location || profile.location, links: [...(profile.links || []), ...result.links.filter((link) => !profile.links?.some((existing) => existing.url === link.url))], socials: [...(profile.socials || []), ...result.socials.filter((social) => !profile.socials?.some((existing) => existing.url === social.url))] };
      report('GitHub profile loaded. Save to keep it.');
    } catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
  async function importGithubPhoto() {
    if (!github.trim()) return;
    busy = true;
    try {
      const result = await api.importGithubHeadshot(github.trim());
      updated({ ...config, headshot_url: result.headshot_url });
      report('GitHub photo imported');
    } catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
  let github = $state('');
</script>
<Card.Root class="site-card !rounded-2xl !p-6"><p class="site-eyebrow mb-2">Who you are</p><h2 class="mb-6 text-2xl font-bold tracking-tight">Profile</h2>
  <div class="mb-7 rounded-xl border border-dashed border-[var(--site-line)] p-4">
    <span class="site-label">Start from GitHub</span>
    <div class="flex flex-wrap items-center gap-2"><input class="site-field min-w-0 flex-1 basis-48" placeholder="GitHub username" bind:value={github} onkeydown={(event) => { if (event.key === 'Enter') importGithub(github); }}/><Button variant="secondary" onclick={() => importGithub(github)} loading={busy}>Import profile</Button><Button variant="quiet" onclick={importGithubPhoto} disabled={busy}>Use GitHub photo</Button></div>
  </div>
  <div class="grid gap-5 sm:grid-cols-2"><Field label="Site title" bind:value={profile.siteName}/><Field label="Name" bind:value={profile.name}/><Field label="Title" bind:value={profile.title}/><Field label="Location" bind:value={profile.location}/><Field label="Email" type="email" bind:value={profile.email}/><div class="sm:col-span-2"><Field label="Bio (Markdown)" multiline mono bind:value={profile.bio}/></div></div>
  <section class="mt-8"><div class="mb-3 flex items-center justify-between"><h3 class="font-bold">Links</h3><Button variant="quiet" size="sm" onclick={() => profile.links = [...(profile.links || []), { label: '', url: '' }]}><Plus size={14}/> Add</Button></div>{#each profile.links || [] as link, index}<div class="mb-2 flex items-center gap-2"><input class="site-field sm:max-w-56" placeholder="Label" aria-label="Link label" bind:value={link.label}/><input class="site-field" type="url" placeholder="https://" aria-label="Link URL" bind:value={link.url}/><button type="button" class="admin-icon danger" aria-label="Remove link" onclick={() => profile.links = profile.links?.filter((_, i) => i !== index)}><Trash2 size={16}/></button></div>{:else}<p class="site-copy text-sm">No links yet.</p>{/each}</section>
  <section class="mt-8"><div class="mb-3 flex items-center justify-between"><h3 class="font-bold">Education</h3><Button variant="quiet" size="sm" onclick={() => profile.education = [...(profile.education || []), { institution: '', degree: '', concentration: '', startYear: '', endYear: '' }]}><Plus size={14}/> Add</Button></div>{#each profile.education || [] as entry, index}<div class="mb-3 rounded-xl border border-[var(--site-line)] p-4"><div class="mb-3 flex items-center justify-between gap-3"><p class="truncate text-sm font-semibold">{entry.institution || 'New entry'}</p><button type="button" class="admin-icon danger" aria-label="Remove education entry" onclick={() => profile.education = profile.education?.filter((_, i) => i !== index)}><Trash2 size={16}/></button></div><div class="grid gap-3 sm:grid-cols-2"><label><span class="site-label">Institution</span><input class="site-field" bind:value={entry.institution}/></label><label><span class="site-label">Degree</span><input class="site-field" placeholder="M.S. Computer Science" bind:value={entry.degree}/></label><label><span class="site-label">Concentration</span><input class="site-field" placeholder="Optional" bind:value={entry.concentration}/></label><div class="grid grid-cols-2 gap-3"><label><span class="site-label">Start year</span><input class="site-field" inputmode="numeric" placeholder="2025" bind:value={entry.startYear}/></label><label><span class="site-label">End year</span><input class="site-field" inputmode="numeric" placeholder="2027" bind:value={entry.endYear}/></label></div></div></div>{:else}<p class="site-copy text-sm">No education entries yet.</p>{/each}</section>
  <section class="mt-8"><div class="mb-3 flex items-center justify-between"><h3 class="font-bold">Social links</h3><Button variant="quiet" size="sm" onclick={() => profile.socials = [...(profile.socials || []), { platform: 'github', url: '' }]}><Plus size={14}/> Add</Button></div>{#each profile.socials || [] as social, index}<div class="mb-2 flex items-center gap-2"><input class="site-field max-w-36" placeholder="Platform" aria-label="Platform" bind:value={social.platform}/><input class="site-field" type="url" placeholder="https://" aria-label="Profile URL" bind:value={social.url}/><button type="button" class="admin-icon danger" aria-label="Remove social link" onclick={() => profile.socials = profile.socials?.filter((_, i) => i !== index)}><Trash2 size={16}/></button></div>{:else}<p class="site-copy text-sm">No social links yet.</p>{/each}</section>
  <div class="mt-8 flex justify-end border-t border-[var(--site-line)] pt-5"><Button onclick={save} loading={busy}>Save profile</Button></div>
</Card.Root>
