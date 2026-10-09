<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { Moon, Sun, ArrowUpRight } from 'lucide-svelte';
  import { siteName } from '$lib/api';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
  let dark = $state(false);
  const config = $derived(data.config);
  const name = $derived(siteName(config));

  $effect(() => {
    if (!browser) return;
    const theme = config?.theme ?? {};
    document.documentElement.dataset.palette = theme.palette || 'violet';
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

<header class="sticky top-0 z-30 border-b border-[var(--site-line)] bg-[var(--site-paper)]/90 backdrop-blur-xl">
  <div class="site-shell flex h-18 items-center justify-between gap-4">
    <a class="flex items-center gap-3 font-bold tracking-tight" href="/">
      <span class="grid size-9 place-items-center rounded-xl bg-[var(--site-accent)] font-black text-white">V</span>
      <span class="max-w-42 truncate">{name}</span>
    </a>
    <nav class="flex items-center gap-3 text-sm font-semibold sm:gap-6" aria-label="Main navigation">
      <a class:active={$page.url.pathname === '/'} href="/">Home</a>
      <a class:active={$page.url.pathname.startsWith('/publications')} href="/publications">Publications</a>
      <a class="hidden items-center gap-1 sm:inline-flex" href="/admin">Admin <ArrowUpRight size={13} /></a>
      <button class="grid size-9 place-items-center rounded-full border border-[var(--site-line)]" type="button" aria-label="Toggle color mode" onclick={toggleMode}>
        {#if dark}<Sun size={17}/>{:else}<Moon size={17}/>{/if}
      </button>
    </nav>
  </div>
</header>
{@render children()}
<style>
  nav a { color: var(--site-muted); }
  nav a:hover, nav a.active { color: var(--site-accent); }
</style>
