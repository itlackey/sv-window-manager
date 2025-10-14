<script lang="ts">
	let { data }: PageProps = $props();
	import ChatSession from './ChatSession.svelte';
	import TerminalSession from './TerminalSession.svelte';
	import FileBrowserSession from './FileBrowserSession.svelte';
	import FileEditorSession from './FileEditorSession.svelte';
	import type { PageProps } from '../$types.js';
	import { BinaryWindow } from './bwin.js';
    import './bwin.css';

	import { mount } from 'svelte';
	import { onMount } from 'svelte';

	// Reactive state for the input value (session ID)
	let sessionId = $state(''); // $state makes this reactive:contentReference[oaicite:4]{index=4}

	let bwinContainer = $state<HTMLElement>(); // will hold reference to the container DOM element
	let manager: BinaryWindow | undefined = $state(); // BWIN manager instance

	// Mock API data for sessions (sessionId -> {type, data})
	const sessionData = {
		abc123: { type: 'chat', data: { welcome: 'Hello Chat!' } },
		term42: { type: 'terminal', data: { initCommand: "echo 'Hello'" } },
		files99: { type: 'filebrowser', data: { rootPath: '/home/user' } },
		edit77: { type: 'fileeditor', data: { filename: 'notes.txt', content: 'Sample text' } }
	};

	async function fetchSessionInfo(id) {
		// Simulate an API call with a delay
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(sessionData[id] || { type: 'chat', data: {} });
			}, 500);
		});
	}

	async function openSession() {
		if (!sessionId) return;
		const info = await fetchSessionInfo(sessionId);
		const type = info.type;
		const data = info.data;

		// Choose the appropriate Svelte component for this session type
		let Component;
		switch (type) {
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


		// Create a DOM element and mount the chosen Svelte component into it using Svelte 5's imperative API
		const contentElem = document.createElement('div');
		mount(Component, {
			target: contentElem,
			props: { sessionId, data }
		});

		// Add the new element as a pane in the BWIN window manager
		if (manager && manager.rootSash) {
			// Find the rightmost leaf pane
			let node = manager.rootSash;
			while (node.rightChild) {
				node = node.rightChild;
			}
			// Add to the right of the rightmost leaf
			manager.addPane(node.id, {
				position: 'right',
				content: contentElem
				// Optionally, add id/size/title here
			});
		}
	}

	// Initialize BWIN on the container when component mounts
	onMount(() => {
		if (!manager && bwinContainer) {
			manager = new BinaryWindow({
				/* options if any */
                fitContainer: true
			});
			// (Optional) If desired, could add an initial pane or welcome message here.
			manager.mount(document.querySelector('.bwin-container'));
			console.log('BWIN initialized:', manager, bwinContainer);
		}
	});
</script>

<svelte:head>
	<title>Test BWIN Integration</title>
	<!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bwin@latest/dist/bwin.css" /> -->
	<!-- <script src="https://cdn.jsdelivr.net/npm/bwin@0.2.8/dist/bwin.min.js"></script> -->
</svelte:head>

<div class="session-opener">
	<input type="text" bind:value={sessionId} placeholder="Enter Session ID" />
	<button onclick={openSession}>Open Session</button>
</div>

<!-- Container for the BWIN tiling window manager -->
<div
	bind:this={bwinContainer}
	class="bwin-container"
	style="width: 100%; height: 600px; border: 1px solid #ccc;"
>
	<!-- BWIN will render panes inside this container -->
</div>
