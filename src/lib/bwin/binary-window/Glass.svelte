<script lang="ts">
  import type { Sash } from '../sash.js';
  import { BUILTIN_ACTIONS } from './actions.js';

  interface GlassProps {
    title?: string | HTMLElement | null;
    content?: string | HTMLElement | null;
    tabs?: (string | { label: string })[];
    actions?: any[] | boolean;
    draggable?: boolean;
    sash?: Sash;
    binaryWindow: any;
  }

  let {
    title = null,
    content = null,
    tabs = [],
    actions = undefined,
    draggable = true,
    sash,
    binaryWindow
  }: GlassProps = $props();

  let contentElement = $state<HTMLElement>();

  const finalActions = $derived(
    actions === undefined ? BUILTIN_ACTIONS : Array.isArray(actions) ? actions : []
  );

  function handleActionClick(event: MouseEvent, action: any) {
    if (typeof action === 'object' && typeof action.onClick === 'function') {
      action.onClick(event, binaryWindow);
    }
  }
</script>

<div class="glass">
  <header class="glass-header" data-can-drag={draggable}>
    {#if Array.isArray(tabs) && tabs.length > 0}
      <div class="glass-tabs">
        {#each tabs as tab}
          <button class="glass-tab">{typeof tab === 'string' ? tab : tab.label}</button>
        {/each}
      </div>
    {:else if title}
      <div class="glass-title">{title}</div>
    {/if}

    <div class="glass-actions">
      {#each finalActions as action}
        <button
          class="glass-action {action.className || ''}"
          onclick={(e) => handleActionClick(e, action)}
        >
          {typeof action === 'string' ? action : action.label}
        </button>
      {/each}
    </div>
  </header>

  <div class="glass-content" bind:this={contentElement}>
    {#if content}
      {@html content}
    {/if}
  </div>
</div>

<style>
  .glass {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .glass-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
  }

  .glass-content {
    flex: 1;
    overflow: auto;
  }

  .glass-actions {
    display: flex;
    gap: 0.25rem;
  }

  .glass-tabs {
    display: flex;
    gap: 0.25rem;
  }
</style>
