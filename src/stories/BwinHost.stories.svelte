<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import BwinHostDemo from './BwinHostDemo.svelte';

  const { Story } = defineMeta({
    title: 'Bwin/BinaryWindow',
    component: BinaryWindow,
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
  {#snippet template(args: any)}
    <BinaryWindow {...args} />
  {/snippet}
</Story>

<Story name="With Demo Pane" args={defaultArgs}>
  {#snippet template(args: any)}
    <BwinHostDemo {...args} />
  {/snippet}
</Story>





