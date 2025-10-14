<script lang="ts">
	import WindowManagerShell from "$lib/WindowManagerShell.svelte";
	import TabBar from "$lib/components/TabBar.svelte";
	import type { Tab } from "$lib/types.js";

	// Sample tabs for demo (T051)
	let tabs = $state<Tab[]>([
		{ id: '1', name: 'Welcome', pinned: true, order: 0 },
		{ id: '2', name: 'Documentation', pinned: true, order: 1 },
		{ id: '3', name: 'Project Setup', pinned: false, order: 0 },
		{ id: '4', name: 'Component Library', pinned: false, order: 1 },
		{ id: '5', name: 'Testing Guide', pinned: false, order: 2 },
		{ id: '6', name: 'Deployment', pinned: false, order: 3 },
		{ id: '7', name: 'API Reference', pinned: false, order: 4 },
		{ id: '8', name: 'Examples', pinned: false, order: 5 }
	]);

	let activeTabId = $state('3');
	let showConfigError = $state(false);
	let aiEnabled = $state(false);

	// Event log for demo (T052)
	type EventLog = {
		timestamp: string;
		type: string;
		data: any;
	};
	let eventLog = $state<EventLog[]>([]);

	function logEvent(type: string, data: any) {
		const timestamp = new Date().toLocaleTimeString();
		eventLog = [{ timestamp, type, data }, ...eventLog].slice(0, 20); // Keep last 20 events
	}

	// Event handlers
	function handleActivate(event: { tabId: string }) {
		logEvent('activate', event);
		activeTabId = event.tabId;
	}

	function handleReorder(event: { segment: 'pinned' | 'regular'; order: string[] }) {
		logEvent('reorder', event);
		
		// Apply reorder to tabs
		const { segment, order } = event;
		const segmentTabs = tabs.filter(t => t.pinned === (segment === 'pinned'));
		const otherTabs = tabs.filter(t => t.pinned !== (segment === 'pinned'));
		
		// Reorder segment tabs according to new order
		const reorderedSegment = order.map((id, index) => {
			const tab = segmentTabs.find(t => t.id === id);
			return tab ? { ...tab, order: index } : null;
		}).filter((t): t is Tab => t !== null);
		
		tabs = [...otherTabs, ...reorderedSegment];
	}

	function handlePin(event: { tabId: string; pinned: boolean }) {
		logEvent('pin', event);
		
		// Apply pin/unpin to tabs (US3: T027)
		const { tabId, pinned } = event;
		tabs = tabs.map(t => {
			if (t.id === tabId) {
				// When pinning/unpinning, update order within the new segment
				const targetSegmentTabs = tabs.filter(tab => 
					tab.id !== tabId && tab.pinned === pinned
				);
				const newOrder = targetSegmentTabs.length;
				return { ...t, pinned, order: newOrder };
			}
			return t;
		});
	}

	function handleRename(event: { tabId: string; name: string }) {
		logEvent('rename', event);
		
		// Apply rename to tabs (US2: T023 - title sync hook)
		const { tabId, name } = event;
		tabs = tabs.map(t => t.id === tabId ? { ...t, name } : t);
		
		// Simulate title sync timing (would be handled by host in real implementation)
		setTimeout(() => {
			// Title sync complete
			logEvent('titleSync', { tabId, name, timing: '< 100ms' });
		}, 50);
	}

	function handleAddTab() {
		logEvent('addTab', {});
		const newId = String(Math.max(...tabs.map(t => Number(t.id))) + 1);
		const regularTabs = tabs.filter(t => !t.pinned);
		const newOrder = regularTabs.length;
		tabs = [...tabs, { id: newId, name: `New Tab ${newId}`, pinned: false, order: newOrder }];
	}

	function handleToggleAI(event: { enabled: boolean }) {
		logEvent('toggleAI', event);
		aiEnabled = event.enabled;
	}

	function handleSwitchWorkspace() {
		logEvent('switchWorkspace', {});
	}

	function handleOpenConfigDetails() {
		logEvent('openConfigDetails', {});
	}

	function handleClose(event: { tabId: string }) {
		logEvent('close', event);
		
		// Remove tab and update active if needed (US3: T038)
		const { tabId } = event;
		const closingTab = tabs.find(t => t.id === tabId);
		if (!closingTab) return;
		
		// Remove the tab
		const newTabs = tabs.filter(t => t.id !== tabId);
		
		// If closing active tab, move focus to left neighbor or right if none
		if (tabId === activeTabId && newTabs.length > 0) {
			const segment = tabs.filter(t => t.pinned === closingTab.pinned);
			const closingIndex = segment.findIndex(t => t.id === tabId);
			
			// Try left neighbor first
			if (closingIndex > 0) {
				activeTabId = segment[closingIndex - 1].id;
			} else if (closingIndex < segment.length - 1) {
				// Try right neighbor
				activeTabId = segment[closingIndex + 1].id;
			} else {
				// No neighbors in segment, pick any tab
				activeTabId = newTabs[0].id;
			}
		}
		
		tabs = newTabs;
	}

	// Demo controls (T053)
	let useMany = $state(false);

	function toggleTabCount() {
		useMany = !useMany;
		if (useMany) {
			// Add 20+ tabs for overflow demo
			tabs = [
				{ id: '1', name: 'Welcome', pinned: true, order: 0 },
				{ id: '2', name: 'Documentation', pinned: true, order: 1 },
				...Array.from({ length: 20 }, (_, i) => ({
					id: String(i + 3),
					name: `Tab ${i + 3}`,
					pinned: false,
					order: i
				}))
			];
		} else {
			// Reset to default 8 tabs
			tabs = [
				{ id: '1', name: 'Welcome', pinned: true, order: 0 },
				{ id: '2', name: 'Documentation', pinned: true, order: 1 },
				{ id: '3', name: 'Project Setup', pinned: false, order: 0 },
				{ id: '4', name: 'Component Library', pinned: false, order: 1 },
				{ id: '5', name: 'Testing Guide', pinned: false, order: 2 },
				{ id: '6', name: 'Deployment', pinned: false, order: 3 },
				{ id: '7', name: 'API Reference', pinned: false, order: 4 },
				{ id: '8', name: 'Examples', pinned: false, order: 5 }
			];
		}
	}
</script>

<div class="demo-page">
	<header>
		<h1>Tab Bar Demo</h1>
		<p>Interactive demonstration of tab bar reordering, keyboard navigation, and overflow handling</p>
	</header>

	<!-- TabBar Component -->
	<div class="tab-bar-container">
		<TabBar
			{tabs}
			activeId={activeTabId}
			{showConfigError}
			{aiEnabled}
			onactivate={handleActivate}
			onreorder={handleReorder}
			onpin={handlePin}
			onrename={handleRename}
			onaddTab={handleAddTab}
			ontoggleAI={handleToggleAI}
			onswitchWorkspace={handleSwitchWorkspace}
			onopenConfigDetails={handleOpenConfigDetails}
			onclose={handleClose}
		/>
	</div>

	<div class="demo-content">
		<!-- Demo Controls (T053, T057, T061-T064) -->
		<div class="demo-section">
			<h2>Demo Controls</h2>
			<div class="controls">
				<button onclick={toggleTabCount}>
					{useMany ? 'Show Few Tabs (8)' : 'Show Many Tabs (20+)'}
				</button>
				<button onclick={() => showConfigError = !showConfigError}>
					{showConfigError ? 'Hide' : 'Show'} Config Error
				</button>
				<button onclick={() => aiEnabled = !aiEnabled}>
					{aiEnabled ? 'Disable' : 'Enable'} AI
				</button>
			</div>
			<p class="control-hint">
				<strong>Rename:</strong> Double-click any tab to edit its name. 
				Press <kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel.<br/>
				<strong>Close:</strong> Hover over a tab and click the × button to close it.<br/>
				<strong>Pin:</strong> Right-click a tab for the context menu (pin/unpin coming soon).
			</p>
		</div>

		<!-- Visual Indicators (T054) -->
		<div class="demo-section">
			<h2>Current State</h2>
			<div class="state-display">
				<div class="state-item">
					<strong>Active Tab:</strong>
					{tabs.find(t => t.id === activeTabId)?.name || 'None'}
				</div>
				<div class="state-item">
					<strong>Pinned Tabs:</strong>
					{tabs.filter(t => t.pinned).length}
				</div>
				<div class="state-item">
					<strong>Regular Tabs:</strong>
					{tabs.filter(t => !t.pinned).length}
				</div>
				<div class="state-item">
					<strong>Tab Order (Pinned):</strong>
					{tabs.filter(t => t.pinned).map(t => t.name).join(', ')}
				</div>
				<div class="state-item">
					<strong>Tab Order (Regular):</strong>
					{tabs.filter(t => !t.pinned).map(t => t.name).join(', ')}
				</div>
			</div>
		</div>

		<!-- Keyboard Shortcuts (T055, T060) -->
		<div class="demo-section">
			<h2>Keyboard Shortcuts</h2>
			<div class="shortcuts">
				<div class="shortcut-item">
					<kbd>←</kbd> <kbd>→</kbd>
					<span>Navigate between tabs (move focus)</span>
				</div>
				<div class="shortcut-item">
					<kbd>Click</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd>
					<span>Activate tab</span>
				</div>
				<div class="shortcut-item">
					<kbd>Ctrl</kbd> + <kbd>←</kbd>
					<span>Reorder tab left</span>
				</div>
				<div class="shortcut-item">
					<kbd>Ctrl</kbd> + <kbd>→</kbd>
					<span>Reorder tab right</span>
				</div>
				<div class="shortcut-item">
					<kbd>Double-click</kbd>
					<span>Activate rename mode</span>
				</div>
				<div class="shortcut-item">
					<kbd>Enter</kbd>
					<span>Commit rename</span>
				</div>
				<div class="shortcut-item">
					<kbd>Escape</kbd>
					<span>Cancel rename</span>
				</div>
				<div class="shortcut-item">
					<kbd>Right-click</kbd>
					<span>Open context menu</span>
				</div>
			</div>
		</div>

		<!-- Rename Validation Demo (T058) -->
		<div class="demo-section">
			<h2>Rename Validation</h2>
			<div class="validation-info">
				<div class="info-item">
					<strong>Rules:</strong>
					<ul>
						<li>Name must not be empty (after trimming)</li>
						<li>Maximum length: 60 characters</li>
						<li>Whitespace is automatically trimmed</li>
					</ul>
				</div>
				<div class="info-item">
					<strong>Behavior:</strong>
					<ul>
						<li>Valid name → Commits and exits edit mode</li>
						<li>Invalid name → Shows error, stays in edit mode</li>
						<li>Blur with valid name → Auto-commits</li>
						<li>Blur with invalid name → Stays in edit mode with error</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Event Log (T052) -->
		<div class="demo-section">
			<h2>Event Log</h2>
			<div class="event-log">
				{#if eventLog.length === 0}
					<div class="no-events">No events yet. Try reordering tabs!</div>
				{:else}
					{#each eventLog as event}
						<div class="event-entry">
							<span class="event-time">{event.timestamp}</span>
							<span class="event-type">{event.type}</span>
							<span class="event-data">{JSON.stringify(event.data)}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.demo-page {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		margin-bottom: 30px;
	}

	header h1 {
		margin: 0 0 10px 0;
		font-size: 32px;
		color: #333;
	}

	header p {
		margin: 0;
		color: #666;
		font-size: 16px;
	}

	.tab-bar-container {
		margin-bottom: 30px;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}

	.demo-content {
		display: grid;
		gap: 20px;
	}

	.demo-section {
		background: #f9f9f9;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #eee;
	}

	.demo-section h2 {
		margin: 0 0 15px 0;
		font-size: 20px;
		color: #333;
	}

	.controls {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.controls button {
		padding: 10px 20px;
		background: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
	}

	.controls button:hover {
		background: #0052a3;
	}

	.control-hint {
		margin: 15px 0 0 0;
		padding: 10px;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 14px;
		color: #666;
	}

	.state-display {
		display: grid;
		gap: 10px;
	}

	.state-item {
		padding: 10px;
		background: white;
		border-radius: 4px;
		border: 1px solid #ddd;
		font-size: 14px;
	}

	.state-item strong {
		display: inline-block;
		min-width: 180px;
		color: #0066cc;
	}

	.shortcuts {
		display: grid;
		gap: 12px;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		background: white;
		border-radius: 4px;
		border: 1px solid #ddd;
	}

	kbd {
		padding: 4px 8px;
		background: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-family: monospace;
		font-size: 12px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.shortcut-item span {
		color: #666;
		font-size: 14px;
	}

	.event-log {
		max-height: 400px;
		overflow-y: auto;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 10px;
	}

	.no-events {
		text-align: center;
		color: #999;
		padding: 20px;
		font-style: italic;
	}

	.event-entry {
		display: flex;
		gap: 10px;
		padding: 8px;
		border-bottom: 1px solid #eee;
		font-size: 13px;
		font-family: monospace;
	}

	.event-entry:last-child {
		border-bottom: none;
	}

	.event-time {
		color: #999;
		min-width: 80px;
	}

	.event-type {
		color: #0066cc;
		font-weight: bold;
		min-width: 120px;
	}

	.event-data {
		color: #333;
		flex: 1;
		word-break: break-all;
	}

	.validation-info {
		display: grid;
		gap: 15px;
	}

	.info-item {
		padding: 15px;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.info-item strong {
		display: block;
		margin-bottom: 10px;
		color: #0066cc;
		font-size: 15px;
	}

	.info-item ul {
		margin: 0;
		padding-left: 20px;
	}

	.info-item li {
		margin: 6px 0;
		color: #666;
		font-size: 14px;
	}

	@media (prefers-color-scheme: dark) {
		header h1 {
			color: #fff;
		}

		header p {
			color: #ccc;
		}

		.demo-section {
			background: #2a2a2a;
			border-color: #444;
		}

		.demo-section h2 {
			color: #fff;
		}

		.state-item,
		.shortcut-item {
			background: #1e1e1e;
			border-color: #444;
		}

		.state-item strong {
			color: #66b3ff;
		}

		kbd {
			background: #3a3a3a;
			border-color: #555;
			color: #fff;
		}

		.shortcut-item span {
			color: #ccc;
		}

		.event-log {
			background: #1e1e1e;
			border-color: #444;
		}

		.event-entry {
			border-bottom-color: #333;
		}

		.event-data {
			color: #ccc;
		}

		.no-events {
			color: #666;
		}

		.control-hint {
			background: #1e1e1e;
			border-color: #444;
			color: #ccc;
		}

		.info-item {
			background: #1e1e1e;
			border-color: #444;
		}

		.info-item strong {
			color: #66b3ff;
		}

		.info-item li {
			color: #ccc;
		}
	}
</style>