<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import { Position } from '$lib/bwin/position.js';
	import '$lib/bwin/css/vars.css';
	import '$lib/bwin/css/frame.css';
	import '$lib/bwin/css/glass.css';
	import '$lib/bwin/css/sill.css';
	import '$lib/bwin/css/body.css';
	import TestPane from './components/TestPane.svelte';
	import LeftPane from './components/LeftPane.svelte';
	import RightPane from './components/RightPane.svelte';
	import TopPane from './components/TopPane.svelte';
	import BottomLeftPane from './components/BottomLeftPane.svelte';
	import BottomRightPane from './components/BottomRightPane.svelte';
	// Events: import dispatcher helpers for live event console
	import {
		onPaneEvent,
		onpaneresized,
		onpaneremoved,
		onpaneadded,
		onpaneminimized,
		onpanemaximized,
		onpanerestored,
		onpanefocused,
		onpaneblurred,
		onpaneorderchanged,
		onpanetitlechanged,
		offPaneEvent
	} from '$lib/events/dispatcher.js';
	import type { PaneEvent } from '$lib/events/types.js';

	// Create a simple test configuration with 2 panes
	const testConfig = {
		width: 800, // Initial dimensions for SSR
		height: 500,
		fitContainer: true, // Enable automatic container fitting
		children: [
			{
				position: Position.Left,
				size: 400,
				title: 'Left Pane',
				component: LeftPane,
				droppable: true,
				resizable: true
			},
			{
				position: Position.Right,
				size: 400,
				title: 'Right Pane',
				component: RightPane,
				droppable: true,
				resizable: true
			}
		]
	};

	// More complex configuration with nested panes
	const complexConfig = {
		width: 800, // Initial dimensions for SSR
		height: 500,
		fitContainer: true, // Enable automatic container fitting
		children: [
			{
				position: Position.Top,
				size: 200,
				title: 'Top Pane',
				component: TopPane
			},
			{
				position: Position.Bottom,
				size: 300, // Fixed: 200 + 300 = 500 (container height)
				children: [
					{
						position: Position.Left,
						size: 400,
						title: 'Bottom Left',
						component: BottomLeftPane
					},
					{
						position: Position.Right,
						size: 400,
						title: 'Bottom Right',
						component: BottomRightPane
					}
				]
			}
		]
	};

	let selectedConfig = $state<'simple' | 'complex'>('simple');
	let debugMode = $state(false);

	const config = $derived({
		...(selectedConfig === 'simple' ? testConfig : complexConfig),
		debug: debugMode
	});

	// Use a unique key that changes with selectedConfig
	const componentKey = $derived(`${selectedConfig}-${debugMode}`);

	// BinaryWindow component reference
	let binaryWindowComponent = $state<any>();

	// State for adding panes
	let newPanePosition = $state<string>(Position.Right);
	let targetSashId = $state('');
	let errorMessage = $state('');
	let customPaneTitle = $state(''); // User-provided title (can be empty)

	// Use $derived for computed values instead of $effect to avoid circular dependency
	// This pattern is declarative and doesn't create effect loops
	let nextPaneNumber = $derived(getAvailablePanes().length + 1);
	let defaultPaneTitle = $derived(`New Pane ${nextPaneNumber}`);
	let newPaneTitle = $derived(customPaneTitle || defaultPaneTitle);

	// Get available pane sash IDs
	function getAvailablePanes(): Array<{ id: string; title: string }> {
		if (!binaryWindowComponent) return [];

		const rootSash = binaryWindowComponent.getRootSash();
		if (!rootSash) return [];

		const panes: Array<{ id: string; title: string }> = [];

		function collectPanes(sash: any) {
			if (sash.isLeaf()) {
				panes.push({
					id: sash.id,
					title: sash.store?.title || sash.id
				});
			} else {
				sash.children?.forEach((child: any) => collectPanes(child));
			}
		}

		collectPanes(rootSash);
		return panes;
	}

	// Track tree version to make availablePanes reactive to add/remove operations
	const treeVersion = $derived(binaryWindowComponent?.getTreeVersion?.() ?? 0);
	const availablePanes = $derived.by(() => {
		// Access treeVersion to create reactive dependency
		treeVersion;
		return getAvailablePanes();
	});

	// Set default target when panes change
	$effect(() => {
		if (availablePanes.length > 0 && !targetSashId) {
			targetSashId = availablePanes[0].id;
		}
	});

	// Add a new pane
	function addNewPane() {
		errorMessage = '';

		if (!binaryWindowComponent) {
			errorMessage = 'BinaryWindow component not initialized';
			return;
		}

		if (!targetSashId) {
			errorMessage = 'Please select a target pane';
			return;
		}

		try {
			// Use the computed title directly (newPaneTitle is now $derived)
			const finalTitle = newPaneTitle;
			const timestamp = new Date().toLocaleTimeString();

			binaryWindowComponent.addPane(targetSashId, {
				position: newPanePosition,
				size: newPanePosition === Position.Top || newPanePosition === Position.Bottom ? 200 : 300,
				title: finalTitle,
				component: TestPane,
				componentProps: {
					title: finalTitle,
					position: newPanePosition,
					timestamp
				},
				droppable: true,
				resizable: true
			});

			// Counter auto-updates via $derived based on pane count
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to add pane';
			console.error('Error adding pane:', error);
		}
	}

	// --- Event console state ---
	let eventLogging = $state(false);
	let recentEvents = $state<Array<{ ts: string; type: string; id: string; title?: string }>>([]);
	let eventOffs = $state<Array<() => void>>([]);
	const MAX = 30;

	function startEvents() {
		if (eventLogging) return;
		eventLogging = true;
		const offs: Array<() => void> = [];
		const push = (evt: PaneEvent) => {
			const ts = new Date().toLocaleTimeString();
			recentEvents = [
				{ ts, type: evt.type, id: evt.pane?.id ?? '', title: evt.pane?.title as string | undefined },
				...recentEvents
			].slice(0, MAX);
		};
		onpaneadded(push); offs.push(() => offPaneEvent('onpaneadded', push));
		onpaneremoved(push); offs.push(() => offPaneEvent('onpaneremoved', push));
		onpaneminimized(push); offs.push(() => offPaneEvent('onpaneminimized', push));
		onpanemaximized(push); offs.push(() => offPaneEvent('onpanemaximized', push));
		onpanerestored(push); offs.push(() => offPaneEvent('onpanerestored', push));
		onpaneresized(push); offs.push(() => offPaneEvent('onpaneresized', push));
		onpanefocused(push); offs.push(() => offPaneEvent('onpanefocused', push));
		onpaneblurred(push); offs.push(() => offPaneEvent('onpaneblurred', push));
		onpaneorderchanged(push); offs.push(() => offPaneEvent('onpaneorderchanged', push));
		onpanetitlechanged(push); offs.push(() => offPaneEvent('onpanetitlechanged', push));
		eventOffs = offs;
	}

	function stopEventsNow() { for (const off of eventOffs) off(); eventOffs = []; eventLogging = false; }
	function clearEvents() { recentEvents = []; }
</script>

<svelte:head>
	<title>Frame Component Test - SV BWIN</title>
</svelte:head>

<div class="test-page" tabindex="-1">
	<header class="test-header">
		<h1>Frame Component Test</h1>
		<p>Testing the declarative Svelte 5 Frame component</p>
	</header>

	<div class="test-controls">
		<div class="control-group">
			<label>
				<input
					type="radio"
					name="config"
					value="simple"
					tabindex="0"
					checked={selectedConfig === 'simple'}
					onchange={() => (selectedConfig = 'simple')}
				/>
				Simple Layout (2 panes)
			</label>
			<label>
				<input
					type="radio"
					name="config"
					value="complex"
					tabindex="0"
					checked={selectedConfig === 'complex'}
					onchange={() => (selectedConfig = 'complex')}
				/>
				Complex Layout (3 panes, nested)
			</label>
		</div>

		<div class="control-group">
			<label>
				<input type="checkbox" bind:checked={debugMode} />
				Debug Mode
			</label>
		</div>
	</div>

	<div class="add-pane-controls">
		<h3>Add Pane Dynamically</h3>
		<div class="add-pane-form">
			<div class="form-row">
				<div class="form-field">
					<label for="target-pane">Target Pane:</label>
					<select id="target-pane" bind:value={targetSashId}>
						{#each availablePanes as pane}
							<option value={pane.id}>{pane.title} ({pane.id})</option>
						{/each}
					</select>
				</div>

				<div class="form-field">
					<label for="position">Position:</label>
					<select id="position" bind:value={newPanePosition}>
						<option value={Position.Top}>Top</option>
						<option value={Position.Right}>Right</option>
						<option value={Position.Bottom}>Bottom</option>
						<option value={Position.Left}>Left</option>
					</select>
				</div>

				<div class="form-field">
					<label for="pane-title">Title:</label>
					<input
						id="pane-title"
						type="text"
						bind:value={customPaneTitle}
						placeholder={defaultPaneTitle}
					/>
				</div>

				<div class="form-field">
					<button type="button" onclick={addNewPane} class="add-pane-button">Add Pane</button>
				</div>
			</div>

			{#if errorMessage}
				<div class="error-message">{errorMessage}</div>
			{/if}

			<div class="add-pane-instructions">
				<strong>Instructions:</strong> Select a target pane to split, choose the position (which side
				of the target), enter a title, and click "Add Pane".
			</div>
		</div>
	</div>

	<div class="frame-container">
		{#key componentKey}
			<BinaryWindow bind:this={binaryWindowComponent} settings={config} />
		{/key}
	</div>

	<div class="event-console">
		<div class="event-console-header">
			<h3>Event Console</h3>
			<div class="event-actions">
				{#if !eventLogging}
					<button type="button" onclick={startEvents}>Enable</button>
				{:else}
					<button type="button" onclick={stopEventsNow}>Disable</button>
				{/if}
				<button type="button" onclick={clearEvents}>Clear</button>
			</div>
		</div>
		<div class="event-list">
			{#if recentEvents.length === 0}
				<div class="event-empty">No events yet. Interact with panes to see events.</div>
			{:else}
				<ul>
					{#each recentEvents as e}
						<li>
							<span class="ts">{e.ts}</span>
							<code class="type">{e.type}</code>
							<span class="id">{e.id}</span>
							{#if e.title}<span class="title">{e.title}</span>{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div class="test-info">
		<h2>Component Features</h2>
		<ul>
			<li>
				<strong>Declarative Rendering:</strong> Uses Svelte 5 runes ($state, $derived, $props)
			</li>
			<li><strong>Regular HTML Elements:</strong> Uses div elements instead of custom elements</li>
			<li><strong>Automatic Updates:</strong> Tree mutations trigger re-renders via key blocks</li>
			<li><strong>Resizable Muntins:</strong> Drag the dividers to resize panes</li>
			<li>
				<strong>Window Chrome:</strong> Title bars with action buttons (close, minimize, maximize)
			</li>
			<li><strong>Debug Mode:</strong> Shows sash IDs and metrics when enabled</li>
		</ul>

		<h2>Architecture</h2>
		<ul>
			<li>
				<strong>BinaryWindow.svelte:</strong> Top-level component, coordinates Frame and Glass
			</li>
			<li><strong>Frame.svelte:</strong> Layout engine, manages sash tree positioning</li>
			<li><strong>Pane.svelte:</strong> Pure presentational component for leaf nodes</li>
			<li><strong>Muntin.svelte:</strong> Divider component with individual derived styles</li>
			<li>
				<strong>Glass.svelte:</strong> Window chrome (title bar, tabs, action buttons, content)
			</li>
		</ul>

		<h2>How It Works</h2>
		<ol>
			<li>BinaryWindow receives configuration and passes to Frame</li>
			<li>Frame builds a sash tree using ConfigRoot</li>
			<li>Panes and muntins are derived from tree using $derived.by()</li>
			<li>Each pane/muntin is rendered declaratively with each blocks</li>
			<li>BinaryWindow creates Glass components for each pane</li>
			<li>Updates trigger via key blocks when tree changes</li>
		</ol>
	</div>
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.test-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.test-header h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.test-header p {
		color: #666;
		font-size: 1.1rem;
	}

	.test-controls {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
		flex-wrap: wrap;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.control-group input[type='radio'],
	.control-group input[type='checkbox'] {
		cursor: pointer;
	}

	.add-pane-controls {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 8px;
		color: white;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.add-pane-controls h3 {
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.add-pane-form {
		background: rgba(255, 255, 255, 0.1);
		padding: 1rem;
		border-radius: 6px;
		backdrop-filter: blur(10px);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr auto;
		gap: 1rem;
		align-items: end;
		margin-bottom: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field label {
		font-weight: 500;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.95);
	}

	.form-field select,
	.form-field input[type='text'] {
		padding: 0.6rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.95);
		color: #333;
		font-size: 0.95rem;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.form-field select:focus,
	.form-field input[type='text']:focus {
		outline: none;
		border-color: #fff;
		background: #fff;
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
	}

	.add-pane-button {
		padding: 0.6rem 1.5rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.add-pane-button:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.add-pane-button:active {
		transform: translateY(0);
	}

	.error-message {
		background: rgba(239, 68, 68, 0.9);
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-weight: 500;
		border-left: 4px solid #dc2626;
	}

	.add-pane-instructions {
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.frame-container {
		border: 2px solid #333;
		overflow: visible;
		margin-bottom: 2rem;
		background: #e0e0e0;
		position: relative;
		display: grid;
		height: 500px;
		width: 100%;
	}

	.test-info {
		background: #f9f9f9;
		padding: 2rem;
		border-radius: 8px;
		border-left: 4px solid #0461ad;
	}

	.test-info h2 {
		margin-top: 0;
		color: #0461ad;
	}

	.test-info ul,
	.test-info ol {
		line-height: 1.8;
		color: #333;
	}

	.test-info li {
		margin: 0.5rem 0;
	}

	.test-info strong {
		color: #0461ad;
	}

	/* Event console */
	.event-console {
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.event-console-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.event-actions button {
		margin-left: 0.5rem;
		padding: 0.4rem 0.75rem;
		border-radius: 4px;
		border: 1px solid #ccc;
		background: #f7f7f7;
		cursor: pointer;
	}

	.event-list {
		max-height: 240px;
		overflow: auto;
		padding: 0.5rem 1rem 1rem 1rem;
	}

	.event-list ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.event-list li {
		display: grid;
		grid-template-columns: 90px 1fr 1fr 1.2fr;
		gap: 0.5rem;
		padding: 0.3rem 0;
		border-bottom: 1px dashed #eee;
		align-items: center;
		font-size: 0.9rem;
	}

	.event-list .ts { color: #666; }
	.event-list .id { color: #333; }
	.event-list .title { color: #555; font-style: italic; }
	.event-list .type { color: #0461ad; }

	.event-empty {
		color: #666;
		padding: 0.75rem 0;
		text-align: center;
	}
</style>
