import type { BwinContext } from '../context.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { getMetricsFromElement } from '../utils.js';
import { getIntersectRect } from '../rect.js';
import { Position } from '../position.js';
import { createDebugger, type Debugger } from '../utils/debug.svelte.js';
import { emitPaneEvent } from '../../events/dispatcher.js';
import { buildPanePayload } from '../../events/payload.js';
import {
	cleanupMinimizedGlass,
	type BwinMinimizedElement
} from '../binary-window/actions.minimize.js';

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
	debugUtil = createDebugger('SillState', debug);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Registers the sill element from the Sill component
 *
 * Called by Sill.svelte when it mounts. The sill element can be placed anywhere
 * on the page, not just inside the BinaryWindow component tree. This allows for
 * flexible layout options where the minimized pane bar can be positioned independently.
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
	debugLog('[registerSillElement] Sill element registered:', { element: sillElement });

	// Setup click handler
	setupClickHandler();
}

/**
 * Unregisters the sill element
 *
 * Called by Sill.svelte when it unmounts. Cleans up click handlers and clears
 * the sill element reference, allowing the sill to be re-registered later if needed.
 *
 * @example
 * ```typescript
 * // In Sill.svelte onDestroy:
 * unregisterSillElement();
 * ```
 */
export function unregisterSillElement(): void {
	debugLog('[unregisterSillElement] Unregistering sill element');

	// Cleanup all minimized glass components before destroying the sill
	if (sillElement) {
		const minimizedGlasses = sillElement.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`);
		minimizedGlasses.forEach((el) => {
			cleanupMinimizedGlass(el as BwinMinimizedElement);
		});
		debugLog(`[unregisterSillElement] Cleaned up ${minimizedGlasses.length} minimized glasses`);
	}

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
 * Handles multiple scenarios:
 * - Empty/placeholder state: Replaces the placeholder with the restored content
 * - Single pane (root position): Replaces the target pane content
 * - Multiple panes: Splits the best-matching pane based on original position
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
		bwOriginalStore?: Record<string, unknown>;
	}
): void {
	if (!bwinContext) {
		debugWarn('[restoreGlass] Module not initialized - call initialize() first');
		return;
	}

	debugLog('[restoreGlass] Starting restore:', {
		hasWindowElement: !!bwinContext.windowElement,
		hasRootSash: !!bwinContext.rootSash,
		originalBoundingRect: minimizedGlassEl.bwOriginalBoundingRect,
		originalSashId: minimizedGlassEl.bwOriginalSashId,
		originalPosition: minimizedGlassEl.bwOriginalPosition
	});

	if (!bwinContext.windowElement || !bwinContext.rootSash) {
		debugWarn('[restoreGlass] Missing required components');
		return;
	}

	const originalStore = minimizedGlassEl.bwOriginalStore || {};
	const originalSashId = minimizedGlassEl.bwOriginalSashId;
	const originalPosition = minimizedGlassEl.bwOriginalPosition;
	const originalRect = minimizedGlassEl.bwOriginalBoundingRect;

	// Check if we're in empty/placeholder state (only one pane that is a placeholder)
	const rootSash = bwinContext.rootSash;
	const leafPanes = rootSash.getAllLeafDescendants();
	const isEmptyState =
		leafPanes.length === 1 &&
		(leafPanes[0].store?.isPlaceholder ||
			(leafPanes[0].children.length === 0 && !leafPanes[0].store?.component));

	if (isEmptyState) {
		// Restore to empty/placeholder state - just replace the placeholder
		debugLog('[restoreGlass] Restoring to empty/placeholder state');

		const targetSash = leafPanes[0];
		const targetSashId = targetSash.id;

		// Filter out any 'id' property from originalStore to avoid confusion
		// For placeholder replacement, the sash keeps its existing ID
		const { id: _unusedId, ...storeWithoutId } = originalStore;
		void _unusedId; // Intentionally unused - destructured to remove from object

		// Use addPane which handles placeholder replacement
		// Note: Don't pass id for placeholder replacement - the sash keeps its ID
		const newSash = bwinContext.addPane(targetSashId, storeWithoutId);

		// Post-action: emit restored event
		try {
			if (newSash) {
				const payload = buildPanePayload(newSash, undefined);
				emitPaneEvent('onpanerestored', payload);
			}
		} catch (err) {
			debugWarn('[restoreGlass] failed to emit onpanerestored', err as unknown);
		}
		return;
	}

	// Check if original position was "root" - this means it was a single pane
	// In this case, we should add to the first available pane
	const isRootPosition = originalPosition === Position.Root || originalPosition === 'root';

	if (!originalRect && !isRootPosition) {
		debugWarn('[restoreGlass] Missing original bounding rect');
		return;
	}

	let biggestIntersectArea = 0;
	let targetPaneEl: HTMLElement | null = null;

	// Find the pane with the biggest intersection area with the original position
	bwinContext.windowElement.querySelectorAll(`.${CSS_CLASSES.PANE}`).forEach((paneEl) => {
		const paneRect = getMetricsFromElement(paneEl as HTMLElement);

		if (originalRect) {
			const intersectRect = getIntersectRect(originalRect, paneRect);

			if (intersectRect) {
				const intersectArea = intersectRect.width * intersectRect.height;

				if (intersectArea > biggestIntersectArea) {
					biggestIntersectArea = intersectArea;
					targetPaneEl = paneEl as HTMLElement;
				}
			}
		} else {
			// If no original rect (e.g., root position), use the first pane
			if (!targetPaneEl) {
				targetPaneEl = paneEl as HTMLElement;
			}
		}
	});

	debugLog('[restoreGlass] Target pane found:', {
		targetPaneEl,
		biggestIntersectArea,
		isRootPosition
	});

	if (!targetPaneEl) {
		debugWarn('[restoreGlass] No target pane found');
		return;
	}

	// TypeScript narrowing helper - targetPaneEl is definitely HTMLElement here
	const validTargetPaneEl: HTMLElement = targetPaneEl;
	const targetPaneSashId = validTargetPaneEl.getAttribute(DATA_ATTRIBUTES.SASH_ID);
	if (!targetPaneSashId) {
		debugWarn('[restoreGlass] Target pane missing sash ID');
		return;
	}

	const targetPaneSash = bwinContext.rootSash.getById(targetPaneSashId);
	if (!targetPaneSash) {
		debugWarn('[restoreGlass] Target pane sash not found');
		return;
	}

	// Determine the position for the new pane
	let newPosition: string;
	if (isRootPosition) {
		// For root position, default to splitting right
		newPosition = Position.Right;
	} else if (
		originalPosition === Position.Left ||
		originalPosition === Position.Right ||
		originalPosition === Position.Top ||
		originalPosition === Position.Bottom
	) {
		newPosition = originalPosition;
	} else {
		// Unknown position, default to right
		debugWarn('[restoreGlass] Unknown original position, defaulting to right:', originalPosition);
		newPosition = Position.Right;
	}

	debugLog('[restoreGlass] Restoring to pane:', {
		targetPaneSashId,
		newPosition,
		originalPosition
	});

	const targetRect = getMetricsFromElement(validTargetPaneEl);
	let newSize = 0;

	if (newPosition === Position.Left || newPosition === Position.Right) {
		if (originalRect) {
			newSize =
				targetRect.width - originalRect.width < targetPaneSash.minWidth
					? targetRect.width / 2
					: originalRect.width;
		} else {
			newSize = targetRect.width / 2;
		}
	} else if (newPosition === Position.Top || newPosition === Position.Bottom) {
		if (originalRect) {
			newSize =
				targetRect.height - originalRect.height < targetPaneSash.minHeight
					? targetRect.height / 2
					: originalRect.height;
		} else {
			newSize = targetRect.height / 2;
		}
	}

	// addPane will create a new Glass component with the preserved store
	const newSash = bwinContext.addPane(targetPaneSashId, {
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
		// Use closest() to find the minimized glass button even when clicking on child elements
		// (like the icon span or title span inside the button)
		const minimizedGlassEl = (event.target as HTMLElement).closest(
			`.${CSS_CLASSES.MINIMIZED_GLASS}`
		) as BwinMinimizedElement | null;

		debugLog('[Click] Click detected on sill:', {
			target: event.target,
			minimizedGlassEl,
			targetClassName: (event.target as HTMLElement).className
		});

		if (!minimizedGlassEl) {
			debugLog('[Click] Target is not within a minimized glass, ignoring');
			return;
		}

		debugLog('[Click] Restoring minimized glass...');
		restoreGlass(minimizedGlassEl);
		// CRITICAL: Cleanup Svelte component before removing DOM element to prevent memory leaks
		cleanupMinimizedGlass(minimizedGlassEl);
		minimizedGlassEl.remove();
		debugLog('[Click] Minimized glass removed and component unmounted');
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
