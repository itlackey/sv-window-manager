import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { BwinErrors } from '../errors.js';

/**
 * Read `data-sash-id` attribute from the pane element
 *
 * @param {Element} innerElement - Element inside the pane element
 * @returns {string} - Sash ID
 */
export function getSashIdFromPane(innerElement) {
	if (innerElement.classList?.contains(CSS_CLASSES.PANE)) {
		const sashId = innerElement.getAttribute(DATA_ATTRIBUTES.SASH_ID);
		if (!sashId) {
			throw BwinErrors.paneElementMissingSashId();
		}
		return sashId;
	}

	const paneEl = innerElement.closest(`.${CSS_CLASSES.PANE}`);

	if (!paneEl) {
		throw BwinErrors.paneElementNotFound();
	}

	const sashId = paneEl.getAttribute(DATA_ATTRIBUTES.SASH_ID);
	if (!sashId) {
		throw BwinErrors.paneElementMissingSashId();
	}

	return sashId;
}
