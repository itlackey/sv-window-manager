<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import BwinHostDemo from './BwinHostDemo.svelte';
  import ChatSession from '../routes/components/ChatSession.svelte';

  const { Story } = defineMeta({
    title: 'Bwin/BinaryWindow',
    component: BinaryWindow,
    parameters: {
      layout: 'fullscreen'
    },
    argTypes: {
      settings: {
        control: 'object',
        description: 'Window manager configuration'
      }
    }
  });

  const defaultArgs = {
    settings: {
      sashSize: 6,
      minPaneSize: 80
    }
  };

  const largeSettings = {
    settings: {
      sashSize: 10,
      minPaneSize: 100
    }
  };

  const smallSettings = {
    settings: {
      sashSize: 3,
      minPaneSize: 50
    }
  };
</script>

<!-- Empty BinaryWindow -->
<Story name="Empty Window" args={defaultArgs}>
  {#snippet template(args: any)}
    <BinaryWindow {...args} />
  {/snippet}
</Story>

<!-- Single Pane -->
<Story name="With Single Pane" args={defaultArgs}>
  {#snippet template(args: any)}
    <BwinHostDemo {...args} />
  {/snippet}
</Story>

<!-- Large Sash Size -->
<Story name="Large Sash Size" args={largeSettings}>
  {#snippet template(args: any)}
    <BwinHostDemo {...args} />
  {/snippet}
</Story>

<!-- Small Sash Size -->
<Story name="Small Sash Size" args={smallSettings}>
  {#snippet template(args: any)}
    <BwinHostDemo {...args} />
  {/snippet}
</Story>

<!-- Multiple Panes (Interactive Demo) -->
<Story name="Multiple Panes">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';

      let bwin: any = $state();

      $effect(() => {
        if (bwin?.addPane) {
          setTimeout(() => {
            try {
              // Add multiple panes to demonstrate layout
              bwin.addPane('root', {
                position: 'right',
                title: 'Pane 1',
                component: ChatSession,
                componentProps: { initialMessage: 'First pane' }
              });

              setTimeout(() => {
                bwin.addPane('pane-0', {
                  position: 'bottom',
                  title: 'Pane 2',
                  component: ChatSession,
                  componentProps: { initialMessage: 'Second pane (bottom split)' }
                });
              }, 300);

              setTimeout(() => {
                bwin.addPane('pane-1', {
                  position: 'right',
                  title: 'Pane 3',
                  component: ChatSession,
                  componentProps: { initialMessage: 'Third pane (right split)' }
                });
              }, 600);
            } catch (e) {
              console.error('Failed to add panes:', e);
            }
          }, 200);
        }
      });
    </script>

    <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
  {/snippet}
</Story>

<!-- Complex Layout -->
<Story name="Complex Layout">
  {#snippet template()}
    <script lang="ts">
      import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
      import ChatSession from '../routes/components/ChatSession.svelte';

      let bwin: any = $state();

      $effect(() => {
        if (bwin?.addPane) {
          setTimeout(() => {
            try {
              // Create a complex multi-pane layout
              bwin.addPane('root', {
                position: 'right',
                title: 'Left Panel',
                component: ChatSession,
                componentProps: { initialMessage: 'Left side' }
              });

              setTimeout(() => {
                bwin.addPane('pane-1', {
                  position: 'bottom',
                  title: 'Bottom Right',
                  component: ChatSession,
                  componentProps: { initialMessage: 'Bottom right pane' }
                });

                bwin.addPane('pane-0', {
                  position: 'bottom',
                  title: 'Bottom Left',
                  component: ChatSession,
                  componentProps: { initialMessage: 'Bottom left pane' }
                });
              }, 300);

              setTimeout(() => {
                bwin.addPane('pane-2', {
                  position: 'right',
                  title: 'Top Right',
                  component: ChatSession,
                  componentProps: { initialMessage: 'Top right pane' }
                });
              }, 600);
            } catch (e) {
              console.error('Failed to add panes:', e);
            }
          }, 200);
        }
      });
    </script>

    <BinaryWindow bind:this={bwin} settings={{ sashSize: 6, minPaneSize: 80 }} />
  {/snippet}
</Story>





