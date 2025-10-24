<!--
  Example 5: Minimize/Maximize (Glass Actions)

  This example demonstrates glass window controls and actions.
  It shows how to:
  - Configure glass action buttons (minimize, maximize, close)
  - Minimize panes to the sill
  - Restore minimized panes
  - Maximize panes to full window
  - Close panes with action buttons

  Glass actions provide standard window management controls.
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

	// Track action events for demo
	let actionLog = $state<string[]>([]);

	function logAction(action: string, paneId: string) {
		const timestamp = new Date().toLocaleTimeString();
		actionLog = [`[${timestamp}] ${action} on ${paneId}`, ...actionLog.slice(0, 9)];
	}

	// Initialize with panes that have custom actions
	onMount(() => {
		if (!bwinRef) return;

		// Add first pane with all default actions
		bwinRef.addPane('root', {
			id: 'pane-controls',
			title: 'Control Center',
			content: createControlContent(),
			// actions: true means use default actions (minimize, maximize, close)
			// This is the default behavior
			actions: true
		});

		// Add second pane with custom action configuration
		setTimeout(() => {
			if (!bwinRef) return;
			bwinRef.addPane('pane-controls', {
				id: 'pane-info',
				position: 'right',
				title: 'Information',
				content: createInfoContent(),
				actions: true // Default actions enabled
			});
		}, 100);

		// Add third pane
		setTimeout(() => {
			if (!bwinRef) return;
			bwinRef.addPane('pane-controls', {
				id: 'pane-demo',
				position: 'bottom',
				title: 'Demo Pane',
				content: createDemoContent(),
				actions: true
			});
		}, 200);
	});

	// Create control center content
	function createControlContent() {
		const div = document.createElement('div');
		div.style.cssText = 'padding: 20px; font-family: system-ui; line-height: 1.6;';
		div.innerHTML = `
			<h3 style="margin-top: 0; color: #667eea;">Window Controls</h3>
			<p>Try the action buttons in the pane headers:</p>
			<div style="margin: 16px 0;">
				<div style="margin-bottom: 12px;">
					<strong style="color: #667eea;">➖ Minimize</strong>
					<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">
						Collapses the pane to the sill at the bottom
					</p>
				</div>
				<div style="margin-bottom: 12px;">
					<strong style="color: #667eea;">⬜ Maximize</strong>
					<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">
						Expands the pane to fill the entire window
					</p>
				</div>
				<div style="margin-bottom: 12px;">
					<strong style="color: #667eea;">❌ Close</strong>
					<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">
						Removes the pane from the window
					</p>
				</div>
			</div>
			<div style="
				background: #fef3c7;
				border: 1px solid #fbbf24;
				border-radius: 6px;
				padding: 12px;
				margin-top: 16px;
			">
				<strong style="color: #92400e;">💡 Tip:</strong>
				<p style="margin: 4px 0 0 0; font-size: 14px; color: #92400e;">
					Minimized panes appear in the sill at the bottom. Click them to restore!
				</p>
			</div>
		`;
		return div;
	}

	// Create information content
	function createInfoContent() {
		const div = document.createElement('div');
		div.style.cssText = 'padding: 20px; font-family: system-ui; line-height: 1.6;';
		div.innerHTML = `
			<h3 style="margin-top: 0; color: #667eea;">Glass Actions API</h3>
			<p>Configure actions when adding panes:</p>
			<pre style="
				background: #f3f4f6;
				padding: 12px;
				border-radius: 6px;
				overflow-x: auto;
				font-size: 13px;
			"><code>// Default actions (minimize, maximize, close)
bwinRef.addPane('target-id', {
  title: 'My Pane',
  actions: true  // This is the default
});

// Disable all actions
bwinRef.addPane('target-id', {
  title: 'No Actions',
  actions: false
});

// Custom actions (advanced)
bwinRef.addPane('target-id', {
  title: 'Custom',
  actions: [
    { label: 'Save', onClick: handleSave },
    { label: 'Close', onClick: handleClose }
  ]
});</code></pre>
		`;
		return div;
	}

	// Create demo content
	function createDemoContent() {
		const div = document.createElement('div');
		div.style.cssText = `
			padding: 20px;
			font-family: system-ui;
			line-height: 1.6;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
		`;
		div.innerHTML = `
			<div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
			<h3 style="margin: 0 0 8px 0;">Try Me!</h3>
			<p style="margin: 0 0 16px 0; opacity: 0.9;">
				Use the action buttons in my header to minimize, maximize, or close me.
			</p>
			<div style="
				background: rgba(255, 255, 255, 0.2);
				padding: 12px 20px;
				border-radius: 8px;
				backdrop-filter: blur(10px);
			">
				<p style="margin: 0; font-size: 14px;">
					Click the minimize button ➖ to send me to the sill, then click my button in the sill to restore me!
				</p>
			</div>
		`;
		return div;
	}
</script>

<div class="example-container">
	<div class="example-header">
		<div class="header-text">
			<h3>Example 5: Glass Actions (Minimize/Maximize/Close)</h3>
			<p>Window management controls for each pane</p>
		</div>
	</div>

	<div class="action-guide">
		<div class="action-item">
			<span class="action-icon">➖</span>
			<div>
				<strong>Minimize</strong>
				<p>Collapse to sill</p>
			</div>
		</div>
		<div class="action-item">
			<span class="action-icon">⬜</span>
			<div>
				<strong>Maximize</strong>
				<p>Expand to full size</p>
			</div>
		</div>
		<div class="action-item">
			<span class="action-icon">❌</span>
			<div>
				<strong>Close</strong>
				<p>Remove pane</p>
			</div>
		</div>
	</div>

	<div class="window-wrapper">
		<BinaryWindow bind:this={bwinRef} {settings} />
	</div>

	<div class="features-panel">
		<div class="features-section">
			<h4>Default Actions</h4>
			<ul>
				<li><strong>Minimize:</strong> Collapses pane to sill at bottom</li>
				<li><strong>Maximize:</strong> Expands pane to fill entire window</li>
				<li><strong>Close:</strong> Removes pane from layout</li>
				<li><strong>Restore:</strong> Click minimized button in sill to restore</li>
			</ul>
		</div>
		<div class="features-section">
			<h4>Configuration</h4>
			<ul>
				<li><code>actions: true</code> - Enable default actions (default)</li>
				<li><code>actions: false</code> - Disable all actions</li>
				<li><code>actions: []</code> - Custom action array (advanced)</li>
				<li>Last pane cannot be closed (disabled automatically)</li>
			</ul>
		</div>
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

	.action-guide {
		padding: 16px 20px;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		gap: 16px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.action-item {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 12px 20px;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.action-icon {
		font-size: 24px;
		line-height: 1;
	}

	.action-item strong {
		display: block;
		font-size: 14px;
		color: #111827;
		margin-bottom: 2px;
	}

	.action-item p {
		margin: 0;
		font-size: 12px;
		color: #6b7280;
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

	.features-panel {
		padding: 16px 20px;
		background: white;
		border-top: 1px solid #e5e7eb;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.features-section h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		color: #111827;
		font-weight: 600;
	}

	.features-section ul {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.features-section li {
		font-size: 14px;
		color: #374151;
		line-height: 1.6;
	}

	.features-section code {
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 13px;
		color: #667eea;
	}
</style>
