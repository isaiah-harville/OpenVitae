<script lang="ts">
  import { untrack } from 'svelte';
  import { Card } from '@sivir-ui/svelte';
  import type { SiteConfig } from '$lib/api';
  import { api } from '$lib/client';
  let { config, updated, report }: { config: SiteConfig; updated: (config: SiteConfig) => void; report: (message: string, error?: boolean) => void } = $props();
  let features = $state(untrack(() => ({ ...config.features })));
  const labels = $derived(config.pages
    ? { headshot: 'Show portrait in hero' }
    : { about: 'About & skills', publications: 'Publications', talks: 'Talks', projects: 'Projects', skills: 'Skills', contact: 'Contact', headshot: 'Headshot' });
  async function toggle(key: string, checked: boolean) { const previous = features[key]; features[key] = checked; try { updated(await api.updateConfig({ features })); report('Sections updated'); } catch (error) { features[key] = previous; report(String(error), true); } }
</script>
<Card.Root class="site-card !rounded-2xl !p-6"><p class="site-eyebrow mb-2">What visitors see</p><h2 class="mb-5 text-2xl font-bold tracking-tight">{config.pages ? 'Portrait' : 'Sections'}</h2><div class="divide-y divide-[var(--site-line)]">{#each Object.entries(labels) as [key, label]}<label class="flex cursor-pointer items-center justify-between py-3 text-sm font-semibold">{label}<input type="checkbox" checked={features[key] !== false} onchange={(event) => toggle(key, event.currentTarget.checked)} class="size-5 accent-[var(--site-accent)]"/></label>{/each}</div></Card.Root>
