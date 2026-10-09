<script lang="ts">
  let { label, title, detail }: { label: string; title: string; detail?: string } = $props();
</script>
<div class="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--site-line)] pb-5">
  <div><p class="site-eyebrow mb-2">{label}</p><h2 class="site-heading">{title}</h2></div>
  {#if detail}<p class="site-copy max-w-md text-sm">{detail}</p>{/if}
</div>
