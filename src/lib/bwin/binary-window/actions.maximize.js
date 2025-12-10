import { getMetricsFromElement } from '../utils.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { emitPaneEvent } from '../../events/dispatcher.js';
import { buildPanePayload } from '../../events/payload.js';

/**
 * @typedef {Object} BoundingRect
 * @property {number} left
 * @property {number} top
 * @property {number} width
 * @property {number} height
 */

/**
 * Extended HTMLElement with custom bwin properties for maximization
 * @typedef {HTMLElement & {
 *   bwOriginalBoundingRect?: BoundingRect;
 * }} BwinMaximizableElement
 */

export default {
	label: '',
	className: 'glass-action glass-action--maximize',
	onClick: (
		/** @type {MouseEvent} */ event,
		/** @type {import('../types.js').BwinContext} */ binaryWindow
	) => {
		if (!(event.target instanceof HTMLElement)) return;

		const paneElCandidate = event.target.closest(`.${CSS_CLASSES.PANE}`);
		if (!paneElCandidate || !(paneElCandidate instanceof HTMLElement)) return;

		/** @type {BwinMaximizableElement} */
		const paneEl = paneElCandidate;

		const sashId = paneEl.getAttribute(DATA_ATTRIBUTES.SASH_ID);
		const rootSash = binaryWindow?.rootSash;
		const sash = sashId ? rootSash?.getById(sashId) : null;

		if (paneEl.hasAttribute(DATA_ATTRIBUTES.MAXIMIZED)) {
			paneEl.removeAttribute(DATA_ATTRIBUTES.MAXIMIZED);
			if (paneEl.bwOriginalBoundingRect) {
				paneEl.style.left = `${paneEl.bwOriginalBoundingRect.left}px`;
				paneEl.style.top = `${paneEl.bwOriginalBoundingRect.top}px`;
				paneEl.style.width = `${paneEl.bwOriginalBoundingRect.width}px`;
				paneEl.style.height = `${paneEl.bwOriginalBoundingRect.height}px`;
			}

			// Emit restored after unmaximize
			if (sash) {
				const payload = buildPanePayload(sash, paneEl);
				emitPaneEvent('onpanerestored', payload);
			}
		} else {
			paneEl.setAttribute(DATA_ATTRIBUTES.MAXIMIZED, '');
			paneEl.bwOriginalBoundingRect = getMetricsFromElement(paneEl);
			paneEl.style.left = '0';
			paneEl.style.top = '0';
			paneEl.style.width = '100%';
			paneEl.style.height = '100%';

			// Emit maximized
			if (sash) {
				const payload = buildPanePayload(sash, paneEl);
				emitPaneEvent('onpanemaximized', payload);
			}
		}
	}
};
