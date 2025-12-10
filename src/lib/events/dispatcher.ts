import type { PaneContext, PaneEvent, PaneEventType, PanePayload } from './types.js';

// Lightweight typed event bus (SSR-safe: no DOM/window usage)
const listeners: Map<PaneEventType, Set<(event: PaneEvent) => void>> = new Map();

function ensureSet(type: PaneEventType) {
	let set = listeners.get(type);
	if (!set) {
		set = new Set();
		listeners.set(type, set);
	}
	return set;
}

export function addEventHandler(type: PaneEventType, handler: (event: PaneEvent) => void): void {
	ensureSet(type).add(handler);
}

export function removeEventHandler(type: PaneEventType, handler: (event: PaneEvent) => void): void {
	const set = listeners.get(type);
	if (set) set.delete(handler);
}

export function emitPaneEvent(type: PaneEventType, pane: PanePayload, context?: PaneContext): void {
	const event: PaneEvent = {
		type,
		timestamp: new Date().toISOString(),
		pane,
		...(context ? { context } : {})
	};
	const set = listeners.get(type);
	if (!set || set.size === 0) return;
	// Copy to prevent mutation during iteration
	[...set].forEach((fn) => {
		try {
			fn(event);
		} catch (err) {
			// Swallow to isolate subscribers; could add debug hook later
			// eslint-disable-next-line no-console
			console.error('[sv-window-manager] Uncaught error in pane event handler', err);
		}
	});
}

// Convenience specific subscriptions (optional)
export const onpaneadded = (h: (e: PaneEvent) => void) => addEventHandler('onpaneadded', h);
export const onpaneremoved = (h: (e: PaneEvent) => void) => addEventHandler('onpaneremoved', h);
export const onpaneminimized = (h: (e: PaneEvent) => void) => addEventHandler('onpaneminimized', h);
export const onpanemaximized = (h: (e: PaneEvent) => void) => addEventHandler('onpanemaximized', h);
export const onpanerestored = (h: (e: PaneEvent) => void) => addEventHandler('onpanerestored', h);
export const onpaneresized = (h: (e: PaneEvent) => void) => addEventHandler('onpaneresized', h);
export const onpanefocused = (h: (e: PaneEvent) => void) => addEventHandler('onpanefocused', h);
export const onpaneblurred = (h: (e: PaneEvent) => void) => addEventHandler('onpaneblurred', h);
export const onpaneorderchanged = (h: (e: PaneEvent) => void) =>
	addEventHandler('onpaneorderchanged', h);
export const onpanetitlechanged = (h: (e: PaneEvent) => void) =>
	addEventHandler('onpanetitlechanged', h);
