import type { Component } from 'svelte';

/**
 * Represents a mounted Glass component instance
 */
export interface GlassInstance {
	/** DOM container element holding the Glass component */
	container: HTMLElement;
	/** Svelte component instance (from mount()) */
	instance: Record<string, unknown>;
	/** Associated sash ID */
	sashId: string;
	/** Glass properties (title, content, tabs, actions, etc.) */
	props: Record<string, unknown>;
}

/**
 * Represents a mounted user component instance
 */
export interface UserComponentInstance {
	/** Svelte component instance (from mount()) */
	instance: Record<string, unknown>;
	/** Associated sash ID */
	sashId: string;
	/** DOM element containing the component */
	element: HTMLElement;
}

/**
 * Properties for creating a Glass component
 */
export interface CreateGlassProps {
	/** Title text or element */
	title?: string | HTMLElement | null;
	/** Icon to display alongside the title (URL, emoji, or HTML string) */
	icon?: string | null;
	/** Content to display (ignored if component provided) */
	content?: string | HTMLElement | null;
	/** Tab labels */
	tabs?: (string | { label: string })[];
	/** Action buttons */
	actions?: Array<{ label: string; onClick: () => void }> | boolean;
	/** Whether glass is draggable */
	draggable?: boolean;
	/** User Svelte component to mount */
	component?: Component;
	/** Props for user component */
	componentProps?: Record<string, unknown>;
	/** Any other custom properties */
	[key: string]: unknown;
}

/**
 * Data stored for a minimized glass
 */
export interface MinimizedGlassData {
	/** Sash ID of the minimized glass */
	sashId: string;
	/** Original position ('top', 'right', 'bottom', 'left') */
	originalPosition: string;
	/** Original bounding rectangle */
	originalBoundingRect: DOMRect;
	/** Original store data (title, content, component, etc.) */
	originalStore: Record<string, unknown>;
	/** The minimized glass button element */
	glassElement: HTMLElement;
}
