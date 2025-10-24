<!--
  Example 2: Dynamic Pane Management

  This example demonstrates dynamic pane management capabilities.
  It shows how to:
  - Add panes programmatically with button controls
  - Remove panes dynamically
  - Track the current layout state
  - Position new panes relative to existing ones

  This is essential for interactive applications where panes are created
  and destroyed based on user actions.
-->
<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import { onMount } from 'svelte';

	// BinaryWindow component reference
	let bwinRef = $state<BinaryWindow | undefined>();

	// Track pane IDs for management
	let paneCounter = $state(0);
	let activePanes = $state<string[]>([]);

	// Configuration with responsive container fitting
	const settings = {
		fitContainer: true
	};

	// Initialize with one starting pane
	onMount(() => {
		addInitialPane();
	});

	// Add the first pane when component mounts
	function addInitialPane() {
		if (!bwinRef) return;

		const paneId = `pane-${paneCounter++}`;
		activePanes = [...activePanes, paneId];

		bwinRef.addPane('root', {
			id: paneId,
			title: 'Pane 1',
			content: createPaneContent(paneId, 'This is your first pane. Use the controls above to add more!')
		});
	}

	// Add a new pane to the right of the last active pane
	function addPaneRight() {
		if (!bwinRef || activePanes.length === 0) return;

		const targetPaneId = activePanes[activePanes.length - 1];
		const newPaneId = `pane-${paneCounter++}`;
		activePanes = [...activePanes, newPaneId];

		bwinRef.addPane(targetPaneId, {
			id: newPaneId,
			position: 'right',
			title: `Pane ${paneCounter}`,
			content: createPaneContent(newPaneId, 'Added to the right')
		});
	}

	// Add a new pane below the last active pane
	function addPaneBottom() {
		if (!bwinRef || activePanes.length === 0) return;

		const targetPaneId = activePanes[activePanes.length - 1];
		const newPaneId = `pane-${paneCounter++}`;
		activePanes = [...activePanes, newPaneId];

		bwinRef.addPane(targetPaneId, {
			id: newPaneId,
			position: 'bottom',
			title: `Pane ${paneCounter}`,
			content: createPaneContent(newPaneId, 'Added to the bottom')
		});
	}

	// Remove the most recently added pane
	function removeLastPane() {
		if (!bwinRef || activePanes.length <= 1) {
			alert('Cannot remove the last pane!');
			return;
		}

		const paneToRemove = activePanes[activePanes.length - 1];
		bwinRef.removePane(paneToRemove);
		activePanes = activePanes.slice(0, -1);
	}

	// Remove a specific pane by ID
	function removePane(paneId: string) {
		if (!bwinRef || activePanes.length <= 1) {
			alert('Cannot remove the last pane!');
			return;
		}

		bwinRef.removePane(paneId);
		activePanes = activePanes.filter((id) => id !== paneId);
	}

	// Create styled content for a pane with remove button
	function createPaneContent(paneId: string, description: string) {
		const div = document.createElement('div');
		div.style.cssText = 'padding: 20px; font-family: system-ui; line-height: 1.6; height: 100%;';
		div.innerHTML = `
			<h3 style="margin-top: 0; color: #667eea;">${paneId}</h3>
			<p>${description}</p>
			<p style="color: #6b7280; font-size: 0.9em;">
				<strong>Total Panes:</strong> ${activePanes.length + 1}
			</p>
			<button
				onclick="window.removePaneById('${paneId}')"
				style="
					margin-top: 10px;
					padding: 8px 16px;
					background: #ef4444;
					color: white;
					border: none;
					border-radius: 6px;
					cursor: pointer;
					font-size: 14px;
					font-weight: 500;
				"
			>
				Remove This Pane
			</button>
		`;
		return div;
	}

	// Expose removePane to window for button onclick handlers
	// This is a simple approach for demo purposes
	if (typeof window !== 'undefined') {
		(window as any).removePaneById = removePane;
	}
</script>

<div class="example-container">
	<div class="example-header">
		<div class="header-text">
			<h3>Example 2: Dynamic Pane Management</h3>
			<p>Add and remove panes dynamically with button controls</p>
		</div>
		<div class="header-stats">
			<span class="stat">Active Panes: <strong>{activePanes.length}</strong></span>
		</div>
	</div>

	<div class="controls">
		<button class="btn btn-primary" onclick={addPaneRight} disabled={activePanes.length === 0}>
			➕ Add Pane Right
		</button>
		<button class="btn btn-primary" onclick={addPaneBottom} disabled={activePanes.length === 0}>
			➕ Add Pane Bottom
		</button>
		<button class="btn btn-danger" onclick={removeLastPane} disabled={activePanes.length <= 1}>
			❌ Remove Last Pane
		</button>
	</div>

	<div class="window-wrapper">
		<BinaryWindow bind:this={bwinRef} {settings} />
	</div>
</div>

<style>
	.example-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f9fafb;
	}

	.example-header {
		padding: 16px 20px;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.header-text h3 {
		margin: 0 0 4px 0;
		font-size: 18px;
		color: #111827;
		font-weight: 600;
	}

	.header-text p {
		margin: 0;
		font-size: 14px;
		color: #6b7280;
	}

	.header-stats {
		display: flex;
		gap: 16px;
	}

	.stat {
		font-size: 14px;
		color: #6b7280;
	}

	.stat strong {
		color: #667eea;
		font-size: 18px;
	}

	.controls {
		padding: 12px 20px;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.btn {
		padding: 8px 16px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #5568d3;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
	}

	.window-wrapper {
		flex: 1;
		background: white;
		border: 1px solid #e5e7eb;
		border-top: none;
		overflow: hidden;
	}

	:global(.window-wrapper .bw-container) {
		height: 100%;
	}
</style>
