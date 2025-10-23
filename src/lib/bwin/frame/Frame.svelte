<script lang="ts">
  import type { Sash } from '../sash.js';
  import { SashConfig } from '../config/sash-config.js';
  import { ConfigRoot } from '../config/config-root.js';
  import { setContext } from 'svelte';
  import { addPaneSash } from './pane-utils.js';
  import { genId } from '../utils.js';
  import { Position } from '../position.js';
  import Pane from './Pane.svelte';
  import Muntin from './Muntin.svelte';
  import { resize } from '../actions/resize.svelte';
  import { drop } from '../actions/drop.svelte';

  interface FrameProps {
    settings: SashConfig | ConfigRoot | any;
    debug?: boolean;
    oncreated?: () => void;
    onupdated?: () => void;
    onPaneRender?: (paneEl: HTMLElement, sash: Sash) => void;
    onMuntinRender?: (muntinEl: HTMLElement, sash: Sash) => void;
    onPaneDrop?: (event: DragEvent, sash: Sash, dropArea: string) => void;
  }

  let {
    settings,
    debug = false,
    oncreated = () => {},
    onupdated = () => {},
    onPaneRender,
    onMuntinRender,
    onPaneDrop
  }: FrameProps = $props();

  // Force re-render trigger
  let updateCounter = $state(0);
  function triggerUpdate() {
    updateCounter++;
  }

  // Initialize sash tree from settings
  let rootSash = $derived.by(() => {
    if (settings instanceof SashConfig) {
      return settings;
    }
    const config = new ConfigRoot(settings);
    return config.buildSashTree({ resizeStrategy: config.resizeStrategy });
  });

  // Collect panes and muntins from tree
  const panes = $derived.by(() => {
    // Access updateCounter to create dependency
    updateCounter;
    if (!rootSash) return [];
    const result: Sash[] = [];
    rootSash.walk((sash) => {
      if (sash.children.length === 0) result.push(sash);
    });
    return result;
  });

  const muntins = $derived.by(() => {
    // Access updateCounter to create dependency
    updateCounter;
    if (!rootSash) return [];
    const result: Sash[] = [];
    rootSash.walk((sash) => {
      if (sash.children.length > 0) result.push(sash);
    });
    return result;
  });

  // DOM element references
  let windowElement = $state<HTMLElement | undefined>();
  let containerElement = $state<HTMLElement | undefined>();

  // Share context
  setContext('frame', { debug });

  // Public API
  export function addPane(targetId: string, options: any) {
    const { position, size, id } = options;
    if (!position || !rootSash) return null;

    const targetSash = rootSash.getById(targetId);
    if (!targetSash) return null;

    const newSash = addPaneSash(targetSash, { position, size, id });
    triggerUpdate();
    return newSash;
  }

  export function removePane(id: string) {
    if (!rootSash) return;

    const parentSash = rootSash.getDescendantParentById(id);
    if (!parentSash) return;

    const siblingSash = parentSash.getChildSiblingById(id);
    if (!siblingSash) return;

    if (siblingSash.children.length === 0) {
      parentSash.id = siblingSash.id;
      parentSash.domNode = siblingSash.domNode;
      parentSash.store = siblingSash.store;
      parentSash.children = [];
    } else {
      parentSash.id = genId();
      parentSash.children = siblingSash.children;

      if (siblingSash.position === Position.Left || siblingSash.position === Position.Right) {
        siblingSash.width = parentSash.width;
        if (siblingSash.position === Position.Right) {
          siblingSash.left = parentSash.left;
        }
      } else {
        siblingSash.height = parentSash.height;
        if (siblingSash.position === Position.Bottom) {
          siblingSash.top = parentSash.top;
        }
      }
    }

    triggerUpdate();
  }

  export function swapPanes(sourcePaneEl: HTMLElement | Element | null, targetPaneEl: HTMLElement | Element | null) {
    if (!sourcePaneEl || !targetPaneEl || !rootSash) return;

    // Swap the stores in the sashes
    const sourceSashId = (sourcePaneEl as HTMLElement).getAttribute('data-sash-id');
    const targetSashId = (targetPaneEl as HTMLElement).getAttribute('data-sash-id');

    if (sourceSashId && targetSashId) {
      const sourceSash = rootSash.getById(sourceSashId);
      const targetSash = rootSash.getById(targetSashId);

      if (sourceSash && targetSash) {
        // Swap stores
        const tempStore = sourceSash.store;
        sourceSash.store = targetSash.store;
        targetSash.store = tempStore;

        // Trigger a re-render so Glass components get recreated with swapped stores
        triggerUpdate();
      }
    }
  }

  export function mount(containerEl: HTMLElement) {
    containerElement = containerEl;
  }

  export function fit() {
    if (!containerElement || !rootSash) return;
    rootSash.width = containerElement.clientWidth;
    rootSash.height = containerElement.clientHeight;
    triggerUpdate();
  }

  export { rootSash, windowElement, containerElement };
</script>

{#if rootSash}
  {#key updateCounter}
    <div
      bind:this={windowElement}
      class="window"
      data-root-sash-id={rootSash.id}
      use:resize={{ rootSash, onUpdate: triggerUpdate }}
      use:drop={{ rootSash, onDrop: onPaneDrop }}
    >
      {#each panes as sash (sash.id)}
        <Pane {sash} {onPaneRender} />
      {/each}

      {#each muntins as sash (sash.id)}
        <Muntin {sash} {onMuntinRender} />
      {/each}
    </div>
  {/key}
{/if}
