<!--
  Example 1: Basic Window Setup

  This example demonstrates the simplest possible BinaryWindow setup.
  It shows how to:
  - Import and use the BinaryWindow component
  - Create a static 2-pane layout
  - Configure basic settings

  This is the starting point for any BinaryWindow application.
-->
<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import { onMount } from 'svelte';

	// BinaryWindow component reference - used to call methods after mounting
	let bwinRef = $state<BinaryWindow | undefined>();

	// Basic configuration for the window manager
	// - width/height define the initial size
	// - fitContainer: false means manual size management
	const settings = {
		width: 800,
		height: 500,
		fitContainer: false
	};

	// After mounting, add two simple panes to demonstrate the layout
	onMount(() => {
		if (!bwinRef) return;

		// Add first pane with some content
		// The 'root' ID is the default starting pane ID
		bwinRef.addPane('root', {
			title: 'Welcome',
			content: createWelcomeContent()
		});

		// Add second pane to the right of the first
		// This creates a vertical split (side-by-side layout)
		bwinRef.addPane('root', {
			position: 'right',
			title: 'Getting Started',
			content: createGettingStartedContent()
		});
	});

	// Helper function to create styled content for the first pane
	function createWelcomeContent() {
		const div = document.createElement('div');
		div.style.cssText = 'padding: 20px; font-family: system-ui; line-height: 1.6;';
		div.innerHTML = `
			<h2 style="margin-top: 0; color: #667eea;">Welcome to BinaryWindow!</h2>
			<p>This is a simple 2-pane layout demonstrating the basic setup.</p>
			<p><strong>Features:</strong></p>
			<ul>
				<li>Static layout configuration</li>
				<li>Programmatic pane addition</li>
				<li>Custom content rendering</li>
			</ul>
		`;
		return div;
	}

	// Helper function to create styled content for the second pane
	function createGettingStartedContent() {
		const div = document.createElement('div');
		div.style.cssText = 'padding: 20px; font-family: system-ui; line-height: 1.6;';
		div.innerHTML = `
			<h2 style="margin-top: 0; color: #667eea;">Getting Started</h2>
			<p>This pane was added to the <code>right</code> of the first pane.</p>
			<p><strong>Basic Setup Steps:</strong></p>
			<ol>
				<li>Import BinaryWindow component</li>
				<li>Configure settings (width, height, etc.)</li>
				<li>Use onMount to add panes after initialization</li>
				<li>Call addPane() with position and content</li>
			</ol>
			<p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">
				Try resizing the panes by dragging the vertical divider between them!
			</p>
		`;
		return div;
	}
</script>

<div class="example-container">
	<div class="example-header">
		<h3>Example 1: Basic Window Setup</h3>
		<p>A simple 2-pane layout with minimal configuration</p>
	</div>

	<!-- BinaryWindow component with basic settings -->
	<BinaryWindow bind:this={bwinRef} {settings} />
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

	.example-header h3 {
		margin: 0 0 4px 0;
		font-size: 18px;
		color: #111827;
		font-weight: 600;
	}

	.example-header p {
		margin: 0;
		font-size: 14px;
		color: #6b7280;
	}

	:global(.example-container .bw-container) {
		flex: 1;
		background: white;
		border: 1px solid #e5e7eb;
		border-top: none;
	}
</style>
