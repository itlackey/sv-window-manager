<script lang="ts">
	import { mount } from 'svelte';
	import { BinaryWindow } from 'bwin';
	import type { Component } from 'svelte';
	import type { BwinConfig, PaneConfig } from '../types.js';
	import './bwin.css';

	interface Props {
		/** Configuration for the BinaryWindow instance */
		config?: BwinConfig;
		/** Callback when a pane is added */
		onpaneadded?: (sessionId: string) => void;
		/** Callback when a pane is removed */
		onpaneremoved?: (sessionId: string) => void;
	}

	let { config = {}, onpaneadded = (sessionId) => {}, onpaneremoved = (sessionId) => {} }: Props = $props();

	let bwinContainer = $state<HTMLElement>();
	let manager = $state<BinaryWindow | undefined>();

	/**
	 * Add a new pane to the window manager with a Svelte component
	 * @param sessionId - Unique identifier for the pane
	 * @param paneConfig - Configuration for the pane (position, etc.)
	 * @param Component - Svelte component to render in the pane
	 * @param componentProps - Props to pass to the component
	 */
	export function addPane(
		sessionId: string,
		paneConfig: PaneConfig,
		Component: Component<any>,
		componentProps: Record<string, any> = {}
	): void {
		if (!manager || !manager.rootSash) return;
		let node = manager.rootSash;
		while (node.rightChild) {
			node = node.rightChild;
		}
		const contentElem = document.createElement('div');
		// Ensure the content element fills the pane vertically
		contentElem.style.height = '100%';
		contentElem.style.width = '100%';
		contentElem.style.overflow = 'hidden';
		mount(Component, {
			target: contentElem,
			props: { sessionId, ...componentProps }
		});
		manager.addPane(node.id, {
			position: 'right',
			content: contentElem,
			...paneConfig
		});
		onpaneadded(sessionId);
	}
	export function removePane(sessionId: string): void {
		if (!manager) return;
		manager.removePane(sessionId);
		onpaneremoved(sessionId);
	}
	/**
	 * Get information about the current window manager state
	 * @returns The root sash node or null if manager is not initialized
	 */
	export function getInfo(): any {
		return manager ? manager.rootSash : null;
	}

	$effect(() => {
		if (!manager && bwinContainer) {
			manager = new BinaryWindow(config || {});
			manager.mount(bwinContainer);
		}
	});
</script>

<div bind:this={bwinContainer} class="bwin-container"></div>
