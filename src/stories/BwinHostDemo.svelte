<script lang="ts">
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import DemoSession from '../routes/components/ChatSession.svelte';

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

<BinaryWindow bind:this={hostRef} settings={config} />
