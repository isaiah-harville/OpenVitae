<script lang="ts">
  import { Button, Card } from '@sivir-ui/svelte';
  import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-svelte';
  import type { Project, Publication, Skill, Tag, Talk } from '$lib/api';
  import { api } from '$lib/client';
  import Field from './Field.svelte';

  type Entity = Publication | Talk | Project | Skill | Tag;
  type Kind = 'publications' | 'talks' | 'projects' | 'skills' | 'tags';
  type FieldDef = { key: string; label: string; multiline?: boolean; type?: string };
  let { kind, items, tags = [], skills = [], reload, report }: { kind: Kind; items: Entity[]; tags?: Tag[]; skills?: Skill[]; reload: () => Promise<void>; report: (message: string, error?: boolean) => void } = $props();
  const definitions: Record<Kind, FieldDef[]> = {
    publications: [{ key: 'title', label: 'Title' }, { key: 'authors', label: 'Authors' }, { key: 'venue', label: 'Venue' }, { key: 'year', label: 'Year', type: 'number' }, { key: 'abstract', label: 'Abstract', multiline: true }, { key: 'doi', label: 'DOI' }, { key: 'url', label: 'URL' }],
    talks: [{ key: 'title', label: 'Title' }, { key: 'event', label: 'Event' }, { key: 'event_date', label: 'Date', type: 'date' }, { key: 'location', label: 'Location' }, { key: 'url', label: 'Slides or video URL' }, { key: 'description', label: 'Description', multiline: true }],
    projects: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Short description', multiline: true }, { key: 'content', label: 'Detail page (Markdown)', multiline: true }, { key: 'url', label: 'Project URL' }, { key: 'source_url', label: 'Source URL' }],
    skills: [{ key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }],
    tags: [{ key: 'name', label: 'Name' }]
  };
  const fields = $derived(definitions[kind]);
  let editing = $state<number | null>(null);
  let form = $state<Record<string, string>>({});
  let tagIds = $state<number[]>([]);
  let skillIds = $state<number[]>([]);
  let featured = $state(false);
  let color = $state('#7957e8');
  let busy = $state(false);
  const title = $derived(kind[0].toUpperCase() + kind.slice(1));
  const first = $derived(kind === 'projects' || kind === 'skills' || kind === 'tags' ? 'name' : 'title');

  function start(item?: Entity) {
    editing = item?.id ?? 0;
    form = Object.fromEntries(fields.map(({ key }) => [key, item ? String((item as unknown as Record<string, unknown>)[key] ?? '') : '']));
    tagIds = item && 'tags' in item ? item.tags.map((tag) => tag.id) : [];
    skillIds = item && 'skills' in item ? item.skills.map((skill) => skill.id) : [];
    featured = item && 'featured' in item ? item.featured : false;
    color = item && 'color' in item ? item.color || '#7957e8' : '#7957e8';
  }
  function selected(ids: number[], id: number) { return ids.includes(id) ? ids.filter((n) => n !== id) : [...ids, id]; }
  async function run(task: () => Promise<unknown>, success: string) {
    busy = true;
    try { await task(); await reload(); editing = null; report(success); }
    catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
  async function save() {
    if (!form[first]?.trim()) return report(`${first === 'name' ? 'Name' : 'Title'} is required`, true);
    const body: Record<string, unknown> = { ...form };
    if (kind === 'publications') { body.year = form.year ? Number(form.year) : null; body.tag_ids = tagIds; body.featured = featured; }
    if (kind === 'projects') { body.tag_ids = tagIds; body.skill_ids = skillIds; }
    if (kind === 'talks') body.event_date = form.event_date || null;
    if (kind === 'skills' || kind === 'tags') body.color = color;
    const id = editing;
    const call = {
      publications: () => id ? api.updatePublication(id, body) : api.createPublication(body),
      talks: () => id ? api.updateTalk(id, body) : api.createTalk(body),
      projects: () => id ? api.updateProject(id, body) : api.createProject(body),
      skills: () => id ? api.updateSkill(id, body) : api.createSkill(body),
      tags: () => id ? api.updateTag(id, body) : api.createTag(form.name, color)
    }[kind];
    await run(call, `${title.slice(0, -1)} saved`);
  }
  async function remove(id: number) {
    if (!confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) return;
    const call = { publications: api.deletePublication, talks: api.deleteTalk, projects: api.deleteProject, skills: api.deleteSkill, tags: api.deleteTag }[kind];
    await run(() => call(id), 'Deleted');
  }
  async function move(index: number, delta: number) {
    const next = [...items]; const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const ids = next.map((item) => item.id);
    const call = { publications: api.reorderPublications, talks: api.reorderTalks, projects: api.reorderProjects, skills: api.reorderSkills }[kind as Exclude<Kind, 'tags'>];
    if (call) await run(() => call(ids), 'Order updated');
  }
  async function upload(item: Entity, file: File) {
    if (kind === 'publications') await run(() => api.uploadPaper(item.id, file), 'PDF uploaded');
    if (kind === 'talks') await run(() => api.uploadTalkFile(item.id, file), 'Slides uploaded');
    if (kind === 'projects') await run(() => api.uploadProjectScreenshot(item.id, file), 'Screenshot uploaded');
  }
  async function deleteScreenshot(item: Entity, index: number) {
    if (kind === 'projects') await run(() => api.deleteProjectScreenshot(item.id, index), 'Screenshot removed');
  }
</script>
<Card.Root class="site-card !rounded-2xl !p-6">
  <div class="mb-6 flex items-center justify-between gap-3"><div><p class="site-eyebrow mb-2">Manage content</p><h2 class="text-2xl font-bold tracking-tight">{title} <span class="text-[var(--site-muted)]">{items.length}</span></h2></div><Button onclick={() => start()}><Plus size={16}/> Add new</Button></div>
  <div class="divide-y divide-[var(--site-line)]">
    {#each items as item, index (item.id)}
      <div class="flex items-center gap-3 py-4"><div class="min-w-0 flex-1"><p class="truncate font-semibold">{String((item as unknown as Record<string, unknown>)[first])}</p>{#if 'year' in item && item.year}<p class="site-copy text-xs">{item.year}</p>{/if}</div>
      <div class="flex shrink-0 items-center gap-1"><button class="admin-icon" aria-label="Move up" disabled={index === 0 || kind === 'tags'} onclick={() => move(index, -1)}><ArrowUp size={16}/></button><button class="admin-icon" aria-label="Move down" disabled={index === items.length - 1 || kind === 'tags'} onclick={() => move(index, 1)}><ArrowDown size={16}/></button><Button variant="quiet" size="sm" onclick={() => start(item)}>Edit</Button><button class="admin-icon text-red-500" aria-label="Delete" onclick={() => remove(item.id)}><Trash2 size={16}/></button></div></div>
      {#if kind === 'projects' && 'screenshot_urls' in item && item.screenshot_urls.length}<div class="mb-4 flex gap-2 overflow-auto">{#each item.screenshot_urls as url, imageIndex}<div class="relative shrink-0"><img src={url} alt="" class="h-18 w-24 rounded-lg object-cover"/><button class="absolute right-1 top-1 rounded bg-red-500 p-1 text-white" aria-label="Remove screenshot" onclick={() => deleteScreenshot(item, imageIndex)}><Trash2 size={12}/></button></div>{/each}</div>{/if}
      {#if ['projects', 'publications', 'talks'].includes(kind)}<label class="mb-4 block cursor-pointer text-xs font-bold text-[var(--site-accent)]">Upload {kind === 'projects' ? 'screenshot' : 'file'} <input class="sr-only" type="file" accept={kind === 'projects' ? 'image/*' : '.pdf,application/pdf'} onchange={(event) => { const file = event.currentTarget.files?.[0]; if (file) upload(item, file); }}/></label>{/if}
    {:else}<p class="site-copy py-8 text-sm">Nothing here yet. Add the first one.</p>{/each}
  </div>
</Card.Root>
{#if editing !== null}
<Card.Root class="site-card mt-5 !rounded-2xl !p-6"><h3 class="mb-6 text-xl font-bold">{editing ? 'Edit' : 'Add'} {title.slice(0, -1).toLowerCase()}</h3><div class="grid gap-5 sm:grid-cols-2">{#each fields as field}<div class:sm:col-span-2={field.multiline}><Field label={field.label} type={field.type || 'text'} multiline={field.multiline} bind:value={form[field.key]}/></div>{/each}</div>
  {#if kind === 'publications'}<label class="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={featured}/> Featured</label>{/if}
  {#if kind === 'tags' || kind === 'skills'}<label class="mt-5 block"><span class="site-label">Color</span><input type="color" bind:value={color}/></label>{/if}
  {#if kind === 'publications' || kind === 'projects'}<div class="mt-5"><span class="site-label">Tags</span><div class="flex flex-wrap gap-2">{#each tags as tag}<button type="button" class:chosen={tagIds.includes(tag.id)} class="rounded-full border border-[var(--site-line)] px-3 py-1 text-xs" onclick={() => tagIds = selected(tagIds, tag.id)}>{tag.name}</button>{/each}</div></div>{/if}
  {#if kind === 'projects'}<div class="mt-5"><span class="site-label">Skills</span><div class="flex flex-wrap gap-2">{#each skills as skill}<button type="button" class:chosen={skillIds.includes(skill.id)} class="rounded-full border border-[var(--site-line)] px-3 py-1 text-xs" onclick={() => skillIds = selected(skillIds, skill.id)}>{skill.name}</button>{/each}</div></div>{/if}
  <div class="mt-7 flex gap-2"><Button onclick={save} loading={busy}>Save</Button><Button variant="quiet" onclick={() => editing = null}>Cancel</Button></div>
</Card.Root>
{/if}
<style>.admin-icon { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .5rem; } .admin-icon:hover { background: var(--site-accent-soft); } .admin-icon:disabled { opacity: .25; } .chosen { background: var(--site-accent); color: white; }</style>
