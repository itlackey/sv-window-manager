<script lang="ts">
  import { mount as svelteMount, unmount } from 'svelte';
  import { Position } from '../position.js';
  import { getMetricsFromElement } from '../utils.js';
  import { getSashIdFromPane } from '../frame/frame-utils.js';
  import { getIntersectRect } from '../rect.js';
  import Frame from '../frame/Frame.svelte';
  import Glass from './Glass.svelte';
  import { drag } from '../actions/drag.svelte';
  import { setContext } from 'svelte';
  import type { Sash } from '../sash.js';

  const DEBUG = import.meta.env.VITE_DEBUG == 'true' ? true : false;

  interface BinaryWindowProps {
    settings: any;
    debug?: boolean;
    oncreated?: () => void;
    onupdated?: () => void;
  }

  let {
    settings,
    debug = DEBUG,
    oncreated = () => {},
    onupdated = () => {}
  }: BinaryWindowProps = $props();

  // Frame component binding
  let frameComponent = $state<any>();
  let sillElement = $state<HTMLElement | undefined>();

  // State for muntin size (needed for trim)
  const muntinSize = 8;

  // Track glasses by sash ID
  let glassesBySashId = $state(new Map<string, { container: HTMLElement; instance: any }>());

  // Drag state
  let activeDragGlassEl = $state<HTMLElement | null>(null);

  // Provide context for child components via Frame
  const bwinContext = {
    get windowElement() { return frameComponent?.windowElement; },
    get sillElement() { return sillElement; },
    get rootSash() { return frameComponent?.rootSash; },
    removePane,
    addPane,
    getMinimizedGlassElementBySashId
  };

  setContext('bwin-context', bwinContext);

  // Create glass component for a pane
  function createGlassForPane(paneEl: HTMLElement, sash: Sash) {
    if (!paneEl) return;

    const glassProps = sash.store;
    const container = document.createElement('div');

    const glassInstance = svelteMount(Glass, {
      target: container,
      props: {
        ...glassProps,
        sash,
        binaryWindow: bwinContext
      }
    });

    glassesBySashId.set(sash.id, { container, instance: glassInstance });

    paneEl.innerHTML = '';
    const glassElement = container.firstElementChild;
    if (glassElement) {
      paneEl.append(glassElement);
    }

    if (debug) {
      const contentEl = paneEl.querySelector('.glass-content');
      if (contentEl) {
        contentEl.prepend(document.createTextNode(sash.id));
      }
    }
  }

  // Pane render callback
  function handlePaneRender(paneEl: HTMLElement, sash: Sash) {
    createGlassForPane(paneEl, sash);
  }

  // Muntin render callback - apply trim
  function handleMuntinRender(muntinEl: HTMLElement, sash: Sash) {
    trimMuntin(muntinEl);
  }

  // Trim muntin (adjust muntin position to create gap)
  function trimMuntin(muntinEl: HTMLElement) {
    if (muntinEl.classList.contains('vertical')) {
      muntinEl.style.top = `${parseFloat(muntinEl.style.top) + muntinSize / 2}px`;
      muntinEl.style.height = `${parseFloat(muntinEl.style.height) - muntinSize}px`;
    } else if (muntinEl.classList.contains('horizontal')) {
      muntinEl.style.left = `${parseFloat(muntinEl.style.left) + muntinSize / 2}px`;
      muntinEl.style.width = `${parseFloat(muntinEl.style.width) - muntinSize}px`;
    }
  }

  // Pane drop callback - handle glass dragging
  function handlePaneDrop(event: DragEvent, sash: Sash, dropArea: string) {
    if (!activeDragGlassEl || !frameComponent?.windowElement) return;

    const activeDropPaneEl = frameComponent.windowElement.querySelector('.pane[data-drop-area]');
    if (!activeDropPaneEl) return;

    const actualDropArea = activeDropPaneEl.getAttribute('data-drop-area');

    // Swap the content of the two panes
    if (actualDropArea === 'center') {
      const sourcePaneEl = activeDragGlassEl.closest('.pane');
      frameComponent.swapPanes(sourcePaneEl, activeDropPaneEl);
      return;
    }
    // Add the pane of glass next to the current pane, vertically or horizontally
    else {
      const oldSashId = getSashIdFromPane(activeDragGlassEl);
      removePane(oldSashId);

      const newPaneSash = addPane(sash.id, { position: actualDropArea, id: oldSashId });
      if (newPaneSash.domNode) {
        newPaneSash.domNode.append(activeDragGlassEl);
      }
    }
  }

  // Drag action callbacks
  function handleDragStart(glassEl: HTMLElement) {
    activeDragGlassEl = glassEl;
  }

  function handleDragEnd(_glassEl: HTMLElement) {
    activeDragGlassEl = null;
  }

  // Public API - delegate to Frame
  export function addPane(targetPaneSashId: string, props: any) {
    const { position, size, id, ...glassProps } = props;

    if (!frameComponent) throw new Error('[bwin] Frame not initialized');

    const newPaneSash = frameComponent.addPane(targetPaneSashId, { position, size, id });

    // Create and mount Glass component
    if (newPaneSash.domNode) {
      createGlassForPane(newPaneSash.domNode, newPaneSash);
    }

    return newPaneSash;
  }

  export function removePane(sashId: string) {
    if (!frameComponent) return;

    const paneEl = frameComponent.windowElement?.querySelector(`[data-sash-id="${sashId}"]`);

    if (paneEl) {
      // Cleanup glass component if it exists
      const glassData = glassesBySashId.get(sashId);
      if (glassData) {
        unmount(glassData.instance);
        glassesBySashId.delete(sashId);
      }

      frameComponent.removePane(sashId);
      return;
    }

    // Remove minimized glass element if pane is minimized
    const minimizedGlassEl = getMinimizedGlassElementBySashId(sashId);
    if (minimizedGlassEl) {
      (minimizedGlassEl as HTMLElement).remove();
    }
  }

  export function fit() {
    frameComponent?.fit();
  }

  export function mount(containerEl: HTMLElement) {
    frameComponent?.mount(containerEl);
  }

  // Restore minimized glass
  function restoreGlass(minimizedGlassEl: any) {
    if (!frameComponent?.windowElement || !frameComponent?.rootSash) return;

    const originalRect = minimizedGlassEl.bwOriginalBoundingRect;
    let biggestIntersectArea = 0;
    let targetPaneEl: HTMLElement | null = null;

    frameComponent.windowElement.querySelectorAll('.pane').forEach((paneEl: HTMLElement) => {
      const paneRect = getMetricsFromElement(paneEl);
      const intersectRect = getIntersectRect(originalRect, paneRect);

      if (intersectRect) {
        const intersectArea = intersectRect.width * intersectRect.height;

        if (intersectArea > biggestIntersectArea) {
          biggestIntersectArea = intersectArea;
          targetPaneEl = paneEl;
        }
      }
    });

    if (targetPaneEl && frameComponent?.rootSash) {
      const newPosition = minimizedGlassEl.bwOriginalPosition;
      const targetRect = getMetricsFromElement(targetPaneEl);
      const targetPaneSashId = (targetPaneEl as HTMLElement).getAttribute('data-sash-id');
      const targetPaneSash = frameComponent.rootSash.getById(targetPaneSashId);

      let newSize = 0;

      if (newPosition === Position.Left || newPosition === Position.Right) {
        newSize =
          targetRect.width - originalRect.width < targetPaneSash.minWidth
            ? targetRect.width / 2
            : originalRect.width;
      } else if (newPosition === Position.Top || newPosition === Position.Bottom) {
        newSize =
          targetRect.height - originalRect.height < targetPaneSash.minHeight
            ? targetRect.height / 2
            : originalRect.height;
      } else {
        throw new Error('[bwin] Invalid position when restoring glass');
      }

      const originalSashId = minimizedGlassEl.bwOriginalSashId;
      const newSashPane = addPane((targetPaneEl as HTMLElement).getAttribute('data-sash-id')!, {
        id: originalSashId,
        position: newPosition,
        size: newSize
      });
      if (newSashPane.domNode) {
        newSashPane.domNode.append(minimizedGlassEl.bwGlassElement);
      }
    }
  }

  // Get minimized glass element by sash ID
  function getMinimizedGlassElementBySashId(sashId: string) {
    if (!frameComponent?.windowElement) return null;
    const els = frameComponent.windowElement.querySelectorAll('.bw-minimized-glass');
    return Array.from(els).find((el: any) => el.bwOriginalSashId === sashId);
  }

  // Update disabled state of action buttons
  function updateDisabledStateOfActionButtons() {
    updateDisabledState('.glass-action--close');
    updateDisabledState('.glass-action--minimize');
    updateDisabledState('.glass-action--maximize');
  }

  function updateDisabledState(cssSelector: string) {
    if (!frameComponent?.windowElement) return;

    const paneCount = frameComponent.windowElement.querySelectorAll('.pane').length;

    if (paneCount === 1) {
      const el = frameComponent.windowElement.querySelector(cssSelector);
      el && el.setAttribute('disabled', '');
    } else {
      frameComponent.windowElement.querySelectorAll(cssSelector).forEach((el: HTMLElement) => {
        el.removeAttribute('disabled');
      });
    }
  }

  // Observe action buttons to update disabled state
  $effect(() => {
    if (!frameComponent?.windowElement) return;

    updateDisabledStateOfActionButtons();

    const paneCountObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          updateDisabledStateOfActionButtons();
        }
      });
    });

    paneCountObserver.observe(frameComponent.windowElement, {
      childList: true
    });

    return () => {
      paneCountObserver.disconnect();
    };
  });

  // Create and append sill element
  $effect(() => {
    if (frameComponent?.windowElement && !sillElement) {
      const sillEl = document.createElement('div');
      sillEl.className = 'sill';
      frameComponent.windowElement.append(sillEl);
      sillElement = sillEl;
    }
  });

  // Handle sill click for minimized glasses
  $effect(() => {
    if (!sillElement) return;

    function handleClick(event: MouseEvent) {
      if (!(event.target as HTMLElement).matches('.bw-minimized-glass')) return;

      const minimizedGlassEl = event.target;
      restoreGlass(minimizedGlassEl);
      (minimizedGlassEl as HTMLElement).remove();
    }

    sillElement.addEventListener('click', handleClick);

    return () => {
      sillElement?.removeEventListener('click', handleClick);
    };
  });

  // Cleanup all glasses on destroy
  $effect(() => {
    return () => {
      glassesBySashId.forEach((glassData) => {
        unmount(glassData.instance);
      });
      glassesBySashId.clear();
    };
  });

  // Expose public properties as getters
  export function getRootSash() {
    return frameComponent?.rootSash;
  }

  export function getWindowElement() {
    return frameComponent?.windowElement;
  }

  export function getContainerElement() {
    return frameComponent?.containerElement;
  }

  export function getSillElement() {
    return sillElement;
  }

  export function getDebug() {
    return debug;
  }
</script>

<div
  use:drag={{
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd
  }}
>
  <Frame
    bind:this={frameComponent}
    {settings}
    {debug}
    oncreated={oncreated}
    onupdated={onupdated}
    onPaneRender={handlePaneRender}
    onMuntinRender={handleMuntinRender}
    onPaneDrop={handlePaneDrop}
  />
</div>

<style>
  /* Styles are handled by the global CSS files */
</style>
