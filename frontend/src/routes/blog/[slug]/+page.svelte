<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import { blogDate } from '$lib/blog';
  import { markdown } from '$lib/markdown';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const post = $derived(data.post);
</script>
<svelte:head><title>{post.title} · {data.config?.profile?.siteName || data.config?.profile?.name || 'OpenVitae'}</title><meta name="description" content={post.excerpt}/></svelte:head>
<main class="site-shell max-w-4xl py-14 md:py-20">
  <a href="/blog" class="site-copy mb-12 inline-flex items-center gap-2 text-sm hover:text-[var(--site-accent)]"><ArrowLeft size={16}/> All posts</a>
  <p class="site-eyebrow mb-5">{blogDate(post.published_at)}</p>
  <h1 class="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-[-.065em] md:text-7xl">{post.title}</h1>
  {#if post.excerpt}<p class="site-copy mt-7 max-w-2xl text-xl">{post.excerpt}</p>{/if}
  <article class="prose prose-lg mt-12 max-w-none border-t border-[var(--site-line)] pt-10">{@html markdown(post.content)}</article>
  <a href="/blog" class="mt-16 inline-flex items-center gap-2 border-t border-[var(--site-line)] pt-6 text-sm font-bold"><ArrowLeft size={16}/> Back to the blog</a>
</main>
