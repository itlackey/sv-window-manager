/**
 * Sash class - Binary tree structure for window manager
 *
 * This module provides the Sash implementation based on feature flag.
 * Set VITE_USE_REACTIVE_SASH=true to use the reactive Svelte 5 implementation.
 * Set VITE_USE_REACTIVE_SASH=false (default) to use the legacy vanilla JS implementation.
 *
 * Both implementations provide identical APIs and pass all 349+ unit tests.
 */

import { Sash as LegacySash, DEFAULTS as LEGACY_DEFAULTS } from './sash.legacy';
import { ReactiveSash, DEFAULTS as REACTIVE_DEFAULTS } from './sash.svelte';

// Use feature flag to determine which implementation to export
const USE_REACTIVE = import.meta.env.VITE_USE_REACTIVE_SASH === 'true';

export const Sash = USE_REACTIVE ? ReactiveSash : LegacySash;
export const DEFAULTS = USE_REACTIVE ? REACTIVE_DEFAULTS : LEGACY_DEFAULTS;

// Log which implementation is being used (tree-shaken in production)
if (import.meta.env.DEV) {
	console.info(
		`[sv-window-manager] Using ${USE_REACTIVE ? 'reactive (Svelte 5)' : 'legacy (vanilla JS)'} Sash implementation`
	);
}

// Re-export types from legacy (they're the same for both)
export type { SashConstructorParams } from './sash.legacy';
