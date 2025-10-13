// Public exports for the SV Window Manager library

export type {
	ShellConfig,
	KeyboardConfig,
	AppearanceConfig,
	PanelState,
	ReadyDetail
} from './types.js';

export { default as WindowManagerShell } from './WindowManagerShell.svelte';
export { default as ExamplePanel } from './ExamplePanel.svelte';
