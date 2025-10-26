<!--
  Example 1: Basic Window Setup

  This example demonstrates the simplest possible BinaryWindow setup.
  It shows how to:
  - Import and use the BinaryWindow component
  - Create a static 2-pane layout with Svelte components
  - Configure basic settings

  This is the starting point for any BinaryWindow application.
-->
<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import { onMount } from 'svelte';
	import WelcomePane from './components/WelcomePane.svelte';
	import GettingStartedPane from './components/GettingStartedPane.svelte';

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

		const rootSash = bwinRef.getRootSash();
		if (!rootSash) return;

		// Add first pane with WelcomePane component
		// Replace the placeholder with our component
		bwinRef.addPane(rootSash.id, {
			title: 'Welcome',
			component: WelcomePane
		});

		// Add second pane to the right of the first
		// This creates a vertical split (side-by-side layout)
		setTimeout(() => {
			if (!bwinRef) return;
			const root = bwinRef.getRootSash();
			if (!root) return;

			bwinRef.addPane(root.id, {
				position: 'right',
				title: 'Getting Started',
				component: GettingStartedPane
			});
		}, 50);
	});
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
