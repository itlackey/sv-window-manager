<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';
	import { FRAME_CONTEXT, type FrameContext } from '../context.js';

	interface PaneProps {
		sash: Sash;
		children?: Snippet;
		onPaneRender?: (paneEl: HTMLElement, sash: Sash) => void;
	}

	let { sash, children, onPaneRender }: PaneProps = $props();

	const frame = getContext<FrameContext>(FRAME_CONTEXT);
	const debug = $derived(frame?.debug ?? false);
	const canDrop = $derived(sash.store.droppable !== false);

	let paneElement = $state<HTMLElement>();

	// Call the render callback when the pane mounts or updates
	$effect(() => {
		if (paneElement && onPaneRender) {
			onPaneRender(paneElement, sash);
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
