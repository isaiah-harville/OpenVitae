<script lang="ts">
  import { ArrowUpRight, FileText } from 'lucide-svelte';
  import { Card } from '@sivir-ui/svelte';
  import type { Publication } from '$lib/api';
  import TagChip from './TagChip.svelte';
  let { publication }: { publication: Publication } = $props();
</script>
<Card.Root class="site-card !rounded-2xl !p-5 transition-all hover:-translate-y-0.5 sm:!p-7">
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        {#if publication.year}<span class="site-eyebrow">{publication.year}</span>{/if}
        {#if publication.featured}<span class="site-chip">Featured</span>{/if}
      </div>
      <h3 class="text-lg font-bold leading-snug tracking-tight sm:text-xl">{publication.title}</h3>
      {#if publication.authors}<p class="site-copy text-sm">{publication.authors}</p>{/if}
      {#if publication.venue}<p class="text-sm font-semibold text-[var(--site-accent)]">{publication.venue}</p>{/if}
      {#if publication.abstract}<p class="site-copy line-clamp-3 text-sm">{publication.abstract}</p>{/if}
      {#if publication.tags.length}<div class="flex flex-wrap gap-2">{#each publication.tags as tag (tag.id)}<TagChip {tag}/>{/each}</div>{/if}
      <div class="flex flex-wrap gap-4 pt-1 text-sm font-semibold text-[var(--site-accent)]">
        {#if publication.url}<a class="inline-flex items-center gap-1" href={publication.url} target="_blank" rel="noreferrer">Read paper <ArrowUpRight size={15}/></a>{/if}
        {#if publication.doi}<a class="inline-flex items-center gap-1" href={`https://doi.org/${publication.doi}`} target="_blank" rel="noreferrer">DOI <ArrowUpRight size={15}/></a>{/if}
        {#if publication.file_url}<a class="inline-flex items-center gap-1" href={publication.file_url} target="_blank" rel="noreferrer"><FileText size={15}/> PDF</a>{/if}
      </div>
    </div>
  </div>
</Card.Root>
