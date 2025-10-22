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
    if (muntinEl.hasAttribute('vertical')) {
      document.body.classList.add('body--bw-resize-x');
    } else if (muntinEl.hasAttribute('horizontal')) {
      document.body.classList.add('body--bw-resize-y');
    }
  }

  function revertResizeStyles() {
    document.body.classList.remove('body--bw-resize-x');
    document.body.classList.remove('body--bw-resize-y');
  }

  function handleMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'BW-MUNTIN') return;
    if (target.getAttribute('resizable') === 'false') return;

    const sashId = target.getAttribute('sash-id');
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

      onUpdate();
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

      onUpdate();
      lastY = event.pageY;
    }
  }

  function handleMouseUp() {
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
