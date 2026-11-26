<script lang="ts">
  import type { Attachment } from '#lib/api.ts';
  import FileCard from './FileCard.svelte';

  let { attachments, compact = false }: { attachments: Attachment[]; compact?: boolean } = $props();
  const asFile = (a: Attachment) => ({ url: a.url, filename: a.filename, contentType: a.content_type, size: a.size, downloadUrl: a.download_url });
</script>

{#if attachments.length}
  <ul class={compact ? 'grid gap-2' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'} aria-label="Files">
    {#each attachments as attachment (attachment.id)}
      <li><FileCard file={asFile(attachment)} preview={attachment.preview_url} {compact}/></li>
    {/each}
  </ul>
{/if}
