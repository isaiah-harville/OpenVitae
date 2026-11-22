<script lang="ts">
  import { Button, Card } from '@sivir-ui/svelte';
  import { api } from '#lib/client.ts';
  let { reload, report }: { reload: () => Promise<void>; report: (message: string, error?: boolean) => void } = $props();
  let doi = $state(''); let orcid = $state(''); let bibtex = $state(''); let busy = $state(false);
  async function run(task: () => Promise<{ created: number; skipped: number }>) { busy = true; try { const result = await task(); await reload(); report(`Imported ${result.created}; skipped ${result.skipped}`); } catch (error) { report(String(error), true); } finally { busy = false; } }
</script>
<Card.Root class="site-card !rounded-2xl !p-6"><p class="site-eyebrow mb-2">Add in bulk</p><h2 class="mb-5 text-2xl font-bold tracking-tight">Import publications</h2>
  <div class="space-y-5">
    <div class="grid gap-5 md:grid-cols-2">
      <div><label class="site-label" for="import-doi">DOI</label><div class="flex gap-2"><input id="import-doi" class="site-field" bind:value={doi} placeholder="10.1000/example"/><Button variant="secondary" disabled={busy || !doi.trim()} onclick={() => run(() => api.importDoi(doi))}>Import</Button></div></div>
      <div><label class="site-label" for="import-orcid">ORCID</label><div class="flex gap-2"><input id="import-orcid" class="site-field" bind:value={orcid} placeholder="0000-0000-0000-0000"/><Button variant="secondary" disabled={busy || !orcid.trim()} onclick={() => run(() => api.importOrcid(orcid))}>Import</Button></div></div>
    </div>
    <div><label class="site-label" for="import-bibtex">BibTeX</label><textarea id="import-bibtex" class="site-field min-h-30 font-mono" bind:value={bibtex} placeholder="Paste BibTeX here"></textarea><div class="mt-3 flex justify-end"><Button variant="secondary" disabled={busy || !bibtex.trim()} onclick={() => run(() => api.importBibtex(bibtex))}>Import BibTeX</Button></div></div>
  </div>
</Card.Root>
