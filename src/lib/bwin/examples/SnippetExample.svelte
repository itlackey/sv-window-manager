<script lang="ts">
	/**
	 * Example demonstrating snippet-based content in BinaryWindow panes
	 *
	 * This example shows how to use Svelte 5 snippets for type-safe,
	 * reactive pane content instead of HTML strings or DOM elements.
	 *
	 * Benefits of snippets:
	 * - Full TypeScript type safety
	 * - Reactive state works automatically
	 * - Clean syntax with {@render}
	 * - Better performance (no DOM parsing)
	 */
	import BinaryWindow from '../binary-window/BinaryWindow.svelte';
	import { ConfigRoot } from '../config/config-root.js';

	// Counter state for demonstrating reactivity in snippets
	let count = $state(0);

	// Initialize binary window configuration
	// Note: We'll pass snippet props when the panes are created
	const config = new ConfigRoot({
		width: 800,
		height: 600,
		left: 0,
		top: 0,
		panes: [
			{
				id: 'main-pane',
				// Traditional string-based content (for comparison)
				title: 'Traditional Content',
				content: '<div style="padding: 20px;"><p>This is traditional HTML string content.</p></div>'
			}
		]
	});

	let binaryWindow = $state<any>();

	// Example: Adding a pane with string content (old way)
	function addStringPane() {
		binaryWindow?.addPane('main-pane', {
			position: 'right',
			size: '50%',
			title: 'String Content',
			content: '<div style="padding: 20px;"><h3>HTML String</h3><p>This is rendered from a string.</p></div>'
		});
	}

	// Note: Snippet support is ready in Glass.svelte, but passing snippets
	// through addPane() requires additional work in BinaryWindow to handle
	// snippet serialization through the store. This example demonstrates
	// the API design for when that work is complete.
</script>

{#snippet titleSnippet()}
	<strong style="color: #4A90E2;">🎨 Snippet Title</strong>
{/snippet}

{#snippet contentSnippet()}
	<div style="padding: 20px;">
		<h2>Snippet Content Example</h2>
		<p>This content is rendered using a Svelte snippet!</p>
		<p>Count: <strong>{count}</strong></p>
		<button onclick={() => count++}>Increment</button>
		<p style="margin-top: 20px;">
			Snippets provide full type safety and can include reactive state,
			making them perfect for complex, interactive pane content.
		</p>
	</div>
{/snippet}

<div class="snippet-example">
	<div class="controls">
		<button onclick={addStringPane}>Add String-Based Pane</button>
		<p style="margin-top: 10px; font-size: 12px; color: #666;">
			Note: Direct snippet usage in Glass component works. Integration with BinaryWindow.addPane()
			is planned for Phase 2.3 (declarative-glass-rendering).
		</p>
	</div>

	<div class="window-container">
		<BinaryWindow bind:this={binaryWindow} settings={config} />
	</div>
</div>

<style>
	.snippet-example {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.controls {
		padding: 1rem;
		background: #f5f5f5;
		border-bottom: 1px solid #ddd;
	}

	.controls button {
		padding: 0.5rem 1rem;
		background: #4a90e2;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	.controls button:hover {
		background: #357abd;
	}

	.window-container {
		flex: 1;
		overflow: hidden;
	}
</style>
