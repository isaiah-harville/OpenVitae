<script lang="ts">
  import { Download, Eye } from 'lucide-svelte';
  import { extension, fileKind, formatBytes, viewable } from '#lib/files.ts';
  import FileIcon from './FileIcon.svelte';
  import FileViewer, { type ViewedFile } from './FileViewer.svelte';

  let { file, preview, compact = false }: { file: ViewedFile; preview?: string | null; compact?: boolean } = $props();
  const kind = $derived(fileKind(file.contentType));
  const canView = $derived(viewable(kind));
  const label = $derived(extension(file.filename).toUpperCase() || kind.toUpperCase());
  const meta = $derived([label, file.size ? formatBytes(file.size) : null].filter(Boolean).join(' · '));
  const href = $derived(file.downloadUrl ?? file.url);
  let open = $state(false);
</script>

{#if compact}
  <div class="flex items-center gap-3 rounded-xl border border-[var(--site-line)] p-2 pr-3 transition-colors hover:border-[color-mix(in_srgb,var(--site-accent)_45%,var(--site-line))]">
    <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--site-accent-soft)] text-[var(--site-accent)]"><FileIcon {kind} size={17}/></span>
    {#if canView}
      <button type="button" class="min-w-0 flex-1 text-left" onclick={() => open = true}><span class="block truncate text-sm font-semibold">{file.filename}</span><span class="block text-xs text-[var(--site-muted)]">{meta}</span></button>
    {:else}
      <a class="min-w-0 flex-1" {href} download={file.filename}><span class="block truncate text-sm font-semibold">{file.filename}</span><span class="block text-xs text-[var(--site-muted)]">{meta}</span></a>
    {/if}
    <a class="viewer-tool !p-1.5 text-[var(--site-muted)]" {href} download={file.filename} aria-label={`Download ${file.filename}`}><Download size={15}/></a>
  </div>
{:else}
  <article class="site-card group flex flex-col overflow-hidden rounded-2xl">
    {#snippet thumb()}
      {#if preview}
        <img src={preview} alt="" loading="lazy" class="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"/>
      {:else}
        <span class="grid size-full place-content-center justify-items-center gap-2 text-[var(--site-accent)]"><FileIcon {kind} size={34}/><span class="text-xs font-extrabold tracking-[.18em]">{label}</span></span>
      {/if}
      <span class="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100 group-focus-within:opacity-100"><span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--site-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--site-ink)] shadow">{#if canView}<Eye size={14}/> View{:else}<Download size={14}/> Download{/if}</span></span>
    {/snippet}
    {#if canView}
      <button type="button" class="relative aspect-[16/10] w-full overflow-hidden border-b border-[var(--site-line)] bg-[var(--site-accent-soft)]" aria-label={`View ${file.filename}`} onclick={() => open = true}>{@render thumb()}</button>
    {:else}
      <a class="relative block aspect-[16/10] w-full overflow-hidden border-b border-[var(--site-line)] bg-[var(--site-accent-soft)]" {href} download={file.filename} aria-label={`Download ${file.filename}`}>{@render thumb()}</a>
    {/if}
    <div class="flex items-center gap-2 p-3.5">
      <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold" title={file.filename}>{file.filename}</p><p class="text-xs text-[var(--site-muted)]">{meta}</p></div>
      <a class="viewer-tool !p-2 text-[var(--site-muted)]" {href} download={file.filename} aria-label={`Download ${file.filename}`}><Download size={16}/></a>
    </div>
  </article>
{/if}

{#if canView}<FileViewer {file} bind:open/>{/if}
