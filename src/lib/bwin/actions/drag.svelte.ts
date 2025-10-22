import type { Action } from 'svelte/action';

interface DragActionParams {
  onDragStart?: (glassEl: HTMLElement) => void;
  onDragEnd?: (glassEl: HTMLElement) => void;
}

export const drag: Action<HTMLElement, DragActionParams> = (node, params = {}) => {
  let activeDragGlassEl: HTMLElement | null = null;
  let activeDragGlassPaneCanDrop = false;

  function handleMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (event.button !== 0 || !target.matches('bw-glass-header')) return;

    if (target.getAttribute('can-drag') === 'false') {
      // Chrome bug: use `event.preventDefault` to trigger `dragover` event
      // even if there's no `draggable` attribute set
      event.preventDefault();
      return;
    }

    const headerEl = target;
    const glassEl = headerEl.closest('bw-glass') as HTMLElement;
    if (!glassEl) return;

    glassEl.setAttribute('draggable', 'true');
    activeDragGlassEl = glassEl;
  }

  function handleMouseUp() {
    if (activeDragGlassEl) {
      activeDragGlassEl.removeAttribute('draggable');
      activeDragGlassEl = null;
    }
  }

  function handleDragStart(event: DragEvent) {
    const target = event.target as HTMLElement;
    if (!target.matches('bw-glass') || !activeDragGlassEl) {
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }

    const paneEl = activeDragGlassEl.closest('bw-pane') as HTMLElement;
    if (paneEl) {
      // Save original `can-drop` attribute for later carry-over
      activeDragGlassPaneCanDrop = paneEl.getAttribute('can-drop') !== 'false';
      paneEl.setAttribute('can-drop', 'false');
    }

    if (params.onDragStart) {
      params.onDragStart(activeDragGlassEl);
    }
  }

  function handleDragEnd() {
    if (activeDragGlassEl) {
      activeDragGlassEl.removeAttribute('draggable');
      // Carry over `can-drop` attribute
      const paneEl = activeDragGlassEl.closest('bw-pane') as HTMLElement;
      if (paneEl) {
        paneEl.setAttribute('can-drop', String(activeDragGlassPaneCanDrop));
      }

      if (params.onDragEnd) {
        params.onDragEnd(activeDragGlassEl);
      }

      activeDragGlassEl = null;
    }
  }

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  node.addEventListener('dragstart', handleDragStart);
  node.addEventListener('dragend', handleDragEnd);

  return {
    destroy() {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      node.removeEventListener('dragstart', handleDragStart);
      node.removeEventListener('dragend', handleDragEnd);
    }
  };
};
