<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { Snippet } from 'svelte';
	import type { PaneEvents } from '../types.js';
	import { getContext, onMount, createEventDispatcher } from 'svelte';
	import { FRAME_CONTEXT, type FrameContext } from '../context.js';

	interface PaneProps {
		sash: Sash;
		children?: Snippet;
		/** @deprecated Use on:panerender event instead. Will be removed in v2.0 */
		onPaneRender?: (paneEl: HTMLElement, sash: Sash) => void;
	}

	let { sash, children, onPaneRender }: PaneProps = $props();

	const dispatch = createEventDispatcher<PaneEvents>();
	const frame = getContext<FrameContext>(FRAME_CONTEXT);
	const debug = $derived(frame?.debug ?? false);
	const canDrop = $derived(sash.store.droppable !== false);

	let paneElement = $state<HTMLElement>();

	// REFACTORED: Use onMount lifecycle hook instead of $effect
	// This runs ONCE when the pane mounts, preventing infinite loops
	// The callback is responsible for managing state, not the effect
	onMount(() => {
		if (paneElement) {
			// Dispatch new event API
			dispatch('panerender', { paneElement, sash });

			// Support deprecated callback for backward compatibility
			if (onPaneRender) {
				console.warn(
					'[Pane] onPaneRender callback prop is deprecated and will be removed in v2.0. Use on:panerender event instead.'
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
>
	{#if debug}
		<pre style="font-size: 10px;">{sash.id}
{sash.position}
top: {sash.top}px
left: {sash.left}px
width: {sash.width}px
height: {sash.height}px</pre>
	{:else if children}
		{@render children()}
	{/if}
</div>
