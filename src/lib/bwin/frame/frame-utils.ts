import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
import { BwinErrors } from '../errors.js';

/**
 * Read `data-sash-id` attribute from the pane element
 *
 * This function finds the sash ID associated with a pane element. It can handle
 * both direct pane elements and child elements within a pane by traversing up
 * the DOM tree using `closest()`.
 *
 * @param innerElement - Element inside or the pane element itself
 * @returns The sash ID attribute value
 * @throws {BwinError} PANE_ELEMENT_NOT_FOUND - If no pane element is found in the DOM tree
 * @throws {BwinError} PANE_MISSING_SASH_ID - If the pane element lacks a data-sash-id attribute
 *
 * @example
 * ```typescript
 * // Direct pane element
 * const paneEl = document.querySelector('.pane');
 * const sashId = getSashIdFromPane(paneEl); // → "AB-123"
 *
 * // Child element within pane
 * const button = paneEl.querySelector('button');
 * const sashId = getSashIdFromPane(button); // → "AB-123" (traverses up to pane)
 * ```
 */
export function getSashIdFromPane(innerElement: Element): string {
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
