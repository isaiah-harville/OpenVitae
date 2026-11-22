<script lang="ts">
  import { untrack } from 'svelte';
  import { Button, Card } from '@sivir-ui/svelte';
  import type { SiteConfig } from '#lib/api.ts';
  import { api } from '#lib/client.ts';
  import { DEFAULT_PALETTE, PALETTES, type ThemeConfig } from '#lib/palettes.ts';
  let { config, updated, report }: { config: SiteConfig; updated: (config: SiteConfig) => void; report: (message: string, error?: boolean) => void } = $props();
  let theme = $state<ThemeConfig>(untrack(() => ({ palette: DEFAULT_PALETTE, ...config.theme })));
  let busy = $state(false);
  function palette(id: string) { theme.palette = id; document.documentElement.dataset.palette = id; }
  function custom(value: string) { theme.customPrimary = value; document.documentElement.style.setProperty('--site-accent', value); }
  function clearCustom() { delete theme.customPrimary; theme = { ...theme }; document.documentElement.style.removeProperty('--site-accent'); }
  let hex = $state(untrack(() => config.theme.customPrimary || ''));
  function typed(value: string) { hex = value; if (/^#[0-9a-f]{6}$/i.test(value)) custom(value); }
  async function save() { busy = true; try { updated(await api.updateConfig({ theme: theme as Record<string, string> })); report('Appearance saved'); } catch (error) { report(String(error), true); } finally { busy = false; } }
</script>
<Card.Root class="site-card !rounded-2xl !p-6"><p class="site-eyebrow mb-2">Visual identity</p><h2 class="mb-6 text-2xl font-bold tracking-tight">Appearance</h2>
  <span class="site-label">Palette</span><div class="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{#each PALETTES as option}<button type="button" class="flex items-center gap-2 rounded-xl border border-[var(--site-line)] p-3 text-sm font-semibold hover:border-[var(--site-accent)]" class:chosen={theme.palette === option.id} onclick={() => palette(option.id)}><span class="size-5 rounded-full" style:background={option.swatch}></span>{option.name}</button>{/each}</div>
  <div class="grid gap-6 sm:grid-cols-2"><label><span class="site-label">Layout</span><select class="site-field" bind:value={theme.layout}><option value="linear">Scrolling page</option><option value="pages">Section tabs</option></select></label><label><span class="site-label">Default mode</span><select class="site-field" bind:value={theme.defaultMode}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><div class="sm:col-span-2"><label class="site-label" for="custom-accent">Custom accent <span class="font-normal text-[var(--site-muted)]">— overrides the palette color</span></label><div class="flex items-center gap-2"><input type="color" aria-label="Pick a custom accent" class="accent-swatch" value={theme.customPrimary || '#171717'} oninput={(event) => { hex = event.currentTarget.value; custom(hex); }}/><input id="custom-accent" class="site-field max-w-40 font-mono" placeholder="#rrggbb" value={hex} oninput={(event) => typed(event.currentTarget.value)}/>{#if theme.customPrimary}<Button variant="quiet" size="sm" onclick={() => { hex = ''; clearCustom(); }}>Use palette color</Button>{/if}</div></div></div>
  <div class="mt-8 flex justify-end border-t border-[var(--site-line)] pt-5"><Button onclick={save} loading={busy}>Save appearance</Button></div>
</Card.Root>
<style>
  .chosen { border-color: var(--site-accent); background: var(--site-accent-soft); }
  .accent-swatch { width: 2.25rem; height: 2.25rem; flex-shrink: 0; padding: 0; border: 1px solid var(--site-line); border-radius: 0.625rem; background: none; cursor: pointer; overflow: hidden; }
  .accent-swatch::-webkit-color-swatch-wrapper { padding: 3px; }
  .accent-swatch::-webkit-color-swatch { border: 0; border-radius: 0.4rem; }
  .accent-swatch::-moz-color-swatch { border: 0; border-radius: 0.4rem; }
</style>
