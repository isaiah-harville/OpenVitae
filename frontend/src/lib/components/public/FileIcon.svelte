<script lang="ts">
  import { Archive, File, FileText, Film, Image, Music, Presentation } from 'lucide-svelte';
  import type { FileKind } from '#lib/files.ts';
  let { kind, size = 18 }: { kind: FileKind; size?: number } = $props();
  const icons = { pdf: FileText, deck: Presentation, image: Image, video: Film, audio: Music, document: FileText, archive: Archive, other: File };
  const Icon = $derived(icons[kind]);
</script>
<Icon {size} aria-hidden="true"/>
