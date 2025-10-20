<script lang="ts">
	let { sessionId, data } = $props();

	// Mock terminal output
	const terminalLines = [
		{ type: 'prompt', text: '$ ' + (data.initCommand || "echo 'Terminal Ready'") },
		{ type: 'output', text: data.initCommand ? 'Terminal Ready' : '' },
		{ type: 'prompt', text: '$ npm run dev' },
		{ type: 'output', text: '> sv-window-manager@0.0.1 dev' },
		{ type: 'output', text: '> vite dev' },
		{ type: 'success', text: '\n✓ Local: http://localhost:5173/' },
		{ type: 'success', text: '✓ Network: use --host to expose' },
		{ type: 'output', text: '\nready in 234 ms.' },
		{ type: 'prompt', text: '$ ' }
	];
</script>

<div class="terminal-session">
	<div class="terminal-header">
		<div class="terminal-buttons">
			<span class="btn red"></span>
			<span class="btn yellow"></span>
			<span class="btn green"></span>
		</div>
		<div class="terminal-title">
			<span class="icon">⌘</span>
			Terminal - {sessionId}
		</div>
		<div class="spacer"></div>
	</div>

	<div class="terminal-body">
		{#each terminalLines as line, i}
			{#if line.type === 'prompt'}
				<div class="terminal-line prompt">
					<span class="prompt-symbol">{line.text}</span>
					{#if i === terminalLines.length - 1}
						<span class="cursor">█</span>
					{/if}
				</div>
			{:else}
				<div class="terminal-line {line.type}">{line.text}</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.terminal-session {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #1e1e1e;
		font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
		color: #d4d4d4;
		overflow: hidden;
	}

	.terminal-header {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		background: #2d2d2d;
		border-bottom: 1px solid #1e1e1e;
	}

	.terminal-buttons {
		display: flex;
		gap: 8px;
	}

	.btn {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		cursor: pointer;
		opacity: 0.9;
	}

	.btn.red {
		background: #ff5f56;
	}

	.btn.yellow {
		background: #ffbd2e;
	}

	.btn.green {
		background: #27c93f;
	}

	.terminal-title {
		flex: 1;
		text-align: center;
		font-size: 13px;
		color: #999;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.icon {
		font-size: 16px;
	}

	.spacer {
		width: 80px;
	}

	.terminal-body {
		flex: 1;
		padding: 16px;
		overflow-y: auto;
		font-size: 14px;
		line-height: 1.5;
	}

	.terminal-line {
		margin-bottom: 2px;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.terminal-line.prompt {
		display: flex;
		align-items: center;
	}

	.prompt-symbol {
		color: #4ec9b0;
		font-weight: 600;
	}

	.terminal-line.output {
		color: #d4d4d4;
	}

	.terminal-line.success {
		color: #4ec9b0;
	}

	.terminal-line.error {
		color: #f48771;
	}

	.cursor {
		display: inline-block;
		background: #4ec9b0;
		color: #1e1e1e;
		margin-left: 2px;
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

	/* Scrollbar styling */
	.terminal-body::-webkit-scrollbar {
		width: 8px;
	}

	.terminal-body::-webkit-scrollbar-track {
		background: #1e1e1e;
	}

	.terminal-body::-webkit-scrollbar-thumb {
		background: #4d4d4d;
		border-radius: 4px;
	}

	.terminal-body::-webkit-scrollbar-thumb:hover {
		background: #5d5d5d;
	}
</style>
