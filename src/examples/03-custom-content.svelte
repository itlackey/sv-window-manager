<!--
  Example 3: Custom Glass Content

  This example demonstrates using BwinHost to mount custom Svelte components.
  It shows how to:
  - Use BwinHost wrapper for Svelte component integration
  - Pass props to child components
  - Create reusable session components
  - Mix different component types in one window

  This pattern is ideal for complex applications where you want full
  Svelte reactivity and component composition inside each pane.
-->
<script lang="ts">
	import BwinHost from '$lib/components/BwinHost.svelte';
	import { onMount } from 'svelte';

	// Import session components (we'll use the existing ones as examples)
	import ChatSession from '../routes/ChatSession.svelte';
	import TerminalSession from '../routes/TerminalSession.svelte';
	import FileEditorSession from '../routes/FileEditorSession.svelte';

	// BwinHost component reference
	let bwinHostRef = $state<BwinHost | undefined>();

	// Configuration for responsive behavior
	const config = {
		fitContainer: true
	};

	// Initialize with multiple component types
	onMount(() => {
		if (!bwinHostRef) return;

		// Add a chat session component
		bwinHostRef.addPane(
			'chat-1',
			{ position: 'right' },
			ChatSession,
			{
				sessionId: 'chat-1',
				data: { welcome: 'Hello! This is a custom Svelte component in a pane.' }
			}
		);

		// Add a terminal session component
		setTimeout(() => {
			if (!bwinHostRef) return;
			bwinHostRef.addPane(
				'terminal-1',
				{ position: 'bottom' },
				TerminalSession,
				{
					sessionId: 'terminal-1',
					data: { initCommand: 'echo "Custom Svelte components in action!"' }
				}
			);
		}, 100);

		// Add a file editor component
		setTimeout(() => {
			if (!bwinHostRef) return;
			bwinHostRef.addPane(
				'editor-1',
				{ position: 'right' },
				FileEditorSession,
				{
					sessionId: 'editor-1',
					data: {
						filename: 'example.ts',
						content: `// Custom Svelte Components Example
//
// This demonstrates using BwinHost to mount
// full Svelte components into panes.

import BwinHost from 'sv-window-manager';
import MyComponent from './MyComponent.svelte';

function addCustomPane() {
  bwinHost.addPane(
    'my-pane-id',
    { position: 'right' },
    MyComponent,
    {
      sessionId: 'session-1',
      data: { /* custom props */ }
    }
  );
}
`
					}
				}
			);
		}, 200);
	});

	// Add another chat pane dynamically
	function addChatPane() {
		if (!bwinHostRef) return;

		const chatId = `chat-${Date.now()}`;
		bwinHostRef.addPane(
			chatId,
			{ position: 'right' },
			ChatSession,
			{
				sessionId: chatId,
				data: { welcome: 'Another chat session added dynamically!' }
			}
		);
	}

	// Add another terminal pane
	function addTerminalPane() {
		if (!bwinHostRef) return;

		const termId = `terminal-${Date.now()}`;
		bwinHostRef.addPane(
			termId,
			{ position: 'bottom' },
			TerminalSession,
			{
				sessionId: termId,
				data: { initCommand: 'ls -la' }
			}
		);
	}

	// Add another editor pane
	function addEditorPane() {
		if (!bwinHostRef) return;

		const editorId = `editor-${Date.now()}`;
		bwinHostRef.addPane(
			editorId,
			{ position: 'right' },
			FileEditorSession,
			{
				sessionId: editorId,
				data: {
					filename: 'new-file.md',
					content: '# New Document\n\nStart editing here...'
				}
			}
		);
	}
</script>

<div class="example-container">
	<div class="example-header">
		<div class="header-text">
			<h3>Example 3: Custom Glass Content</h3>
			<p>Using BwinHost to mount custom Svelte components in panes</p>
		</div>
	</div>

	<div class="controls">
		<button class="btn btn-chat" onclick={addChatPane}>💬 Add Chat</button>
		<button class="btn btn-terminal" onclick={addTerminalPane}>⌨️ Add Terminal</button>
		<button class="btn btn-editor" onclick={addEditorPane}>📝 Add Editor</button>
	</div>

	<div class="window-wrapper">
		<BwinHost bind:this={bwinHostRef} {config} />
	</div>

	<div class="info-panel">
		<h4>How It Works</h4>
		<div class="info-content">
			<div class="info-item">
				<strong>1. Import BwinHost</strong>
				<code>import BwinHost from 'sv-window-manager';</code>
			</div>
			<div class="info-item">
				<strong>2. Import Your Components</strong>
				<code>import MyComponent from './MyComponent.svelte';</code>
			</div>
			<div class="info-item">
				<strong>3. Add Panes with Components</strong>
				<code>bwinHost.addPane(id, config, MyComponent, props);</code>
			</div>
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

	.btn-chat {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-terminal {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
	}

	.btn-editor {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		color: white;
	}

	.btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.btn:active {
		transform: translateY(0);
	}

	.window-wrapper {
		flex: 1;
		background: white;
		border: 1px solid #e5e7eb;
		border-top: none;
		overflow: hidden;
		min-height: 300px;
	}

	:global(.window-wrapper .bwin-container) {
		height: 100%;
	}

	.info-panel {
		padding: 16px 20px;
		background: white;
		border-top: 1px solid #e5e7eb;
	}

	.info-panel h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		color: #111827;
		font-weight: 600;
	}

	.info-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.info-item strong {
		font-size: 14px;
		color: #374151;
	}

	.info-item code {
		background: #f3f4f6;
		padding: 8px 12px;
		border-radius: 4px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 13px;
		color: #667eea;
		border: 1px solid #e5e7eb;
	}

	@media (max-width: 768px) {
		.info-content {
			flex-direction: column;
		}
	}
</style>
