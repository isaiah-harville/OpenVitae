<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { Moon, Sun, ArrowUpRight } from 'lucide-svelte';
  import { siteName } from '$lib/api';
  import { DEFAULT_PALETTE } from '$lib/palettes';
  import { pagePath } from '$lib/pages';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
  let dark = $state(false);
  const config = $derived(data.config);
  const name = $derived(siteName(config));

  $effect(() => {
    if (!browser) return;
    const theme = config?.theme ?? {};
    document.documentElement.dataset.palette = theme.palette || DEFAULT_PALETTE;
    if (theme.customPrimary) document.documentElement.style.setProperty('--site-accent', theme.customPrimary);
    const selected = localStorage.getItem('ov_mode') || theme.defaultMode || 'system';
    dark = selected === 'dark' || (selected === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  });
  function toggleMode() {
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('ov_mode', dark ? 'dark' : 'light');
  }
</script>

<svelte:head>
  <title>{name}</title>
  <meta name="description" content={config?.profile?.title || 'A personal portfolio and publication archive'} />
</svelte:head>

<div class="flex min-h-screen flex-col">
<header class="sticky top-0 z-30 border-b border-[var(--site-line)] bg-[var(--site-paper)]/90 backdrop-blur-xl">
  <div class="site-shell flex h-18 items-center justify-between gap-4">
    <a class="flex items-center gap-3 font-bold tracking-tight" href="/">
      <span class="grid size-9 place-items-center rounded-xl bg-[var(--site-accent)] font-black text-[var(--site-on-accent)]">V</span>
      <span class="max-w-42 truncate">{name}</span>
    </a>
    <nav class="flex max-w-[65vw] items-center gap-3 overflow-x-auto whitespace-nowrap text-sm font-semibold sm:gap-6" aria-label="Main navigation">
      <a class:active={$page.url.pathname === '/'} href="/">Home</a>
      <a class:active={$page.url.pathname.startsWith('/publications')} href="/publications">Publications</a>
      {#if config?.features.blog === true}<a class:active={$page.url.pathname.startsWith('/blog')} href="/blog">Blog</a>{/if}
      {#each config?.pages?.pages.filter((item) => item.inNav && item.slug !== 'home') ?? [] as sitePage (sitePage.id)}<a class:active={$page.url.pathname === pagePath(sitePage.slug)} href={pagePath(sitePage.slug)}>{sitePage.title}</a>{/each}
      <button class="grid size-9 place-items-center rounded-full border border-[var(--site-line)]" type="button" aria-label="Toggle color mode" onclick={toggleMode}>
        {#if dark}<Sun size={17}/>{:else}<Moon size={17}/>{/if}
      </button>
    </nav>
  </div>
</header>
<div class="flex-1">{@render children()}</div>
<footer class="border-t border-[var(--site-line)]">
  <div class="site-shell flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-[var(--site-muted)]">
    <span>© {new Date().getFullYear()} {name}</span>
    <div class="flex items-center gap-6">
      <span class="hidden sm:inline">Built with OpenVitae</span>
      <a class="inline-flex items-center gap-1 rounded-full border border-[var(--site-line)] px-3 py-1.5 font-semibold hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]" href="/admin">Admin <ArrowUpRight size={14}/></a>
    </div>
  </div>
</footer>
</div>
<style>
  nav a { color: var(--site-muted); }
  nav a:hover, nav a.active { color: var(--site-accent); }
</style>
