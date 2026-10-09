<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button, Card } from '@sivir-ui/svelte';
  import Cropper from 'svelte-easy-crop';
  import type { CropArea } from 'svelte-easy-crop';
  import type { SiteConfig } from '$lib/api';
  import { api } from '$lib/client';

  let { config, updated, report }: {
    config: SiteConfig;
    updated: (config: SiteConfig) => void;
    report: (message: string, error?: boolean) => void;
  } = $props();
  let image = $state('');
  let crop = $state({ x: 0, y: 0 });
  let zoom = $state(1);
  let area = $state<CropArea | null>(null);
  let busy = $state(false);

  function clear() {
    if (image) URL.revokeObjectURL(image);
    image = '';
    area = null;
  }
  onDestroy(clear);

  function choose(file: File) {
    clear();
    image = URL.createObjectURL(file);
    crop = { x: 0, y: 0 };
    zoom = 1;
  }

  async function save() {
    if (!image || !area) return;
    busy = true;
    try {
      const source = new Image();
      source.src = image;
      await source.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image cropping is unavailable in this browser');
      context.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not crop the image')), 'image/jpeg', 0.9));
      const file = new File([blob], 'headshot.jpg', { type: 'image/jpeg' });
      const result = await api.uploadHeadshot(file);
      updated({ ...config, headshot_url: result.headshot_url });
      clear();
      report('Headshot updated');
    } catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
</script>

<Card.Root class="site-card !rounded-2xl !p-6">
  <p class="site-eyebrow mb-2">First impression</p>
  <h2 class="mb-5 text-xl font-bold">Headshot</h2>
  {#if image}
    <div class="relative h-72 overflow-hidden rounded-2xl bg-black"><Cropper {image} bind:crop bind:zoom aspect={1} cropShape="round" oncropcomplete={({ pixels }) => area = pixels}/></div>
    <label class="mt-5 block"><span class="site-label">Zoom</span><input class="w-full accent-[var(--site-accent)]" type="range" min="1" max="3" step="0.01" bind:value={zoom}/></label>
    <div class="mt-5 flex gap-2"><Button onclick={save} loading={busy}>Save crop</Button><Button variant="quiet" onclick={clear}>Cancel</Button></div>
  {:else}
    <div class="flex flex-wrap items-center gap-5">
      {#if config.headshot_url}<img src={config.headshot_url} alt="Current headshot" class="size-24 rounded-2xl object-cover"/>{/if}
      <label class="block"><span class="site-label">Choose photo</span><input class="site-field max-w-xs" type="file" accept="image/*" disabled={busy} onchange={(event) => { const file = event.currentTarget.files?.[0]; if (file) choose(file); }}/></label>
    </div>
  {/if}
</Card.Root>
