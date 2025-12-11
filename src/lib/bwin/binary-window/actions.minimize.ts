import { getMetricsFromElement } from '../utils.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { BwinErrors } from '../errors.js';
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
export interface BwinMinimizedElement extends HTMLElement {
	bwOriginalPosition?: string | null;
	bwOriginalBoundingRect?: BoundingRect;
	bwOriginalSashId?: string | null;
	bwOriginalStore?: Record<string, unknown>;
}

/**
 * Helper to check if icon is a URL (for image icons)
 */
function isImageUrl(value: string | null | undefined): boolean {
	if (!value) return false;
	return (
		value.startsWith('http://') ||
		value.startsWith('https://') ||
		value.startsWith('/') ||
		value.startsWith('data:image/')
	);
}

/**
 * Creates a minimized glass button element (plain DOM, no Svelte component)
 * This is simpler and avoids component lifecycle complexity.
 */
function createMinimizedGlassElement(title: string, icon: string | null): HTMLButtonElement {
	const button = document.createElement('button');
	button.className = CSS_CLASSES.MINIMIZED_GLASS;
	button.type = 'button';
	button.setAttribute('aria-label', `Restore ${title}`);
	button.title = `Restore ${title}`;

	// Add icon if provided
	if (icon) {
		const iconSpan = document.createElement('span');
		iconSpan.className = 'sw-minimized-glass-icon';

		if (isImageUrl(icon)) {
			const img = document.createElement('img');
			img.src = icon;
			img.alt = '';
			img.className = 'sw-minimized-glass-icon-img';
			iconSpan.appendChild(img);
		} else {
			// Emoji or HTML icon
			iconSpan.innerHTML = icon;
		}

		button.appendChild(iconSpan);
	}

	// Add title
	const titleSpan = document.createElement('span');
	titleSpan.className = 'sw-minimized-glass-title';
	titleSpan.textContent = title;
	button.appendChild(titleSpan);

	return button;
}

/**
 * Cleanup a minimized glass element by clearing stored references.
 * Simple cleanup since we use plain DOM elements (no Svelte unmount needed).
 */
export function cleanupMinimizedGlass(element: BwinMinimizedElement): void {
	// Clear references to allow garbage collection
	element.bwOriginalBoundingRect = undefined;
	element.bwOriginalStore = undefined;
	element.bwOriginalSashId = undefined;
	element.bwOriginalPosition = undefined;
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
			if (typeof binaryWindow.ensureSillElement === 'function') {
				sillEl = binaryWindow.ensureSillElement();
			}
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
			return;
		}

		const panePosition = paneEl?.getAttribute(DATA_ATTRIBUTES.POSITION);

		// Preserve the store (title, content, etc.) before removing the pane
		const rootSash = binaryWindow.rootSash;
		const sash = paneSashId ? rootSash?.getById(paneSashId) : null;
		const store = { ...(sash?.store || {}) };

		// Extract title and content from the actual Glass DOM element
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

		// Create minimized glass button (plain DOM element - no Svelte component)
		const minimizedGlassEl = createMinimizedGlassElement(
			paneTitle,
			paneIcon
		) as BwinMinimizedElement;

		// Store restoration data on the element
		minimizedGlassEl.bwOriginalPosition = panePosition;
		minimizedGlassEl.bwOriginalBoundingRect =
			paneEl instanceof HTMLElement ? getMetricsFromElement(paneEl) : undefined;
		minimizedGlassEl.bwOriginalSashId = paneSashId;
		minimizedGlassEl.bwOriginalStore = store;

		// Add to sill
		sillEl.appendChild(minimizedGlassEl);

		// Remove the pane
		if (paneSashId) {
			binaryWindow.removePane(paneSashId);

			try {
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
