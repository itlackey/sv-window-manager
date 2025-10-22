import { getSashIdFromPane } from '../frame/frame-utils.js';

export default {
  label: '',
  className: 'glass-action glass-action--close',
  onClick: (/** @type {{ target: Element; }} */ event, /** @type {any} */ binaryWindow) => {
    const sashId = getSashIdFromPane(event.target);
    binaryWindow.removePane(sashId);
  },
};
