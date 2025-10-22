/**
 * Read `data-sash-id` attribute from the pane element
 *
 * @param {Element} innerElement - Element inside the pane element
 * @returns {string} - Sash ID
 */
export function getSashIdFromPane(innerElement) {
  if (innerElement.classList?.contains('pane')) {
    return innerElement.getAttribute('data-sash-id');
  }

  const paneEl = innerElement.closest('.pane');

  if (!paneEl) {
    throw new Error('[bwin] Pane element not found');
  }

  return paneEl.getAttribute('data-sash-id');
}
