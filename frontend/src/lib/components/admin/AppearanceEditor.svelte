<script lang="ts">
  import { untrack } from 'svelte';
  import { Button, Card } from '@sivir-ui/svelte';
  import type { SiteConfig } from '$lib/api';
  import { api } from '$lib/client';
  import { PALETTES, type ThemeConfig } from '$lib/palettes';
  let { config, updated, report }: { config: SiteConfig; updated: (config: SiteConfig) => void; report: (message: string, error?: boolean) => void } = $props();
  let theme = $state<ThemeConfig>(untrack(() => ({ ...config.theme })));
  let busy = $state(false);
  function palette(id: string) { theme.palette = id; document.documentElement.dataset.palette = id; }
  function custom(value: string) { theme.customPrimary = value; document.documentElement.style.setProperty('--site-accent', value); }
  async function save() { busy = true; try { updated(await api.updateConfig({ theme: theme as Record<string, string> })); report('Appearance saved'); } catch (error) { report(String(error), true); } finally { busy = false; } }
</script>
<Card.Root class="site-card !rounded-2xl !p-6"><p class="site-eyebrow mb-2">Visual identity</p><h2 class="mb-6 text-2xl font-bold tracking-tight">Appearance</h2>
  <span class="site-label">Palette</span><div class="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{#each PALETTES as option}<button class="flex items-center gap-2 rounded-xl border border-[var(--site-line)] p-3 text-sm font-semibold" class:chosen={theme.palette === option.id} onclick={() => palette(option.id)}><span class="size-5 rounded-full" style:background={option.swatch}></span>{option.name}</button>{/each}</div>
  <div class="grid gap-6 sm:grid-cols-2"><label><span class="site-label">Layout</span><select class="site-field" bind:value={theme.layout}><option value="linear">Scrolling page</option><option value="pages">Section tabs</option></select></label><label><span class="site-label">Default mode</span><select class="site-field" bind:value={theme.defaultMode}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label><span class="site-label">Custom accent</span><input type="color" class="site-field h-11" value={theme.customPrimary || '#7957e8'} oninput={(event) => custom(event.currentTarget.value)}/></label></div>
  <Button class="mt-7" onclick={save} loading={busy}>Save appearance</Button>
</Card.Root>
<style>.chosen { border-color: var(--site-accent); background: var(--site-accent-soft); }</style>
