// Shared types for the SV Window Manager library

export type OverridePolicy = 'defer-to-os' | 'override-allowlist' | 'override-all';

export interface KeyboardConfig {
	overridePolicy?: OverridePolicy;
	allowlist?: string[];
	// Named bindings are conventional, but consumers may add more keys
	bindings?: Partial<{
		nextTab: string;
		prevTab: string;
		togglePanel: string;
	}> &
		Record<string, string>;
}

export interface AppearanceConfig {
	zoom: number; // 0.5 – 3.0
	opacity: number; // 0.5 – 1.0
	transparent: boolean;
	backgroundColor?: string;
	backgroundImage?: string | null;
	blur?: number; // 0 – 40
}

export interface PanelState {
	visible: boolean;
	widthPx: number; // 200 – 800
}

export interface ShellConfig {
	keyboard?: KeyboardConfig;
	appearance?: Partial<AppearanceConfig>;
	panel?: Partial<PanelState>;
}

// Event detail for the single `ready` event emitted by the shell
export interface ReadyDetail {
	title: string;
}

// Flash error overlay item
export interface FlashItem {
	id: string;
	message: string;
	expiresInMs?: number;
}

// Tab Bar types
export interface Tab {
	id: string;
	name: string;
	pinned: boolean;
	order: number;
}
