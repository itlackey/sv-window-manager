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
	 * - activate - Emitted when a tab is clicked or activated via keyboard { tabId: string }
	 * - reorder - Emitted when tabs are reordered within a segment { segment: 'pinned' | 'regular', order: string[] }
	 * - pin - Emitted when a tab is pinned/unpinned { tabId: string, pinned: boolean }
	 * - rename - Emitted when a tab is renamed { tabId: string, name: string }
	 * - addTab - Emitted when add-tab control is activated
	 * - toggleAI - Emitted when AI toggle is activated { enabled: boolean }
	 * - switchWorkspace - Emitted when workspace switcher is activated
	 * - openConfigDetails - Emitted when config error indicator is clicked
	 * - close - Emitted when a tab is closed { tabId: string }
	 */

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
		/** Event callback when a tab is activated */
		onactivate?: (event: { tabId: string }) => void;
		/** Event callback when tabs are reordered */
		onreorder?: (event: { segment: 'pinned' | 'regular'; order: string[] }) => void;
		/** Event callback when a tab is pinned/unpinned */
		onpin?: (event: { tabId: string; pinned: boolean }) => void;
		/** Event callback when a tab is renamed */
		onrename?: (event: { tabId: string; name: string }) => void;
		/** Event callback when add-tab is clicked */
		onaddTab?: () => void;
		/** Event callback when AI toggle is clicked */
		ontoggleAI?: (event: { enabled: boolean }) => void;
		/** Event callback when workspace switcher is clicked */
		onswitchWorkspace?: () => void;
		/** Event callback when config error indicator is clicked */
		onopenConfigDetails?: () => void;
		/** Event callback when a tab is closed */
		onclose?: (event: { tabId: string }) => void;
		/** Event callback when background preset is selected */
		onbackgroundPreset?: (event: { tabId: string; preset: string }) => void;
	}

	const {
		tabs = [],
		activeId = '',
		showConfigError = false,
		aiEnabled = false,
		onactivate,
		onreorder,
		onpin,
		onrename,
		onaddTab,
		ontoggleAI,
		onswitchWorkspace,
		onopenConfigDetails,
		onclose,
		onbackgroundPreset
	}: Props = $props();

	// Derived state: separate tabs into pinned and regular segments
	let pinnedTabs = $derived(tabs.filter((tab) => tab.pinned).sort((a, b) => a.order - b.order));
	let regularTabs = $derived(tabs.filter((tab) => !tab.pinned).sort((a, b) => a.order - b.order));

	// Drag state
	let draggedTab: Tab | null = $state(null);
	let draggedFromSegment: 'pinned' | 'regular' | null = $state(null); // Rename state (US2)
	let editingTabId: string | null = $state(null);
	let editingValue: string = $state('');
	let validationError: string | null = $state(null);

	// Context menu state (US3)
	let contextMenuTab: Tab | null = $state(null);
	let contextMenuX: number = $state(0);
	let contextMenuY: number = $state(0);
	let showBackgroundPresetsSubmenu: boolean = $state(false);

	// Focus management after reorder
	let tabToRefocus: string | null = $state(null);

	// Effect to refocus tab after reorder
	$effect(() => {
		if (tabToRefocus) {
			const element = document.querySelector(`[data-tab-id="${tabToRefocus}"]`) as HTMLElement;
			if (element) {
				element.focus();
				tabToRefocus = null;
			}
		}
	});

	// Tab activation handler
	function handleTabClick(tab: Tab) {
		onactivate?.({ tabId: tab.id });
	}

	// Keyboard navigation
	function handleTabKeydown(event: KeyboardEvent, tab: Tab, segment: 'pinned' | 'regular') {
		const segmentTabs = segment === 'pinned' ? pinnedTabs : regularTabs;
		const currentIndex = segmentTabs.findIndex((t) => t.id === tab.id);
		// Reorder with Ctrl/Cmd+Arrow (check this FIRST before plain arrows)
		if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowLeft' && currentIndex > 0) {
			event.preventDefault();
			// Reorder left
			const newOrder = [...segmentTabs];
			[newOrder[currentIndex], newOrder[currentIndex - 1]] = [
				newOrder[currentIndex - 1],
				newOrder[currentIndex]
			];
			tabToRefocus = tab.id; // Mark for refocus after parent updates tabs
			onreorder?.({ segment, order: newOrder.map((t) => t.id) });
		} else if (
			(event.ctrlKey || event.metaKey) &&
			event.key === 'ArrowRight' &&
			currentIndex < segmentTabs.length - 1
		) {
			event.preventDefault();
			// Reorder right
			const newOrder = [...segmentTabs];
			[newOrder[currentIndex], newOrder[currentIndex + 1]] = [
				newOrder[currentIndex + 1],
				newOrder[currentIndex]
			];
			tabToRefocus = tab.id; // Mark for refocus after parent updates tabs
			onreorder?.({ segment, order: newOrder.map((t) => t.id) });
		}
		// Navigate with arrow keys (move focus without activating)
		else if (event.key === 'ArrowLeft' && currentIndex > 0) {
			event.preventDefault();
			const prevTab = segmentTabs[currentIndex - 1];
			(event.target as HTMLElement).parentElement
				?.querySelector<HTMLButtonElement>(`[data-tab-id="${prevTab.id}"]`)
				?.focus();
		} else if (event.key === 'ArrowRight' && currentIndex < segmentTabs.length - 1) {
			event.preventDefault();
			const nextTab = segmentTabs[currentIndex + 1];
			(event.target as HTMLElement).parentElement
				?.querySelector<HTMLButtonElement>(`[data-tab-id="${nextTab.id}"]`)
				?.focus();
		}
		// Activate tab with Enter or Space
		else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onactivate?.({ tabId: tab.id });
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

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
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
			return;
		}

		const segmentTabs = segment === 'pinned' ? pinnedTabs : regularTabs;
		const draggedIndex = segmentTabs.findIndex((t) => t.id === draggedTab!.id);
		const dropIndex = segmentTabs.findIndex((t) => t.id === dropTab.id);

		if (draggedIndex !== dropIndex) {
			const newOrder = [...segmentTabs];
			const [removed] = newOrder.splice(draggedIndex, 1);
			newOrder.splice(dropIndex, 0, removed);
			onreorder?.({ segment, order: newOrder.map((t) => t.id) });
		}

		draggedTab = null;
		draggedFromSegment = null;
	}

	function handleDragEnd() {
		draggedTab = null;
		draggedFromSegment = null;
	} // Rename handlers (US2: T021-T023)
	function startRename(tab: Tab) {
		editingTabId = tab.id;
		editingValue = tab.name;
		validationError = null;

		// Focus and select the input after render
		setTimeout(() => {
			const input = document.querySelector(`[data-rename-id="${tab.id}"]`) as HTMLInputElement;
			if (input) {
				input.focus();
				input.select();
			}
		}, 0);
	}

	function validateName(name: string): string | null {
		const trimmed = name.trim();

		if (trimmed.length === 0) {
			return 'Tab name cannot be empty';
		}

		if (trimmed.length > 60) {
			return 'Tab name must be 60 characters or less';
		}

		return null;
	}

	function commitRename() {
		if (!editingTabId) return;

		const trimmed = editingValue.trim();
		const error = validateName(trimmed);

		if (error) {
			validationError = error;
			return; // Stay in edit mode with error
		}

		// Emit rename event with title sync hook
		onrename?.({ tabId: editingTabId, name: trimmed });

		// Exit edit mode
		editingTabId = null;
		editingValue = '';
		validationError = null;
	}

	function cancelRename() {
		editingTabId = null;
		editingValue = '';
		validationError = null;
	}

	function handleRenameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitRename();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelRename();
		}
	}

	function handleRenameBlur() {
		// Commit on blur (unless there's a validation error)
		if (!validationError) {
			commitRename();
		}
	}

	// Pin/unpin handlers (US3: T027)
	function togglePin(tab: Tab) {
		onpin?.({ tabId: tab.id, pinned: !tab.pinned });
	}

	// Control button handlers (US3: T029)
	function handleAddTabClick() {
		onaddTab?.();
	}

	function handleToggleAIClick() {
		ontoggleAI?.({ enabled: !aiEnabled });
	}

	function handleSwitchWorkspaceClick() {
		onswitchWorkspace?.();
	}

	function handleOpenConfigDetailsClick() {
		onopenConfigDetails?.();
	}

	// Close handler (US3: T038)
	function handleCloseTab(tab: Tab) {
		onclose?.({ tabId: tab.id });
	} // Context menu handler (US3: T041-T043)
	function handleContextMenu(event: MouseEvent, tab: Tab) {
		event.preventDefault();
		contextMenuTab = tab;
		contextMenuX = event.clientX;
		contextMenuY = event.clientY;
	}

	function closeContextMenu() {
		contextMenuTab = null;
		showBackgroundPresetsSubmenu = false;
	}

	function toggleBackgroundPresetsSubmenu() {
		showBackgroundPresetsSubmenu = !showBackgroundPresetsSubmenu;
	}

	function handleBackgroundPreset(preset: string) {
		if (contextMenuTab) {
			onbackgroundPreset?.({ tabId: contextMenuTab.id, preset });
			closeContextMenu();
		}
	}

	function handlePinFromMenu() {
		if (contextMenuTab) {
			togglePin(contextMenuTab);
			closeContextMenu();
		}
	}

	function handleCopyTabId() {
		if (contextMenuTab) {
			navigator.clipboard.writeText(contextMenuTab.id);
			closeContextMenu();
		}
	}

	function handleCloseFromMenu() {
		if (contextMenuTab) {
			handleCloseTab(contextMenuTab);
			closeContextMenu();
		}
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
						class:editing={editingTabId === tab.id}
						role="tab"
						aria-selected={tab.id === activeId}
						aria-label="{tab.name} (pinned)"
						tabindex={tab.id === activeId ? 0 : -1}
						data-tab-id={tab.id}
						draggable={editingTabId !== tab.id ? 'true' : 'false'}
						ondragstart={(e) => handleDragStart(e, tab, 'pinned')}
						ondragover={(e) => handleDragOver(e, index)}
						ondrop={(e) => handleDrop(e, tab, 'pinned')}
						ondragend={handleDragEnd}
						onkeydown={(e) => handleTabKeydown(e, tab, 'pinned')}
						ondblclick={() => startRename(tab)}
						oncontextmenu={(e) => handleContextMenu(e, tab)}
					>
						{#if editingTabId === tab.id}
							<input
								type="text"
								class="tab-name-input"
								class:error={validationError !== null}
								bind:value={editingValue}
								data-rename-id={tab.id}
								onkeydown={handleRenameKeydown}
								onblur={handleRenameBlur}
								aria-label="Rename tab"
								aria-invalid={validationError !== null}
								aria-describedby={validationError ? `error-${tab.id}` : undefined}
								maxlength="65"
							/>
							{#if validationError}
								<span class="validation-error" id="error-{tab.id}" role="alert" aria-live="polite">
									{validationError}
								</span>
							{/if}
						{:else}
							<span class="tab-name">{tab.name}</span>
							<span class="pinned-indicator" aria-hidden="true">📌</span>
							<span
								class="tab-close"
								role="button"
								tabindex="-1"
								aria-label="Close {tab.name}"
								title="Close tab"
								onmousedown={(e) => {
									e.stopPropagation();
									handleCloseTab(tab);
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.stopPropagation();
										e.preventDefault();
										handleCloseTab(tab);
									}
								}}
							>
								×
							</span>
						{/if}
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
					class:editing={editingTabId === tab.id}
					role="tab"
					aria-selected={tab.id === activeId}
					aria-label={tab.name}
					tabindex={tab.id === activeId ? 0 : -1}
					data-tab-id={tab.id}
					draggable={editingTabId !== tab.id ? 'true' : 'false'}
					onclick={() => handleTabClick(tab)}
					ondragstart={(e) => handleDragStart(e, tab, 'regular')}
					ondragover={(e) => handleDragOver(e, index)}
					ondrop={(e) => handleDrop(e, tab, 'regular')}
					ondragend={handleDragEnd}
					onkeydown={(e) => handleTabKeydown(e, tab, 'regular')}
					ondblclick={() => startRename(tab)}
					oncontextmenu={(e) => handleContextMenu(e, tab)}
				>
					{#if editingTabId === tab.id}
						<input
							type="text"
							class="tab-name-input"
							class:error={validationError !== null}
							bind:value={editingValue}
							data-rename-id={tab.id}
							onkeydown={handleRenameKeydown}
							onblur={handleRenameBlur}
							aria-label="Rename tab"
							aria-invalid={validationError !== null}
							aria-describedby={validationError ? `error-${tab.id}` : undefined}
							maxlength="65"
						/>
						{#if validationError}
							<span class="validation-error" id="error-{tab.id}" role="alert" aria-live="polite">
								{validationError}
							</span>
						{/if}
					{:else}
						<span class="tab-name">{tab.name}</span>
						<span
							class="tab-close"
							role="button"
							tabindex="-1"
							aria-label="Close {tab.name}"
							title="Close tab"
							onmousedown={(e) => {
								e.stopPropagation();
								handleCloseTab(tab);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.stopPropagation();
									e.preventDefault();
									handleCloseTab(tab);
								}
							}}
						>
							×
						</span>
					{/if}
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
					onclick={handleOpenConfigDetailsClick}
				>
					⚠️
				</button>
			{/if}
			<button
				class="control-button ai-toggle"
				class:active={aiEnabled}
				aria-label="Toggle AI"
				title="Toggle AI"
				onclick={handleToggleAIClick}
			>
				🤖
			</button>
			<button
				class="control-button workspace-switcher"
				aria-label="Switch workspace"
				title="Switch workspace"
				onclick={handleSwitchWorkspaceClick}
			>
				🔄
			</button>
			<button
				class="control-button add-tab"
				aria-label="Add tab"
				title="Add tab"
				onclick={handleAddTabClick}
			>
				+
			</button>
		</div>
	</div>

	<!-- Context Menu -->
	{#if contextMenuTab}
		<!-- Backdrop to close menu on click outside -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="context-menu-backdrop" onclick={closeContextMenu}></div>
		<div
			class="context-menu"
			style="left: {contextMenuX}px; top: {contextMenuY}px;"
			role="menu"
			aria-label="Tab actions"
		>
			<button class="context-menu-item" role="menuitem" onclick={handlePinFromMenu}>
				{contextMenuTab.pinned ? '📌 Unpin Tab' : '📌 Pin Tab'}
			</button>
			<button class="context-menu-item" role="menuitem" onclick={handleCopyTabId}>
				📋 Copy Tab ID
			</button>
			<div class="context-menu-item-parent">
				<button
					class="context-menu-item"
					role="menuitem"
					aria-haspopup="true"
					aria-expanded={showBackgroundPresetsSubmenu}
					onclick={toggleBackgroundPresetsSubmenu}
				>
					🎨 Background Presets ›
				</button>
				{#if showBackgroundPresetsSubmenu}
					<div class="context-submenu" role="menu" aria-label="Background presets">
						<button
							class="context-menu-item"
							role="menuitem"
							onclick={() => handleBackgroundPreset('default')}
						>
							Default
						</button>
						<button
							class="context-menu-item"
							role="menuitem"
							onclick={() => handleBackgroundPreset('dark')}
						>
							Dark
						</button>
						<button
							class="context-menu-item"
							role="menuitem"
							onclick={() => handleBackgroundPreset('light')}
						>
							Light
						</button>
						<button
							class="context-menu-item"
							role="menuitem"
							onclick={() => handleBackgroundPreset('ocean')}
						>
							Ocean
						</button>
						<button
							class="context-menu-item"
							role="menuitem"
							onclick={() => handleBackgroundPreset('forest')}
						>
							Forest
						</button>
					</div>
				{/if}
			</div>
			<div class="context-menu-separator"></div>
			<button class="context-menu-item danger" role="menuitem" onclick={handleCloseFromMenu}>
				✕ Close Tab
			</button>
		</div>
	{/if}
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
		animation: tab-roll-in 200ms ease-out;
	}

	@keyframes tab-roll-in {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
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

	.tab.editing {
		padding: 0 8px;
	}

	.tab-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
	}

	.tab-name-input {
		flex: 1;
		min-width: 0;
		padding: 4px 6px;
		background: var(--input-bg, #1a1a1a);
		color: var(--input-color, #ffffff);
		border: 1px solid var(--input-border, #555);
		border-radius: 3px;
		font-family: inherit;
		font-size: 13px;
		outline: none;
	}

	.tab-name-input:focus {
		border-color: var(--input-focus-border, #0066cc);
		box-shadow: 0 0 0 1px var(--input-focus-border, #0066cc);
	}

	.tab-name-input.error {
		border-color: var(--error-color, #ff6b6b);
	}

	.validation-error {
		position: absolute;
		bottom: -24px;
		left: 0;
		right: 0;
		padding: 4px 8px;
		background: var(--error-bg, #ff6b6b);
		color: var(--error-text, #ffffff);
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border-radius: 0 0 3px 3px;
		z-index: 10;
	}

	.tab {
		position: relative;
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

	.control-button.active {
		background: var(--control-active-bg, #0066cc);
		color: var(--control-active-color, #ffffff);
	}

	.tab-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		margin-left: 4px;
		background: transparent;
		color: var(--tab-color, #cccccc);
		border-radius: 3px;
		cursor: pointer;
		font-size: 18px;
		line-height: 1;
		opacity: 0.6;
		transition:
			opacity 0.15s ease,
			background 0.15s ease;
		user-select: none;
	}

	.tab-close:hover {
		opacity: 1;
		background: var(--tab-close-hover-bg, rgba(255, 255, 255, 0.1));
	}

	.tab:not(:hover) .tab-close {
		opacity: 0;
	}

	/* Context Menu */
	.context-menu-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
	}

	.context-menu {
		position: fixed;
		z-index: 1000;
		background: var(--context-menu-bg, #2a2a2a);
		border: 1px solid var(--context-menu-border, #444);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		padding: 4px 0;
		min-width: 160px;
	}

	.context-menu-item {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 8px 12px;
		background: transparent;
		color: var(--context-menu-color, #fff);
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 13px;
		transition: background 0.15s ease;
	}

	.context-menu-item:hover {
		background: var(--context-menu-hover-bg, #3a3a3a);
	}

	.context-menu-item.danger {
		color: var(--error-color, #ff6b6b);
	}

	.context-menu-separator {
		height: 1px;
		background: var(--context-menu-border, #444);
		margin: 4px 0;
	}

	.context-menu-item-parent {
		position: relative;
	}

	.context-submenu {
		position: absolute;
		left: 100%;
		top: 0;
		background: var(--context-menu-bg, #2a2a2a);
		border: 1px solid var(--context-menu-border, #444);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		padding: 4px 0;
		min-width: 140px;
		margin-left: 4px;
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.tab,
		.control-button {
			transition: none;
		}

		.tab {
			animation: tab-roll-in-reduced 100ms ease-out;
		}
	}

	/* Also respect data attribute for demo purposes */
	:global([data-reduced-motion='true']) .tab {
		animation: tab-roll-in-reduced 100ms ease-out !important;
	}

	:global([data-reduced-motion='true']) .tab,
	:global([data-reduced-motion='true']) .control-button {
		transition: none !important;
	}

	@keyframes tab-roll-in-reduced {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
