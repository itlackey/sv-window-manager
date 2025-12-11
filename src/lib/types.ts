// Type definitions for SV Window Manager library

/**
 * Configuration options for BinaryWindow
 */
export interface BwinConfig {
	/** Whether the window manager should fit its container */
	fitContainer?: boolean;
	/** Additional BinaryWindow configuration options */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Flexible config extension
	[key: string]: any;
}

/**
 * Configuration for adding a pane to the window manager
 */
export interface PaneConfig {
	/** Position where the pane should be added relative to the target node */
	position?: 'top' | 'right' | 'bottom' | 'left';
	/** The content element to display in the pane */
	content?: HTMLElement;
	/** Additional pane configuration options */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Flexible config extension
	[key: string]: any;
}

/**
 * Props for the BwinHost component
 */
export interface BwinHostProps {
	/** Configuration for the BinaryWindow instance */
	config?: BwinConfig;
	/** Callback when the BinaryWindow instance is created */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Event handler with flexible parameters
	oncreated?: (event: any, node: any) => void;
	/** Callback when the window layout is updated */
	onupdated?: () => void;
}

/**
 * Component props that can be passed to session components
 */
export interface SessionComponentProps {
	/** Unique identifier for the session */
	sessionId: string;
	/** Additional data for the session component */
	data?: Record<string, unknown>;
	/** Additional props */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Flexible props extension
	[key: string]: any;
}
