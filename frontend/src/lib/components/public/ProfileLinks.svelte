<script lang="ts">
  import type { SiteConfig } from '$lib/api';

  let { links }: { links: NonNullable<SiteConfig['profile']['links']> } = $props();
</script>

<section id="links" class="rounded-[2rem] border border-[var(--site-line)] bg-[var(--site-surface)] p-8 md:p-12">
  <h2 class="text-3xl font-extrabold tracking-tight">Links</h2>
  <div class="mt-6 flex flex-wrap gap-3">
    {#each links as link}
      <a class="rounded-full border border-[var(--site-line)] px-5 py-3 text-sm font-bold hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]" href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
    {/each}
  </div>
</section>
