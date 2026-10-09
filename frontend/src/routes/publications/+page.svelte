<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import PublicationCard from '$lib/components/public/PublicationCard.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<svelte:head><title>Publications · {data.config?.profile?.siteName || data.config?.profile?.name || 'OpenVitae'}</title></svelte:head>
<main class="site-shell py-14 md:py-20">
  <a href="/" class="site-copy mb-8 inline-flex items-center gap-2 text-sm hover:text-[var(--site-accent)]"><ArrowLeft size={16}/> Back to home</a>
  <p class="site-eyebrow mb-3">Research archive</p>
  <h1 class="site-heading mb-3">Publications</h1>
  <p class="site-copy mb-9">Browse all work, from recent to earliest.</p>
  <form class="mb-8 flex flex-wrap gap-3" method="GET">
    <label><span class="sr-only">Filter by tag</span><select class="site-field" name="tag" onchange={(event) => event.currentTarget.form?.requestSubmit()}><option value="">All topics</option>{#each data.tags as tag}<option value={tag.slug} selected={data.tag === tag.slug}>{tag.name}</option>{/each}</select></label>
    <label><span class="sr-only">Sort</span><select class="site-field" name="sort" onchange={(event) => event.currentTarget.form?.requestSubmit()}><option value="date_desc" selected={data.sort === 'date_desc'}>Newest first</option><option value="date_asc" selected={data.sort === 'date_asc'}>Oldest first</option></select></label>
  </form>
  <div class="grid gap-4">{#each data.publications as publication (publication.id)}<PublicationCard {publication}/>{:else}<p class="site-copy">No publications found.</p>{/each}</div>
</main>
