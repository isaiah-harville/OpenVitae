<script lang="ts">
  import { Button, Card } from '@sivir-ui/svelte';
  import { ArrowUpRight, Plus, Trash2 } from 'lucide-svelte';
  import type { BlogPost, SiteConfig } from '$lib/api';
  import { api } from '$lib/client';
  import { markdown } from '$lib/markdown';

  let { config, posts, updated, reload, report }: {
    config: SiteConfig;
    posts: BlogPost[];
    updated: (config: SiteConfig) => void;
    reload: () => Promise<void>;
    report: (message: string, error?: boolean) => void;
  } = $props();
  let editing = $state<number | null>(null);
  let title = $state('');
  let excerpt = $state('');
  let content = $state('');
  let published = $state(false);
  let preview = $state(false);
  let busy = $state(false);

  function start(post?: BlogPost) {
    editing = post?.id ?? 0;
    title = post?.title ?? '';
    excerpt = post?.excerpt ?? '';
    content = post?.content ?? '';
    published = post?.published ?? false;
    preview = false;
  }
  async function save() {
    if (!title.trim()) return report('Post title is required.', true);
    busy = true;
    try {
      const body = { title: title.trim(), excerpt, content, published };
      if (editing) await api.updateBlogPost(editing, body);
      else await api.createBlogPost(body);
      await reload();
      editing = null;
      report('Post saved');
    } catch (error) { report(String(error), true); }
    finally { busy = false; }
  }
  async function remove(post: BlogPost) {
    if (!confirm(`Delete “${post.title}”?`)) return;
    try { await api.deleteBlogPost(post.id); await reload(); report('Post deleted'); }
    catch (error) { report(String(error), true); }
  }
  async function toggleBlog(input: HTMLInputElement) {
    const checked = input.checked;
    try {
      updated(await api.updateConfig({ features: { ...config.features, blog: checked } }));
      report(checked ? 'Blog is public' : 'Blog is hidden');
    } catch (error) { input.checked = config.features.blog === true; report(String(error), true); }
  }
</script>

<div class="space-y-5">
  <Card.Root class="site-card !rounded-2xl !p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="site-eyebrow mb-2">Built-in content</p>
        <h2 class="text-2xl font-bold tracking-tight">Blog</h2>
        <p class="site-copy mt-2 text-sm">Write in Markdown. Drafts stay private until published.</p>
      </div>
      <Button onclick={() => start()}><Plus size={16}/> New post</Button>
    </div>
    <label class="mt-6 flex items-center gap-3 border-t border-[var(--site-line)] pt-5 text-sm font-semibold">
      <input type="checkbox" class="size-5 accent-[var(--site-accent)]" checked={config.features.blog === true} onchange={(event) => toggleBlog(event.currentTarget)}/>
      Show blog on the public site
    </label>
  </Card.Root>

  <Card.Root class="site-card !rounded-2xl !p-6">
    <div class="divide-y divide-[var(--site-line)]">
      {#each posts as post (post.id)}
        <div class="flex flex-wrap items-center justify-between gap-3 py-4">
          <div class="min-w-0">
            <p class="font-bold">{post.title}</p>
            <p class="site-copy mt-1 text-xs">{post.published ? 'Published' : 'Draft'} · /blog/{post.slug}</p>
          </div>
          <div class="flex items-center gap-2">
            {#if post.published && config.features.blog}<a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" class="rounded-lg p-2" aria-label={`View ${post.title}`}><ArrowUpRight size={16}/></a>{/if}
            <Button variant="secondary" size="sm" onclick={() => start(post)}>Edit</Button>
            <button type="button" class="rounded-lg p-2 text-red-500 hover:bg-red-500/10" aria-label={`Delete ${post.title}`} onclick={() => remove(post)}><Trash2 size={16}/></button>
          </div>
        </div>
      {:else}<p class="site-copy py-6 text-sm">No posts yet. Start with a draft.</p>{/each}
    </div>
  </Card.Root>

  {#if editing !== null}
    <Card.Root class="site-card !rounded-2xl !p-6">
      <div class="mb-6 flex items-center justify-between gap-3"><h3 class="text-xl font-bold">{editing ? 'Edit post' : 'New post'}</h3><Button variant="quiet" size="sm" onclick={() => preview = !preview}>{preview ? 'Edit text' : 'Preview'}</Button></div>
      {#if preview}
        <div class="prose max-w-none rounded-xl border border-[var(--site-line)] p-6"><h1>{title}</h1><p>{excerpt}</p>{@html markdown(content)}</div>
      {:else}
        <div class="grid gap-5">
          <label><span class="site-label">Title</span><input class="site-field" maxlength="512" bind:value={title}/></label>
          <label><span class="site-label">Short summary</span><textarea class="site-field min-h-20" maxlength="1000" bind:value={excerpt}></textarea></label>
          <label><span class="site-label">Post (Markdown)</span><textarea class="site-field min-h-80 font-mono text-sm" maxlength="100000" bind:value={content}></textarea></label>
          <label class="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" class="size-5 accent-[var(--site-accent)]" bind:checked={published}/> Publish this post</label>
        </div>
      {/if}
      <div class="mt-7 flex gap-2"><Button onclick={save} loading={busy}>Save post</Button><Button variant="quiet" onclick={() => editing = null}>Cancel</Button></div>
    </Card.Root>
  {/if}
</div>
