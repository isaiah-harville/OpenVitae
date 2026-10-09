<script lang="ts">
  import { ArrowLeft, ArrowUpRight } from 'lucide-svelte';
  import { markdown } from '$lib/markdown';
  import TagChip from '$lib/components/public/TagChip.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const project = $derived(data.project);
  let selected = $state(0);
</script>
<svelte:head><title>{project.name} · {data.config?.profile?.siteName || data.config?.profile?.name || 'OpenVitae'}</title><meta name="description" content={project.description || ''}/></svelte:head>
<main class="site-shell max-w-5xl py-14 md:py-20">
  <a href="/" class="site-copy mb-9 inline-flex items-center gap-2 text-sm hover:text-[var(--site-accent)]"><ArrowLeft size={16}/> Back to home</a>
  <p class="site-eyebrow mb-3">Project spotlight</p><h1 class="text-5xl font-extrabold tracking-[-.06em] md:text-7xl">{project.name}<span class="text-[var(--site-accent)]">.</span></h1>
  {#if project.description}<p class="site-copy mt-5 max-w-3xl text-xl">{project.description}</p>{/if}
  <div class="mt-7 flex flex-wrap gap-2">{#each [...project.tags, ...project.skills] as tag (tag.id + tag.name)}<TagChip {tag}/>{/each}</div>
  <div class="mt-8 flex flex-wrap gap-3">{#if project.url}<a class="site-action" href={project.url} target="_blank" rel="noreferrer">Visit project <ArrowUpRight size={16}/></a>{/if}{#if project.source_url}<a class="rounded-full border border-[var(--site-line)] px-5 py-3 text-sm font-bold" href={project.source_url} target="_blank" rel="noreferrer">View source ↗</a>{/if}</div>
  {#if project.screenshot_urls.length}<div class="mt-14"><img src={project.screenshot_urls[selected]} alt={`${project.name} screenshot ${selected + 1}`} class="w-full rounded-3xl border border-[var(--site-line)] shadow-xl"/>{#if project.screenshot_urls.length > 1}<div class="mt-4 flex gap-3 overflow-x-auto">{#each project.screenshot_urls as url, index}<button type="button" onclick={() => selected = index} aria-label={`View screenshot ${index + 1}`} class:chosen={selected === index}><img src={url} alt="" class="h-20 w-30 rounded-xl object-cover"/></button>{/each}</div>{/if}</div>{/if}
  {#if project.content}<article class="prose prose-lg mt-14 max-w-none border-t border-[var(--site-line)] pt-12">{@html markdown(project.content)}</article>{/if}
</main>
<style>.chosen { outline: 2px solid var(--site-accent); border-radius: .75rem; }</style>
