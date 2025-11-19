<script lang="ts" context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Glass from '$lib/bwin/binary-window/Glass.svelte';
  import ChatSession from '../routes/components/ChatSession.svelte';

  const { Story } = defineMeta({
    title: 'Components/Glass',
    component: Glass,
    parameters: {
      layout: 'padded'
    },
    argTypes: {
      title: {
        control: 'text',
        description: 'The title displayed in the glass header'
      },
      minimized: {
        control: 'boolean',
        description: 'Whether the glass is minimized'
      },
      maximized: {
        control: 'boolean',
        description: 'Whether the glass is maximized'
      },
      canClose: {
        control: 'boolean',
        description: 'Whether the close button is enabled'
      },
      canMinimize: {
        control: 'boolean',
        description: 'Whether the minimize button is enabled'
      },
      canMaximize: {
        control: 'boolean',
        description: 'Whether the maximize button is enabled'
      },
      debug: {
        control: 'boolean',
        description: 'Enable debug mode with logging'
      }
    }
  });
</script>

<!-- Basic Glass with Text Content -->
<Story name="Basic" args={{
  title: 'Basic Pane',
  component: ChatSession,
  componentProps: { initialMessage: 'Hello from Glass!' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Glass with All Actions Enabled -->
<Story name="All Actions Enabled" args={{
  title: 'Interactive Pane',
  canClose: true,
  canMinimize: true,
  canMaximize: true,
  component: ChatSession,
  componentProps: { initialMessage: 'Try the action buttons!' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Glass with Only Close -->
<Story name="Close Only" args={{
  title: 'Close Only',
  canClose: true,
  canMinimize: false,
  canMaximize: false,
  component: ChatSession,
  componentProps: { initialMessage: 'Only close button is available' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Glass with No Actions -->
<Story name="No Actions" args={{
  title: 'Read-Only Pane',
  canClose: false,
  canMinimize: false,
  canMaximize: false,
  component: ChatSession,
  componentProps: { initialMessage: 'No action buttons available' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Minimized State -->
<Story name="Minimized" args={{
  title: 'Minimized Pane',
  minimized: true,
  canMinimize: true,
  component: ChatSession,
  componentProps: { initialMessage: 'This pane is minimized' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Maximized State -->
<Story name="Maximized" args={{
  title: 'Maximized Pane',
  maximized: true,
  canMaximize: true,
  component: ChatSession,
  componentProps: { initialMessage: 'This pane is maximized' }
}}>
  {#snippet template(args: any)}
    <div style="width: 800px; height: 600px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Long Title -->
<Story name="Long Title" args={{
  title: 'This is a very long title that should be truncated with ellipsis when it exceeds the available width',
  canClose: true,
  canMinimize: true,
  canMaximize: true,
  component: ChatSession,
  componentProps: { initialMessage: 'Testing long title behavior' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Debug Mode -->
<Story name="Debug Mode" args={{
  title: 'Debug Pane',
  debug: true,
  canClose: true,
  canMinimize: true,
  canMaximize: true,
  component: ChatSession,
  componentProps: { initialMessage: 'Check console for debug logs' }
}}>
  {#snippet template(args: any)}
    <div style="width: 400px; height: 300px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<!-- Multiple Sizes -->
<Story name="Small Size" args={{
  title: 'Small Pane',
  canClose: true,
  component: ChatSession,
  componentProps: { initialMessage: 'Small pane' }
}}>
  {#snippet template(args: any)}
    <div style="width: 200px; height: 150px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Large Size" args={{
  title: 'Large Pane',
  canClose: true,
  canMinimize: true,
  canMaximize: true,
  component: ChatSession,
  componentProps: { initialMessage: 'Large pane with more content space' }
}}>
  {#snippet template(args: any)}
    <div style="width: 800px; height: 600px; border: 1px solid #ccc;">
      <Glass {...args} />
    </div>
  {/snippet}
</Story>
