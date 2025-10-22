import { getSashIdFromPane } from '../frame/frame-utils.js';

export default {
  label: '',
  className: 'bw-glass-action--close',
  onClick: (event, binaryWindow) => {
    const sashId = getSashIdFromPane(event.target);
    binaryWindow.removePane(sashId);
  },
};
