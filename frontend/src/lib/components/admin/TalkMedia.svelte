<script lang="ts">
  import { ExternalLink, Presentation, Video } from 'lucide-svelte';
  import type { Talk, TalkAttachment } from '#lib/api.ts';
  import { api } from '#lib/client.ts';
  import { extension } from '#lib/files.ts';
  import AttachmentManager from './AttachmentManager.svelte';
  import FileDrop from './FileDrop.svelte';
  import UploadBar from './UploadBar.svelte';

  let { talk, reload, report }: { talk: Talk; reload: () => Promise<void>; report: (message: string, error?: boolean) => void } = $props();
  const SLOTS = [
    { kind: 'slides', label: 'Slides', icon: Presentation, accept: '.pdf,.ppt,.pptx,.odp', hint: 'A PDF gets a preview and opens in the slide viewer. PowerPoint and Keynote decks can only be downloaded, so export a PDF and add the original under Other files.' },
    { kind: 'video', label: 'Recording', icon: Video, accept: 'video/mp4,video/webm,video/quicktime,.mp4,.m4v,.webm,.mov', hint: 'MP4, WebM, or MOV. It plays on the talk card.' },
  ] as const;
  let uploading = $state<Partial<Record<TalkAttachment, { name: string; fraction: number }>>>({});
  let busy = $state(false);

  async function upload(kind: TalkAttachment, file: File) {
    uploading = { ...uploading, [kind]: { name: file.name, fraction: 0 } };
    try {
      await api.uploadTalkAttachment(talk.id, kind, file, (fraction) => { uploading = { ...uploading, [kind]: { name: file.name, fraction } }; });
      await reload();
      report(kind === 'video' ? 'Recording uploaded' : 'Slides uploaded');
    } catch (error) { report(String(error), true); }
    finally { const { [kind]: _done, ...rest } = uploading; uploading = rest; }
  }

  async function remove(kind: TalkAttachment) {
    if (!confirm(`Remove this talk's ${kind === 'video' ? 'recording' : 'slides'}?`)) return;
    busy = true;
    try { await api.deleteTalkAttachment(talk.id, kind); await reload(); report(kind === 'video' ? 'Recording removed' : 'Slides removed'); }
    catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
</script>

<section class="mt-8 border-t border-[var(--site-line)] pt-6" aria-labelledby="talk-media">
  <h4 id="talk-media" class="text-base font-bold">Slides, recording &amp; files</h4>
  <p class="site-copy mb-5 text-sm">Uploads save right away. Visitors see them on the talk card.</p>
  <div class="grid gap-4 md:grid-cols-2">
    {#each SLOTS as slot (slot.kind)}
      {@const url = slot.kind === 'video' ? talk.video_url : talk.file_url}
      {@const progress = uploading[slot.kind]}
      <div class="flex flex-col gap-3 rounded-2xl border border-[var(--site-line)] p-4">
        <p class="flex items-center gap-2 text-sm font-bold"><slot.icon size={16}/> {slot.label}</p>
        {#if progress}
          <UploadBar name={progress.name} fraction={progress.fraction}/>
        {:else if url}
          <div class="overflow-hidden rounded-xl border border-[var(--site-line)] bg-[var(--site-accent-soft)]">
            {#if slot.kind === 'video'}
              <!-- svelte-ignore a11y_media_has_caption -->
              <video src={url} controls preload="metadata" class="aspect-video w-full bg-black"></video>
            {:else if talk.file_preview_url}
              <img src={talk.file_preview_url} alt="First slide" class="aspect-video w-full object-cover object-top"/>
            {:else}
              <div class="grid aspect-video place-content-center justify-items-center gap-1 p-4 text-center text-xs text-[var(--site-muted)]"><Presentation size={26} class="text-[var(--site-accent)]"/><span class="font-bold text-[var(--site-ink)]">.{extension(url)} deck</span>No preview. Visitors can download it.</div>
            {/if}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <a class="inline-flex items-center gap-1 text-xs font-semibold text-[var(--site-muted)] hover:text-[var(--site-ink)]" href={url} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Open</a>
            <span class="flex-1"></span>
            <FileDrop accept={slot.accept} compact disabled={busy} onfiles={([file]) => upload(slot.kind, file)}><span class="text-xs font-semibold">Replace</span></FileDrop>
            <button type="button" class="rounded-lg px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10" disabled={busy} onclick={() => remove(slot.kind)}>Remove</button>
          </div>
        {:else}
          <FileDrop accept={slot.accept} onfiles={([file]) => upload(slot.kind, file)}>
            <span class="font-semibold">Upload {slot.label.toLowerCase()}</span>
            <span class="mt-1 block text-xs text-[var(--site-muted)]">{slot.hint}</span>
          </FileDrop>
        {/if}
      </div>
    {/each}
  </div>
  <div class="mt-4 rounded-2xl border border-[var(--site-line)] p-4">
    <p class="text-sm font-bold">Other files</p>
    <p class="site-copy mb-3 text-xs">Handouts, code, the original deck. Shown as downloads on the talk card.</p>
    <AttachmentManager owner="talks" ownerId={talk.id} attachments={talk.attachments} {reload} {report}/>
  </div>
</section>
