<script lang="ts">
  import PageBlocks from '$lib/components/public/PageBlocks.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>
<svelte:head><title>{data.page.title}</title></svelte:head>
{#if data.config}<PageBlocks page={data.page} config={data.config} content={data}/>{/if}
