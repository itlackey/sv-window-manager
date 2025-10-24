import { createDomNode, getMetricsFromElement } from '../utils.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { BwinErrors } from '../errors.js';

/**
 * @typedef {Object} BoundingRect
 * @property {number} left
 * @property {number} top
 * @property {number} width
 * @property {number} height
 */

/**
 * Extended HTMLElement with custom bwin properties
 * @typedef {HTMLElement & {
 *   bwGlassElement?: Element | null;
 *   bwOriginalPosition?: string | null;
 *   bwOriginalBoundingRect?: BoundingRect;
 *   bwOriginalSashId?: string | null;
 *   bwOriginalStore?: Record<string, any>;
 * }} BwinMinimizedElement
 */

export default {
	label: '',
	className: 'glass-action glass-action--minimize',
	onClick: (/** @type {MouseEvent} */ event, /** @type {any} */ binaryWindow) => {
		if (!(event.target instanceof HTMLElement)) return;

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

		const paneEl = event.target.closest(`.${CSS_CLASSES.PANE}`);
		const glassEl = event.target.closest(`.${CSS_CLASSES.GLASS}`);
		const paneSashId = paneEl?.getAttribute(DATA_ATTRIBUTES.SASH_ID);
		const panePosition = paneEl?.getAttribute(DATA_ATTRIBUTES.POSITION);

		// Preserve the store (title, content, etc.) before removing the pane
		const rootSash = binaryWindow.getRootSash?.();
		const sash = rootSash?.getById(paneSashId);
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

		const paneTitle = store.title || 'Untitled';
		const minimizedGlassNode = createDomNode(
			`<button class="${CSS_CLASSES.MINIMIZED_GLASS}" type="button" aria-label="Restore ${paneTitle}" title="Restore ${paneTitle}" />`
		);
		if (!(minimizedGlassNode instanceof HTMLElement)) {
			throw BwinErrors.minimizedGlassCreationFailed();
		}

		/** @type {BwinMinimizedElement} */
		const minimizedGlassEl = minimizedGlassNode;
		sillEl.append(minimizedGlassEl);

		minimizedGlassEl.bwGlassElement = glassEl;
		minimizedGlassEl.bwOriginalPosition = panePosition;
		minimizedGlassEl.bwOriginalBoundingRect =
			paneEl instanceof HTMLElement ? getMetricsFromElement(paneEl) : undefined;
		minimizedGlassEl.bwOriginalSashId = paneSashId;
		minimizedGlassEl.bwOriginalStore = store;

		if (paneSashId) {
			binaryWindow.removePane(paneSashId);
		}
	}
};
