<script lang="ts">
  import { ArrowRight, ArrowUpRight, Mail, MapPin, Sparkles } from 'lucide-svelte';
  import { markdown } from '$lib/markdown';
  import { Button } from '@sivir-ui/svelte/components/button';
  import PublicationCard from '$lib/components/public/PublicationCard.svelte';
  import ProjectCard from '$lib/components/public/ProjectCard.svelte';
  import SectionTitle from '$lib/components/public/SectionTitle.svelte';
  import TagChip from '$lib/components/public/TagChip.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const config = $derived(data.config);
  const profile = $derived(config?.profile ?? {});
  const features = $derived(config?.features ?? {});
  let active = $state('about');
  const sections = $derived([
    ...(features.about !== false && (profile.bio || data.skills.length) ? ['about'] : []),
    ...(features.publications !== false ? ['publications'] : []),
    ...(features.projects !== false && data.projects.length ? ['projects'] : []),
    ...(features.talks !== false && data.talks.length ? ['talks'] : []),
    ...(features.contact !== false && (profile.email || profile.links?.length) ? ['contact'] : [])
  ]);
  const pages = $derived(config?.theme?.layout === 'pages');
</script>

{#if !config}
  <main class="site-shell py-32 text-center"><h1 class="site-heading">OpenVitae is almost ready.</h1><p class="site-copy mt-4">The API is unavailable. Start the backend, then <a href="/admin">configure your site</a>.</p></main>
{:else}
<main>
  <div class="relative overflow-hidden border-b border-[var(--site-line)]">
    <div class="pointer-events-none absolute -right-24 top-0 size-96 rounded-full bg-[var(--site-accent)]/10 blur-3xl"></div>
    <div class="site-shell relative grid gap-12 py-20 md:grid-cols-[1fr_auto] md:items-center md:py-28">
      <div class="max-w-3xl">
        <p class="site-eyebrow mb-5 flex items-center gap-2"><Sparkles size={15}/> Hello, I'm</p>
        <h1 class="text-[clamp(3.6rem,9vw,7rem)] font-extrabold leading-[.95] tracking-[-.075em]">{profile.name || 'Your Name'}<span class="text-[var(--site-accent)]">.</span></h1>
        {#if profile.title}<p class="mt-6 max-w-2xl text-xl font-medium leading-relaxed text-[var(--site-muted)] md:text-2xl">{profile.title}</p>{/if}
        {#if profile.location}<p class="site-copy mt-4 flex items-center gap-2 text-sm"><MapPin size={15}/>{profile.location}</p>{/if}
        <div class="mt-9 flex flex-wrap gap-3">
          {#if profile.email}<a class="site-action" href={`mailto:${profile.email}`}>Get in touch <ArrowUpRight size={16}/></a>{/if}
          {#if data.publications.length}<Button href="/publications" variant="secondary" class="!rounded-full !px-6">Explore work <ArrowRight size={16}/></Button>{/if}
        </div>
        {#if profile.socials?.length}<div class="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-[var(--site-muted)]">{#each profile.socials as social}<a href={social.url} target="_blank" rel="noreferrer" class="capitalize hover:text-[var(--site-accent)]">{social.platform} ↗</a>{/each}</div>{/if}
      </div>
      {#if features.headshot !== false}
        <div class="mx-auto grid size-54 place-items-center rounded-[2rem] border border-[var(--site-line)] bg-[var(--site-surface)] p-2 shadow-2xl shadow-[var(--site-accent)]/15 md:size-72 md:rotate-3">
          {#if config.headshot_url}<img src={config.headshot_url} alt={profile.name || 'Portrait'} class="size-full rounded-[1.5rem] object-cover"/>
          {:else}<span class="text-7xl font-black text-[var(--site-accent)]">{(profile.name || 'V').slice(0, 1)}</span>{/if}
        </div>
      {/if}
    </div>
  </div>
  <div class="site-shell py-14 md:py-20">
    {#if pages}<div class="mb-10 flex flex-wrap gap-2">{#each sections as section}<button type="button" class:chosen={active === section} class="rounded-full border border-[var(--site-line)] px-5 py-2 text-sm font-bold capitalize" onclick={() => active = section}>{section}</button>{/each}</div>{/if}
    <div class="space-y-20 md:space-y-28">
      {#if sections.includes('about') && (!pages || active === 'about')}
        <section id="about"><SectionTitle label="01 / The story" title="A little about me"/><div class="grid gap-8 md:grid-cols-[1.3fr_.7fr]"><div class="prose prose-lg max-w-none leading-relaxed">{@html markdown(profile.bio || '')}</div>{#if data.skills.length}<div class="site-card h-fit rounded-2xl p-6"><p class="site-eyebrow mb-4">Tools & expertise</p><div class="flex flex-wrap gap-2">{#each data.skills as skill (skill.id)}<TagChip tag={skill}/>{/each}</div></div>{/if}</div></section>
      {/if}
      {#if sections.includes('publications') && (!pages || active === 'publications')}
        <section id="publications"><SectionTitle label="02 / Research" title="Selected publications" detail="Ideas, findings, and work shared with the world."/><div class="grid gap-4">{#each data.publications.slice(0, 5) as publication (publication.id)}<PublicationCard {publication}/>{:else}<p class="site-copy">No publications yet.</p>{/each}</div>{#if data.publications.length > 5}<a class="mt-6 inline-flex items-center gap-2 font-bold text-[var(--site-accent)]" href="/publications">View all publications <ArrowRight size={17}/></a>{/if}</section>
      {/if}
      {#if sections.includes('projects') && (!pages || active === 'projects')}
        <section id="projects"><SectionTitle label="03 / Selected work" title="Projects & experiments"/><div class="grid gap-5 md:grid-cols-2">{#each data.projects as project (project.id)}<ProjectCard {project}/>{/each}</div></section>
      {/if}
      {#if sections.includes('talks') && (!pages || active === 'talks')}
        <section id="talks"><SectionTitle label="04 / On stage" title="Talks & appearances"/><div class="grid gap-4 md:grid-cols-2">{#each data.talks as talk (talk.id)}<div class="site-card rounded-2xl p-6"><p class="site-eyebrow mb-3">{[talk.event, talk.event_date].filter(Boolean).join(' · ')}</p><h3 class="text-xl font-bold">{talk.title}</h3>{#if talk.description}<p class="site-copy mt-3 text-sm">{talk.description}</p>{/if}<div class="mt-5 flex gap-4 text-sm font-bold text-[var(--site-accent)]">{#if talk.url}<a href={talk.url} target="_blank" rel="noreferrer">Watch ↗</a>{/if}{#if talk.file_url}<a href={talk.file_url} target="_blank" rel="noreferrer">Slides ↗</a>{/if}</div></div>{/each}</div></section>
      {/if}
      {#if sections.includes('contact') && (!pages || active === 'contact')}
        <section id="contact" class="rounded-[2rem] bg-[var(--site-accent)] p-8 text-white md:p-14"><p class="mb-3 text-xs font-bold uppercase tracking-[.2em] opacity-70">05 / Let's connect</p><h2 class="max-w-xl text-4xl font-extrabold tracking-tight md:text-5xl">Have something in mind? Let's talk.</h2><div class="mt-8 flex flex-wrap gap-4">{#if profile.email}<a class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--site-accent)]" href={`mailto:${profile.email}`}><Mail size={16}/>{profile.email}</a>{/if}{#each profile.links || [] as link}<a class="inline-flex items-center gap-1 rounded-full border border-white/40 px-5 py-3 text-sm font-bold" href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>{/each}</div></section>
      {/if}
    </div>
  </div>
</main>
<footer class="site-shell flex flex-wrap justify-between gap-4 border-t border-[var(--site-line)] py-9 text-sm text-[var(--site-muted)]"><span>© {new Date().getFullYear()} {profile.name || 'OpenVitae'}</span><span>Built with OpenVitae</span></footer>
{/if}
<style>.chosen { background: var(--site-accent); color: white; border-color: var(--site-accent); }</style>
