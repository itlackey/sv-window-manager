import type { BwinContext } from '../context.js';
import type { Sash } from '../sash';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { getMetricsFromElement } from '../utils.js';
import { getIntersectRect } from '../rect.js';
import { Position } from '../position.js';
import { BwinErrors } from '../errors.js';
import { createDebugger, type Debugger } from '../utils/debug.svelte.js';

/**
 * Manages the sill element and minimized glasses using Svelte 5 reactive state
 *
 * Key Svelte 5 Patterns:
 * - Uses $state() for reactive properties
 * - Uses $derived() for computed values
 * - Automatic reactivity when state changes
 * - Shared via context API for type-safe access
 *
 * Responsibilities:
 * - Create and manage sill element (bottom bar for minimized glasses)
 * - Track minimized glass instances
 * - Handle restoration of minimized glasses to panes
 * - Manage click events on minimized glass buttons
 */
export class SillManager {
	// ============================================================================
	// REACTIVE STATE (Svelte 5 runes)
	// ============================================================================

	/** The sill element (bottom bar) */
	sillElement = $state<HTMLElement | undefined>();

	/** Click handler reference for cleanup */
	private clickHandler: ((event: MouseEvent) => void) | undefined;

	// ============================================================================
	// DERIVED STATE (computed automatically)
	// ============================================================================

	/** Whether sill element is mounted */
	hasSillElement = $derived(this.sillElement !== undefined);

	// ============================================================================
	// CONSTRUCTOR
	// ============================================================================

	private bwinContext: BwinContext;
	private debugger: Debugger;

	constructor(bwinContext: BwinContext, debug = false) {
		this.bwinContext = bwinContext;
		this.debugger = createDebugger('SillManager', debug);
	}

	// ============================================================================
	// PUBLIC METHODS
	// ============================================================================

	/**
	 * Mounts the sill element to the window element
	 *
	 * Creates or reuses existing sill element, preserving any minimized glass buttons.
	 * The sill is automatically recreated when the window element changes (e.g., Frame re-renders).
	 *
	 * @returns The mounted sill element, or undefined if window element not available
	 *
	 * @example
	 * ```typescript
	 * const sill = sillManager.mount();
	 * if (sill) {
	 *   console.log('Sill mounted:', sill);
	 * }
	 * ```
	 */
	mount(): HTMLElement | undefined {
		const winEl = this.bwinContext.windowElement;
		if (!winEl) {
			this.sillElement = undefined;
			this.debugWarn('[mount] No window element available');
			return undefined;
		}

		// Check if sill already exists in this windowElement
		const existingSill = winEl.querySelector(`.${CSS_CLASSES.SILL}`);
		if (existingSill) {
			this.sillElement = existingSill as HTMLElement;
			this.debugLog('[mount] Found existing sill in windowElement:', this.sillElement);
			this.setupClickHandler();
			return this.sillElement;
		}

		// Create new sill
		const sillEl = document.createElement('div');
		sillEl.className = CSS_CLASSES.SILL;

		// Preserve minimized glass buttons from old sill if it exists
		if (this.sillElement) {
			const minimizedGlasses = Array.from(
				this.sillElement.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`)
			);
			this.debugLog('[mount] Preserving minimized glasses:', minimizedGlasses.length);
			minimizedGlasses.forEach((glassBtn) => {
				sillEl.append(glassBtn);
			});
		}

		winEl.append(sillEl);
		this.sillElement = sillEl;
		this.debugLog('[mount] Created and appended sill element');

		// Setup click handler
		this.setupClickHandler();

		return this.sillElement;
	}

	/**
	 * Ensures the sill element exists and returns it
	 *
	 * If the sill doesn't exist yet, this method triggers its creation.
	 *
	 * @returns The sill element, or undefined if window element not available
	 */
	ensureSillElement(): HTMLElement | undefined {
		if (!this.sillElement) {
			return this.mount();
		}
		return this.sillElement;
	}

	/**
	 * Gets a minimized glass element by sash ID
	 *
	 * Searches the window element for a minimized glass button with the matching sash ID.
	 *
	 * @param sashId - The sash ID to search for
	 * @returns The minimized glass element, or null/undefined if not found
	 *
	 * @example
	 * ```typescript
	 * const minimizedGlass = sillManager.getMinimizedGlassElement('pane-1');
	 * if (minimizedGlass) {
	 *   console.log('Found minimized glass for pane-1');
	 * }
	 * ```
	 */
	getMinimizedGlassElement(sashId: string): Element | null | undefined {
		if (!this.bwinContext.windowElement) return null;
		const els = this.bwinContext.windowElement.querySelectorAll(
			`.${CSS_CLASSES.MINIMIZED_GLASS}`
		);
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
	 *   sillManager.restoreGlass(minimizedGlass);
	 *   minimizedGlass.remove();
	 * }
	 * ```
	 */
	restoreGlass(
		minimizedGlassEl: HTMLElement & {
			bwOriginalBoundingRect?: DOMRect;
			bwOriginalSashId?: string;
			bwOriginalPosition?: string;
			bwGlassElement?: HTMLElement;
			bwOriginalStore?: Record<string, unknown>;
		}
	): void {
		this.debugLog('[restoreGlass] Starting restore:', {
			minimizedGlassEl,
			hasWindowElement: !!this.bwinContext.windowElement,
			hasRootSash: !!this.bwinContext.rootSash,
			originalBoundingRect: minimizedGlassEl.bwOriginalBoundingRect,
			originalSashId: minimizedGlassEl.bwOriginalSashId,
			originalPosition: minimizedGlassEl.bwOriginalPosition,
			glassElement: minimizedGlassEl.bwGlassElement
		});

		if (!this.bwinContext.windowElement || !this.bwinContext.rootSash) {
			this.debugWarn('[restoreGlass] Missing required components');
			return;
		}

		const originalRect = minimizedGlassEl.bwOriginalBoundingRect;
		if (!originalRect) {
			this.debugWarn('[restoreGlass] Missing original bounding rect');
			return;
		}

		let biggestIntersectArea = 0;
		let targetPaneEl: HTMLElement | null = null;

		// Find the pane with the biggest intersection area with the original position
		this.bwinContext.windowElement.querySelectorAll(`.${CSS_CLASSES.PANE}`).forEach((paneEl) => {
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

		this.debugLog('[restoreGlass] Target pane found:', {
			targetPaneEl,
			biggestIntersectArea
		});

		if (targetPaneEl && this.bwinContext.rootSash) {
			const newPosition = minimizedGlassEl.bwOriginalPosition;
			const targetRect = getMetricsFromElement(targetPaneEl);
			const targetPaneSashId = (targetPaneEl as HTMLElement).getAttribute(DATA_ATTRIBUTES.SASH_ID);
			if (!targetPaneSashId) {
				this.debugWarn('[restoreGlass] Target pane missing sash ID');
				return;
			}

			const targetPaneSash = this.bwinContext.rootSash.getById(targetPaneSashId);
			if (!targetPaneSash) {
				this.debugWarn('[restoreGlass] Target pane sash not found');
				return;
			}

			this.debugLog('[restoreGlass] Restoring to pane:', {
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
			this.bwinContext.addPane((targetPaneEl as HTMLElement).getAttribute(DATA_ATTRIBUTES.SASH_ID)!, {
				id: originalSashId,
				position: newPosition,
				size: newSize,
				...originalStore // Preserve title, content, and other Glass props
			});
		}
	}

	/**
	 * Cleanup all sill-related resources
	 *
	 * Removes click handler and clears sill element reference.
	 * Call this on component cleanup.
	 */
	destroy(): void {
		this.debugLog('[destroy] Cleaning up sill manager');
		this.removeClickHandler();
		this.sillElement = undefined;
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	/**
	 * Setup click handler for restoring minimized glasses from sill
	 */
	private setupClickHandler(): void {
		if (!this.sillElement) {
			this.debugWarn('[setupClickHandler] No sill element');
			return;
		}

		// Remove existing handler if any
		this.removeClickHandler();

		this.debugLog('[setupClickHandler] Setting up click handler on sill:', this.sillElement);

		this.clickHandler = (event: MouseEvent) => {
			this.debugLog('[Click] Click detected on sill:', {
				target: event.target,
				targetMatches: (event.target as HTMLElement).matches(`.${CSS_CLASSES.MINIMIZED_GLASS}`),
				targetClassName: (event.target as HTMLElement).className
			});

			if (!(event.target as HTMLElement).matches(`.${CSS_CLASSES.MINIMIZED_GLASS}`)) {
				this.debugLog('[Click] Target is not a minimized glass, ignoring');
				return;
			}

			this.debugLog('[Click] Restoring minimized glass...');
			const minimizedGlassEl = event.target as HTMLElement;
			this.restoreGlass(minimizedGlassEl);
			minimizedGlassEl.remove();
			this.debugLog('[Click] Minimized glass removed');
		};

		this.sillElement.addEventListener('click', this.clickHandler);
		this.debugLog('[setupClickHandler] Click listener attached to sill');
	}

	/**
	 * Remove click handler from sill element
	 */
	private removeClickHandler(): void {
		if (this.sillElement && this.clickHandler) {
			this.sillElement.removeEventListener('click', this.clickHandler);
			this.clickHandler = undefined;
			this.debugLog('[removeClickHandler] Click listener removed from sill');
		}
	}

	// ============================================================================
	// DEBUG UTILITIES
	// ============================================================================

	private debugLog(...args: unknown[]): void {
		this.debugger.log(...args);
	}

	private debugWarn(...args: unknown[]): void {
		this.debugger.warn(...args);
	}
}
