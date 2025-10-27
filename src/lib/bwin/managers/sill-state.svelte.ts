import type { BwinContext } from '../context.js';
import type { Sash } from '../sash.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { getMetricsFromElement } from '../utils.js';
import { getIntersectRect } from '../rect.js';
import { Position } from '../position.js';
import { BwinErrors } from '../errors.js';
import { createDebugger, type Debugger } from '../utils/debug.svelte.js';
import { emitPaneEvent } from '../../events/dispatcher.js';
import { buildPanePayload } from '../../events/payload.js';

/**
 * Sill Reactive State Module (Svelte 5)
 *
 * Manages the sill element and minimized glasses using Svelte 5 module-level reactive state.
 * This module replaces the old SillManager class with a more functional approach
 * using Svelte 5 runes at module level.
 *
 * Key Svelte 5 Patterns:
 * - Uses $state() for reactive properties
 * - Uses $derived() for computed values
 * - Exports named functions instead of class methods
 * - Module-level state shared across imports
 * - Automatic reactivity when state changes
 *
 * Responsibilities:
 * - Create and manage sill element (bottom bar for minimized glasses)
 * - Track minimized glass instances
 * - Handle restoration of minimized glasses to panes
 * - Manage click events on minimized glass buttons
 */

// ============================================================================
// MODULE STATE
// ============================================================================

/** BwinContext reference (set during initialization) */
let bwinContext: BwinContext | undefined = $state();

/** Debug mode flag */
let debugMode = $state(false);

/** Debug utility instance */
let debugUtil: Debugger;

/** The sill element (bottom bar) */
let sillElement = $state<HTMLElement | undefined>();

/** Click handler reference for cleanup */
let clickHandler: ((event: MouseEvent) => void) | undefined;

// ============================================================================
// DERIVED STATE (computed automatically)
// ============================================================================

/** Whether sill element is mounted */
const _hasSillElement = $derived(sillElement !== undefined);

// Export getter for derived state (Svelte 5 doesn't allow exporting $derived directly)
export const hasSillElement = () => _hasSillElement;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the sill state module with BwinContext
 * Must be called before using any other functions
 *
 * @param context - BwinContext reference
 * @param debug - Enable debug logging
 */
export function initialize(context: BwinContext, debug = false): void {
	bwinContext = context;
	debugMode = debug;
	debugUtil = createDebugger('SillState', debug);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Registers the sill element from the Sill component
 *
 * Called by Sill.svelte when it mounts. This replaces the old mount() logic
 * that appended the sill to the window element.
 *
 * @param element - The sill element from Sill.svelte
 *
 * @example
 * ```typescript
 * // In Sill.svelte onMount:
 * registerSillElement(sillElement);
 * ```
 */
export function registerSillElement(element: HTMLElement): void {
	if (!bwinContext) {
		debugWarn('[registerSillElement] Module not initialized - call initialize() first');
		return;
	}

	sillElement = element;
	debugLog('[registerSillElement] Sill element registered:', sillElement);

	// Setup click handler
	setupClickHandler();
}

/**
 * Unregisters the sill element
 *
 * Called by Sill.svelte when it unmounts.
 */
export function unregisterSillElement(): void {
	debugLog('[unregisterSillElement] Unregistering sill element');
	removeClickHandler();
	sillElement = undefined;
}

/**
 * Ensures the sill element exists and returns it
 *
 * In the new architecture, the Sill.svelte component registers itself when mounted.
 * This function returns the registered sill element, or undefined if not yet registered.
 *
 * @returns The sill element, or undefined if not yet registered by Sill.svelte
 *
 * @example
 * ```typescript
 * const sill = ensureSillElement();
 * if (!sill) {
 *   console.warn('Sill not yet mounted - ensure Sill.svelte is in the component tree');
 * }
 * ```
 */
export function ensureSillElement(): HTMLElement | undefined {
	if (!sillElement) {
		debugWarn(
			'[ensureSillElement] Sill element not registered yet. Ensure Sill.svelte is mounted in the component tree.'
		);
	}
	return sillElement;
}

/**
 * Gets the current sill element
 *
 * @returns The sill element, or undefined if not mounted
 */
export function getSillElement(): HTMLElement | undefined {
	return sillElement;
}

/**
 * Gets a minimized glass element by sash ID
 *
 * Searches the sill element for a minimized glass button with the matching sash ID.
 *
 * @param sashId - The sash ID to search for
 * @returns The minimized glass element, or null/undefined if not found
 *
 * @example
 * ```typescript
 * const minimizedGlass = getMinimizedGlassElement('pane-1');
 * if (minimizedGlass) {
 *   console.log('Found minimized glass for pane-1');
 * }
 * ```
 */
export function getMinimizedGlassElement(sashId: string): Element | null | undefined {
	if (!sillElement) return null;
	const els = sillElement.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`);
	return Array.from(els).find(
		(el) => (el as HTMLElement & { bwOriginalSashId?: string }).bwOriginalSashId === sashId
	);
}

/**
 * Restores a minimized glass to a pane
 *
 * Finds the best target pane based on intersection area with original position,
 * then adds a new pane with the preserved glass properties.
 *
 * @param minimizedGlassEl - The minimized glass button element to restore
 *
 * @example
 * ```typescript
 * const minimizedGlass = document.querySelector('.bw-minimized-glass');
 * if (minimizedGlass) {
 *   restoreGlass(minimizedGlass);
 *   minimizedGlass.remove();
 * }
 * ```
 */
export function restoreGlass(
	minimizedGlassEl: HTMLElement & {
		bwOriginalBoundingRect?: DOMRect;
		bwOriginalSashId?: string;
		bwOriginalPosition?: string;
		bwGlassElement?: HTMLElement;
		bwOriginalStore?: Record<string, unknown>;
	}
): void {
	if (!bwinContext) {
		debugWarn('[restoreGlass] Module not initialized - call initialize() first');
		return;
	}

	debugLog('[restoreGlass] Starting restore:', {
		minimizedGlassEl,
		hasWindowElement: !!bwinContext.windowElement,
		hasRootSash: !!bwinContext.rootSash,
		originalBoundingRect: minimizedGlassEl.bwOriginalBoundingRect,
		originalSashId: minimizedGlassEl.bwOriginalSashId,
		originalPosition: minimizedGlassEl.bwOriginalPosition,
		glassElement: minimizedGlassEl.bwGlassElement
	});

	if (!bwinContext.windowElement || !bwinContext.rootSash) {
		debugWarn('[restoreGlass] Missing required components');
		return;
	}

	const originalRect = minimizedGlassEl.bwOriginalBoundingRect;
	if (!originalRect) {
		debugWarn('[restoreGlass] Missing original bounding rect');
		return;
	}

	let biggestIntersectArea = 0;
	let targetPaneEl: HTMLElement | null = null;

	// Find the pane with the biggest intersection area with the original position
	bwinContext.windowElement.querySelectorAll(`.${CSS_CLASSES.PANE}`).forEach((paneEl) => {
		const paneRect = getMetricsFromElement(paneEl as HTMLElement);
		const intersectRect = getIntersectRect(originalRect, paneRect);

		if (intersectRect) {
			const intersectArea = intersectRect.width * intersectRect.height;

			if (intersectArea > biggestIntersectArea) {
				biggestIntersectArea = intersectArea;
				targetPaneEl = paneEl as HTMLElement;
			}
		}
	});

	debugLog('[restoreGlass] Target pane found:', {
		targetPaneEl,
		biggestIntersectArea
	});

	if (targetPaneEl && bwinContext.rootSash) {
		const newPosition = minimizedGlassEl.bwOriginalPosition;
		const targetRect = getMetricsFromElement(targetPaneEl);
		const targetPaneSashId = (targetPaneEl as HTMLElement).getAttribute(DATA_ATTRIBUTES.SASH_ID);
		if (!targetPaneSashId) {
			debugWarn('[restoreGlass] Target pane missing sash ID');
			return;
		}

		const targetPaneSash = bwinContext.rootSash.getById(targetPaneSashId);
		if (!targetPaneSash) {
			debugWarn('[restoreGlass] Target pane sash not found');
			return;
		}

		debugLog('[restoreGlass] Restoring to pane:', {
			targetPaneSashId,
			newPosition,
			targetRect
		});

		let newSize = 0;

		if (newPosition === Position.Left || newPosition === Position.Right) {
			newSize =
				targetRect.width - originalRect.width < targetPaneSash.minWidth
					? targetRect.width / 2
					: originalRect.width;
		} else if (newPosition === Position.Top || newPosition === Position.Bottom) {
			newSize =
				targetRect.height - originalRect.height < targetPaneSash.minHeight
					? targetRect.height / 2
					: originalRect.height;
		} else {
			throw BwinErrors.invalidPosition(newPosition || 'unknown');
		}

		const originalSashId = minimizedGlassEl.bwOriginalSashId;
		const originalStore = minimizedGlassEl.bwOriginalStore || {};

				// addPane will create a new Glass component with the preserved store
				const newSash = bwinContext.addPane((targetPaneEl as HTMLElement).getAttribute(DATA_ATTRIBUTES.SASH_ID)!, {
			id: originalSashId,
			position: newPosition,
			size: newSize,
			...originalStore // Preserve title, content, and other Glass props
				});

				// Post-action: emit restored event
				try {
					if (newSash) {
						const payload = buildPanePayload(newSash, undefined);
						emitPaneEvent('onpanerestored', payload);
					}
				} catch (err) {
					debugWarn('[restoreGlass] failed to emit onpanerestored', err as unknown);
				}
	}
}

/**
 * Cleanup all sill-related resources
 *
 * Removes click handler and clears sill element reference.
 * Call this on component cleanup.
 */
export function destroy(): void {
	debugLog('[destroy] Cleaning up sill manager');
	removeClickHandler();
	sillElement = undefined;
}

/**
 * Resets the module state (primarily for testing)
 * Clears all state and resets to initial state
 */
export function reset(): void {
	removeClickHandler();
	sillElement = undefined;
	bwinContext = undefined;
	debugMode = false;
}

// ============================================================================
// PRIVATE FUNCTIONS
// ============================================================================

/**
 * Setup click handler for restoring minimized glasses from sill
 */
function setupClickHandler(): void {
	if (!sillElement) {
		debugWarn('[setupClickHandler] No sill element');
		return;
	}

	// Remove existing handler if any
	removeClickHandler();

	debugLog('[setupClickHandler] Setting up click handler on sill:', sillElement);

	clickHandler = (event: MouseEvent) => {
		debugLog('[Click] Click detected on sill:', {
			target: event.target,
			targetMatches: (event.target as HTMLElement).matches(`.${CSS_CLASSES.MINIMIZED_GLASS}`),
			targetClassName: (event.target as HTMLElement).className
		});

		if (!(event.target as HTMLElement).matches(`.${CSS_CLASSES.MINIMIZED_GLASS}`)) {
			debugLog('[Click] Target is not a minimized glass, ignoring');
			return;
		}

		debugLog('[Click] Restoring minimized glass...');
		const minimizedGlassEl = event.target as HTMLElement;
		restoreGlass(minimizedGlassEl);
		minimizedGlassEl.remove();
		debugLog('[Click] Minimized glass removed');
	};

	sillElement.addEventListener('click', clickHandler);
	debugLog('[setupClickHandler] Click listener attached to sill');
}

/**
 * Remove click handler from sill element
 */
function removeClickHandler(): void {
	if (sillElement && clickHandler) {
		sillElement.removeEventListener('click', clickHandler);
		clickHandler = undefined;
		debugLog('[removeClickHandler] Click listener removed from sill');
	}
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
