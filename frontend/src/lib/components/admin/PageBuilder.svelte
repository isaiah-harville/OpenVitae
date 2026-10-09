<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '@sivir-ui/svelte';
  import { GripVertical, Plus, ArrowUp, ArrowDown, Trash2, Eye } from 'lucide-svelte';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import type { Project, Publication, SiteConfig, Skill, Talk } from '$lib/api';
  import { api } from '$lib/client';
  import { BLOCK_TYPES, createBlock, defaultPages, moveBlock, pagePath, reservedSlug, type PageBlock, type PageDocument } from '$lib/pages';
  import PageBlocks from '../public/PageBlocks.svelte';
  import BlockSettings from './BlockSettings.svelte';

  let { config, content, updated, report }: {
    config: SiteConfig;
    content: { projects: Project[]; publications: Publication[]; talks: Talk[]; skills: Skill[] };
    updated: (config: SiteConfig) => void;
    report: (message: string, error?: boolean) => void;
  } = $props();
  let document = $state<PageDocument>(untrack(() => structuredClone(config.pages ?? defaultPages(config.features, {
    skills: content.skills.length, projects: content.projects.length, talks: content.talks.length,
    hasBio: Boolean(config.profile.bio), hasContact: Boolean(config.profile.email || config.profile.links?.length),
  }))));
  let selectedPageId = $state('home');
  let selectedBlockId = $state<string | null>(null);
  let preview = $state(false);
  let busy = $state(false);
  const page = $derived(document.pages.find((item) => item.id === selectedPageId) ?? document.pages[0]);
  const block = $derived(page.blocks.find((item) => item.id === selectedBlockId));
  function addPage() {
    const id = crypto.randomUUID();
    const index = document.pages.length + 1;
    document.pages.push({ id, slug: `page-${index}`, title: `New page ${index}`, inNav: true, blocks: [] });
    selectedPageId = id; selectedBlockId = null; preview = false;
  }
  function addBlock(type: (typeof BLOCK_TYPES)[number]) {
    const next = createBlock(type);
    page.blocks.push(next); selectedBlockId = next.id;
  }
  function removePage() {
    if (page.slug === 'home') return;
    document.pages = document.pages.filter((item) => item.id !== page.id);
    selectedPageId = 'home'; selectedBlockId = null;
  }
  function removeBlock(id: string) {
    page.blocks = page.blocks.filter((item) => item.id !== id);
    if (selectedBlockId === id) selectedBlockId = null;
  }
  function sort(event: CustomEvent<DndEvent<PageBlock>>) { page.blocks = event.detail.items; }
  async function save() {
    const slugs = document.pages.map((item) => item.slug);
    if (slugs.some((slug) => slug !== 'home' && reservedSlug(slug)) || new Set(slugs).size !== slugs.length) {
      report('Page URLs must be unique lowercase slugs and cannot use reserved routes.', true); return;
    }
    busy = true;
    try {
      const pages = $state.snapshot(document);
      for (const page of pages.pages) for (const block of page.blocks) delete block.imageUrl;
      updated(await api.updateConfig({ pages })); report('Pages published');
    }
    catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
</script>
<div class="space-y-5">
  <div class="site-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><p class="site-eyebrow mb-1">Your site, your layout</p><h2 class="text-2xl font-bold">Page builder</h2><p class="site-copy text-sm">Drag blocks to reorder. Choose a block to edit its content.</p></div><div class="flex gap-2"><Button variant="secondary" onclick={() => preview = !preview}><Eye size={16}/>{preview ? 'Edit' : 'Preview'}</Button><Button onclick={save} loading={busy}>Save & publish</Button></div></div>
  <div class="flex flex-wrap gap-2" aria-label="Pages">{#each document.pages as item (item.id)}<button type="button" class={item.id === page.id ? 'rounded-full bg-[var(--site-accent)] px-4 py-2 text-sm font-bold text-[var(--site-on-accent)]' : 'rounded-full border border-[var(--site-line)] px-4 py-2 text-sm font-bold'} onclick={() => { selectedPageId = item.id; selectedBlockId = null; }}>{item.title}</button>{/each}<Button size="sm" variant="secondary" onclick={addPage}><Plus size={15}/> Add page</Button></div>
  {#if preview}
    <div class="site-card overflow-hidden rounded-2xl"><div class="border-b border-[var(--site-line)] px-5 py-3 text-sm text-[var(--site-muted)]">Preview · {pagePath(page.slug)}</div><PageBlocks {page} {config} {content}/></div>
  {:else}
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div class="space-y-5">
        <div class="site-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2"><label><span class="site-label">Page title</span><input class="site-field" maxlength="120" bind:value={page.title}/></label><label><span class="site-label">Page URL</span><input class="site-field" disabled={page.slug === 'home'} maxlength="80" bind:value={page.slug}/></label><label class="flex items-center gap-3 text-sm font-semibold"><input class="size-4 accent-[var(--site-accent)]" type="checkbox" bind:checked={page.inNav}/> Show in navigation</label>{#if page.slug !== 'home'}<div class="flex flex-wrap items-center gap-2"><button type="button" class="rounded-lg border border-[var(--site-line)] p-2" aria-label="Move page earlier in navigation" onclick={() => { if (document.pages.indexOf(page) > 1) document.pages = moveBlock(document.pages, page, -1); }}><ArrowUp size={15}/></button><button type="button" class="rounded-lg border border-[var(--site-line)] p-2" aria-label="Move page later in navigation" onclick={() => document.pages = moveBlock(document.pages, page, 1)}><ArrowDown size={15}/></button><Button variant="quiet" size="sm" onclick={removePage}><Trash2 size={15}/> Remove page</Button></div>{/if}</div>
        <div class="site-card rounded-2xl p-5"><p class="site-eyebrow mb-3">Add a block</p><div class="flex flex-wrap gap-2">{#each BLOCK_TYPES as type}<Button size="sm" variant="secondary" onclick={() => addBlock(type)}><Plus size={13}/>{type.replace(/([A-Z])/g, ' $1')}</Button>{/each}</div></div>
        <div class="grid min-h-32 gap-3 rounded-2xl border border-dashed border-[var(--site-line)] p-3 md:grid-cols-2" use:dndzone={{ items: page.blocks, flipDurationMs: 0, delayTouchStart: true }} onconsider={sort} onfinalize={sort} aria-label="Page blocks">
          {#each page.blocks as item (item.id)}<div class={item.width === 2 ? 'site-card rounded-xl p-4 md:col-span-2' : 'site-card rounded-xl p-4'} aria-label={`${item.type} block: ${item.heading || 'Untitled'}`}><div class="flex items-start justify-between gap-3"><button type="button" class="flex min-w-0 flex-1 items-center gap-2 text-left" onclick={() => selectedBlockId = item.id}><GripVertical size={17} class="shrink-0 text-[var(--site-muted)]"/><span class="truncate font-bold">{item.heading || item.type}</span></button><span class="site-eyebrow">{item.type}</span></div><div class="mt-4 flex justify-end gap-1"><button type="button" class="rounded-lg p-2 hover:bg-[var(--site-accent-soft)]" aria-label={`Move ${item.type} up`} onclick={() => page.blocks = moveBlock(page.blocks, item, -1)}><ArrowUp size={15}/></button><button type="button" class="rounded-lg p-2 hover:bg-[var(--site-accent-soft)]" aria-label={`Move ${item.type} down`} onclick={() => page.blocks = moveBlock(page.blocks, item, 1)}><ArrowDown size={15}/></button><button type="button" class="rounded-lg p-2 hover:bg-[var(--site-accent-soft)]" aria-label={`Remove ${item.type}`} onclick={() => removeBlock(item.id)}><Trash2 size={15}/></button></div></div>{/each}
        </div>
      </div>
      <div>{#if block}<BlockSettings {block} {report}/>{:else}<div class="site-card rounded-2xl p-6"><p class="site-copy text-sm">Select a block to edit its heading, text, image, and width.</p></div>{/if}</div>
    </div>
  {/if}
</div>
