<script lang="ts">
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import { Position } from '$lib/bwin/position.js';
  import '$lib/bwin/css/vars.css';
  import '$lib/bwin/css/frame.css';
  import '$lib/bwin/css/glass.css';
  import '$lib/bwin/css/sill.css';

  // Create a simple test configuration with 2 panes
  const testConfig = {
    width: 800,
    height: 600,
    children: [
      {
        position: Position.Left,
        size: 400,
        store: {
          title: 'Left Pane',
          content: '<p style="padding: 1rem;">This is the left pane content. The Frame component positions this pane on the left side.</p>',
          droppable: true,
          resizable: true
        }
      },
      {
        position: Position.Right,
        size: 400,
        store: {
          title: 'Right Pane',
          content: '<p style="padding: 1rem;">This is the right pane content. Frame handles the layout declaratively using Svelte 5 runes.</p>',
          droppable: true,
          resizable: true
        }
      }
    ]
  };

  // More complex configuration with nested panes
  const complexConfig = {
    width: 800,
    height: 600,
    children: [
      {
        position: Position.Top,
        size: 200,
        store: {
          title: 'Top Pane',
          content: '<div style="padding: 1rem;"><h3 style="margin: 0 0 0.5rem 0;">Top Pane</h3><p style="margin: 0;">This is a top pane with nested children below.</p></div>'
        }
      },
      {
        position: Position.Bottom,
        size: 400,
        children: [
          {
            position: Position.Left,
            size: 400,
            store: {
              title: 'Bottom Left',
              content: '<div style="padding: 1rem;"><h3 style="margin: 0 0 0.5rem 0;">Bottom Left</h3><p style="margin: 0;">Nested pane demonstrating complex layouts.</p></div>'
            }
          },
          {
            position: Position.Right,
            size: 400,
            store: {
              title: 'Bottom Right',
              content: '<div style="padding: 1rem;"><h3 style="margin: 0 0 0.5rem 0;">Bottom Right</h3><p style="margin: 0;">Try dragging the muntins (dividers) to resize!</p></div>'
            }
          }
        ]
      }
    ]
  };

  let selectedConfig = $state<'simple' | 'complex'>('simple');
  let debugMode = $state(false);

  const config = $derived(selectedConfig === 'simple' ? testConfig : complexConfig);
</script>

<svelte:head>
  <title>Frame Component Test - SV BWIN</title>
</svelte:head>

<div class="test-page">
  <header class="test-header">
    <h1>Frame Component Test</h1>
    <p>Testing the declarative Svelte 5 Frame component</p>
  </header>

  <div class="test-controls">
    <div class="control-group">
      <label>
        <input
          type="radio"
          name="config"
          value="simple"
          checked={selectedConfig === 'simple'}
          onchange={() => (selectedConfig = 'simple')}
        />
        Simple Layout (2 panes)
      </label>
      <label>
        <input
          type="radio"
          name="config"
          value="complex"
          checked={selectedConfig === 'complex'}
          onchange={() => (selectedConfig = 'complex')}
        />
        Complex Layout (3 panes, nested)
      </label>
    </div>

    <div class="control-group">
      <label>
        <input type="checkbox" bind:checked={debugMode} />
        Debug Mode
      </label>
    </div>
  </div>

  <div class="frame-container">
    {#key selectedConfig}
      <BinaryWindow settings={config} debug={debugMode} />
    {/key}
  </div>

  <div class="test-info">
    <h2>Component Features</h2>
    <ul>
      <li><strong>Declarative Rendering:</strong> Uses Svelte 5 runes ($state, $derived, $props)</li>
      <li><strong>Regular HTML Elements:</strong> Uses div elements instead of custom elements</li>
      <li><strong>Automatic Updates:</strong> Tree mutations trigger re-renders via key blocks</li>
      <li><strong>Resizable Muntins:</strong> Drag the dividers to resize panes</li>
      <li><strong>Window Chrome:</strong> Title bars with action buttons (close, minimize, maximize)</li>
      <li><strong>Debug Mode:</strong> Shows sash IDs and metrics when enabled</li>
    </ul>

    <h2>Architecture</h2>
    <ul>
      <li><strong>BinaryWindow.svelte:</strong> Top-level component, coordinates Frame and Glass</li>
      <li><strong>Frame.svelte:</strong> Layout engine, manages sash tree positioning</li>
      <li><strong>Pane.svelte:</strong> Pure presentational component for leaf nodes</li>
      <li><strong>Muntin.svelte:</strong> Divider component with individual derived styles</li>
      <li><strong>Glass.svelte:</strong> Window chrome (title bar, tabs, action buttons, content)</li>
    </ul>

    <h2>How It Works</h2>
    <ol>
      <li>BinaryWindow receives configuration and passes to Frame</li>
      <li>Frame builds a sash tree using ConfigRoot</li>
      <li>Panes and muntins are derived from tree using $derived.by()</li>
      <li>Each pane/muntin is rendered declaratively with each blocks</li>
      <li>BinaryWindow creates Glass components for each pane</li>
      <li>Updates trigger via key blocks when tree changes</li>
    </ol>
  </div>
</div>

<style>
  .test-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .test-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .test-header h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .test-header p {
    color: #666;
    font-size: 1.1rem;
  }

  .test-controls {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .control-group input[type='radio'],
  .control-group input[type='checkbox'] {
    cursor: pointer;
  }

  .frame-container {
    border: 2px solid #333;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 2rem;
    background: #e0e0e0;
  }

  .test-info {
    background: #f9f9f9;
    padding: 2rem;
    border-radius: 8px;
    border-left: 4px solid #0461ad;
  }

  .test-info h2 {
    margin-top: 0;
    color: #0461ad;
  }

  .test-info ul,
  .test-info ol {
    line-height: 1.8;
    color: #333;
  }

  .test-info li {
    margin: 0.5rem 0;
  }

  .test-info strong {
    color: #0461ad;
  }

  .test-info code {
    background: #e8e8e8;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', monospace;
  }
</style>
