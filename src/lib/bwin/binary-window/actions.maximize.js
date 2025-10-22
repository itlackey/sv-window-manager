import { getMetricsFromElement } from '../utils.js';

export default {
  label: '',
  className: 'glass-action glass-action--maximize',
  onClick: (event) => {
    const paneEl = event.target.closest('.pane');
    if (!paneEl) return;

    if (paneEl.hasAttribute('data-maximized')) {
      paneEl.removeAttribute('data-maximized');
      paneEl.style.left = `${paneEl.bwOriginalBoundingRect.left}px`;
      paneEl.style.top = `${paneEl.bwOriginalBoundingRect.top}px`;
      paneEl.style.width = `${paneEl.bwOriginalBoundingRect.width}px`;
      paneEl.style.height = `${paneEl.bwOriginalBoundingRect.height}px`;
    }
    else {
      paneEl.setAttribute('data-maximized', '');
      paneEl.bwOriginalBoundingRect = getMetricsFromElement(paneEl);
      paneEl.style.left = '0';
      paneEl.style.top = '0';
      paneEl.style.width = '100%';
      paneEl.style.height = '100%';
    }
  },
};
