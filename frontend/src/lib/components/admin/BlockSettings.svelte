<script lang="ts">
  import { Button } from '@sivir-ui/svelte';
  import type { PageBlock } from '$lib/pages';
  import { api } from '$lib/client';
  let { block, report }: { block: PageBlock; report: (message: string, error?: boolean) => void } = $props();
  let uploading = $state(false);
  async function upload(file: File) {
    uploading = true;
    try { block.imageKey = (await api.uploadPageImage(file)).image_key; block.imageUrl = URL.createObjectURL(file); report('Image uploaded. Save the page to publish it.'); }
    catch (error) { report(String(error), true); }
    finally { uploading = false; }
  }
</script>
<div class="site-card rounded-2xl p-5">
  <p class="site-eyebrow mb-2">Block settings</p>
  <h3 class="mb-5 text-xl font-bold capitalize">{block.type.replace(/([A-Z])/g, ' $1')}</h3>
  <div class="grid gap-4">
    <label><span class="site-label">Width</span><select class="site-field" value={block.width} onchange={(event) => block.width = Number(event.currentTarget.value) as 1 | 2}><option value="1">Half grid</option><option value="2">Full grid</option></select></label>
    <label><span class="site-label">Small label</span><input class="site-field" maxlength="100" bind:value={block.eyebrow}/></label>
    <label><span class="site-label">Heading</span><input class="site-field" maxlength="200" bind:value={block.heading}/></label>
    {#if !['skills', 'projects', 'talks', 'education', 'links', 'image'].includes(block.type)}<label><span class="site-label">{block.type === 'hero' ? 'Intro text' : 'Text'}</span><textarea class="site-field min-h-30" maxlength="20000" bind:value={block.text}></textarea></label>{/if}
    {#if ['image', 'imageText', 'custom'].includes(block.type)}
      <label><span class="site-label">Image</span><input class="site-field" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onchange={(event) => { const file = event.currentTarget.files?.[0]; if (file) upload(file); }}/></label>
      {#if block.imageKey}<div class="flex items-center gap-3"><img class="size-16 rounded-lg object-cover" src={block.imageUrl || `/api/uploads/page-image/${encodeURIComponent(block.imageKey.slice('page-images/'.length))}`} alt={block.imageAlt || ''}/><Button variant="quiet" size="sm" onclick={() => { block.imageKey = undefined; block.imageUrl = undefined; }}>Remove image</Button></div>{/if}
      <label><span class="site-label">Image description</span><input class="site-field" maxlength="300" bind:value={block.imageAlt}/></label>
      {#if block.type !== 'image'}<label><span class="site-label">Image placement</span><select class="site-field" bind:value={block.imagePosition}><option value="right">Right or below</option><option value="left">Left or above</option></select></label>{/if}
    {/if}
    {#if ['custom', 'text', 'imageText'].includes(block.type)}<label><span class="site-label">Button text</span><input class="site-field" maxlength="100" bind:value={block.buttonLabel}/></label><label><span class="site-label">Button URL</span><input class="site-field" maxlength="2048" bind:value={block.buttonUrl} placeholder="/contact or https://…"/></label>{/if}
  </div>
</div>
