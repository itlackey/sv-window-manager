<script lang="ts">
  import BwinHost from '$lib/components/BwinHost.svelte';
  import DemoSession from '../routes/ChatSession.svelte';
  
  let { config = {} } = $props();
  let hostRef: any = $state();
  
  $effect(() => {
    if (hostRef?.addPane) {
      setTimeout(() => {
        try {
          hostRef.addPane('demo-1', { title: 'Chat' }, DemoSession, { initialMessage: 'Hello from story' });
        } catch (e) {
          console.error('Failed to add demo pane:', e);
        }
      }, 200);
    }
  });
</script>

<BwinHost bind:this={hostRef} {config} />
