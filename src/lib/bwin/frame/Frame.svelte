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
    if (!rootSash) return [];
    const result: Sash[] = [];
    rootSash.walk((sash) => {
      if (sash.children.length === 0) result.push(sash);
    });
    return result;
  });

  const muntins = $derived.by(() => {
    if (!rootSash) return [];
    const result: Sash[] = [];
    rootSash.walk((sash) => {
      if (sash.children.length > 0) result.push(sash);
    });
    return result;
  });

  // Force re-render trigger
  let updateCounter = $state(0);
  function triggerUpdate() {
    updateCounter++;
  }

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

  export { rootSash };
</script>

{#if rootSash}
  {#key updateCounter}
    <div
      class="window"
      data-root-sash-id={rootSash.id}
      style:width="{rootSash.width}px"
      style:height="{rootSash.height}px"
      use:resize={{ rootSash, onUpdate: triggerUpdate }}
      use:drop={{ rootSash, onDrop: () => {} }}
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
