<div class="getting-started-pane">
	<h2>Getting Started</h2>
	<p>This pane was added to the <code>right</code> of the first pane.</p>
	<p><strong>Basic Setup Steps:</strong></p>
	<ol>
		<li>Import BinaryWindow component</li>
		<li>Configure settings (width, height, etc.)</li>
		<li>Use onMount to add panes after initialization</li>
		<li>Call addPane() with position, component, and componentProps</li>
	</ol>
	<p class="note">Try resizing the panes by dragging the vertical divider between them!</p>
</div>

<style>
	.getting-started-pane {
		padding: 20px;
		font-family: system-ui;
		line-height: 1.6;
	}

	h2 {
		margin-top: 0;
		color: #667eea;
	}

	code {
		background: #f3f4f6;
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', monospace;
	}

	ol {
		margin: 0;
		padding-left: 20px;
	}

	li {
		margin: 8px 0;
	}

	.note {
		color: #6b7280;
		font-size: 0.9em;
		margin-top: 20px;
	}
</style>
