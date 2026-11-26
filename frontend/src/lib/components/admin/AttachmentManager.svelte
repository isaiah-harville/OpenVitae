<script lang="ts">
  import { ExternalLink, X } from 'lucide-svelte';
  import type { Attachment, AttachmentOwner } from '#lib/api.ts';
  import { api } from '#lib/client.ts';
  import FileIcon from '#lib/components/public/FileIcon.svelte';
  import { ATTACHMENT_ACCEPT, fileKind, formatBytes } from '#lib/files.ts';
  import FileDrop from './FileDrop.svelte';
  import UploadBar from './UploadBar.svelte';

  let { owner, ownerId, attachments, reload, report }: {
    owner: AttachmentOwner;
    ownerId: number;
    attachments: Attachment[];
    reload: () => Promise<void>;
    report: (message: string, error?: boolean) => void;
  } = $props();
  let uploads = $state<{ id: number; name: string; fraction: number }[]>([]);
  let removing = $state<number | null>(null);
  let next = 0;

  async function add(files: File[]) {
    const results = await Promise.allSettled(files.map(async (file) => {
      const id = next++;
      uploads = [...uploads, { id, name: file.name, fraction: 0 }];
      try {
        await api.attachFile(owner, ownerId, file, (fraction) => {
          uploads = uploads.map((u) => (u.id === id ? { ...u, fraction } : u));
        });
      } catch (error) {
        throw new Error(`${file.name}: ${error instanceof Error ? error.message : error}`);
      } finally {
        uploads = uploads.filter((u) => u.id !== id);
      }
    }));
    await reload();
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length) report(failed.map((r) => r.reason.message).join(' · '), true);
    else report(files.length === 1 ? 'File added' : `${files.length} files added`);
  }

  async function remove(attachment: Attachment) {
    if (!confirm(`Remove “${attachment.filename}”? Visitors will no longer be able to download it.`)) return;
    removing = attachment.id;
    try { await api.removeAttachment(attachment.id); await reload(); report('File removed'); }
    catch (error) { report(String(error), true); }
    finally { removing = null; }
  }
</script>

<div class="grid gap-2">
  {#each attachments as attachment (attachment.id)}
    {@const kind = fileKind(attachment.content_type)}
    <div class="flex items-center gap-3 rounded-xl border border-[var(--site-line)] p-2 pr-2.5" class:opacity-50={removing === attachment.id}>
      <span class="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[var(--site-accent-soft)] text-[var(--site-accent)]">
        {#if attachment.preview_url}<img src={attachment.preview_url} alt="" class="size-full object-cover object-top"/>{:else}<FileIcon {kind} size={17}/>{/if}
      </span>
      <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">{attachment.filename}</p><p class="text-xs text-[var(--site-muted)]">{formatBytes(attachment.size)}{kind === 'pdf' ? ' · opens in the viewer' : ''}</p></div>
      <a class="admin-icon" href={attachment.url} target="_blank" rel="noreferrer" aria-label={`Open ${attachment.filename}`}><ExternalLink size={15}/></a>
      <button type="button" class="admin-icon danger" aria-label={`Remove ${attachment.filename}`} disabled={removing !== null} onclick={() => remove(attachment)}><X size={15}/></button>
    </div>
  {/each}
  {#each uploads as upload (upload.id)}<UploadBar name={upload.name} fraction={upload.fraction}/>{/each}
  <FileDrop accept={ATTACHMENT_ACCEPT} multiple onfiles={add} compact={attachments.length > 0}>
    <span class="font-semibold">Drop files here or <span class="text-[var(--site-accent)] underline underline-offset-2">browse</span></span>
    {#if attachments.length === 0}<span class="mt-1 block text-xs text-[var(--site-muted)]">PDFs, slide decks, documents, images, video, audio, or zip files. Visitors can view PDFs, images, and media in the page and download everything.</span>{/if}
  </FileDrop>
</div>
