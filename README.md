# SV Window Manager

A modern Svelte 5 component library that provides tiling window management for web applications. Built on top of [bwin.js](https://bhjsdev.github.io/bwin-docs/), it enables dynamic, resizable layouts with a simple, type-safe API.

## Features

- **Svelte 5 Native**: Built with modern Svelte 5 runes and patterns
- **Type-Safe**: TypeScript definitions included
- **Dynamic Layouts**: Create tiling window layouts programmatically
- **Resizable Panes**: Drag dividers to resize panes
- **Flexible Positioning**: Add panes in any direction (top, right, bottom, left)
- **Component-Only Architecture**: Type-safe, component-based pane content (no HTML strings)

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
	import { BinaryWindow } from 'sv-window-manager';
	import MyComponent from './MyComponent.svelte';

	const settings = {
		id: 'root',
		title: 'My Window',
		component: MyComponent,
		componentProps: { message: 'Hello!' }
	};

	let bwin = $state<BinaryWindow>();

	function addPane() {
		if (!bwin) return;

		bwin.addPane('root', {
			position: 'right',
			title: 'New Pane',
			component: MyComponent,
			componentProps: { message: 'Split pane!' }
		});
	}
</script>

<BinaryWindow bind:this={bwin} {settings} />
<button onclick={addPane}>Add Pane</button>
```

## API Reference

### BinaryWindow Component

**Props:**

| Prop          | Type                            | Description                                |
| ------------- | ------------------------------- | ------------------------------------------ |
| `settings`    | `SashConfig \| ConfigRoot`      | Initial window configuration and root pane |
| `debug`       | `boolean`                       | Enable debug logging (default: false)      |
| `fitContainer`| `boolean`                       | Auto-resize to fit parent (default: true)  |

**Methods:**

| Method    | Signature                                                                    | Description                            |
| --------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| `addPane` | `addPane(targetSashId: string, props: PaneProps): Sash \| null`              | Add a new pane with a Svelte component |
| `removePane` | `removePane(sashId: string): void`                                        | Remove a pane by its sash ID           |

**PaneProps Interface:**

```typescript
interface PaneProps {
	position: 'top' | 'right' | 'bottom' | 'left';
	component: Component;          // Required: Svelte component to render
	componentProps?: Record<string, unknown>;  // Optional: Props for the component
	title?: string;                // Optional: Pane title
	size?: string;                 // Optional: Size (e.g., '50%', '300px')
	id?: string;                   // Optional: Custom sash ID
}
```

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
