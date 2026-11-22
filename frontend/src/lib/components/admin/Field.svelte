<script lang="ts">
  import { Input } from '@sivir-ui/svelte';
  let { label, value = $bindable(), multiline = false, mono = false, type = 'text', placeholder = '' }: { label: string; value?: string; multiline?: boolean; mono?: boolean; type?: string; placeholder?: string } = $props();
</script>
<label class="block"><span class="site-label">{label}</span>{#if multiline}<textarea class="site-field min-h-28 resize-y" class:font-mono={mono} class:min-h-48={mono} bind:value {placeholder}></textarea>{:else}<Input {type} bind:value {placeholder}/>{/if}</label>
