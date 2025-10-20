# SV Window Manager

A modern Svelte 5 component library that provides tiling window management for web applications. Built on top of [bwin.js](https://bhjsdev.github.io/bwin-docs/), it enables dynamic, resizable layouts with a simple, type-safe API.

## Features

- **Svelte 5 Native**: Built with modern Svelte 5 runes and patterns
- **Type-Safe**: TypeScript definitions included
- **Dynamic Layouts**: Create tiling window layouts programmatically
- **Resizable Panes**: Drag dividers to resize panes
- **Flexible Positioning**: Add panes in any direction (top, right, bottom, left)
- **Component Integration**: Mount any Svelte component as pane content

## Installation

```sh
npm install sv-window-manager
```

**Requirements:**
- Svelte 5 or later
- SvelteKit (recommended) or Vite

## Quick Start

```svelte
<script lang="ts">
  import BwinHost from 'sv-window-manager';
  import type { BwinConfig, PaneConfig } from 'sv-window-manager';
  import YourComponent from './YourComponent.svelte';

  let bwinHost = $state<BwinHost | undefined>();

  const config: BwinConfig = {
    fitContainer: true
  };

  function addPane() {
    if (!bwinHost) return;

    const paneConfig: PaneConfig = {
      position: 'right'
    };

    bwinHost.addPane(
      'pane-1',
      paneConfig,
      YourComponent,
      { sessionId: 'session-1', data: { title: 'My Pane' } }
    );
  }
</script>

<BwinHost bind:this={bwinHost} {config} />
<button onclick={addPane}>Add Pane</button>
```
## API Reference

### BwinHost Component

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `config` | `BwinConfig` | Configuration for the window manager |

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `addPane` | `addPane(sessionId: string, paneConfig: PaneConfig, Component: Component<any>, componentProps?: Record<string, any>): void` | Add a new pane with a Svelte component |
| `getInfo` | `getInfo(): any` | Get current window manager state |

## Customization

Customize the appearance using CSS custom properties:

```css
:root {
  /* Colors */
  --bw-glass-bg-color: #ffffff;
  --bw-glass-border-color: #667eea;
  --bw-glass-header-bg-color: #667eea;
  --bw-muntin-bg-color: #4c5fd5;
  --bw-pane-bg-color: #333333;

  /* Sizing */
  --bw-container-height: 100vh;
  --bw-glass-header-height: 30px;
  --bw-glass-border-radius: 5px;
}
```

[View all CSS variables →](https://bhjsdev.github.io/bwin-docs/)

## Development

```sh
# Start development server with demo app
npm run dev

# Run type checking
npm run check

# Build library
npm pack

# Run tests
npm test
```

## Resources

- [bwin.js Documentation](https://bhjsdev.github.io/bwin-docs/)
- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)
- [Example Implementation](./src/routes/+page.svelte)

## License

CC-BY
