<script lang="ts">
  import { ArrowUpRight, Download, MapPin, Presentation } from 'lucide-svelte';
  import type { Talk } from '#lib/api.ts';
  import { extension, fileKind, fileType } from '#lib/files.ts';
  import AttachmentList from './AttachmentList.svelte';
  import FileViewer from './FileViewer.svelte';

  let { talk, framed = true }: { talk: Talk; framed?: boolean } = $props();
  const meta = $derived([talk.event, talk.event_date].filter(Boolean).join(' · '));
  const slides = $derived.by(() => {
    if (!talk.file_url) return null;
    const ext = extension(talk.file_url) || 'pdf';
    const filename = `${talk.title}.${ext}`;
    return { url: talk.file_url, filename, contentType: fileType({ name: filename, type: '' }) };
  });
  const slidesViewable = $derived(slides ? fileKind(slides.contentType) === 'pdf' : false);
  let viewing = $state(false);
</script>

<article class={framed ? 'site-card flex h-full flex-col rounded-2xl p-6' : 'flex h-full flex-col rounded-xl border border-[var(--site-line)] p-5'}>
  {#if talk.video_url}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video class="mb-5 aspect-video w-full rounded-xl bg-black" src={talk.video_url} poster={talk.file_preview_url ?? undefined} controls preload="metadata" playsinline></video>
  {:else if slides && slidesViewable && talk.file_preview_url}
    <button type="button" class="group relative mb-5 aspect-video w-full overflow-hidden rounded-xl border border-[var(--site-line)] bg-[var(--site-accent-soft)]" aria-label={`View slides for ${talk.title}`} onclick={() => viewing = true}>
      <img src={talk.file_preview_url} alt="" loading="lazy" class="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"/>
      <span class="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent"></span>
      <span class="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--site-surface)] px-3 py-1.5 text-xs font-bold text-[var(--site-ink)] shadow transition-transform group-hover:-translate-y-0.5"><Presentation size={14}/> View slides</span>
    </button>
  {/if}
  {#if meta}<p class="site-eyebrow mb-2">{meta}</p>{/if}
  <h3 class="text-xl font-bold">{talk.title}</h3>
  {#if talk.location}<p class="site-copy mt-2 flex items-center gap-1.5 text-xs"><MapPin size={13}/>{talk.location}</p>{/if}
  {#if talk.description}<p class="site-copy mt-3 text-sm">{talk.description}</p>{/if}
  {#if talk.attachments.length}<div class="mt-4"><AttachmentList attachments={talk.attachments} compact/></div>{/if}
  {#if slides || talk.url}
    <div class="mt-auto flex flex-wrap gap-4 pt-5 text-sm font-bold text-[var(--site-accent)]">
      {#if slides && slidesViewable}
        <button type="button" class="inline-flex items-center gap-1.5" onclick={() => viewing = true}><Presentation size={15}/> Slides</button>
      {:else if slides}
        <a class="inline-flex items-center gap-1.5" href={slides.url} download={slides.filename}><Download size={15}/> Slides (.{extension(slides.url)})</a>
      {/if}
      {#if talk.url}<a class="inline-flex items-center gap-1" href={talk.url} target="_blank" rel="noreferrer">{talk.video_url ? 'More' : 'Watch'} <ArrowUpRight size={15}/></a>{/if}
    </div>
  {/if}
</article>

{#if slides && slidesViewable}<FileViewer file={slides} bind:open={viewing}/>{/if}
