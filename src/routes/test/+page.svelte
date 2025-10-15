<script lang="ts">
	import type { PageProps } from '../$types.js';
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
</div>

<BwinHost
	bind:this={bwinHostRef}
	config={{
		fitContainer: true
	}}
/>

<button onclick={refresh}>Refresh</button>
{#key bwinInfo}
	{#if bwinInfo}
		<pre><code>
    {JSON.stringify(bwinInfo, null, 2)}
</code></pre>
	{/if}
{/key}
