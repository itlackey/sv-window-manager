import { createDomNode, getMetricsFromElement } from '../utils.js';

export default {
  label: '',
  className: 'glass-action glass-action--minimize',
  onClick: (/** @type {MouseEvent} */ event, /** @type {any} */ binaryWindow) => {
    if (!(event.target instanceof HTMLElement)) return;

    const sillEl = binaryWindow.getSillElement?.();
    if (!sillEl) throw new Error(`[bwin] Sill element not found when minimizing`);

    const minimizedGlassEl = createDomNode('<button class="bw-minimized-glass" />');
    sillEl.append(minimizedGlassEl);

    const paneEl = event.target.closest('.pane');
    const glassEl = event.target.closest('.glass');
    const paneSashId = paneEl?.getAttribute('data-sash-id');
    const panePosition = paneEl?.getAttribute('data-position');

    // Preserve the store (title, content, etc.) before removing the pane
    const rootSash = binaryWindow.getRootSash?.();
    const sash = rootSash?.getById(paneSashId);
    const store = { ...(sash?.store || {}) };

    // Extract title and content from the actual Glass DOM element to ensure we capture them
    const glassTitleEl = glassEl?.querySelector('.glass-title');
    const glassContentEl = glassEl?.querySelector('.glass-content');

    if (glassTitleEl && !store.title) {
      store.title = glassTitleEl.textContent;
    }
    if (glassContentEl && !store.content) {
      store.content = glassContentEl.innerHTML;
    }

    minimizedGlassEl.bwGlassElement = glassEl;
    minimizedGlassEl.bwOriginalPosition = panePosition;
    minimizedGlassEl.bwOriginalBoundingRect = getMetricsFromElement(paneEl);
    minimizedGlassEl.bwOriginalSashId = paneSashId;
    minimizedGlassEl.bwOriginalStore = store;

    binaryWindow.removePane(paneSashId);
  },
};
