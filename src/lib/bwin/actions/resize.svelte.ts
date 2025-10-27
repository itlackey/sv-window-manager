import type { Action } from 'svelte/action';
import { on } from 'svelte/events';
import type { Sash } from '../sash.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { emitPaneEvent } from '../../events/dispatcher.js';
import { buildPanePayload } from '../../events/payload.js';

interface ResizeActionParams {
	rootSash: Sash;
	onUpdate?: () => void;
}

export const resize: Action<HTMLElement, ResizeActionParams> = (node, params) => {
	let { rootSash, onUpdate } = params;
	let activeMuntinSash: Sash | null = null;
	let isResizeStarted = false;
	let lastX = 0;
	let lastY = 0;

	// Store initial positions when drag starts to avoid compounding errors
	let initialLeftChildWidth = 0;
	let initialRightChildWidth = 0;
	let initialTopChildHeight = 0;
	let initialBottomChildHeight = 0;
	let initialMouseX = 0;
	let initialMouseY = 0;

	// RAF throttling for 60fps performance
	let rafId: number | null = null;
	let pendingUpdate = false;

	// Debounce for resize event emission (trailing)
	let debounceId: ReturnType<typeof setTimeout> | null = null;
	const DEBOUNCE_MS = 100;

	// Track the two leaf panes adjacent to the active muntin during drag
	let affectedLeft: Sash | null = null;
	let affectedRight: Sash | null = null;

	function applyResizeStyles(muntinEl: HTMLElement) {
		if (muntinEl.classList.contains('vertical')) {
			document.body.classList.add('body--bw-resize-x');
		} else if (muntinEl.classList.contains('horizontal')) {
			document.body.classList.add('body--bw-resize-y');
		}
	}

	function revertResizeStyles() {
		document.body.classList.remove('body--bw-resize-x');
		document.body.classList.remove('body--bw-resize-y');
	}

	function handleMouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.classList.contains(CSS_CLASSES.MUNTIN)) return;
		if (target.getAttribute(DATA_ATTRIBUTES.RESIZABLE) === 'false') return;

		const sashId = target.getAttribute(DATA_ATTRIBUTES.SASH_ID);
		if (!sashId) return;

		activeMuntinSash = rootSash.getById(sashId);
		if (!activeMuntinSash) return;

		isResizeStarted = true;
		lastX = event.pageX;
		lastY = event.pageY;

		// Capture initial positions to avoid compounding errors during drag
		initialMouseX = event.pageX;
		initialMouseY = event.pageY;

		const [topChild, rightChild, bottomChild, leftChild] = activeMuntinSash.getChildren();

		if (leftChild && rightChild) {
			initialLeftChildWidth = leftChild.width;
			initialRightChildWidth = rightChild.width;
		}

		if (topChild && bottomChild) {
			initialTopChildHeight = topChild.height;
			initialBottomChildHeight = bottomChild.height;
		}

		applyResizeStyles(target);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isResizeStarted || !activeMuntinSash) return;

		// Update last mouse position immediately
		lastX = event.pageX;
		lastY = event.pageY;

		// Skip if update already scheduled (RAF throttling)
		if (pendingUpdate) return;

		pendingUpdate = true;

		// Identify affected leaf panes for eventual emission
		[affectedLeft, affectedRight] = getAdjacentLeafPanes(activeMuntinSash);

		// Restart trailing debounce timer on every movement
		if (debounceId) clearTimeout(debounceId);
		debounceId = setTimeout(() => emitResizeEvents(), DEBOUNCE_MS);

		// Cancel any pending animation frame
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
		}

		// Schedule update for next animation frame (60fps max)
		rafId = requestAnimationFrame(() => {
			performResize();
			pendingUpdate = false;
			rafId = null;
		});
	}

	/**
	 * Perform the actual resize calculation
	 * Called by RAF throttler for smooth 60fps performance
	 *
	 * With reactive Sash, we only update sash properties - reactive style:
	 * directives in Pane/Muntin components automatically propagate changes to DOM.
	 */
	function performResize() {
		if (!activeMuntinSash) return;

		const [topChild, rightChild, bottomChild, leftChild] = activeMuntinSash.getChildren();

		const isVerticalMuntin = activeMuntinSash.isLeftRightSplit();
		const isHorizontalMuntin = activeMuntinSash.isTopBottomSplit();

		if (isVerticalMuntin && leftChild && rightChild) {
			// Calculate distance from initial mouse position, not from current sash positions
			// This prevents compounding errors as sash positions are updated during drag
			const distX = lastX - initialMouseX;

			const newLeftChildWidth = initialLeftChildWidth + distX;
			const newRightChildWidth = initialRightChildWidth - distX;

			if (distX > 0 && newRightChildWidth <= rightChild.calcMinWidth()) return;
			if (distX < 0 && newLeftChildWidth <= leftChild.calcMinWidth()) return;

			// Update reactive sash properties - Svelte's reactive styles handle DOM updates
			leftChild.width = newLeftChildWidth;
			rightChild.width = newRightChildWidth;
			rightChild.left = leftChild.left + newLeftChildWidth;
		} else if (isHorizontalMuntin && topChild && bottomChild) {
			// Calculate distance from initial mouse position, not from current sash positions
			// This prevents compounding errors as sash positions are updated during drag
			const distY = lastY - initialMouseY;

			const newTopChildHeight = initialTopChildHeight + distY;
			const newBottomChildHeight = initialBottomChildHeight - distY;

			if (distY > 0 && newBottomChildHeight <= bottomChild.calcMinHeight()) return;
			if (distY < 0 && newTopChildHeight <= topChild.calcMinHeight()) return;

			// Update reactive sash properties - Svelte's reactive styles handle DOM updates
			topChild.height = newTopChildHeight;
			bottomChild.height = newBottomChildHeight;
			bottomChild.top = topChild.top + newTopChildHeight;
		}
	}

	function handleMouseUp() {
		if (isResizeStarted) {
			// Cancel any pending RAF to ensure we don't update after cleanup
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			// Call optional onUpdate callback for backward compatibility
			// With reactive Sash, state is automatically saved
			onUpdate?.();

			// Ensure debounced resize emission fires shortly after mouseup
			if (debounceId) clearTimeout(debounceId);
			debounceId = setTimeout(() => emitResizeEvents(), DEBOUNCE_MS);
		}

		isResizeStarted = false;
		activeMuntinSash = null;
		pendingUpdate = false;

		revertResizeStyles();
	}

	function emitResizeEvents() {
		// Use the last known affected panes captured during drag; they remain valid
		const panes: (Sash | null)[] = [affectedLeft, affectedRight];
		for (const pane of panes) {
			if (!pane) continue;
			try {
				const el = document.querySelector(
					`.${CSS_CLASSES.PANE}[${DATA_ATTRIBUTES.SASH_ID}="${pane.id}"]`
				) as HTMLElement | null;
				const payload = buildPanePayload(pane, el);
				emitPaneEvent('onpaneresized', payload);
			} catch (err) {
				// ignore emission errors to keep UI responsive
			}
		}
	}

	function getAdjacentLeafPanes(muntin: Sash): [Sash | null, Sash | null] {
		const [topChild, rightChild, bottomChild, leftChild] = muntin.getChildren();
		if (leftChild && rightChild) {
			return [getEdgeLeaf(leftChild, 'right'), getEdgeLeaf(rightChild, 'left')];
		}
		if (topChild && bottomChild) {
			return [getEdgeLeaf(topChild, 'bottom'), getEdgeLeaf(bottomChild, 'top')];
		}
		return [null, null];
	}

	function getEdgeLeaf(node: Sash, edge: 'left' | 'right' | 'top' | 'bottom'): Sash | null {
		const leaves = node.getAllLeafDescendants();
		if (!leaves.length) return null;
		if (edge === 'left') {
			return leaves.reduce((best, cur) => (cur.left < (best?.left ?? Infinity) ? cur : best),
				leaves[0]);
		}
		if (edge === 'right') {
			return leaves.reduce((best, cur) => (cur.left + cur.width > (best ? best.left + best.width : -Infinity) ? cur : best), leaves[0]);
		}
		if (edge === 'top') {
			return leaves.reduce((best, cur) => (cur.top < (best?.top ?? Infinity) ? cur : best), leaves[0]);
		}
		// bottom
		return leaves.reduce((best, cur) => (cur.top + cur.height > (best ? best.top + best.height : -Infinity) ? cur : best), leaves[0]);
	}

	// Use svelte/events for automatic cleanup
	const cleanupMouseDown = on(document, 'mousedown', handleMouseDown);
	const cleanupMouseMove = on(document, 'mousemove', handleMouseMove);
	const cleanupMouseUp = on(document, 'mouseup', handleMouseUp);

	return {
		update(newParams: ResizeActionParams) {
			rootSash = newParams.rootSash;
			onUpdate = newParams.onUpdate;
		},
		destroy() {
			// Cancel any pending RAF
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			cleanupMouseDown();
			cleanupMouseMove();
			cleanupMouseUp();
			revertResizeStyles();
		}
	};
};
