<script lang="ts">
  import { ArrowUpRight } from 'lucide-svelte';
  import { blogDate } from '$lib/blog';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<svelte:head><title>Blog · {data.config?.profile?.siteName || data.config?.profile?.name || 'OpenVitae'}</title><meta name="description" content="Notes, ideas, and stories from the blog."/></svelte:head>
<main class="site-shell py-14 md:py-20">
  <div class="mb-12 max-w-3xl"><p class="site-eyebrow mb-4">Notes & ideas</p><h1 class="text-5xl font-extrabold tracking-[-.07em] md:text-7xl">The blog<span class="text-[var(--site-accent)]">.</span></h1><p class="site-copy mt-5 text-lg">Writing from the desk, the field, and everywhere in between.</p></div>
  <div class="grid gap-5 md:grid-cols-2">
    {#each data.posts as post (post.id)}
      <a href={`/blog/${post.slug}`} class="site-card group flex min-h-64 flex-col rounded-[1.7rem] p-7 transition-transform hover:-translate-y-1 md:p-9">
        <p class="site-eyebrow mb-5">{blogDate(post.published_at)}</p>
        <h2 class="text-2xl font-bold tracking-tight md:text-3xl">{post.title}</h2>
        {#if post.excerpt}<p class="site-copy mt-4 line-clamp-3">{post.excerpt}</p>{/if}
        <span class="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[var(--site-accent)]">Read post <ArrowUpRight size={16}/></span>
      </a>
    {:else}<p class="site-copy py-12">No posts published yet.</p>{/each}
  </div>
</main>
