import type { Action } from 'svelte/action';

interface ResizeActionParams {
  rootSash: any;
  onUpdate: () => void;
}

export const resize: Action<HTMLElement, ResizeActionParams> = (node, params) => {
  let { rootSash, onUpdate } = params;
  let activeMuntinSash: any = null;
  let isResizeStarted = false;
  let lastX = 0;
  let lastY = 0;

  function applyResizeStyles(muntinEl: HTMLElement) {
    if (muntinEl.classList.contains('vertical')) {
      document.body.classList.add('body--bw-resize-x');
    } else if (muntinEl.classList.contains('horizontal')) {
      document.body.classList.add('body--bw-resize-y');
    }
  }

  function revertResizeStyles() {
    document.body.classList.remove('body--bw-resize-x');
    document.body.classList.remove('body--bw-resize-y');
  }

  function handleMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('muntin')) return;
    if (target.getAttribute('data-resizable') === 'false') return;

    const sashId = target.getAttribute('data-sash-id');
    if (!sashId) return;

    activeMuntinSash = rootSash.getById(sashId);
    if (!activeMuntinSash) return;

    isResizeStarted = true;
    lastX = event.pageX;
    lastY = event.pageY;

    applyResizeStyles(target);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isResizeStarted || !activeMuntinSash) return;

    const [topChild, rightChild, bottomChild, leftChild] = activeMuntinSash.getChildren();

    const isVerticalMuntin = activeMuntinSash.isLeftRightSplit();
    const isHorizontalMuntin = activeMuntinSash.isTopBottomSplit();

    if (isVerticalMuntin && leftChild && rightChild) {
      const distX = event.pageX - lastX;

      const newLeftChildWidth = leftChild.width + distX;
      const newRightChildWidth = rightChild.width - distX;

      if (distX > 0 && newRightChildWidth <= rightChild.calcMinWidth()) return;
      if (distX < 0 && newLeftChildWidth <= leftChild.calcMinWidth()) return;

      leftChild.width = newLeftChildWidth;
      rightChild.width = newRightChildWidth;
      rightChild.left = rightChild.left + distX;

      // Update DOM directly during drag for smooth resizing
      updatePaneAndMuntinStyles(leftChild);
      updatePaneAndMuntinStyles(rightChild);

      lastX = event.pageX;
    } else if (isHorizontalMuntin && topChild && bottomChild) {
      const distY = event.pageY - lastY;

      const newTopChildHeight = topChild.height + distY;
      const newBottomChildHeight = bottomChild.height - distY;

      if (distY > 0 && newBottomChildHeight <= bottomChild.calcMinHeight()) return;
      if (distY < 0 && newTopChildHeight <= topChild.calcMinHeight()) return;

      topChild.height = newTopChildHeight;
      bottomChild.height = newBottomChildHeight;
      bottomChild.top = bottomChild.top + distY;

      // Update DOM directly during drag for smooth resizing
      updatePaneAndMuntinStyles(topChild);
      updatePaneAndMuntinStyles(bottomChild);

      lastY = event.pageY;
    }
  }

  function updatePaneAndMuntinStyles(sash: any) {
    // Update pane element if it exists
    const paneEl = document.querySelector(`[data-sash-id="${sash.id}"].pane`) as HTMLElement;
    if (paneEl) {
      paneEl.style.top = `${sash.top}px`;
      paneEl.style.left = `${sash.left}px`;
      paneEl.style.width = `${sash.width}px`;
      paneEl.style.height = `${sash.height}px`;
    }

    // Update child muntins recursively
    sash.walk((childSash: any) => {
      if (childSash.children.length > 0) {
        // This is a muntin
        const muntinEl = document.querySelector(`[data-sash-id="${childSash.id}"].muntin`) as HTMLElement;
        if (muntinEl) {
          updateMuntinElement(muntinEl, childSash);
        }
      } else {
        // This is a pane
        const childPaneEl = document.querySelector(`[data-sash-id="${childSash.id}"].pane`) as HTMLElement;
        if (childPaneEl) {
          childPaneEl.style.top = `${childSash.top}px`;
          childPaneEl.style.left = `${childSash.left}px`;
          childPaneEl.style.width = `${childSash.width}px`;
          childPaneEl.style.height = `${childSash.height}px`;
        }
      }
    });
  }

  function updateMuntinElement(muntinEl: HTMLElement, sash: any) {
    const muntinSize = 4; // Default muntin size from Muntin.svelte
    const trimSize = 8; // Trim size from BinaryWindow
    const isVertical = !!sash.leftChild;
    const isHorizontal = !!sash.topChild;

    if (isVertical) {
      muntinEl.style.width = `${muntinSize}px`;
      muntinEl.style.height = `${sash.height - trimSize}px`;
      muntinEl.style.top = `${sash.top + trimSize / 2}px`;
      muntinEl.style.left = `${sash.left + sash.leftChild.width - muntinSize / 2}px`;
    } else if (isHorizontal) {
      muntinEl.style.width = `${sash.width - trimSize}px`;
      muntinEl.style.height = `${muntinSize}px`;
      muntinEl.style.top = `${sash.top + sash.topChild.height - muntinSize / 2}px`;
      muntinEl.style.left = `${sash.left + trimSize / 2}px`;
    }
  }

  function handleMouseUp() {
    if (isResizeStarted) {
      // Call onUpdate only once when resize is complete
      // This ensures the sash tree state is properly saved
      onUpdate();
    }

    isResizeStarted = false;
    activeMuntinSash = null;
    revertResizeStyles();
  }

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  return {
    update(newParams: ResizeActionParams) {
      rootSash = newParams.rootSash;
      onUpdate = newParams.onUpdate;
    },
    destroy() {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      revertResizeStyles();
    }
  };
};
