import { unmount } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { BwinContext } from '../context.js';
import type { GlassInstance, UserComponentInstance, CreateGlassProps } from './types.js';
import { createDebugger, type Debugger } from '../utils/debug.svelte.js';

/**
 * Glass Component Reactive State Module (Svelte 5)
 *
 * Manages Glass component lifecycle using Svelte 5 module-level reactive state.
 * This module replaces the old GlassManager class with a more functional approach
 * using Svelte 5 runes at module level.
 *
 * LEGACY MODE: This manager is kept for backward compatibility but is largely
 * a no-op in the default declarative rendering mode. Glass components are now
 * rendered declaratively via BinaryWindow's {#each} loop and Svelte 5 snippets,
 * making imperative creation/mounting unnecessary.
 *
 * Key Svelte 5 Patterns:
 * - Uses SvelteMap for reactive collections
 * - Uses $state() for reactive variables
 * - Uses $derived() for computed properties
 * - Exports named functions instead of class methods
 * - Module-level state shared across imports
 *
 * Responsibilities (legacy):
 * - Track Glass instances reactively (typically empty in declarative mode)
 * - Provide computed state (count, active, etc.)
 * - Clean up instances on removal (typically no-op in declarative mode)
 */

// ============================================================================
// MODULE STATE
// ============================================================================

/** BwinContext reference (set during initialization) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Stored for potential future use
let bwinContext: BwinContext | undefined = $state();

/** Debug mode flag */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Stored for potential future use
let debugMode = $state(false);

/** Debug utility instance */
let debugUtil: Debugger;

/** All glass instances (reactive array)
 * Using $state.raw to prevent Svelte from wrapping component instances in proxies
 * This avoids "state_proxy_unmount" errors when calling unmount()
 */
let glasses = $state.raw<GlassInstance[]>([]);

/** User components mapped by sash ID (reactive map)
 * Using SvelteMap for automatic reactivity without proxy wrapping issues
 */
const userComponents = new SvelteMap<string, UserComponentInstance>();

/** Currently active glass instance */
let activeGlass = $state<GlassInstance | undefined>();

// ============================================================================
// DERIVED STATE (computed automatically)
// ============================================================================

/** Number of active glasses (auto-updates) */
const _glassCount = $derived(glasses.length);

/** Whether there's an active glass */
const _hasActiveGlass = $derived(activeGlass !== undefined);

/** Map of glasses by sash ID (computed from array) */
const _glassesBySashId = $derived.by(() => {
	const map = new SvelteMap<string, GlassInstance>();
	glasses.forEach((glass) => map.set(glass.sashId, glass));
	return map;
});

/** Array of sash IDs with glasses */
const _glassIds = $derived(glasses.map((g) => g.sashId));

// Export getters for derived state (Svelte 5 doesn't allow exporting $derived directly)
export const glassCount = () => _glassCount;
export const hasActiveGlass = () => _hasActiveGlass;
export const glassesBySashId = () => _glassesBySashId;
export const glassIds = () => _glassIds;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the glass state module with BwinContext
 * Must be called before using any other functions
 *
 * @param context - BwinContext reference
 * @param debug - Enable debug logging
 */
export function initialize(context: BwinContext, debug = false): void {
	bwinContext = context;
	debugMode = debug;
	debugUtil = createDebugger('GlassState', debug);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Removes a Glass component
 *
 * Note: In declarative rendering mode (which is now the default), Glass components
 * are managed by Svelte's reactivity system and this method is a no-op. It's kept
 * for backward compatibility and will be removed in a future release.
 *
 * Reactive - removal automatically updates all derived state
 * and triggers UI updates.
 *
 * @param sashId - The sash ID to remove
 */
export function removeGlass(sashId: string): void {
	// Find and remove from reactive array
	const index = glasses.findIndex((g) => g.sashId === sashId);
	if (index !== -1) {
		const glassData = glasses[index];
		unmount(glassData.instance);
		// Need to reassign to trigger reactivity with $state.raw
		glasses = glasses.filter((g) => g.sashId !== sashId);

		// Clear active if this was active
		if (activeGlass?.sashId === sashId) {
			activeGlass = undefined;
		}
	}

	debugLog('removeGlass: Removed glass for sash', sashId);
}

/**
 * Updates Glass properties for an existing instance
 *
 * @param sashId - Sash ID to update
 * @param props - New properties to apply
 */
export function updateGlass(sashId: string, props: Partial<CreateGlassProps>): void {
	const glass = _glassesBySashId.get(sashId);
	if (!glass) {
		debugWarn('updateGlass: Glass not found for sash', sashId);
		return;
	}

	// Update stored props (triggers reactivity if needed)
	glass.props = { ...glass.props, ...props };

	// Force array update to trigger reactivity
	glasses = [...glasses];

	debugLog('updateGlass: Updated glass for sash', sashId);
}

/**
 * Sets the active glass instance
 *
 * @param sashId - Sash ID to set as active (or undefined to clear)
 */
export function setActiveGlass(sashId: string | undefined): void {
	if (sashId === undefined) {
		activeGlass = undefined;
		return;
	}

	const glass = _glassesBySashId.get(sashId);
	if (glass) {
		activeGlass = glass;
	}
}

/**
 * Gets a Glass instance by sash ID (uses derived map)
 */
export function getGlass(sashId: string): GlassInstance | undefined {
	return _glassesBySashId.get(sashId);
}

/**
 * Checks if a Glass exists for a sash ID
 */
export function hasGlass(sashId: string): boolean {
	return _glassesBySashId.has(sashId);
}

/**
 * Gets all Glass instances (reactive array)
 */
export function getAllGlasses(): GlassInstance[] {
	return glasses;
}

/**
 * Gets the current active glass instance
 */
export function getActiveGlass(): GlassInstance | undefined {
	return activeGlass;
}

/**
 * Destroys all Glass instances
 * Call this on component cleanup
 *
 * Note: In declarative rendering mode (which is now the default), Glass components
 * are managed by Svelte's reactivity system and this cleanup is typically a no-op.
 * It's kept for backward compatibility and will be removed in a future release.
 */
export function destroy(): void {
	debugLog('destroy: Cleaning up all glasses');

	// Cleanup all glasses (typically empty in declarative mode)
	glasses.forEach((glassData) => {
		unmount(glassData.instance);
	});
	glasses = []; // Clear reactive array

	// Cleanup all user components (typically empty in declarative mode)
	userComponents.forEach((component) => {
		unmount(component.instance);
	});
	userComponents.clear();

	activeGlass = undefined;
}

/**
 * Resets the module state (primarily for testing)
 * Clears all glasses and resets to initial state
 */
export function reset(): void {
	glasses.forEach((glassData) => {
		unmount(glassData.instance);
	});
	glasses = [];

	userComponents.forEach((component) => {
		unmount(component.instance);
	});
	userComponents.clear();

	activeGlass = undefined;
	bwinContext = undefined;
	debugMode = false;
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

function debugLog(...args: unknown[]): void {
	if (debugUtil) {
		debugUtil.log(...args);
	}
}

function debugWarn(...args: unknown[]): void {
	if (debugUtil) {
		debugUtil.warn(...args);
	}
}
