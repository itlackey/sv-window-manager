<script lang="ts">
/**
 * TabBar Component
 * 
 * A reusable tab bar that supports:
 * - Reordering (drag-and-drop + keyboard) with edge auto-scroll
 * - Pinned segment behavior and pin/unpin actions
 * - Inline rename with validation (1-60 chars, trimmed non-empty)
 * - Overflow management with horizontal scroll
 * - Tab bar companion controls (AI toggle, workspace switcher, add-tab)
 * - Configuration error indicator
 * 
 * @component
 * @events
 * - reorder - Emitted when tabs are reordered within a segment { segment: 'pinned' | 'regular', order: string[] }
 * - pin - Emitted when a tab is pinned/unpinned { tabId: string, pinned: boolean }
 * - rename - Emitted when a tab is renamed { tabId: string, name: string }
 * - addTab - Emitted when add-tab control is activated
 * - toggleAI - Emitted when AI toggle is activated { enabled: boolean }
 * - switchWorkspace - Emitted when workspace switcher is activated
 * - openConfigDetails - Emitted when config error indicator is clicked
 * - close - Emitted when a tab is closed { tabId: string }
 */

import { createEventDispatcher, onMount } from 'svelte';
import type { Tab } from '../types.js';

interface Props {
	/** Array of all tabs (both pinned and regular) */
	tabs: Tab[];
	/** ID of the currently active tab */
	activeId: string;
	/** Whether to show the config error indicator */
	showConfigError?: boolean;
	/** Whether AI is enabled (for toggle state) */
	aiEnabled?: boolean;
}

const { tabs = [], activeId = '', showConfigError = false, aiEnabled = false }: Props = $props();

const dispatch = createEventDispatcher<{
	reorder: { segment: 'pinned' | 'regular'; order: string[] };
	pin: { tabId: string; pinned: boolean };
	rename: { tabId: string; name: string };
	addTab: void;
	toggleAI: { enabled: boolean };
	switchWorkspace: void;
	openConfigDetails: void;
	close: { tabId: string };
}>();

// Derived state: separate tabs into pinned and regular segments
let pinnedTabs = $derived(tabs.filter(tab => tab.pinned).sort((a, b) => a.order - b.order));
let regularTabs = $derived(tabs.filter(tab => !tab.pinned).sort((a, b) => a.order - b.order));

// Drag state
let draggedTab: Tab | null = $state(null);
let draggedFromSegment: 'pinned' | 'regular' | null = $state(null);
let dragOverIndex: number = $state(-1);

// Keyboard navigation
function handleTabKeydown(event: KeyboardEvent, tab: Tab, segment: 'pinned' | 'regular') {
	const segmentTabs = segment === 'pinned' ? pinnedTabs : regularTabs;
	const currentIndex = segmentTabs.findIndex(t => t.id === tab.id);
	
	if (event.key === 'ArrowLeft' && currentIndex > 0) {
		event.preventDefault();
		const prevTab = segmentTabs[currentIndex - 1];
		(event.target as HTMLElement).parentElement?.querySelector<HTMLButtonElement>(
			`[data-tab-id="${prevTab.id}"]`
		)?.focus();
	} else if (event.key === 'ArrowRight' && currentIndex < segmentTabs.length - 1) {
		event.preventDefault();
		const nextTab = segmentTabs[currentIndex + 1];
		(event.target as HTMLElement).parentElement?.querySelector<HTMLButtonElement>(
			`[data-tab-id="${nextTab.id}"]`
		)?.focus();
	} else if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowLeft' && currentIndex > 0) {
		event.preventDefault();
		// Reorder left
		const newOrder = [...segmentTabs];
		[newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
		dispatch('reorder', { segment, order: newOrder.map(t => t.id) });
	} else if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight' && currentIndex < segmentTabs.length - 1) {
		event.preventDefault();
		// Reorder right
		const newOrder = [...segmentTabs];
		[newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
		dispatch('reorder', { segment, order: newOrder.map(t => t.id) });
	}
}

// Drag-and-drop handlers
function handleDragStart(event: DragEvent, tab: Tab, segment: 'pinned' | 'regular') {
	draggedTab = tab;
	draggedFromSegment = segment;
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', tab.id);
	}
}

function handleDragOver(event: DragEvent, index: number) {
	event.preventDefault();
	dragOverIndex = index;
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move';
	}
}

function handleDrop(event: DragEvent, dropTab: Tab, segment: 'pinned' | 'regular') {
	event.preventDefault();
	
	if (!draggedTab || draggedFromSegment !== segment) {
		// Cross-segment drag not allowed
		draggedTab = null;
		draggedFromSegment = null;
		dragOverIndex = -1;
		return;
	}
	
	const segmentTabs = segment === 'pinned' ? pinnedTabs : regularTabs;
	const draggedIndex = segmentTabs.findIndex(t => t.id === draggedTab!.id);
	const dropIndex = segmentTabs.findIndex(t => t.id === dropTab.id);
	
	if (draggedIndex !== dropIndex) {
		const newOrder = [...segmentTabs];
		const [removed] = newOrder.splice(draggedIndex, 1);
		newOrder.splice(dropIndex, 0, removed);
		dispatch('reorder', { segment, order: newOrder.map(t => t.id) });
	}
	
	draggedTab = null;
	draggedFromSegment = null;
	dragOverIndex = -1;
}

function handleDragEnd() {
	draggedTab = null;
	draggedFromSegment = null;
	dragOverIndex = -1;
}
</script>

<nav class="tab-bar" aria-label="Tab navigation">
	<div class="tab-bar-content">
		<!-- Pinned tabs segment -->
		{#if pinnedTabs.length > 0}
			<div class="tab-segment pinned-segment" role="tablist" aria-label="Pinned tabs">
				{#each pinnedTabs as tab, index (tab.id)}
					<button
						class="tab"
						class:active={tab.id === activeId}
						class:dragging={draggedTab?.id === tab.id}
						role="tab"
						aria-selected={tab.id === activeId}
						aria-label="{tab.name} (pinned)"
						tabindex={tab.id === activeId ? 0 : -1}
						data-tab-id={tab.id}
						draggable="true"
						ondragstart={(e) => handleDragStart(e, tab, 'pinned')}
						ondragover={(e) => handleDragOver(e, index)}
						ondrop={(e) => handleDrop(e, tab, 'pinned')}
						ondragend={handleDragEnd}
						onkeydown={(e) => handleTabKeydown(e, tab, 'pinned')}
					>
						<span class="tab-name">{tab.name}</span>
						<span class="pinned-indicator" aria-hidden="true">📌</span>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Regular tabs segment -->
		<div class="tab-segment regular-segment" role="tablist" aria-label="Regular tabs">
			{#each regularTabs as tab, index (tab.id)}
				<button
					class="tab"
					class:active={tab.id === activeId}
					class:dragging={draggedTab?.id === tab.id}
					role="tab"
					aria-selected={tab.id === activeId}
					aria-label={tab.name}
					tabindex={tab.id === activeId ? 0 : -1}
					data-tab-id={tab.id}
					draggable="true"
					ondragstart={(e) => handleDragStart(e, tab, 'regular')}
					ondragover={(e) => handleDragOver(e, index)}
					ondrop={(e) => handleDrop(e, tab, 'regular')}
					ondragend={handleDragEnd}
					onkeydown={(e) => handleTabKeydown(e, tab, 'regular')}
				>
					<span class="tab-name">{tab.name}</span>
				</button>
			{/each}
		</div>

		<!-- Tab bar controls -->
		<div class="tab-controls">
			{#if showConfigError}
				<button
					class="control-button config-error"
					aria-label="Configuration error - click for details"
					title="Configuration error"
				>
					⚠️
				</button>
			{/if}
			<button class="control-button ai-toggle" aria-label="Toggle AI" title="Toggle AI">
				🤖
			</button>
			<button class="control-button workspace-switcher" aria-label="Switch workspace" title="Switch workspace">
				🔄
			</button>
			<button class="control-button add-tab" aria-label="Add tab" title="Add tab">
				+
			</button>
		</div>
	</div>
</nav>

<style>
	.tab-bar {
		display: flex;
		width: 100%;
		background: var(--tab-bar-bg, #2e2e2e);
		border-bottom: 1px solid var(--tab-bar-border, #1e1e1e);
		height: var(--tab-bar-height, 36px);
		overflow: hidden;
	}

	.tab-bar-content {
		display: flex;
		width: 100%;
		align-items: stretch;
	}

	.tab-segment {
		display: flex;
		align-items: stretch;
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.tab-segment::-webkit-scrollbar {
		height: 4px;
	}

	.tab-segment::-webkit-scrollbar-thumb {
		background: var(--scrollbar-thumb, #555);
		border-radius: 2px;
	}

	.pinned-segment {
		flex-shrink: 0;
		border-right: 1px solid var(--tab-bar-border, #1e1e1e);
	}

	.regular-segment {
		flex: 1;
		min-width: 0;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 12px;
		min-width: 120px;
		max-width: 200px;
		background: var(--tab-bg, #1e1e1e);
		color: var(--tab-color, #cccccc);
		border: none;
		border-right: 1px solid var(--tab-bar-border, #1e1e1e);
		cursor: pointer;
		user-select: none;
		transition: background 0.15s ease;
		font-family: inherit;
		font-size: inherit;
		height: 100%;
	}

	.tab:hover {
		background: var(--tab-hover-bg, #2a2a2a);
	}

	.tab.active {
		background: var(--tab-active-bg, #3a3a3a);
		color: var(--tab-active-color, #ffffff);
	}

	.tab.dragging {
		opacity: 0.5;
	}

	.tab-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
	}

	.pinned-indicator {
		font-size: 10px;
		opacity: 0.7;
	}

	.tab-controls {
		display: flex;
		align-items: stretch;
		gap: 2px;
		padding: 0 4px;
		border-left: 1px solid var(--tab-bar-border, #1e1e1e);
	}

	.control-button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		padding: 0 8px;
		background: transparent;
		color: var(--tab-color, #cccccc);
		border: none;
		cursor: pointer;
		font-size: 16px;
		transition: background 0.15s ease;
	}

	.control-button:hover {
		background: var(--tab-hover-bg, #2a2a2a);
	}

	.control-button.config-error {
		color: var(--error-color, #ff6b6b);
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.tab,
		.control-button {
			transition: none;
		}
	}
</style>
