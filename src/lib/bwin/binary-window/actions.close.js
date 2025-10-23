import { getSashIdFromPane } from '../frame/frame-utils.js';

export default {
  label: '',
  className: 'glass-action glass-action--close',
  onClick: (/** @type {MouseEvent} */ event, /** @type {any} */ binaryWindow) => {
    if (!(event.target instanceof HTMLElement)) return;
    const sashId = getSashIdFromPane(event.target);
    binaryWindow.removePane(sashId);
  },
};
