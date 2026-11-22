<script lang="ts">
  import { ArrowUpRight, FileText, MapPin } from 'lucide-svelte';
  import type { Talk } from '#lib/api.ts';

  let { talk, framed = true }: { talk: Talk; framed?: boolean } = $props();
  const meta = $derived([talk.event, talk.event_date].filter(Boolean).join(' · '));
</script>

<article class={framed ? 'site-card flex h-full flex-col rounded-2xl p-6' : 'flex h-full flex-col rounded-xl border border-[var(--site-line)] p-5'}>
  {#if talk.video_url}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video class="mb-5 aspect-video w-full rounded-xl bg-black" src={talk.video_url} controls preload="metadata" playsinline></video>
  {/if}
  {#if meta}<p class="site-eyebrow mb-2">{meta}</p>{/if}
  <h3 class="text-xl font-bold">{talk.title}</h3>
  {#if talk.location}<p class="site-copy mt-2 flex items-center gap-1.5 text-xs"><MapPin size={13}/>{talk.location}</p>{/if}
  {#if talk.description}<p class="site-copy mt-3 text-sm">{talk.description}</p>{/if}
  {#if talk.file_url || talk.url}
    <div class="mt-auto flex flex-wrap gap-4 pt-5 text-sm font-bold text-[var(--site-accent)]">
      {#if talk.file_url}<a class="inline-flex items-center gap-1.5" href={talk.file_url} target="_blank" rel="noreferrer"><FileText size={15}/> Slides</a>{/if}
      {#if talk.url}<a class="inline-flex items-center gap-1" href={talk.url} target="_blank" rel="noreferrer">{talk.video_url ? 'More' : 'Watch'} <ArrowUpRight size={15}/></a>{/if}
    </div>
  {/if}
</article>
