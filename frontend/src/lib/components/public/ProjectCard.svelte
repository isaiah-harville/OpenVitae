<script lang="ts">
  import { ArrowUpRight } from 'lucide-svelte';
  import { Card } from '@sivir-ui/svelte';
  import type { Project } from '$lib/api';
  import TagChip from './TagChip.svelte';
  let { project }: { project: Project } = $props();
</script>
<a class="group block" href={`/projects/${project.slug}`}>
  <Card.Root class="site-card h-full overflow-hidden !rounded-2xl !p-0 transition-all group-hover:-translate-y-1">
    {#if project.screenshot_urls[0]}
      <img src={project.screenshot_urls[0]} alt="" class="aspect-[16/10] w-full object-cover" />
    {:else}
      <div class="grid aspect-[16/10] place-items-center bg-[var(--site-accent-soft)]"><span class="text-6xl font-black text-[var(--site-accent)]/30">{project.name.slice(0, 1)}</span></div>
    {/if}
    <div class="space-y-3 p-6">
      <h3 class="flex items-center justify-between gap-2 text-lg font-bold tracking-tight">{project.name}<ArrowUpRight size={18} class="text-[var(--site-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></h3>
      {#if project.description}<p class="site-copy line-clamp-3 text-sm">{project.description}</p>{/if}
      <div class="flex flex-wrap gap-2">{#each [...project.tags, ...project.skills] as tag (tag.id + tag.name)}<TagChip {tag}/>{/each}</div>
    </div>
  </Card.Root>
</a>
