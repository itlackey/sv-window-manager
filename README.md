# SV Window Manager

A native Svelte 5 component library that provides tiling window management for web applications. Built from the ground up with modern Svelte 5 patterns, it enables dynamic, resizable layouts with a simple, type-safe API. Inspired by the concepts from bwin.js but fully reimplemented in Svelte 5.

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

| Prop           | Type                       | Description                                |
| -------------- | -------------------------- | ------------------------------------------ |
| `settings`     | `SashConfig \| ConfigRoot` | Initial window configuration and root pane |
| `debug`        | `boolean`                  | Enable debug logging (default: false)      |
| `fitContainer` | `boolean`                  | Auto-resize to fit parent (default: true)  |

**Methods:**

| Method       | Signature                                                       | Description                            |
| ------------ | --------------------------------------------------------------- | -------------------------------------- |
| `addPane`    | `addPane(targetSashId: string, props: PaneProps): Sash \| null` | Add a new pane with a Svelte component |
| `removePane` | `removePane(sashId: string): void`                              | Remove a pane by its sash ID           |

**PaneProps Interface:**

```typescript
interface PaneProps {
	position: 'top' | 'right' | 'bottom' | 'left';
	component: Component; // Required: Svelte component to render
	componentProps?: Record<string, unknown>; // Optional: Props for the component
	title?: string; // Optional: Pane title
	size?: string; // Optional: Size (e.g., '50%', '300px')
	id?: string; // Optional: Custom sash ID
}
```

## Pane Lifecycle Events

SV Window Manager emits typed lifecycle events as panes are added, removed, focused, resized, reordered, and more. You can subscribe with either a generic handler or convenience helpers.

Supported events:

- onpaneadded, onpaneremoved
- onpaneminimized, onpanemaximized, onpanerestored
- onpaneresized (debounced ~100ms, trailing)
- onpanefocused, onpaneblurred
- onpaneorderchanged (when panes swap/move; includes groupId and previousIndex)
- onpanetitlechanged (includes previousTitle)

### Quick example

```svelte
<script lang="ts">
	import { BinaryWindow, onPaneEvent, onpaneresized, offPaneEvent } from 'sv-window-manager';

	let bwin = $state<BinaryWindow | undefined>();
	let unsubs: Array<() => void> = [];

	function startLogging() {
		// Subscribe to a specific event type using the generic API
		const handler = (evt) => {
			console.log('[pane-event]', evt.type, evt.pane, evt.context);
		};
		onPaneEvent('onpaneadded', handler);
		unsubs.push(() => offPaneEvent('onpaneadded', handler));

		// Or use convenience helpers for common events
		const onResize = (evt) => {
			console.log('[resized]', evt.pane.id, evt.pane.size, evt.pane.position);
		};
		onpaneresized(onResize);
		unsubs.push(() => offPaneEvent('onpaneresized', onResize));
	}

	function stopLogging() { unsubs.forEach((u) => u()); unsubs = []; }
</script>

<BinaryWindow bind:this={bwin} settings={{ fitContainer: true }} />
<button onclick={startLogging}>Start Event Log</button>
<button onclick={stopLogging}>Stop</button>
```

Event callback signature:

```ts
type PaneEvent = {
	type:
		| 'onpaneadded' | 'onpaneremoved'
		| 'onpaneminimized' | 'onpanemaximized' | 'onpanerestored'
		| 'onpaneresized' | 'onpanefocused' | 'onpaneblurred'
		| 'onpaneorderchanged' | 'onpanetitlechanged';
		pane: PanePayload; // id, title, size, position, state, group, index, bounds, etc.
	context?: { previousTitle?: string; previousIndex?: number; groupId?: string };
}
```

For detailed examples, open the demo app’s “Events” tab at `src/routes/+page.svelte`.

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

See the [demo app](./src/routes/+page.svelte) for a complete list of customizable CSS variables.

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

- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)
- [Example Implementation](./src/routes/+page.svelte)
- [bwin.js Documentation](https://bhjsdev.github.io/bwin-docs/) (conceptual reference only)

## License

CC-BY
