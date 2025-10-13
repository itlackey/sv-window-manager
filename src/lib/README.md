# SV Window Manager — Shell Component

The Window Manager Shell provides the initial layout scaffold (toolbar, main workspace, side panel), a single `ready` event after reveal, and config-driven shortcuts and context menu behavior.

## Install

Peer dependency: Svelte 5+

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

<WindowManagerShell title="Demo Workspace" {config} on:ready={onReady} />
```

## Props

- `title?: string` — Workspace title used in the `ready` event payload
- `config?: ShellConfig`
  - `appearance?: { zoom, opacity, transparent, backgroundColor?, backgroundImage?, blur? }`
  - `keyboard?: { overridePolicy?, allowlist?, bindings? }`
  - `panel?: { visible?, widthPx? }`

## Events

- `ready`: once per mount (≤100 ms after reveal)
  - `detail: { title: string }`

## Accessibility

- Landmarks: `role="toolbar"` (header), `main` (workspace), `complementary` (side panel)
- Keyboard: configurable bindings (default `Ctrl+`` toggles panel)
- Reduced motion friendly, visible focus states

## Notes

- Panel visibility and width are remembered within the session; host-provided `config.panel` takes precedence.
- Context menu adapts to selection/clipboard and is fully keyboard navigable.
