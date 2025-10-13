<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { WindowManagerShell, type ShellConfig } from '../lib/index.js';

  const { Story, Variant } = defineMeta({
    title: 'Window Manager/Shell',
    component: WindowManagerShell,
    tags: ['a11y'],
    argTypes: {
      title: { control: 'text' },
      config: { control: 'object' }
    },
    args: {
      title: 'Demo Workspace',
      config: {
        appearance: { zoom: 1.0, opacity: 1.0, transparent: false, blur: 0 },
        panel: { visible: true, widthPx: 360 },
        keyboard: {
          overridePolicy: 'override-allowlist',
          allowlist: ['Ctrl+`'],
          bindings: { togglePanel: 'Ctrl+`' }
        }
      }
    }
  });
</script>

<Story name="Default" />

<Variant name="Ready event and appearance">
  <svelte:fragment slot="story">
    <div style="height: 360px; border: 1px dashed #888; padding: 8px">
      <WindowManagerShell
        title="Workspace A"
        on:ready={(e) => console.log('ready event detail:', e.detail)}
        config={{ appearance: { zoom: 1.0, opacity: 0.95, transparent: false, blur: 2 }, panel: { visible: false, widthPx: 340 } }}
      />
    </div>
  </svelte:fragment>
</Variant>

<Variant name="Keyboard toggle + Context menu">
  <svelte:fragment slot="story">
    <div style="height: 360px; border: 1px dashed #888; padding: 8px">
      <p>Press Ctrl+` to toggle the side panel. Right click to open the context menu.</p>
      <WindowManagerShell
        title="Keyboard & Menu Demo"
        config={{
          panel: { visible: true, widthPx: 360 },
          keyboard: { overridePolicy: 'override-allowlist', allowlist: ['Ctrl+`'], bindings: { togglePanel: 'Ctrl+`' } }
        }}
      >
        <div slot="workspace">
          <p>Try selecting URL-like text (e.g., https://example.com) then open the context menu.</p>
        </div>
      </WindowManagerShell>
    </div>
  </svelte:fragment>
</Variant>

<Variant name="Layout and Resize">
  <svelte:fragment slot="story">
    <div style="height: 360px; border: 1px dashed #888; padding: 8px">
      <WindowManagerShell
        title="Layout Demo"
        config={{ panel: { visible: true, widthPx: 420 } }}
      />
      <p style="font-size: 12px; color: #666">Drag the vertical handle at the left edge of the side panel to resize. Min 200px, max 800px.</p>
    </div>
  </svelte:fragment>
</Variant>

<Variant name="Quickstart (Docs Snippet)">
  <svelte:fragment slot="story">
    <div style="height: 360px; border: 1px dashed #888; padding: 8px">
      <script>
        let config: ShellConfig = {
          keyboard: {
            overridePolicy: 'override-allowlist',
            allowlist: ['Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+`'],
            bindings: { nextTab: 'Ctrl+Tab', prevTab: 'Ctrl+Shift+Tab', togglePanel: 'Ctrl+`' }
          },
          appearance: { zoom: 1.0, opacity: 1.0, transparent: false },
          panel: { visible: false, widthPx: 360 }
        };
        function onReady(e: CustomEvent<{ title: string }>) {
          console.log('ready:', e.detail.title);
        }
      </script>
      <WindowManagerShell title="Quickstart Workspace" {config} on:ready={onReady} />
    </div>
  </svelte:fragment>
  <svelte:fragment slot="args" let:args />
  <svelte:fragment />
</Variant>

<Variant name="Flash Error Overlay">
  <svelte:fragment slot="story">
    <div style="height: 360px; border: 1px dashed #888; padding: 8px; position: relative">
      <WindowManagerShell title="Overlay Demo" />
      <div style="position:absolute; bottom: 8px; left: 8px; display:flex; gap:8px">
        <button onclick={() => window.dispatchEvent(new CustomEvent('svwm:flash', { detail: { message: 'Something went wrong' } }))}>Trigger Error</button>
      </div>
    </div>
  </svelte:fragment>
</Variant>
