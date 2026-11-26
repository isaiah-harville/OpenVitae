<script lang="ts">
  import { Upload } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  let { accept, multiple = false, disabled = false, compact = false, onfiles, children }: {
    accept: string;
    multiple?: boolean;
    disabled?: boolean;
    compact?: boolean;
    onfiles: (files: File[]) => void;
    children: Snippet;
  } = $props();
  let over = $state(false);

  function take(list: FileList | null | undefined) {
    const files = [...(list ?? [])];
    if (files.length && !disabled) onfiles(multiple ? files : files.slice(0, 1));
  }
</script>

<label
  class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed text-sm transition-colors {compact ? 'px-3 py-2' : 'flex-col justify-center px-5 py-6 text-center'} {over ? 'border-[var(--site-accent)] bg-[var(--site-accent-soft)]' : 'border-[var(--site-line)] hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)]'}"
  class:opacity-50={disabled}
  ondragover={(event) => { event.preventDefault(); over = true; }}
  ondragleave={() => over = false}
  ondrop={(event) => { event.preventDefault(); over = false; take(event.dataTransfer?.files); }}
>
  <span class="grid shrink-0 place-items-center rounded-lg bg-[var(--site-accent-soft)] text-[var(--site-accent)] {compact ? 'size-7' : 'size-10'}"><Upload size={compact ? 14 : 18}/></span>
  <span class="min-w-0">{@render children()}</span>
  <input class="sr-only" type="file" {accept} {multiple} {disabled} onchange={(event) => { take(event.currentTarget.files); event.currentTarget.value = ''; }}/>
</label>
