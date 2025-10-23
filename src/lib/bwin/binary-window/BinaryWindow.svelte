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
    fitContainer?: boolean;
    oncreated?: () => void;
    onupdated?: () => void;
  }

  let {
    settings,
    debug = DEBUG,
    fitContainer = true, // Default to true for responsive behavior
    oncreated = () => {},
    onupdated = () => {}
  }: BinaryWindowProps = $props();

  // Support fitContainer from settings object (like bwin.js) or from prop
  const shouldFitContainer = $derived(settings?.fitContainer ?? fitContainer);

  // Frame component binding
  let frameComponent = $state<any>();
  let sillElement = $state<HTMLElement | undefined>();
  let rootElement = $state<HTMLElement | undefined>();

  // State for muntin size (needed for trim)
  const muntinSize = 8;

  // Tree version counter - increments whenever panes are added/removed
  // This allows parent components to reactively track tree changes
  let treeVersion = $state(0);

  // Track glasses by sash ID
  let glassesBySashId = $state(new Map<string, { container: HTMLElement; instance: any }>());

  // Drag state
  let activeDragGlassEl = $state<HTMLElement | null>(null);

  // Provide context for child components via Frame
  const bwinContext = {
    get windowElement() { return frameComponent?.windowElement; },
    get sillElement() { return sillElement; },
    getSillElement: () => sillElement,
    get rootSash() { return frameComponent?.rootSash; },
    removePane,
    addPane,
    getMinimizedGlassElementBySashId
  };

  setContext('bwin-context', bwinContext);

  // Create glass component for a pane
  function createGlassForPane(paneEl: HTMLElement, sash: Sash) {
    if (!paneEl) return;

    // Cleanup existing glass instance for this sash if it exists
    // This happens when Frame re-renders and recreates pane elements
    const existingGlass = glassesBySashId.get(sash.id);
    if (existingGlass) {
      unmount(existingGlass.instance);
      glassesBySashId.delete(sash.id);
    }

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

      // Preserve the store (title, content, etc.) before removing the pane
      const oldSash = frameComponent.rootSash?.getById(oldSashId);
      const oldStore = oldSash?.store || {};

      // Save reference to the glass element before removing the pane
      const glassToMove = activeDragGlassEl;

      removePane(oldSashId);

      // Add new pane with preserved store
      const newPaneSash = addPane(sash.id, {
        position: actualDropArea,
        id: oldSashId,
        ...oldStore  // Preserve title, content, and other Glass props
      });

      // The new pane already has a Glass component created by addPane
      // No need to append the old glass element - the new one has the correct store
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

    // Store glass props (title, content, etc.) in the sash's store
    newPaneSash.store = glassProps;

    // Create and mount Glass component
    if (newPaneSash.domNode) {
      createGlassForPane(newPaneSash.domNode, newPaneSash);
    }

    // Increment tree version to trigger reactive updates
    treeVersion++;

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

      // Increment tree version to trigger reactive updates
      treeVersion++;
      return;
    }

    // Remove minimized glass element if pane is minimized
    const minimizedGlassEl = getMinimizedGlassElementBySashId(sashId);
    if (minimizedGlassEl) {
      (minimizedGlassEl as HTMLElement).remove();
      // Increment tree version to trigger reactive updates
      treeVersion++;
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
    console.log('[restoreGlass] Starting restore:', {
      minimizedGlassEl,
      hasWindowElement: !!frameComponent?.windowElement,
      hasRootSash: !!frameComponent?.rootSash,
      originalBoundingRect: minimizedGlassEl.bwOriginalBoundingRect,
      originalSashId: minimizedGlassEl.bwOriginalSashId,
      originalPosition: minimizedGlassEl.bwOriginalPosition,
      glassElement: minimizedGlassEl.bwGlassElement
    });

    if (!frameComponent?.windowElement || !frameComponent?.rootSash) {
      console.error('[restoreGlass] Missing required components');
      return;
    }

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

    console.log('[restoreGlass] Target pane found:', {
      targetPaneEl,
      biggestIntersectArea
    });

    if (targetPaneEl && frameComponent?.rootSash) {
      const newPosition = minimizedGlassEl.bwOriginalPosition;
      const targetRect = getMetricsFromElement(targetPaneEl);
      const targetPaneSashId = (targetPaneEl as HTMLElement).getAttribute('data-sash-id');
      const targetPaneSash = frameComponent.rootSash.getById(targetPaneSashId);

      console.log('[restoreGlass] Restoring to pane:', {
        targetPaneSashId,
        newPosition,
        targetRect
      });

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
      const originalStore = minimizedGlassEl.bwOriginalStore || {};

      // addPane will create a new Glass component with the preserved store
      addPane((targetPaneEl as HTMLElement).getAttribute('data-sash-id')!, {
        id: originalSashId,
        position: newPosition,
        size: newSize,
        ...originalStore  // Preserve title, content, and other Glass props
      });
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

  // Create and append sill element inside window element
  $effect(() => {
    if (frameComponent?.windowElement && !sillElement) {
      const sillEl = document.createElement('div');
      sillEl.className = 'sill';
      frameComponent.windowElement.append(sillEl);
      sillElement = sillEl;
      console.log('[Sill] Created and appended sill element:', {
        sillEl,
        parent: frameComponent.windowElement,
        computedStyles: window.getComputedStyle(sillEl)
      });
    }
  });

  // Handle sill click for minimized glasses
  $effect(() => {
    if (!sillElement) {
      console.warn('[Sill Click Handler] No sill element, skipping click handler setup');
      return;
    }

    console.log('[Sill Click Handler] Setting up click handler on sill:', sillElement);

    function handleClick(event: MouseEvent) {
      console.log('[Sill Click] Click detected on sill:', {
        target: event.target,
        targetMatches: (event.target as HTMLElement).matches('.bw-minimized-glass'),
        targetClassName: (event.target as HTMLElement).className
      });

      if (!(event.target as HTMLElement).matches('.bw-minimized-glass')) {
        console.log('[Sill Click] Target is not a minimized glass, ignoring');
        return;
      }

      console.log('[Sill Click] Restoring minimized glass...');
      const minimizedGlassEl = event.target;
      restoreGlass(minimizedGlassEl);
      (minimizedGlassEl as HTMLElement).remove();
      console.log('[Sill Click] Minimized glass removed from sill');
    }

    sillElement.addEventListener('click', handleClick);
    console.log('[Sill Click Handler] Click listener attached to sill');

    return () => {
      sillElement?.removeEventListener('click', handleClick);
      console.log('[Sill Click Handler] Click listener removed from sill');
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

  // Observe parent container size changes and update rootSash dimensions
  // This matches the bwin.js fitContainer feature implementation
  $effect(() => {
    if (!shouldFitContainer || !rootElement || !frameComponent?.rootSash) return;

    const containerElement = rootElement.parentElement;
    if (!containerElement) return;

    // Mount the container element so fit() can work properly
    frameComponent.mount(containerElement);

    // Use requestAnimationFrame to ensure container has rendered and has final dimensions
    // This fixes the initial load issue where clientWidth/Height might be 0
    requestAnimationFrame(() => {
      if (!frameComponent?.rootSash) return;

      // Set initial dimensions from container (matches bwin.js fit() method)
      const width = containerElement.clientWidth;
      const height = containerElement.clientHeight;

      console.log('[fitContainer] Initial setup:', {
        containerElement: containerElement,
        width,
        height,
        rootElementParent: rootElement?.parentElement,
        frameComponentWindowElement: frameComponent?.windowElement,
        currentRootSashDimensions: {
          width: frameComponent.rootSash.width,
          height: frameComponent.rootSash.height
        }
      });

      if (width > 0 && height > 0) {
        // Set defaults if not provided
        if (!settings.width) settings.width = width;
        if (!settings.height) settings.height = height;

        frameComponent.rootSash.width = width;
        frameComponent.rootSash.height = height;
        frameComponent.fit();

        console.log('[fitContainer] Set dimensions:', { width, height });
      } else {
        console.warn('[fitContainer] Invalid dimensions, skipping fit');
      }
    });

    // Watch for container size changes (matches bwin.js enableFitContainer)
    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          if (entry.target === containerElement && shouldFitContainer && frameComponent?.rootSash) {
            const width = containerElement.clientWidth;
            const height = containerElement.clientHeight;

            if (width > 0 && height > 0) {
              frameComponent.rootSash.width = width;
              frameComponent.rootSash.height = height;
              frameComponent.fit();
            }
          }
        }
      });
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
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

  export function getTreeVersion() {
    return treeVersion;
  }
</script>

<div
  bind:this={rootElement}
  class="bw-container"
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
  .bw-container {
    position: relative;
    width: 100%;
    height: 100%;
    /* Allow sill to overflow below the window without being clipped */
    overflow: visible;
  }
</style>
