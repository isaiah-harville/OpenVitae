<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button, Card, Input } from '@sivir-ui/svelte';
  import { api } from '$lib/client';
  let email = $state('');
  let password = $state('');
  let message = $state('');
  let loading = $state(false);
  onMount(() => { api.getAuthMode().then(({ mode }) => { if (mode === 'proxy') goto('/admin'); }).catch(() => {}); });
  async function login(event: SubmitEvent) {
    event.preventDefault();
    loading = true; message = '';
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: email, password }) });
      if (!response.ok) throw new Error('Invalid email or password');
      const result = await response.json();
      localStorage.setItem('ov_token', result.access_token);
      await goto('/admin');
    } catch (error) { message = error instanceof Error ? error.message : 'Sign in failed'; }
    finally { loading = false; }
  }
</script>
<svelte:head><title>Sign in · OpenVitae</title></svelte:head>
<main class="site-shell grid min-h-[80vh] place-items-center py-16">
  <Card.Root class="site-card w-full max-w-md !rounded-3xl !p-8">
    <p class="site-eyebrow mb-3">Your workspace</p><h1 class="site-heading mb-2">Welcome back.</h1><p class="site-copy mb-8 text-sm">Sign in to shape your corner of the web.</p>
    <form class="space-y-5" onsubmit={login}>
      <label class="block"><span class="site-label">Email</span><Input type="email" bind:value={email} required autocomplete="username"/></label>
      <label class="block"><span class="site-label">Password</span><Input type="password" bind:value={password} required autocomplete="current-password"/></label>
      {#if message}<p class="text-sm text-red-500" role="alert">{message}</p>{/if}
      <Button type="submit" loading={loading} class="w-full">Sign in</Button>
    </form>
  </Card.Root>
</main>
