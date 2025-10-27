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

export function onPaneEvent(type: PaneEventType, handler: (event: PaneEvent) => void): void {
  ensureSet(type).add(handler);
}

export function offPaneEvent(type: PaneEventType, handler: (event: PaneEvent) => void): void {
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
export const onpaneadded = (h: (e: PaneEvent) => void) => onPaneEvent('onpaneadded', h);
export const onpaneremoved = (h: (e: PaneEvent) => void) => onPaneEvent('onpaneremoved', h);
export const onpaneminimized = (h: (e: PaneEvent) => void) => onPaneEvent('onpaneminimized', h);
export const onpanemaximized = (h: (e: PaneEvent) => void) => onPaneEvent('onpanemaximized', h);
export const onpanerestored = (h: (e: PaneEvent) => void) => onPaneEvent('onpanerestored', h);
export const onpaneresized = (h: (e: PaneEvent) => void) => onPaneEvent('onpaneresized', h);
export const onpanefocused = (h: (e: PaneEvent) => void) => onPaneEvent('onpanefocused', h);
export const onpaneblurred = (h: (e: PaneEvent) => void) => onPaneEvent('onpaneblurred', h);
export const onpaneorderchanged = (h: (e: PaneEvent) => void) => onPaneEvent('onpaneorderchanged', h);
export const onpanetitlechanged = (h: (e: PaneEvent) => void) => onPaneEvent('onpanetitlechanged', h);
