<script lang="ts">
	let { sessionId, data } = $props();

	// Sample code with syntax highlighting (mock)
	const defaultContent = `import { mount } from 'svelte';
import BwinHost from './BwinHost.svelte';

// Initialize the window manager
const bwin = mount(BwinHost, {
  target: document.body,
  props: {
    config: {
      fitContainer: true
    }
  }
});

// Add a new pane dynamically
function addPane() {
  bwin.addPane('pane-1', {
    position: 'right'
  }, MyComponent, {
    sessionId: 'session-1'
  });
}`;

	const content = data.content || defaultContent;
	const filename = data.filename || 'example.ts';

	// Get file language based on extension
	function getLanguage(name: string) {
		const ext = name.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'ts':
				return 'TypeScript';
			case 'js':
				return 'JavaScript';
			case 'svelte':
				return 'Svelte';
			case 'md':
				return 'Markdown';
			case 'json':
				return 'JSON';
			default:
				return 'Plain Text';
		}
	}
</script>

<div class="fileeditor-session">
	<div class="editor-header">
		<div class="tabs">
			<div class="tab active">
				<span class="tab-icon">📝</span>
				<span class="tab-name">{filename}</span>
				<button class="tab-close">×</button>
			</div>
		</div>
		<div class="editor-actions">
			<button class="action-btn" title="Save">💾</button>
			<button class="action-btn" title="Format">✨</button>
		</div>
	</div>

	<div class="editor-toolbar">
		<span class="language-indicator">{getLanguage(filename)}</span>
		<span class="separator">•</span>
		<span class="cursor-info">Ln 12, Col 24</span>
		<span class="separator">•</span>
		<span class="encoding">UTF-8</span>
	</div>

	<div class="editor-body">
		<div class="line-numbers">
			{#each content.split('\n') as _, i}
				<div class="line-number">{i + 1}</div>
			{/each}
		</div>
		<div class="code-area">
			<pre class="code">{content}</pre>
			<div class="cursor-line"></div>
		</div>
	</div>

	<div class="editor-footer">
		<span class="status-item">🟢 Ready</span>
		<span class="separator">|</span>
		<span class="status-item">Session: {sessionId}</span>
	</div>
</div>

<style>
	.fileeditor-session {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #1e1e1e;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		color: #d4d4d4;
		overflow: hidden;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #2d2d30;
		border-bottom: 1px solid #1e1e1e;
	}

	.tabs {
		display: flex;
		flex: 1;
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: #2d2d30;
		border-right: 1px solid #1e1e1e;
		cursor: pointer;
		transition: background 0.2s;
		white-space: nowrap;
	}

	.tab.active {
		background: #1e1e1e;
	}

	.tab:hover {
		background: #3e3e42;
	}

	.tab-icon {
		font-size: 14px;
	}

	.tab-name {
		font-size: 13px;
		color: #cccccc;
	}

	.tab-close {
		background: none;
		border: none;
		color: #858585;
		font-size: 20px;
		cursor: pointer;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 3px;
		transition: background 0.2s, color 0.2s;
	}

	.tab-close:hover {
		background: #5a5a5a;
		color: #ffffff;
	}

	.editor-actions {
		display: flex;
		gap: 4px;
		padding: 0 8px;
	}

	.action-btn {
		background: none;
		border: none;
		font-size: 16px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.action-btn:hover {
		background: #3e3e42;
	}

	.editor-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: #252526;
		border-bottom: 1px solid #1e1e1e;
		font-size: 12px;
		color: #858585;
	}

	.language-indicator {
		color: #4ec9b0;
		font-weight: 500;
	}

	.separator {
		color: #3e3e42;
	}

	.cursor-info,
	.encoding {
		color: #858585;
	}

	.editor-body {
		flex: 1;
		display: flex;
		overflow: auto;
		position: relative;
	}

	.line-numbers {
		background: #1e1e1e;
		padding: 16px 8px;
		text-align: right;
		color: #858585;
		font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
		font-size: 13px;
		line-height: 1.6;
		user-select: none;
		border-right: 1px solid #2d2d30;
	}

	.line-number {
		padding-right: 8px;
		min-width: 30px;
	}

	.code-area {
		flex: 1;
		position: relative;
		overflow: auto;
	}

	.code {
		margin: 0;
		padding: 16px;
		font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
		font-size: 13px;
		line-height: 1.6;
		color: #d4d4d4;
		background: transparent;
		white-space: pre;
		overflow: visible;
	}

	.cursor-line {
		position: absolute;
		top: calc(16px + 11 * 1.6em);
		left: 16px;
		width: 2px;
		height: 1.6em;
		background: #aeafad;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	.editor-footer {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: #007acc;
		border-top: 1px solid #1e1e1e;
		font-size: 12px;
		color: #ffffff;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	/* Scrollbar styling */
	.editor-body::-webkit-scrollbar,
	.code-area::-webkit-scrollbar,
	.tabs::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	.editor-body::-webkit-scrollbar-track,
	.code-area::-webkit-scrollbar-track,
	.tabs::-webkit-scrollbar-track {
		background: #1e1e1e;
	}

	.editor-body::-webkit-scrollbar-thumb,
	.code-area::-webkit-scrollbar-thumb,
	.tabs::-webkit-scrollbar-thumb {
		background: #424242;
		border-radius: 5px;
	}

	.editor-body::-webkit-scrollbar-thumb:hover,
	.code-area::-webkit-scrollbar-thumb:hover,
	.tabs::-webkit-scrollbar-thumb:hover {
		background: #4e4e4e;
	}
</style>
