// Sash Interface - Core tree data structure
export interface Sash {
	id: string;
	left: number;
	top: number;
	width: number;
	height: number;
	minWidth: number;
	minHeight: number;
	position: string;
	children: Sash[];
	parent: Sash | null;
	domNode: HTMLElement | null;
	store: Record<string, unknown>;
	leftChild?: Sash;
	rightChild?: Sash;
	topChild?: Sash;
	bottomChild?: Sash;

	// Methods
	getById(id: string): Sash | null;
	getChildren(): [Sash | null, Sash | null, Sash | null, Sash | null];
	isLeftRightSplit(): boolean;
	isTopBottomSplit(): boolean;
	calcMinWidth(): number;
	calcMinHeight(): number;
	walk(callback: (sash: Sash) => void): void;
	getAllLeafDescendants(): Sash[];
	getDescendantParentById(id: string): Sash | null;
	getChildSiblingById(id: string): Sash | undefined;
}

// Glass Action Interface
export interface GlassAction {
	label: string;
	className?: string;
	onClick: (event: MouseEvent, binaryWindow: BwinContext) => void;
}

// Import Snippet type from Svelte for type-safe content composition
import type { Snippet } from 'svelte';

// Import Component type from Svelte
import type { Component } from 'svelte';

// Glass Component Props
export interface GlassProps {
	title?: string | HTMLElement | Snippet | null;
	actions?: GlassAction[] | boolean;
	draggable?: boolean;
	sash: Sash;
	binaryWindow: BwinContext;
	component: Component;
	componentProps?: Record<string, unknown>;
}

// BinaryWindow Context
export interface BwinContext {
	readonly windowElement: HTMLElement | undefined;
	readonly sillElement: HTMLElement | undefined;
	readonly rootSash: Sash | undefined;
	removePane: (sashId: string) => void;
	addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash | null;
	getMinimizedGlassElementBySashId: (sashId: string) => Element | null | undefined;
	getSillElement: () => HTMLElement | undefined;
	ensureSillElement: () => HTMLElement | undefined;
}

// Frame Component Interface
export interface FrameComponent {
	rootSash: Sash | undefined;
	windowElement: HTMLElement | undefined;
	containerElement: HTMLElement | undefined;
	addPane: (targetId: string, options: Record<string, unknown>) => Sash | null;
	removePane: (id: string) => void;
	swapPanes: (
		sourcePaneEl: HTMLElement | Element | null,
		targetPaneEl: HTMLElement | Element | null
	) => void;
	mount: (containerEl: HTMLElement) => void;
	fit: () => void;
}

// Frame Context
export interface FrameContext {
	readonly debug: boolean;
}

// Action Params
export interface ResizeActionParams {
	rootSash: Sash;
	onUpdate: () => void;
}

export interface DragActionParams {
	onDragStart?: (glassEl: HTMLElement) => void;
	onDragEnd?: (glassEl: HTMLElement) => void;
}

export interface DropActionParams {
	rootSash: Sash;
	onDrop: (event: DragEvent, sash: Sash, dropArea: string) => void;
}

// Event Types for Frame component events
export interface PaneRenderEvent {
	paneElement: HTMLElement;
	sash: Sash;
}

export interface MuntinRenderEvent {
	muntinElement: HTMLElement;
	sash: Sash;
}

export interface PaneDropEvent {
	event: DragEvent;
	sash: Sash;
	dropArea: string;
}

// Event map for createEventDispatcher
export interface PaneEvents {
	panerender: PaneRenderEvent;
}

export interface MuntinEvents {
	muntinrender: MuntinRenderEvent;
}
