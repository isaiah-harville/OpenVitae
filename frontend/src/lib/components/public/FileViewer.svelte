<script lang="ts" module>
  export type ViewedFile = { url: string; filename: string; contentType: string; size?: number; downloadUrl?: string };
</script>

<script lang="ts">
  import { Modal } from '@sivir-ui/svelte';
  import { Download, ExternalLink, Maximize2, Minimize2, X } from 'lucide-svelte';
  import { fileKind, formatBytes } from '#lib/files.ts';
  import PdfViewer from './PdfViewer.svelte';

  let { file, open = $bindable(false) }: { file: ViewedFile; open?: boolean } = $props();
  const kind = $derived(fileKind(file.contentType));
  let failed = $state(false);
  let fullscreen = $state(false);
  let frame = $state<HTMLDivElement>();

  $effect(() => { if (!open) failed = false; });

  function toggleFullscreen() {
    const panel = frame?.closest<HTMLElement>('[data-ui="modal-panel"]');
    if (document.fullscreenElement) document.exitFullscreen();
    else panel?.requestFullscreen();
  }

  async function download() {
    if (file.downloadUrl) return void (window.location.href = file.downloadUrl);
    try {
      const blob = await (await fetch(file.url)).blob();
      const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file.filename });
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch { window.open(file.url, '_blank', 'noopener'); }
  }
</script>

<svelte:document onfullscreenchange={() => fullscreen = !!document.fullscreenElement}/>

<Modal.Root bind:open>
  <Modal.Content showClose={false} contentClass="!max-w-[min(1400px,calc(100vw-2rem))] !h-[calc(100dvh-2rem)] !max-h-none md:!top-[50%] !bg-[var(--site-surface)] !text-[var(--site-ink)] !rounded-2xl" surfaceClass="!p-0 !gap-0 !overflow-hidden" aria-label={file.filename}>
    <div bind:this={frame} class="flex min-h-0 flex-1 flex-col">
      <header class="flex shrink-0 items-center gap-2 border-b border-[var(--site-line)] py-2 pl-5 pr-2">
        <div class="min-w-0 flex-1">
          <Modal.Title class="truncate text-sm font-bold">{file.filename}</Modal.Title>
          {#if file.size}<p class="text-xs text-[var(--site-muted)]">{formatBytes(file.size)}</p>{/if}
        </div>
        <button type="button" class="viewer-tool" onclick={download}><Download size={15}/><span class="hidden sm:inline">Download</span></button>
        <a class="viewer-tool" href={file.url} target="_blank" rel="noreferrer" aria-label="Open in a new tab"><ExternalLink size={15}/></a>
        {#if document.fullscreenEnabled}<button type="button" class="viewer-tool" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} onclick={toggleFullscreen}>{#if fullscreen}<Minimize2 size={15}/>{:else}<Maximize2 size={15}/>{/if}</button>{/if}
        <button type="button" class="viewer-tool" aria-label="Close" onclick={() => open = false}><X size={17}/></button>
      </header>
      {#if failed}
        <div class="grid flex-1 place-content-center gap-3 p-8 text-center">
          <p class="text-lg font-bold">This file can't be shown here.</p>
          <p class="site-copy text-sm">Download it to open it on your device.</p>
          <button type="button" class="site-action mx-auto mt-2" onclick={download}><Download size={16}/> Download {file.filename}</button>
        </div>
      {:else if kind === 'pdf'}
        <PdfViewer src={file.url} title={file.filename} onfail={() => failed = true}/>
      {:else if kind === 'image'}
        <div class="grid min-h-0 flex-1 place-items-center bg-[color-mix(in_srgb,var(--site-ink)_6%,var(--site-paper))] p-6"><img src={file.url} alt={file.filename} class="max-h-full max-w-full rounded-md object-contain" onerror={() => failed = true}/></div>
      {:else if kind === 'video'}
        <!-- svelte-ignore a11y_media_has_caption -->
        <div class="grid min-h-0 flex-1 place-items-center bg-black"><video src={file.url} controls autoplay playsinline class="max-h-full max-w-full" onerror={() => failed = true}></video></div>
      {:else if kind === 'audio'}
        <div class="grid flex-1 place-items-center p-8"><audio src={file.url} controls class="w-full max-w-xl" onerror={() => failed = true}></audio></div>
      {:else}
        <div class="grid flex-1 place-content-center gap-3 p-8 text-center">
          <p class="text-lg font-bold">No preview for this file type.</p>
          <button type="button" class="site-action mx-auto mt-2" onclick={download}><Download size={16}/> Download {file.filename}</button>
        </div>
      {/if}
    </div>
  </Modal.Content>
</Modal.Root>
