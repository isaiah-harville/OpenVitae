<script lang="ts">
  import { Badge } from '@sivir-ui/svelte/components/badge';
  import type { Tag } from '$lib/api';
  let { tag }: { tag: Pick<Tag, 'name' | 'color'> } = $props();
</script>
<Badge variant="outline" class="!rounded-full !px-3 !py-1" style={`color: ${tag.color || 'var(--site-accent)'}; border-color: ${tag.color || 'var(--site-line)'}`}>{tag.name}</Badge>
