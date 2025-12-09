// Types for pane lifecycle events and payloads
// Aligns with specs/003-we-need-to/contracts/openapi.yaml

export type PaneState = 'normal' | 'minimized' | 'maximized';

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

export interface PanePayload {
	id: string;
	title: string | null;
	size: Size;
	position: Position;
	state: PaneState;
	groupId: string | null;
	index: number | null;
	config: Record<string, unknown>;
	dynamic: Record<string, unknown>;
}

export type PaneEventType =
	| 'onpaneadded'
	| 'onpaneremoved'
	| 'onpaneminimized'
	| 'onpanemaximized'
	| 'onpanerestored'
	| 'onpaneresized'
	| 'onpanefocused'
	| 'onpaneblurred'
	| 'onpaneorderchanged'
	| 'onpanetitlechanged';

export interface PaneContext {
	previousTitle?: string;
	previousIndex?: number;
	groupId?: string;
}

export interface PaneEvent {
	type: PaneEventType;
	timestamp: string; // ISO 8601
	pane: PanePayload;
	context?: PaneContext;
}
