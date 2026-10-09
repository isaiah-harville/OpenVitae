<script lang="ts">
  import { ArrowRight, ArrowUpRight, Mail, MapPin } from 'lucide-svelte';
  import { Button } from '@sivir-ui/svelte/components/button';
  import type { Project, Publication, SiteConfig, Skill, Talk } from '$lib/api';
  import type { PageBlock, SitePage } from '$lib/pages';
  import { markdown } from '$lib/markdown';
  import ProjectCard from './ProjectCard.svelte';
  import PublicationCard from './PublicationCard.svelte';
  import ProfileLinks from './ProfileLinks.svelte';
  import SectionTitle from './SectionTitle.svelte';
  import TagChip from './TagChip.svelte';

  let { page, config, content }: {
    page: SitePage;
    config: SiteConfig;
    content: { projects: Project[]; publications: Publication[]; talks: Talk[]; skills: Skill[] };
  } = $props();
  const profile = $derived(config.profile);
  function image(block: PageBlock) {
    return block.imageUrl || (block.imageKey ? `/api/uploads/page-image/${encodeURIComponent(block.imageKey.slice('page-images/'.length))}` : '');
  }
</script>

<main class="site-shell py-12 md:py-20">
  <div class="grid gap-5 md:grid-cols-2 md:gap-7">
    {#each page.blocks as block (block.id)}
      <section id={block.id} class={block.width === 2 ? 'min-w-0 md:col-span-2' : 'min-w-0'}>
        {#if block.type === 'hero'}
          <div class="site-card grid gap-9 rounded-[2rem] p-8 md:grid-cols-[1fr_auto] md:items-center md:p-14">
            <div><p class="site-eyebrow mb-5">{block.eyebrow}</p><h1 class="text-[clamp(3.2rem,7vw,6rem)] font-extrabold leading-[.97] tracking-[-.07em]">{block.heading || profile.name || 'Your Name'}<span class="text-[var(--site-accent)]">.</span></h1>
              {#if block.text || profile.title}<p class="site-copy mt-6 max-w-2xl text-xl">{block.text || profile.title}</p>{/if}
              {#if profile.location}<p class="site-copy mt-4 flex items-center gap-2 text-sm"><MapPin size={15}/>{profile.location}</p>{/if}
              {#if profile.email}<a class="site-action mt-8" href={`mailto:${profile.email}`}>Get in touch <ArrowUpRight size={16}/></a>{/if}
            </div>
            {#if config.features.headshot !== false}<div class="mx-auto grid size-44 place-items-center overflow-hidden rounded-full border border-[var(--site-line)] bg-[var(--site-paper)] md:size-56">{#if config.headshot_url}<img src={config.headshot_url} alt={profile.name || 'Portrait'} class="size-full object-cover"/>{:else}<span class="text-7xl font-black">{(profile.name || 'V').slice(0, 1)}</span>{/if}</div>{/if}
          </div>
        {:else if block.type === 'contact'}
          <div class="rounded-[2rem] bg-[var(--site-accent)] p-8 text-[var(--site-on-accent)] md:p-12"><p class="mb-4 text-xs font-bold uppercase tracking-[.2em] opacity-70">{block.eyebrow}</p><h2 class="max-w-2xl text-4xl font-extrabold tracking-tight">{block.heading}</h2>{#if block.text}<p class="mt-4 max-w-xl">{block.text}</p>{/if}<div class="mt-8 flex flex-wrap gap-3">{#if profile.email}<a class="rounded-full bg-[var(--site-paper)] px-5 py-3 text-sm font-bold text-[var(--site-ink)]" href={`mailto:${profile.email}`}><Mail size={15} class="mr-2 inline"/>{profile.email}</a>{/if}</div></div>
        {:else}
          <div class="site-card h-full rounded-[1.7rem] p-7 md:p-9">
            {#if block.type !== 'image'}<SectionTitle label={block.eyebrow} title={block.heading} detail={block.type === 'publications' ? block.text : undefined}/>{/if}
            {#if block.type === 'about'}<div class="prose max-w-none">{@html markdown(block.text || profile.bio || '')}</div>
            {:else if block.type === 'text' || block.type === 'custom' || block.type === 'imageText'}
              <div class={(block.type === 'imageText' || block.type === 'custom') && block.width === 2 && block.imageKey ? 'grid gap-6 md:grid-cols-2 md:items-center' : 'grid gap-6 md:items-center'}><div class={block.imagePosition === 'left' ? 'prose max-w-none md:order-2' : 'prose max-w-none'}>{@html markdown(block.text)}</div>{#if block.imageKey}<img class={block.imagePosition === 'left' ? 'w-full rounded-2xl object-cover md:order-1' : 'w-full rounded-2xl object-cover'} src={image(block)} alt={block.imageAlt || ''}/>{/if}</div>
              {#if block.buttonLabel && block.buttonUrl}<Button href={block.buttonUrl} variant="secondary" class="mt-6">{block.buttonLabel} <ArrowUpRight size={15}/></Button>{/if}
            {:else if block.type === 'image'}
              {#if block.imageKey}<img class="w-full rounded-2xl object-cover" src={image(block)} alt={block.imageAlt || ''}/>{/if}{#if block.heading}<p class="mt-4 font-bold">{block.heading}</p>{/if}{#if block.text}<p class="site-copy mt-2">{block.text}</p>{/if}
            {:else if block.type === 'skills'}<div class="flex flex-wrap gap-2">{#each content.skills as skill (skill.id)}<TagChip tag={skill}/>{:else}<p class="site-copy">No skills yet.</p>{/each}</div>
            {:else if block.type === 'publications'}<div class="grid gap-4">{#each content.publications.slice(0, 5) as publication (publication.id)}<PublicationCard {publication}/>{:else}<p class="site-copy">No publications yet.</p>{/each}</div>{#if content.publications.length > 5}<a class="mt-6 inline-flex items-center gap-2 font-bold text-[var(--site-accent)]" href="/publications">View all publications <ArrowRight size={17}/></a>{/if}
            {:else if block.type === 'projects'}<div class={block.width === 2 ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'}>{#each content.projects as project (project.id)}<ProjectCard {project}/>{:else}<p class="site-copy">No projects yet.</p>{/each}</div>
            {:else if block.type === 'talks'}<div class={block.width === 2 ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'}>{#each content.talks as talk (talk.id)}<article class="rounded-xl border border-[var(--site-line)] p-5"><p class="site-eyebrow mb-2">{[talk.event, talk.event_date].filter(Boolean).join(' · ')}</p><h3 class="text-xl font-bold">{talk.title}</h3>{#if talk.description}<p class="site-copy mt-3 text-sm">{talk.description}</p>{/if}{#if talk.url}<a href={talk.url} target="_blank" rel="noreferrer" class="mt-4 inline-block font-bold text-[var(--site-accent)]">Watch ↗</a>{/if}</article>{:else}<p class="site-copy">No talks yet.</p>{/each}</div>{/if}
          </div>
        {/if}
      </section>
    {/each}
  </div>
  {#if page.slug === 'home' && profile.links?.length}
    <div class="mt-8"><ProfileLinks links={profile.links}/></div>
  {/if}
</main>
