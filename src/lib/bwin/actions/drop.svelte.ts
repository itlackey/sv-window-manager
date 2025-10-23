import type { Action } from 'svelte/action';
import { getCursorPosition } from '../position.js';

interface DropActionParams {
  rootSash: any;
  onDrop?: (event: DragEvent, sash: any, dropArea: string) => void;
}

export const drop: Action<HTMLElement, DropActionParams> = (node, params) => {
  let { rootSash, onDrop } = params;
  let activeDropPaneEl: HTMLElement | null = null;

  function handleDragOver(event: DragEvent) {
    // `preventDefault` is required to allow drop
    event.preventDefault();

    const target = event.target as HTMLElement;
    const paneEl = target.matches('.pane')
      ? target
      : target.closest('.pane') as HTMLElement;

    if (!paneEl) return;

    if (paneEl !== activeDropPaneEl) {
      if (activeDropPaneEl) {
        activeDropPaneEl.removeAttribute('data-drop-area');
      }
      activeDropPaneEl = paneEl;
    }

    if (paneEl.getAttribute('data-can-drop') === 'false') return;

    const position = getCursorPosition(paneEl, event);
    paneEl.setAttribute('data-drop-area', position);
  }

  function handleDragLeave(event: DragEvent) {
    // Prevent `dragleave` from triggering on child elements in Chrome
    const relatedTarget = event.relatedTarget as Node;
    if (
      event.currentTarget &&
      (event.currentTarget as HTMLElement).contains(relatedTarget) &&
      event.currentTarget !== relatedTarget
    ) {
      return;
    }

    if (activeDropPaneEl) {
      activeDropPaneEl.removeAttribute('data-drop-area');
      activeDropPaneEl = null;
    }
  }

  function handleDrop(event: DragEvent) {
    if (!activeDropPaneEl) return;
    if (activeDropPaneEl.getAttribute('data-can-drop') === 'false') return;

    const sashId = activeDropPaneEl.getAttribute('data-sash-id');
    if (!sashId) return;

    const sash = rootSash.getById(sashId);
    const dropArea = activeDropPaneEl.getAttribute('data-drop-area') || '';

    if (onDrop && sash) {
      onDrop(event, sash, dropArea);
    }

    if (typeof sash?.store?.onDrop === 'function') {
      sash.store.onDrop(event, sash);
    }

    activeDropPaneEl.removeAttribute('data-drop-area');
    activeDropPaneEl = null;
  }

  node.addEventListener('dragover', handleDragOver);
  node.addEventListener('dragleave', handleDragLeave);
  node.addEventListener('drop', handleDrop);

  return {
    update(newParams: DropActionParams) {
      rootSash = newParams.rootSash;
      onDrop = newParams.onDrop;
    },
    destroy() {
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
      if (activeDropPaneEl) {
        activeDropPaneEl.removeAttribute('data-drop-area');
      }
    }
  };
};
