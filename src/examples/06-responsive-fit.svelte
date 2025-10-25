<!--
  Example 6: Responsive Layout (Container Fit)

  This example demonstrates responsive container fit behavior.
  It shows how to:
  - Use fitContainer to automatically resize with parent
  - Handle container resize events
  - Maintain layout proportions on resize
  - Test with different container sizes

  This is essential for responsive applications that need to adapt
  to different screen sizes and container dimensions.
-->
<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import { onMount } from 'svelte';

	// BinaryWindow component reference
	let bwinRef = $state<BinaryWindow | undefined>();

	// Container size controls for demo
	let containerWidth = $state('100%');
	let containerHeight = $state('500px');
	let containerElement = $state<HTMLElement | undefined>();

	// Configuration with fitContainer enabled
	// When fitContainer is true, the window automatically resizes to match its parent container
	const settings = {
		fitContainer: true // This is the key setting for responsive behavior
	};

	// Preset sizes for quick testing
	const presets = [
		{ name: 'Full Width', width: '100%', height: '500px' },
		{ name: 'Large', width: '900px', height: '600px' },
		{ name: 'Medium', width: '700px', height: '450px' },
		{ name: 'Small', width: '500px', height: '350px' },
		{ name: 'Narrow', width: '400px', height: '600px' },
		{ name: 'Wide', width: '100%', height: '300px' }
	];

	// Track actual dimensions
	let actualWidth = $state(0);
	let actualHeight = $state(0);

	// Initialize with demo panes
	onMount(() => {
		if (!bwinRef) return;

		// Add responsive demo panes
		bwinRef.addPane('root', {
			id: 'pane-main',
			title: 'Responsive Main',
			content: createResponsiveContent('main')
		});

		setTimeout(() => {
			if (!bwinRef) return;
			bwinRef.addPane('pane-main', {
				id: 'pane-sidebar',
				position: 'right',
				size: '30%', // 30% width
				title: 'Sidebar',
				content: createResponsiveContent('sidebar')
			});
		}, 100);

		setTimeout(() => {
			if (!bwinRef) return;
			bwinRef.addPane('pane-main', {
				id: 'pane-footer',
				position: 'bottom',
				size: 150, // 150px height
				title: 'Footer',
				content: createResponsiveContent('footer')
			});
		}, 200);

		// Update dimensions periodically
		const interval = setInterval(() => {
			if (containerElement) {
				actualWidth = containerElement.offsetWidth;
				actualHeight = containerElement.offsetHeight;
			}
		}, 100);

		return () => clearInterval(interval);
	});

	// Apply a preset size
	function applyPreset(preset: { width: string; height: string }) {
		containerWidth = preset.width;
		containerHeight = preset.height;
	}

	// Create content that shows responsive info
	function createResponsiveContent(type: string) {
		const div = document.createElement('div');
		const colors: Record<string, { bg: string; text: string }> = {
			main: { bg: '#dbeafe', text: '#1e40af' },
			sidebar: { bg: '#fef3c7', text: '#92400e' },
			footer: { bg: '#d1fae5', text: '#065f46' }
		};
		const color = colors[type] || colors.main;

		div.style.cssText = `
			padding: 20px;
			font-family: system-ui;
			line-height: 1.6;
			height: 100%;
			background: ${color.bg};
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
		`;

		div.innerHTML = `
			<div style="
				font-size: 48px;
				margin-bottom: 16px;
			">
				${type === 'main' ? '📐' : type === 'sidebar' ? '📊' : '📏'}
			</div>
			<h3 style="margin: 0 0 8px 0; color: ${color.text}; text-transform: capitalize;">
				${type} Pane
			</h3>
			<p style="margin: 0; color: ${color.text}; opacity: 0.8; font-size: 14px;">
				This pane automatically resizes with the container
			</p>
			<div style="
				margin-top: 16px;
				padding: 12px;
				background: white;
				border-radius: 6px;
				font-size: 13px;
				color: ${color.text};
			">
				<div><strong>Container:</strong> ${actualWidth}px × ${actualHeight}px</div>
			</div>
		`;
		return div;
	}
</script>

<div class="example-container">
	<div class="example-header">
		<div class="header-text">
			<h3>Example 6: Responsive Layout (Container Fit)</h3>
			<p>Automatic resizing to fit parent container</p>
		</div>
		<div class="dimensions">
			<span>Container: {actualWidth}px × {actualHeight}px</span>
		</div>
	</div>

	<div class="controls-panel">
		<div class="control-section">
			<div class="section-label">Quick Presets:</div>
			<div class="preset-buttons">
				{#each presets as preset}
					<button class="btn btn-preset" onclick={() => applyPreset(preset)}>
						{preset.name}
					</button>
				{/each}
			</div>
		</div>

		<div class="control-section">
			<div class="section-label">Custom Size:</div>
			<div class="size-inputs">
				<div class="input-group">
					<label for="width-input">Width:</label>
					<input
						id="width-input"
						type="text"
						bind:value={containerWidth}
						placeholder="e.g., 100% or 800px"
					/>
				</div>
				<div class="input-group">
					<label for="height-input">Height:</label>
					<input
						id="height-input"
						type="text"
						bind:value={containerHeight}
						placeholder="e.g., 500px"
					/>
				</div>
			</div>
		</div>
	</div>

	<div
		class="window-wrapper"
		bind:this={containerElement}
		style="width: {containerWidth}; height: {containerHeight};"
	>
		<BinaryWindow bind:this={bwinRef} {settings} />
	</div>

	<div class="info-panel">
		<div class="info-section">
			<h4>How fitContainer Works</h4>
			<ul>
				<li>Set <code>fitContainer: true</code> in settings</li>
				<li>Window automatically observes parent container size changes</li>
				<li>All panes resize proportionally to maintain layout</li>
				<li>Uses ResizeObserver for efficient resize detection</li>
			</ul>
		</div>
		<div class="info-section">
			<h4>Responsive Best Practices</h4>
			<ul>
				<li>Always use <code>fitContainer: true</code> for responsive apps</li>
				<li>Use percentage sizes for panes that should scale</li>
				<li>Use fixed pixel sizes for panes with minimum dimensions</li>
				<li>Test with different container sizes and aspect ratios</li>
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
		overflow: auto;
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

	.dimensions {
		font-size: 14px;
		color: #667eea;
		font-weight: 600;
	}

	.controls-panel {
		padding: 16px 20px;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.control-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.preset-buttons {
		display: flex;
		gap: 8px;
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

	.btn-preset {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-preset:hover {
		background: #667eea;
		color: white;
		border-color: #667eea;
		transform: translateY(-1px);
	}

	.size-inputs {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.input-group label {
		font-size: 14px;
		color: #6b7280;
		min-width: 50px;
	}

	.input-group input {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		width: 150px;
		transition: border-color 0.2s;
	}

	.input-group input:focus {
		outline: none;
		border-color: #667eea;
	}

	.window-wrapper {
		margin: 20px auto;
		background: white;
		border: 2px solid #667eea;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
	}

	:global(.window-wrapper .bw-container) {
		height: 100%;
	}

	.info-panel {
		padding: 16px 20px;
		background: white;
		border-top: 1px solid #e5e7eb;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.info-section h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		color: #111827;
		font-weight: 600;
	}

	.info-section ul {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.info-section li {
		font-size: 14px;
		color: #374151;
		line-height: 1.6;
	}

	.info-section code {
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 13px;
		color: #667eea;
	}
</style>
