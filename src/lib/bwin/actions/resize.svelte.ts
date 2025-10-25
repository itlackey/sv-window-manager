import type { Action } from 'svelte/action';
import { on } from 'svelte/events';
import type { Sash } from '../sash.js';
import { MUNTIN_SIZE, TRIM_SIZE, CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';

interface ResizeActionParams {
	rootSash: Sash;
	onUpdate: () => void;
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

	// DOM element cache to avoid repeated queries
	// Using regular Map (not SvelteMap) intentionally - this is a non-reactive
	// performance optimization cache that's cleared on mouseup. Reactivity would hurt performance.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const domCache = new Map<string, HTMLElement>();

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

	/**
	 * Get cached DOM element to avoid repeated queries
	 * Cache is cleared on mouseup to ensure fresh elements on next resize
	 */
	function getCachedElement(sashId: string, selector: 'pane' | 'muntin'): HTMLElement | null {
		const key = `${sashId}:${selector}`;
		if (!domCache.has(key)) {
			const className = selector === 'pane' ? CSS_CLASSES.PANE : CSS_CLASSES.MUNTIN;
			const el = document.querySelector(`[${DATA_ATTRIBUTES.SASH_ID}="${sashId}"].${className}`);
			if (el) domCache.set(key, el as HTMLElement);
		}
		return domCache.get(key) || null;
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
	 * Perform the actual resize calculation and DOM updates
	 * Called by RAF throttler for smooth 60fps performance
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

			leftChild.width = newLeftChildWidth;
			rightChild.width = newRightChildWidth;
			rightChild.left = leftChild.left + newLeftChildWidth;

			// Update DOM directly during drag for smooth resizing
			updatePaneAndMuntinStyles(leftChild);
			updatePaneAndMuntinStyles(rightChild);
		} else if (isHorizontalMuntin && topChild && bottomChild) {
			// Calculate distance from initial mouse position, not from current sash positions
			// This prevents compounding errors as sash positions are updated during drag
			const distY = lastY - initialMouseY;

			const newTopChildHeight = initialTopChildHeight + distY;
			const newBottomChildHeight = initialBottomChildHeight - distY;

			if (distY > 0 && newBottomChildHeight <= bottomChild.calcMinHeight()) return;
			if (distY < 0 && newTopChildHeight <= topChild.calcMinHeight()) return;

			topChild.height = newTopChildHeight;
			bottomChild.height = newBottomChildHeight;
			bottomChild.top = topChild.top + newTopChildHeight;

			// Update DOM directly during drag for smooth resizing
			updatePaneAndMuntinStyles(topChild);
			updatePaneAndMuntinStyles(bottomChild);
		}
	}

	/**
	 * Update pane and muntin styles in the DOM
	 * Uses cached elements and batched style updates for performance
	 */
	function updatePaneAndMuntinStyles(sash: Sash) {
		// Update pane element if it exists (use cache)
		const paneEl = getCachedElement(sash.id, 'pane');
		if (paneEl) {
			// Batch all style updates in single cssText assignment
			paneEl.style.cssText = `top: ${sash.top}px; left: ${sash.left}px; width: ${sash.width}px; height: ${sash.height}px;`;
		}

		// Update child muntins and panes recursively
		sash.walk((childSash: Sash) => {
			if (childSash.children.length > 0) {
				// This is a muntin - use cache
				const muntinEl = getCachedElement(childSash.id, 'muntin');
				if (muntinEl) {
					updateMuntinElement(muntinEl, childSash);
				}
			} else {
				// This is a pane - use cache
				const childPaneEl = getCachedElement(childSash.id, 'pane');
				if (childPaneEl) {
					// Batch all style updates in single cssText assignment
					childPaneEl.style.cssText = `top: ${childSash.top}px; left: ${childSash.left}px; width: ${childSash.width}px; height: ${childSash.height}px;`;
				}
			}
		});
	}

	/**
	 * Update muntin element styles
	 * Uses batched cssText updates for better performance
	 */
	function updateMuntinElement(muntinEl: HTMLElement, sash: Sash) {
		const isVertical = !!sash.leftChild;
		const isHorizontal = !!sash.topChild;

		if (isVertical) {
			// Batch all style updates in single cssText assignment
			muntinEl.style.cssText = `width: ${MUNTIN_SIZE}px; height: ${sash.height - TRIM_SIZE}px; top: ${sash.top + TRIM_SIZE / 2}px; left: ${sash.left + sash.leftChild.width - MUNTIN_SIZE / 2}px;`;
		} else if (isHorizontal) {
			// Batch all style updates in single cssText assignment
			muntinEl.style.cssText = `width: ${sash.width - TRIM_SIZE}px; height: ${MUNTIN_SIZE}px; top: ${sash.top + sash.topChild.height - MUNTIN_SIZE / 2}px; left: ${sash.left + TRIM_SIZE / 2}px;`;
		}
	}

	function handleMouseUp() {
		if (isResizeStarted) {
			// Cancel any pending RAF to ensure we don't update after cleanup
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			// Call onUpdate only once when resize is complete
			// This ensures the sash tree state is properly saved
			onUpdate();
		}

		isResizeStarted = false;
		activeMuntinSash = null;
		pendingUpdate = false;

		// Clear DOM cache - ensures fresh elements on next resize
		domCache.clear();

		revertResizeStyles();
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

			// Clear DOM cache
			domCache.clear();

			cleanupMouseDown();
			cleanupMouseMove();
			cleanupMouseUp();
			revertResizeStyles();
		}
	};
};
