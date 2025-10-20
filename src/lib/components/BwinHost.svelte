<script lang="ts">
	import { mount } from 'svelte';
	import { BinaryWindow } from 'bwin';
	import './bwin.css';

	let { config = {}, oncreated = () => {}, onupdated = () => {} } = $props();

	let bwinContainer = $state<HTMLElement>();
	let manager = $state<BinaryWindow | undefined>();

	export function addPane(
		sessionId: string,
		paneConfig: Record<string, any>,
		Component: any,
		componentProps: Record<string, any> = {}
	) {
		if (!manager || !manager.rootSash) return;
		let node = manager.rootSash;
		while (node.rightChild) {
			node = node.rightChild;
		}
		const contentElem = document.createElement('div');
		mount(Component, {
			target: contentElem,
			props: { sessionId, ...componentProps }
		});
		manager.addPane(node.id, {
			position: 'right',
			content: contentElem,
			...paneConfig
		});
	}

	export function getInfo() {
		return manager ? manager.rootSash : null;
	}

	$effect(() => {
		if (!manager && bwinContainer) {
			manager = new BinaryWindow(config || {});
			manager.mount(bwinContainer);
			//manager.onPaneCreate((e, n) => oncreated?.(e, n));

			// manager.onPaneUpdate(() => onupdated?.());
		}
	});
</script>

<div bind:this={bwinContainer} class="bwin-container"></div>
