<!--
  Example 4: Drag & Drop

  This example demonstrates drag-and-drop functionality for rearranging panes.
  It shows how to:
  - Enable drag and drop on glass panes
  - Rearrange panes by dragging headers
  - Swap panes or reposition them
  - Visual feedback during drag operations

  Drag and drop is built-in and enabled by default on glass headers.
-->
<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import { onMount } from 'svelte';

	// BinaryWindow component reference
	let bwinRef = $state<BinaryWindow | undefined>();

	// Configuration
	const settings = {
		fitContainer: true
	};

	// Track panes for demo purposes
	let paneColors = $state<Record<string, string>>({});

	// Initialize with multiple panes to demonstrate drag and drop
	onMount(() => {
		if (!bwinRef) return;

		// Create a grid of colorful panes
		const colors = [
			{ name: 'Purple', bg: '#9333ea', light: '#e9d5ff' },
			{ name: 'Blue', bg: '#3b82f6', light: '#dbeafe' },
			{ name: 'Green', bg: '#10b981', light: '#d1fae5' },
			{ name: 'Orange', bg: '#f59e0b', light: '#fef3c7' },
			{ name: 'Pink', bg: '#ec4899', light: '#fce7f3' },
			{ name: 'Teal', bg: '#14b8a6', light: '#ccfbf1' }
		];

		// Add first pane
		const color1 = colors[0];
		paneColors['pane-1'] = color1.bg;
		bwinRef.addPane('root', {
			id: 'pane-1',
			title: `${color1.name} Pane`,
			content: createDragDropContent('pane-1', color1.name, color1.bg, color1.light),
			draggable: true // Explicitly enable drag (though it's on by default)
		});

		// Add second pane to the right
		setTimeout(() => {
			if (!bwinRef) return;
			const color2 = colors[1];
			paneColors['pane-2'] = color2.bg;
			bwinRef.addPane('pane-1', {
				id: 'pane-2',
				position: 'right',
				title: `${color2.name} Pane`,
				content: createDragDropContent('pane-2', color2.name, color2.bg, color2.light),
				draggable: true
			});
		}, 100);

		// Add third pane to the bottom of first
		setTimeout(() => {
			if (!bwinRef) return;
			const color3 = colors[2];
			paneColors['pane-3'] = color3.bg;
			bwinRef.addPane('pane-1', {
				id: 'pane-3',
				position: 'bottom',
				title: `${color3.name} Pane`,
				content: createDragDropContent('pane-3', color3.name, color3.bg, color3.light),
				draggable: true
			});
		}, 200);

		// Add fourth pane to the bottom of second
		setTimeout(() => {
			if (!bwinRef) return;
			const color4 = colors[3];
			paneColors['pane-4'] = color4.bg;
			bwinRef.addPane('pane-2', {
				id: 'pane-4',
				position: 'bottom',
				title: `${color4.name} Pane`,
				content: createDragDropContent('pane-4', color4.name, color4.bg, color4.light),
				draggable: true
			});
		}, 300);
	});

	// Create content for drag-drop demo panes
	function createDragDropContent(paneId: string, colorName: string, bgColor: string, lightColor: string) {
		const div = document.createElement('div');
		div.style.cssText = `
			padding: 20px;
			font-family: system-ui;
			line-height: 1.6;
			height: 100%;
			background: ${lightColor};
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
		`;
		div.innerHTML = `
			<div style="
				width: 80px;
				height: 80px;
				background: ${bgColor};
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 40px;
				color: white;
				margin-bottom: 16px;
			">
				🎨
			</div>
			<h3 style="margin: 0 0 8px 0; color: ${bgColor};">${colorName} Pane</h3>
			<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">ID: ${paneId}</p>
			<div style="
				background: white;
				padding: 16px;
				border-radius: 8px;
				border: 2px dashed ${bgColor};
				max-width: 300px;
			">
				<p style="margin: 0; font-size: 14px; color: #374151;">
					<strong>🖱️ Drag the header</strong> to reposition this pane
				</p>
			</div>
		`;
		return div;
	}
</script>

<div class="example-container">
	<div class="example-header">
		<div class="header-text">
			<h3>Example 4: Drag & Drop</h3>
			<p>Rearrange panes by dragging their headers</p>
		</div>
	</div>

	<div class="instructions">
		<div class="instruction-card">
			<span class="instruction-icon">🖱️</span>
			<div>
				<strong>Drag Headers</strong>
				<p>Click and hold any pane header to start dragging</p>
			</div>
		</div>
		<div class="instruction-card">
			<span class="instruction-icon">🎯</span>
			<div>
				<strong>Drop Zones</strong>
				<p>Hover over other panes to see drop zones (top, right, bottom, left, center)</p>
			</div>
		</div>
		<div class="instruction-card">
			<span class="instruction-icon">🔄</span>
			<div>
				<strong>Swap or Split</strong>
				<p>Drop in center to swap positions, or on edges to create new splits</p>
			</div>
		</div>
	</div>

	<div class="window-wrapper">
		<BinaryWindow bind:this={bwinRef} {settings} />
	</div>

	<div class="feature-notes">
		<h4>Drag & Drop Features</h4>
		<ul>
			<li><strong>Built-in:</strong> Drag and drop is enabled by default on all glass headers</li>
			<li><strong>Smart Positioning:</strong> Drop zones appear automatically when dragging</li>
			<li><strong>Center Swap:</strong> Drop in the center of a pane to swap positions</li>
			<li><strong>Edge Split:</strong> Drop on edges (top/right/bottom/left) to create adjacent panes</li>
			<li><strong>Visual Feedback:</strong> Drop areas highlight during drag operations</li>
			<li><strong>Disable Option:</strong> Set <code>draggable: false</code> to disable on specific panes</li>
		</ul>
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

	.instructions {
		padding: 16px 20px;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.instruction-card {
		flex: 1;
		min-width: 200px;
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.instruction-icon {
		font-size: 24px;
		line-height: 1;
	}

	.instruction-card strong {
		display: block;
		font-size: 14px;
		color: #111827;
		margin-bottom: 4px;
	}

	.instruction-card p {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
		line-height: 1.4;
	}

	.window-wrapper {
		flex: 1;
		background: white;
		border: 1px solid #e5e7eb;
		border-top: none;
		overflow: hidden;
		min-height: 400px;
	}

	:global(.window-wrapper .bw-container) {
		height: 100%;
	}

	.feature-notes {
		padding: 16px 20px;
		background: white;
		border-top: 1px solid #e5e7eb;
	}

	.feature-notes h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		color: #111827;
		font-weight: 600;
	}

	.feature-notes ul {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.feature-notes li {
		font-size: 14px;
		color: #374151;
		line-height: 1.6;
	}

	.feature-notes code {
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 13px;
		color: #667eea;
	}
</style>
