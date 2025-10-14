# SV Window Manager — Component Library

A Svelte 5 component library for building window management interfaces with tab bars, keyboard shortcuts, and customizable appearance.

## Components

### WindowManagerShell

The Window Manager Shell provides the initial layout scaffold (toolbar, main workspace, side panel), a single `ready` event after reveal, and config-driven shortcuts and context menu behavior.

### TabBar

The TabBar component provides a reusable tab bar with:

- **Drag-and-drop reordering** within segments (pinned/regular)
- **Keyboard navigation** (Arrow keys to navigate, Ctrl+Arrow to reorder)
- **Inline rename** (double-click to edit, Enter to save, Escape to cancel)
- **Pinned tabs** (separate segment, always visible)
- **Close buttons** (hover to reveal)
- **Tab bar controls** (AI toggle, workspace switcher, add-tab, config error indicator)
- **Overflow handling** (horizontal scroll with auto-focus on active tab)
- **Accessibility** (ARIA roles, keyboard support, reduced motion support)

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

<WindowManagerShell title="Demo Workspace" {config} onready={onReady} />
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

---

## TabBar Component

A reusable tab bar supporting drag-and-drop reordering, keyboard navigation, pinned tabs, and overflow management.

### Features (US1-US3 Complete ✅)

- **Drag-and-Drop Reordering**: Reorder tabs within segments (pinned/regular) via drag-and-drop
- **Keyboard Reordering**: Ctrl/Cmd+Arrow to reorder tabs
- **Tab Activation**: Click, Enter, or Space to activate tabs
- **Pinned Tabs**: Separate pinned segment that remains visible
- **Context Menu**: Right-click for pin/unpin, copy ID, and close actions
- **Inline Rename**: Double-click to rename with validation (1-60 chars)
- **Overflow Handling**: Horizontal scroll for many tabs
- **Host Precedence**: Tab order/state managed by host with deterministic updates
- **Accessibility**: Full ARIA roles, keyboard focus management, reduced motion support

### Usage

```svelte
<script lang="ts">
	import { TabBar, type Tab } from '$lib';

	let tabs: Tab[] = [
		{ id: '1', name: 'Welcome', pinned: true, order: 0 },
		{ id: '2', name: 'Docs', pinned: true, order: 1 },
		{ id: '3', name: 'Project', pinned: false, order: 0 },
		{ id: '4', name: 'Settings', pinned: false, order: 1 }
	];

	let activeId = '3';

	function handleReorder(event: CustomEvent<{ segment: 'pinned' | 'regular'; order: string[] }>) {
		console.log('Reorder:', event.detail);
		// Update host state with new order
	}

	function handlePin(event: CustomEvent<{ tabId: string; pinned: boolean }>) {
		console.log('Pin:', event.detail);
		// Update host state
	}

	function handleRename(event: CustomEvent<{ tabId: string; name: string }>) {
		console.log('Rename:', event.detail);
		// Update host state
	}
</script>

<TabBar {tabs} {activeId} on:reorder={handleReorder} on:pin={handlePin} on:rename={handleRename} />
```

### Props

- `tabs: Tab[]` — Array of tab objects with `id`, `name`, `pinned`, `order`
- `activeId: string` — ID of currently active tab
- `showConfigError?: boolean` — Show configuration error indicator
- `aiEnabled?: boolean` — AI toggle state

### Events

- `activate` — Tab clicked or activated via keyboard: `{ tabId: string }`
- `reorder` — Tab reordered within segment: `{ segment: 'pinned' | 'regular', order: string[] }`
- `pin` — Tab pinned/unpinned: `{ tabId: string, pinned: boolean }`
- `rename` — Tab renamed: `{ tabId: string, name: string }`
- `addTab` — Add tab button clicked
- `toggleAI` — AI toggle clicked: `{ enabled: boolean }`
- `switchWorkspace` — Workspace switcher clicked
- `openConfigDetails` — Config error indicator clicked
- `close` — Tab closed: `{ tabId: string }`

### Keyboard Shortcuts

- `Arrow Left/Right` — Navigate between tabs (move focus)
- `Click` / `Enter` / `Space` — Activate tab
- `Ctrl/Cmd + Arrow Left/Right` — Reorder current tab
- `Double-click` — Activate rename mode
- `F2` — Rename current tab
- `Delete` — Close current tab
- `Tab` — Focus next control
- `Shift + Tab` — Focus previous control

### Accessibility Features

- **ARIA Roles**: `navigation`, `tablist`, `tab` with proper labels
- **Focus Management**: Only active tab is tabbable (tabindex=0)
- **Screen Readers**: Pinned tabs announced as "(pinned)"
- **Keyboard Access**: Full keyboard navigation and reordering
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

### Implementation Status

| User Story                         | Status      | Tests         |
| ---------------------------------- | ----------- | ------------- |
| US1: Reorder Tabs with Persistence | ✅ Complete | 16/16 passing |
| US2: Inline Rename with Validation | ✅ Complete | 6/6 passing   |
| US3: Pinned Tabs and Controls      | ✅ Complete | 11/11 passing |

**Total Tests**: 45 passing (34 component tests + 11 US3 tests)

### Rename Feature (US2)

- **Double-click** any tab to activate rename mode
- **Enter** to commit, **Escape** to cancel
- **Validation**: Name must be 1-60 characters (trimmed)
- **Title Sync**: Emits `rename` event for host to sync window title within 100ms

### Pin/Unpin Feature (US3)

- **Pinned Segment**: Always visible, separate from regular tabs
- **Close Buttons**: Hover over tabs to reveal close button
- **Tab Controls**: AI toggle, workspace switcher, add-tab button
- **Config Error Indicator**: Shows when configuration errors are present
- **Focus Management**: Close tab moves focus to left/right neighbor

3. **US3: Controls** — AI toggle, workspace switcher, add-tab button
4. **Polish** — Performance profiling, a11y audit, documentation

## Notes

- Panel visibility and width are remembered within the session; host-provided `config.panel` takes precedence.
- Context menu adapts to selection/clipboard and is fully keyboard navigable.
