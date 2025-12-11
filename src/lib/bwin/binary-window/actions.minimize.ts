import { mount } from 'svelte';
import { getMetricsFromElement } from '../utils.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { BwinErrors } from '../errors.js';
import MinimizedGlass from './MinimizedGlass.svelte';
import { emitPaneEvent } from '../../events/dispatcher.js';
import { buildPanePayload } from '../../events/payload.js';
import type { BwinContext } from '../types.js';

/**
 * Bounding rectangle coordinates
 */
interface BoundingRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Extended HTMLElement with custom bwin properties for minimized glass restoration
 */
interface BwinMinimizedElement extends HTMLElement {
	bwGlassElement?: Element | null;
	bwOriginalPosition?: string | null;
	bwOriginalBoundingRect?: BoundingRect;
	bwOriginalSashId?: string | null;
	bwOriginalStore?: Record<string, unknown>;
}

/**
 * Glass action configuration for minimizing panes
 */
export default {
	label: '',
	className: 'glass-action glass-action--minimize',
	onClick: (event: MouseEvent, binaryWindow: BwinContext) => {
		if (!(event.target instanceof HTMLElement)) return;

		// Get pane info first to check if already minimized
		const paneEl = event.target.closest(`.${CSS_CLASSES.PANE}`);
		const glassEl = event.target.closest(`.${CSS_CLASSES.GLASS}`);
		const paneSashId = paneEl?.getAttribute(DATA_ATTRIBUTES.SASH_ID);

		// Early return if no sash ID
		if (!paneSashId) return;

		let sillEl = binaryWindow.getSillElement?.();

		// If sill doesn't exist, ensure it's created before proceeding
		if (!sillEl) {
			// Call ensureSillElement if available to create/retrieve sill element
			if (typeof binaryWindow.ensureSillElement === 'function') {
				sillEl = binaryWindow.ensureSillElement();
			}

			// If still no sill element, throw error
			if (!sillEl) {
				throw BwinErrors.sillElementNotFound();
			}
		}

		// Check if this pane is already minimized (prevent duplicates)
		const existingMinimized = sillEl.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`);
		const alreadyMinimized = Array.from(existingMinimized).some(
			(el) => (el as BwinMinimizedElement).bwOriginalSashId === paneSashId
		);
		if (alreadyMinimized) {
			// Already minimized, don't create duplicate
			return;
		}
		const panePosition = paneEl?.getAttribute(DATA_ATTRIBUTES.POSITION);

		// Preserve the store (title, content, etc.) before removing the pane
		const rootSash = binaryWindow.rootSash;
		const sash = paneSashId ? rootSash?.getById(paneSashId) : null;
		const store = { ...(sash?.store || {}) };

		// Extract title and content from the actual Glass DOM element to ensure we capture them
		const glassTitleEl = glassEl?.querySelector(`.${CSS_CLASSES.GLASS_TITLE}`);
		const glassContentEl = glassEl?.querySelector(`.${CSS_CLASSES.GLASS_CONTENT}`);

		if (glassTitleEl && !store.title) {
			store.title = glassTitleEl.textContent;
		}
		if (glassContentEl && !store.content) {
			store.content = glassContentEl.innerHTML;
		}

		const paneTitle = (store.title as string) || 'Untitled';
		const paneIcon = (store.icon as string) || null;

		// Create MinimizedGlass component using Svelte's mount API
		const minimizedContainer = document.createElement('div');

		mount(MinimizedGlass, {
			target: minimizedContainer,
			props: {
				title: paneTitle,
				icon: paneIcon,
				onclick: () => {
					// Restore logic will be handled by the sill manager's click handler
					// which queries for .bw-minimized-glass elements
				}
			}
		});

		// Extract the button element from the container
		const minimizedGlassNode = minimizedContainer.firstElementChild;

		if (!(minimizedGlassNode instanceof HTMLElement)) {
			throw BwinErrors.minimizedGlassCreationFailed();
		}

		const minimizedGlassEl = minimizedGlassNode as BwinMinimizedElement;
		sillEl.append(minimizedGlassEl);

		// Store restoration data on the element
		minimizedGlassEl.bwGlassElement = glassEl;
		minimizedGlassEl.bwOriginalPosition = panePosition;
		minimizedGlassEl.bwOriginalBoundingRect =
			paneEl instanceof HTMLElement ? getMetricsFromElement(paneEl) : undefined;
		minimizedGlassEl.bwOriginalSashId = paneSashId;
		minimizedGlassEl.bwOriginalStore = store;

		if (paneSashId) {
			// Perform removal first per spec (post-action emission)
			binaryWindow.removePane(paneSashId);

			try {
				// Emit minimized using pre-removal sash and pane element bounds
				if (sash) {
					const payload = buildPanePayload(sash, paneEl as HTMLElement | null);
					payload.state = 'minimized';
					emitPaneEvent('onpaneminimized', payload);
				}
			} catch (err) {
				 
				console.warn('[minimize] failed to emit onpaneminimized', err);
			}
		}
	}
};
