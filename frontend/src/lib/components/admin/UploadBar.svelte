<script lang="ts">
  let { name, fraction }: { name: string; fraction: number } = $props();
  const percent = $derived(Math.round(fraction * 100));
</script>

<div class="rounded-xl border border-[var(--site-line)] px-3 py-2.5" role="status">
  <div class="flex items-center justify-between gap-3 text-xs font-semibold"><span class="truncate">{name}</span><span class="tabular-nums text-[var(--site-muted)]">{percent < 100 ? `${percent}%` : 'Processing…'}</span></div>
  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--site-accent-soft)]"><div class="h-full rounded-full bg-[var(--site-accent)] transition-[width] duration-200" style:width="{percent}%"></div></div>
</div>
