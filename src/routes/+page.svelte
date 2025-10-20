<script lang="ts">
	import type { PageProps } from './$types.js';
	import ChatSession from '$lib/components/bwin/ChatSession.svelte';
	import TerminalSession from '$lib/components/bwin/TerminalSession.svelte';
	import FileBrowserSession from '$lib/components/bwin/FileBrowserSession.svelte';
	import FileEditorSession from '$lib/components/bwin/FileEditorSession.svelte';

	let { data }: PageProps = $props();

	import BwinHost from '$lib/components/bwin/BwinHost.svelte';
	let bwinHostRef: BwinHost = $state<BwinHost | undefined>();

	// Mock API data for sessions (sessionId -> {type, data})
	const sessionData = {
		abc123: { type: 'chat', data: { welcome: 'Hello Chat!' } },
		term42: { type: 'terminal', data: { initCommand: "echo 'Hello'" } },
		files99: { type: 'filebrowser', data: { rootPath: '/home/user' } },
		edit77: { type: 'fileeditor', data: { filename: 'notes.txt', content: 'Sample text' } }
	};

	async function fetchSessionInfo(id) {
		return sessionData[id];
		// // Simulate an API call with a delay
		// return new Promise((resolve) => {
		// 	setTimeout(() => {
		// 		resolve(sessionData[id] || { type: 'chat', data: { welcome: 'Fallback' } });
		// 	}, 500);
		// });
	}

	let sessionId = $state('abc123');
	let bwinInfo = $state();

	async function openSession() {
		if (!sessionId) return;
		const info = await fetchSessionInfo(sessionId);
		console.log('Fetched session info:', { ...info.data });
		// Choose the appropriate Svelte component for this session type
		let Component;
		switch (info.type) {
			case 'chat':
				Component = ChatSession;
				break;
			case 'terminal':
				Component = TerminalSession;
				break;
			case 'filebrowser':
				Component = FileBrowserSession;
				break;
			case 'fileeditor':
				Component = FileEditorSession;
				break;
			default:
				Component = ChatSession;
		}
		bwinHostRef.addPane(sessionId, {}, Component, { sessionId, data: { ...info.data } });
		bwinInfo = bwinHostRef.getInfo();
	}

	function refresh() {
		bwinInfo = bwinHostRef.getInfo();
		console.log('Refreshed bwinInfo:', bwinInfo);
	}
</script>

<svelte:head>
	<title>Test BWIN Integration</title>
</svelte:head>

<div class="session-opener">
	<input type="text" bind:value={sessionId} placeholder="Enter Session ID" />
	<button onclick={openSession}>Open Session</button>
	<button onclick={refresh}>Refresh</button>
</div>

<BwinHost
	bind:this={bwinHostRef}
	config={{
		fitContainer: true
	}}
/>

{#key bwinInfo}
	{#if bwinInfo}
		<pre style="display:none;"><code>
    {JSON.stringify(bwinInfo, null, 2)}
</code></pre>
	{/if}
{/key}

<style>
	:root {
		--accent-color: hsla(226, 80%, 27%, 0.6);
		--accent-color-strong: hsla(226, 80%, 27%, 0.9);
		--accent-color-light: hsla(226, 50%, 75%, 0.6);
		--bg-color: hsla(0, 0%, 95%, 1);
		--bg-color-dark: hsla(0, 0%, 20%, 1);
		--disabled-color: hsla(0, 0%, 80%, 0.6);

		/* Typography */
		--bw-font-family: inherit;
		--bw-font-size: inherit;

		/* Colors */
		--bw-drop-area-bg-color: var(--accent-color-light);
		--bw-pane-bg-color: var(--bg-color-dark);
		--bw-muntin-bg-color: var(--accent-color-strong);
		--bw-glass-bg-color: var(--bg-color);
		--bw-glass-border-color: var(--accent-color-strong);
		--bw-glass-border-color-disabled: var(--disabled-color);
		--bw-glass-bg-color-disabled: var(--accent-color-light);
		--bw-glass-header-bg-color: var(--accent-color);
		--bw-glass-tab-hover-bg: var(--accent-color-light);
		--bw-glass-action-hover-bg: var(--accent-color-light);
		--bw-minimized-glass-hover-bg: var(--accent-color-light);

		/* Sizing & Spacing */
		--bw-container-width: stretch;
		--bw-container-height: calc(100svh - 50px);
		--bw-glass-clearance: 2px;
		--bw-glass-border-radius: 5px;
		--bw-glass-header-height: 30px;
		--bw-glass-header-gap: 4px;
		--bw-sill-gap: 6px;
		--bw-action-gap: 2px;
		--bw-minimized-glass-height: 10px;
		--bw-minimized-glass-basis: 10%;
	}
</style>
