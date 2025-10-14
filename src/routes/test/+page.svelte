<script lang="ts">
	let { data }: PageProps = $props();
	import type { PageProps } from '../$types.js';
	import { BinaryWindow } from './bwin.js';
	import './bwin.css';

	import { onMount } from 'svelte';
	import { getSessionComponent } from './SessionComponentFactory.svelte';
	

	// Reactive state for the input value (session ID)
	let sessionId = $state(''); // $state makes this reactive:contentReference[oaicite:4]{index=4}

	let bwinContainer = $state<HTMLElement>(); // will hold reference to the container DOM element
	let manager: BinaryWindow | undefined = $state(); // BWIN manager instance

	async function openSession() {
		if (!sessionId) return;

		const contentElem = await getSessionComponent(sessionId);

		// Add the new element as a pane in the BWIN window manager
		if (manager && manager.rootSash) {
			// Find the rightmost leaf pane
			let node = manager.rootSash;
			while (node.rightChild) {
				node = node.rightChild;
			}
			// Add to the right of the rightmost leaf
			manager.addPane(node.id, {
                title: sessionId,
                id: sessionId + '-' + Date.now(),
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
