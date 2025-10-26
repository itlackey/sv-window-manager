# Events Migration Guide

## Overview

As of version 1.x, we are migrating from callback props to Svelte event dispatchers for better composability and type safety. Callback props are now **deprecated** and will be removed in **v2.0**.

## Why Events?

- **Better composability**: Events can bubble and be handled at any level
- **Type safety**: TypeScript can infer event types automatically
- **Svelte best practices**: Events are the idiomatic way to communicate in Svelte
- **Easier testing**: Event listeners are easier to mock and test

## Migration Timeline

- **v1.x**: Both callback props and events are supported with deprecation warnings
- **v2.0**: Callback props will be removed entirely

## Changes

### Frame Component

The `Frame` component now supports both event handlers (new) and callback props (deprecated):

#### Before (Deprecated)

```svelte
<script>
	import { Frame } from 'sv-window-manager';

	function handlePaneRender(paneEl, sash) {
		console.log('Pane rendered:', sash.id);
	}

	function handleMuntinRender(muntinEl, sash) {
		console.log('Muntin rendered:', sash.id);
	}
</script>

<Frame {settings} onPaneRender={handlePaneRender} onMuntinRender={handleMuntinRender} />
```

#### After (Recommended)

```svelte
<script>
	import { Frame } from 'sv-window-manager';

	function handlePaneRender(event) {
		const { paneElement, sash } = event.detail;
		console.log('Pane rendered:', sash.id);
	}

	function handleMuntinRender(event) {
		const { muntinElement, sash } = event.detail;
		console.log('Muntin rendered:', sash.id);
	}
</script>

<Frame {settings} on:panerender={handlePaneRender} on:muntinrender={handleMuntinRender} />
```

### Pane Component

If you're using `Pane` directly (uncommon), the same pattern applies:

#### Before (Deprecated)

```svelte
<Pane {sash} onPaneRender={handleRender} />
```

#### After (Recommended)

```svelte
<Pane {sash} on:panerender={handleRender} />
```

### Muntin Component

#### Before (Deprecated)

```svelte
<Muntin {sash} onMuntinRender={handleRender} />
```

#### After (Recommended)

```svelte
<Muntin {sash} on:muntinrender={handleRender} />
```

## Event Details

### `panerender` Event

Dispatched when a pane is mounted and rendered.

**Type**: `PaneRenderEvent`

```typescript
interface PaneRenderEvent {
	paneElement: HTMLElement;
	sash: Sash;
}
```

**Usage**:

```svelte
<Frame
	{settings}
	on:panerender={(e) => {
		const { paneElement, sash } = e.detail;
		// Your logic here
	}}
/>
```

### `muntinrender` Event

Dispatched when a muntin (divider) is mounted and rendered.

**Type**: `MuntinRenderEvent`

```typescript
interface MuntinRenderEvent {
	muntinElement: HTMLElement;
	sash: Sash;
}
```

**Usage**:

```svelte
<Frame
	{settings}
	on:muntinrender={(e) => {
		const { muntinElement, sash } = e.detail;
		// Your logic here
	}}
/>
```

## Deprecation Warnings

When using callback props in v1.x, you'll see console warnings:

```
[Pane] onPaneRender callback prop is deprecated and will be removed in v2.0. Use on:panerender event instead.
```

```
[Muntin] onMuntinRender callback prop is deprecated and will be removed in v2.0. Use on:muntinrender event instead.
```

These warnings help identify code that needs migration before v2.0.

## TypeScript Support

All events are fully typed. Import the event types if needed:

```typescript
import type { PaneRenderEvent, MuntinRenderEvent } from 'sv-window-manager';

function handlePaneRender(event: CustomEvent<PaneRenderEvent>) {
	const { paneElement, sash } = event.detail;
	// TypeScript knows the exact shape of event.detail
}
```

## BinaryWindow Component

The `BinaryWindow` component internally handles these events. If you're using `BinaryWindow`, no migration is needed - it continues to work seamlessly.

## Migration Checklist

- [ ] Search codebase for `onPaneRender` and replace with `on:panerender`
- [ ] Search codebase for `onMuntinRender` and replace with `on:muntinrender`
- [ ] Update handler signatures to accept `event` parameter
- [ ] Extract data from `event.detail` instead of direct parameters
- [ ] Test that events fire correctly
- [ ] Remove or address any deprecation warnings in console

## Questions?

If you have questions or issues during migration, please open an issue on GitHub.
