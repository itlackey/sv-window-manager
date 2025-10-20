<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BwinHost from '$lib/components/BwinHost.svelte';
  import BwinHostDemo from './BwinHostDemo.svelte';

  const { Story } = defineMeta({
    title: 'Bwin/BwinHost',
    component: BwinHost,
    parameters: {
      layout: 'fullscreen'
    }
  });
  
  const defaultArgs = {
    config: {
      sashSize: 6,
      minPaneSize: 80
    }
  };
</script>

<Story name="Default" args={defaultArgs}>
  {#snippet template(args)}
    <BwinHost {...args} />
  {/snippet}
</Story>

<Story name="With Demo Pane" args={defaultArgs}>
  {#snippet template(args)}
    <BwinHostDemo {...args} />
  {/snippet}
</Story>





