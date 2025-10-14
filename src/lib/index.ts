// Public exports for the SV Window Manager library

export type {
	ShellConfig,
	KeyboardConfig,
	AppearanceConfig,
	PanelState,
	ReadyDetail,
	Tab
} from './types.js';

export { default as WindowManagerShell } from './WindowManagerShell.svelte';
export { default as ExamplePanel } from './ExamplePanel.svelte';
export { default as FlashErrorOverlay } from './components/FlashErrorOverlay.svelte';
export { default as TabBar } from './components/TabBar.svelte';
export type { FlashItem } from './types.js';
