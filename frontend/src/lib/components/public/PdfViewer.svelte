<script lang="ts">
  import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-svelte';
  import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
  import { onDestroy } from 'svelte';
  import { drawPage, openPdf } from '#lib/pdf.ts';

  let { src, title, onfail }: { src: string; title: string; onfail: () => void } = $props();

  let doc = $state.raw<PDFDocumentProxy | null>(null);
  let page = $state(1);
  let thumbnails = $state(true);
  let stage = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let strip = $state<HTMLDivElement>();
  let box = $state({ width: 0, height: 0 });
  const count = $derived(doc?.numPages ?? 0);
  let task: RenderTask | undefined;

  $effect(() => {
    let cancelled = false;
    const loading = openPdf(src);
    loading
      .then((t) => t.promise)
      .then((loaded) => { if (!cancelled) { doc = loaded; page = 1; } })
      .catch(() => { if (!cancelled) onfail(); });
    return () => { cancelled = true; loading.then((t) => t.destroy()); doc = null; };
  });

  $effect(() => {
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      box = { width: entry.contentRect.width, height: entry.contentRect.height };
    });
    observer.observe(stage);
    return () => observer.disconnect();
  });

  $effect(() => {
    const target = canvas;
    const { width, height } = box;
    if (!doc || !target || width < 10 || height < 10) return;
    const number = page;
    let stale = false;
    doc.getPage(number).then((pdfPage) => {
      if (stale) return;
      task?.cancel();
      task = drawPage(pdfPage, target, { width, height });
      task.promise.catch(() => {});
    });
    strip?.querySelector(`[data-page="${number}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    return () => { stale = true; };
  });

  onDestroy(() => task?.cancel());

  function go(next: number) { page = Math.min(Math.max(next, 1), count || 1); }

  function onkeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const moves: Record<string, number> = { ArrowRight: page + 1, ArrowDown: page + 1, PageDown: page + 1, ArrowLeft: page - 1, ArrowUp: page - 1, PageUp: page - 1, Home: 1, End: count };
    if (event.key in moves) { event.preventDefault(); go(moves[event.key]); }
  }

  function thumbnail(node: HTMLCanvasElement, number: number) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !doc) return;
      observer.disconnect();
      doc.getPage(number).then((pdfPage) => drawPage(pdfPage, node, { width: 112, height: 80 }).promise.catch(() => {}));
    }, { root: strip, rootMargin: '0px 200px' });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

<svelte:window {onkeydown}/>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="relative flex min-h-0 flex-1 items-center justify-center bg-[color-mix(in_srgb,var(--site-ink)_6%,var(--site-paper))] p-4 sm:p-8">
    <div bind:this={stage} class="absolute inset-4 sm:inset-8"></div>
    {#if doc}
      <canvas bind:this={canvas} class="relative rounded-md bg-white shadow-[0_18px_50px_-24px_#0006]"></canvas><span class="sr-only" aria-live="polite">{title}, page {page} of {count}</span>
    {:else}
      <div class="relative flex aspect-[4/3] w-[min(70%,36rem)] animate-pulse items-center justify-center rounded-md bg-[var(--site-surface)] text-sm font-semibold text-[var(--site-muted)]">Loading {title}…</div>
    {/if}
    {#if count > 1}
      <button type="button" class="viewer-nav left-2 sm:left-4" aria-label="Previous page" disabled={page <= 1} onclick={() => go(page - 1)}><ChevronLeft size={22}/></button>
      <button type="button" class="viewer-nav right-2 sm:right-4" aria-label="Next page" disabled={page >= count} onclick={() => go(page + 1)}><ChevronRight size={22}/></button>
    {/if}
  </div>
  {#if doc && count > 1}
    {#if thumbnails}
      <div bind:this={strip} class="flex shrink-0 gap-2 overflow-x-auto border-t border-[var(--site-line)] bg-[var(--site-surface)] px-4 py-3">
        {#each { length: count } as _, index (index)}
          {@const number = index + 1}
          <button type="button" data-page={number} class="group grid shrink-0 justify-items-center gap-1" aria-label={`Go to page ${number}`} aria-current={number === page ? 'page' : undefined} onclick={() => go(number)}>
            <span class="grid h-20 w-28 place-items-center overflow-hidden rounded-md border-2 bg-[var(--site-paper)] transition-colors {number === page ? 'border-[var(--site-accent)]' : 'border-transparent group-hover:border-[var(--site-line)]'}"><canvas use:thumbnail={number} class="rounded-sm bg-white"></canvas></span>
            <span class="text-[11px] font-semibold tabular-nums {number === page ? 'text-[var(--site-accent)]' : 'text-[var(--site-muted)]'}">{number}</span>
          </button>
        {/each}
      </div>
    {/if}
    <div class="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--site-line)] px-4 py-2.5 text-sm">
      <button type="button" class="viewer-tool" aria-pressed={thumbnails} onclick={() => thumbnails = !thumbnails}><LayoutGrid size={15}/> {thumbnails ? 'Hide' : 'Show'} pages</button>
      <span class="font-semibold tabular-nums">Page {page} <span class="text-[var(--site-muted)]">of {count}</span></span>
      <span class="hidden text-xs text-[var(--site-muted)] sm:block">← → to turn pages</span>
    </div>
  {/if}
</div>

