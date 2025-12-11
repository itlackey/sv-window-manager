<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { getLayoutContext } from '../context.js';
	import { emitPaneEvent } from '../../events/dispatcher.js';
	import { buildPanePayload } from '../../events/payload.js';

	interface PaneProps {
		sash: Sash;
		children?: Snippet;
		/** @deprecated Use onpanerender callback instead. Will be removed in v2.0 */
		onPaneRender?: (paneEl: HTMLElement, sash: Sash) => void;
		/** Svelte 5 callback for pane render */
		onpanerender?: (paneEl: HTMLElement, sash: Sash) => void;
	}

	let { sash, children, onPaneRender, onpanerender }: PaneProps = $props();

	const frame = getLayoutContext();
	const debug = $derived(frame.debug ?? false);
	const canDrop = $derived(sash.store.droppable !== false);

	let paneElement = $state<HTMLElement>();

	function handleFocusIn() {
		try {
			const payload = buildPanePayload(sash, paneElement);
			emitPaneEvent('onpanefocused', payload);
		} catch {
			// Ignore event emission errors to keep UI responsive
		}
	}

	function handleFocusOut() {
		// Suppress blur if element has been removed
		if (!paneElement?.isConnected) return;
		try {
			const payload = buildPanePayload(sash, paneElement);
			emitPaneEvent('onpaneblurred', payload);
		} catch {
			// Ignore event emission errors to keep UI responsive
		}
	}

	// REFACTORED: Use onMount lifecycle hook instead of $effect
	// This runs ONCE when the pane mounts, preventing infinite loops
	// The callback is responsible for managing state, not the effect
	onMount(() => {
		if (paneElement) {
			// Call new callback prop API (same signature as old one)
			if (onpanerender) {
				onpanerender(paneElement, sash);
			}

			// Support deprecated callback for backward compatibility
			if (onPaneRender) {
				console.warn(
					'[Pane] onPaneRender callback prop is deprecated and will be removed in v2.0. Use onpanerender callback instead.'
				);
				onPaneRender(paneElement, sash);
			}
		}
	});
</script>

<div
	bind:this={paneElement}
	class="pane"
	data-sash-id={sash.id}
	data-position={sash.position}
	data-can-drop={canDrop}
	style:top="{sash.top}px"
	style:left="{sash.left}px"
	style:width="{sash.width}px"
	style:height="{sash.height}px"
	onfocusin={handleFocusIn}
	onfocusout={handleFocusOut}
>
	{#if children}
		{@render children()}
	{/if}
	{#if debug}
		<pre
			style="font-size: 10px; position: absolute; top: 0; left: 0; z-index: 9999; background: rgba(255,255,0,0.8); padding: 2px; margin: 0;">{sash.id}
{sash.position}
top: {sash.top}px
left: {sash.left}px
width: {sash.width}px
height: {sash.height}px</pre>
	{/if}
</div>
