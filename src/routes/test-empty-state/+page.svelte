<script lang="ts">
	import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
	import ExamplePane from './components/ExamplePane.svelte';
	import '$lib/bwin/css/vars.css';
	import '$lib/bwin/css/frame.css';
	import '$lib/bwin/css/glass.css';
	import '$lib/bwin/css/sill.css';
	import '$lib/bwin/css/body.css';

	// Create placeholder configuration (empty window with just placeholder)
	const placeholderConfig = {
		width: 800,
		height: 600,
		fitContainer: true
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let windowComponent = $state<any>();
	let showWithContent = $state(false);

	// Add content when button is clicked
	function addContent() {
		if (!windowComponent) return;

		try {
			// Get the root sash ID
			const rootSash = windowComponent.getRootSash();
			if (!rootSash) {
				console.error('No root sash found');
				return;
			}

			// When adding to a placeholder, use the root sash ID
			// and don't pass position - it will replace the placeholder content
			windowComponent.addPane(rootSash.id, {
				title: 'Example Pane',
				component: ExamplePane,
				componentProps: {}
			});
			showWithContent = true;
		} catch (err) {
			console.error('Failed to add pane:', err);
		}
	}
</script>

<svelte:head>
	<title>Empty State Test - SV Window Manager</title>
</svelte:head>

<div class="test-page">
	<div class="test-header">
		<h1>Empty State Slot Test</h1>
		<p>Testing the empty state slot feature with custom content</p>
	</div>

	<div class="test-controls">
		<button
			id="toggle-content"
			onclick={addContent}
			disabled={showWithContent || !windowComponent}
			data-ready={!!windowComponent}
		>
			Add Content
		</button>
	</div>

	<div class="frame-container">
		<BinaryWindow bind:this={windowComponent} settings={placeholderConfig}>
			{#snippet empty()}
				<div class="custom-empty-state">
					<div class="empty-icon">📋</div>
					<h2>No Windows Open</h2>
					<p>Click "Add Content" to add a pane</p>
				</div>
			{/snippet}
		</BinaryWindow>
	</div>
</div>

<style>
	.test-page {
		padding: 20px;
		height: 100vh;
		display: flex;
		flex-direction: column;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	.test-header {
		margin-bottom: 20px;
	}

	.test-header h1 {
		margin: 0 0 10px 0;
		font-size: 28px;
		font-weight: 600;
	}

	.test-header p {
		margin: 0;
		color: #666;
	}

	.test-controls {
		margin-bottom: 20px;
	}

	.test-controls button {
		padding: 10px 20px;
		font-size: 14px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	.test-controls button:hover:not([disabled]) {
		background: #f5f5f5;
	}

	.test-controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.frame-container {
		flex: 1;
		min-height: 0;
		border: 2px solid #ddd;
		border-radius: 8px;
		background-color: #e0e0e0;
		overflow: hidden;
	}

	.custom-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 40px;
		text-align: center;
	}

	.empty-icon {
		font-size: 64px;
	}

	.custom-empty-state h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: #333;
	}

	.custom-empty-state p {
		margin: 0;
		font-size: 16px;
		color: #666;
	}
</style>
