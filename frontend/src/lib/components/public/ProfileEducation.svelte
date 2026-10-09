<script lang="ts">
  import type { SiteConfig } from '$lib/api';

  let { entries, heading = 'Education' }: { entries: NonNullable<SiteConfig['profile']['education']>; heading?: string } = $props();
</script>

{#if entries.length}
  <div class="site-card rounded-[1.7rem] p-7 md:p-9">
    <h2 class="mb-6 text-3xl font-extrabold tracking-tight">{heading}</h2>
    <div class="grid gap-4">
      {#each entries as entry}
        <article class="rounded-xl border border-[var(--site-line)] p-5">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <h3 class="text-xl font-bold">{entry.degree || entry.institution}</h3>
            {#if entry.startYear || entry.endYear}<span class="site-copy text-sm">{[entry.startYear, entry.endYear].filter(Boolean).join('–')}</span>{/if}
          </div>
          {#if entry.degree && entry.institution}<p class="site-copy mt-1">{entry.institution}</p>{/if}
          {#if entry.concentration}<p class="site-copy mt-2 text-sm">Concentration: {entry.concentration}</p>{/if}
        </article>
      {/each}
    </div>
  </div>
{/if}
