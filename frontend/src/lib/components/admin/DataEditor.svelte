<script lang="ts">
  import { Button, Card } from '@sivir-ui/svelte';
  import { api } from '$lib/client';
  let { reload, report }: { reload: () => Promise<void>; report: (message: string, error?: boolean) => void } = $props();
  let busy = $state(false);
  async function download() { busy = true; try { const url = URL.createObjectURL(await api.downloadBackup()); const link = document.createElement('a'); link.href = url; link.download = `openvitae-backup-${new Date().toISOString().slice(0, 10)}.zip`; link.click(); URL.revokeObjectURL(url); report('Backup downloaded'); } catch (error) { report(String(error), true); } finally { busy = false; } }
  async function restore(file: File) { if (!confirm('Restore will replace all current site data. Continue?')) return; busy = true; try { await api.restoreBackup(file); await reload(); report('Backup restored'); } catch (error) { report(String(error), true); } finally { busy = false; } }
</script>
<Card.Root class="site-card !rounded-2xl !p-6"><p class="site-eyebrow mb-2">Keep a copy</p><h2 class="mb-4 text-2xl font-bold">Backup & restore</h2><p class="site-copy mb-6 text-sm">Download your site data and uploads as a ZIP file.</p><Button disabled={busy} onclick={download}>Download backup</Button><label class="mt-8 block"><span class="site-label">Restore from ZIP</span><input class="site-field max-w-sm" type="file" accept=".zip,application/zip" disabled={busy} onchange={(event) => { const file = event.currentTarget.files?.[0]; if (file) restore(file); }}/></label><p class="mt-2 text-xs text-red-500">Restore replaces all current data.</p></Card.Root>
