<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '@sivir-ui/svelte';
  import { LogOut } from 'lucide-svelte';
  import type { Project, Publication, SiteConfig, Skill, Tag, Talk } from '$lib/api';
  import { api, isAuthed, logout } from '$lib/client';
  import ProfileEditor from '$lib/components/admin/ProfileEditor.svelte';
  import HeadshotEditor from '$lib/components/admin/HeadshotEditor.svelte';
  import FeatureEditor from '$lib/components/admin/FeatureEditor.svelte';
  import AppearanceEditor from '$lib/components/admin/AppearanceEditor.svelte';
  import EntityEditor from '$lib/components/admin/EntityEditor.svelte';
  import ImportEditor from '$lib/components/admin/ImportEditor.svelte';
  import DataEditor from '$lib/components/admin/DataEditor.svelte';
  import PageBuilder from '$lib/components/admin/PageBuilder.svelte';

  let config = $state<SiteConfig | null>(null);
  let tags = $state<Tag[]>([]); let publications = $state<Publication[]>([]);
  let talks = $state<Talk[]>([]); let projects = $state<Project[]>([]); let skills = $state<Skill[]>([]);
  let active = $state('profile'); let message = $state(''); let error = $state(false);
  const tabs = ['profile', 'pages', 'appearance', 'publications', 'talks', 'projects', 'skills', 'tags', 'data'];
  function report(value: string, isError = false) { message = value; error = isError; window.setTimeout(() => { if (message === value) message = ''; }, 5000); }
  async function reload() {
    [config, tags, publications, talks, projects, skills] = await Promise.all([
      api.getConfig(), api.listTags(), api.listPublications(), api.listTalks(), api.listProjects(), api.listSkills()
    ]);
  }
  onMount(() => {
    api.getAuthMode().then(({ mode }) => {
      if (mode !== 'proxy' && !isAuthed()) return goto('/admin/login');
      return reload();
    }).catch((cause) => report(String(cause), true));
  });
  function signOut() { logout(); goto('/admin/login'); }
</script>
<svelte:head><title>Admin · OpenVitae</title></svelte:head>
<main class="site-shell py-10 md:py-14">
  <div class="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p class="site-eyebrow mb-2">Your workspace</p><h1 class="site-heading">Make it yours<span class="text-[var(--site-accent)]">.</span></h1></div><div class="flex gap-2"><Button href="/" variant="secondary" size="sm">View site ↗</Button><Button variant="quiet" size="sm" onclick={signOut}><LogOut size={15}/> Sign out</Button></div></div>
  {#if message}<div role="status" class="mb-5 rounded-xl border p-3 text-sm" class:border-red-400={error} class:text-red-500={error}>{message}</div>{/if}
  {#if config}
    <div class="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Admin sections" class="flex gap-1 overflow-x-auto lg:flex-col">{#each tabs as tab}<button class:chosen={active === tab} type="button" class="shrink-0 rounded-xl px-4 py-3 text-left text-sm font-semibold capitalize" onclick={() => active = tab}>{tab}</button>{/each}</nav>
      <div class="min-w-0 space-y-5">
        {#if active === 'profile'}<ProfileEditor {config} updated={(value) => config = value} {report}/><HeadshotEditor {config} updated={(value) => config = value} {report}/><FeatureEditor {config} updated={(value) => config = value} {report}/>{/if}
        {#if active === 'appearance'}<AppearanceEditor {config} updated={(value) => config = value} {report}/>{/if}
        {#if active === 'pages'}<PageBuilder {config} content={{ publications, talks, projects, skills }} updated={(value) => config = value} {report}/>{/if}
        {#if active === 'publications'}<ImportEditor {reload} {report}/><EntityEditor kind="publications" items={publications} {tags} {reload} {report}/>{/if}
        {#if active === 'talks'}<EntityEditor kind="talks" items={talks} {reload} {report}/>{/if}
        {#if active === 'projects'}<EntityEditor kind="projects" items={projects} {tags} {skills} {reload} {report}/>{/if}
        {#if active === 'skills'}<EntityEditor kind="skills" items={skills} {reload} {report}/>{/if}
        {#if active === 'tags'}<EntityEditor kind="tags" items={tags} {reload} {report}/>{/if}
        {#if active === 'data'}<DataEditor {reload} {report}/>{/if}
      </div>
    </div>
  {:else}<p class="site-copy py-20">Loading workspace…</p>{/if}
</main>
<style>nav button { color: var(--site-muted); } nav button:hover { background: var(--site-accent-soft); color: var(--site-ink); } nav button.chosen { background: var(--site-accent); color: var(--site-on-accent); }</style>
