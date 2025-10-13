# Quickstart — Window Manager Shell

Import and render the shell with minimal config. The shell provides regions (tab bar, main workspace, side panel), emits a `ready` event after reveal, and supports config-driven keyboard shortcuts and appearance updates.

## Install

- Peer dependency: Svelte 5+

## Usage

```svelte
<script lang="ts">
  import { WindowManagerShell, type ShellConfig } from '$lib';

  const config: ShellConfig = {
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

<WindowManagerShell {config} on:ready={onReady} />
```

## Accessibility

- Landmarks: toolbar (tab bar), main (workspace), complementary (side panel)
- Visible focus, keyboard reachability for primary controls
- Respects `prefers-reduced-motion`

## Testing

- Component tests: render, ready event emission, keyboard toggles, context menu variants, a11y roles
- E2E: demo app verifies reveal sequencing and panel resize/toggle
