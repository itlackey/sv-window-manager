<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { MuntinEvents } from '../types.js';
	import { MUNTIN_SIZE, DATA_ATTRIBUTES } from '../constants.js';
	import { onMount, createEventDispatcher } from 'svelte';

	interface MuntinProps {
		sash: Sash;
		muntinSize?: number;
		/** @deprecated Use on:muntinrender event instead. Will be removed in v2.0 */
		onMuntinRender?: (muntinEl: HTMLElement, sash: Sash) => void;
	}

	let { sash, muntinSize = MUNTIN_SIZE, onMuntinRender }: MuntinProps = $props();

	const dispatch = createEventDispatcher<MuntinEvents>();
	const isVertical = $derived(!!sash.leftChild);
	const isHorizontal = $derived(!!sash.topChild);
	const isResizable = $derived(sash.store.resizable !== false);

	let muntinElement = $state<HTMLElement>();

	// REFACTORED: Use onMount lifecycle hook instead of $effect
	// This runs ONCE when the muntin mounts, preventing infinite loops
	onMount(() => {
		if (muntinElement) {
			// Dispatch new event API
			dispatch('muntinrender', { muntinElement, sash });

			// Support deprecated callback for backward compatibility
			if (onMuntinRender) {
				console.warn(
					'[Muntin] onMuntinRender callback prop is deprecated and will be removed in v2.0. Use on:muntinrender event instead.'
				);
				onMuntinRender(muntinElement, sash);
			}
		}
	});

	// Compute individual style values
	const width = $derived(
		sash.leftChild ? `${muntinSize}px` : sash.topChild ? `${sash.width}px` : '0px'
	);

	const height = $derived(
		sash.leftChild ? `${sash.height}px` : sash.topChild ? `${muntinSize}px` : '0px'
	);

	const top = $derived(
		sash.leftChild
			? `${sash.top}px`
			: sash.topChild
				? `${sash.top + sash.topChild.height - muntinSize / 2}px`
				: '0px'
	);

	const left = $derived(
		sash.leftChild
			? `${sash.left + sash.leftChild.width - muntinSize / 2}px`
			: sash.topChild
				? `${sash.left}px`
				: '0px'
	);
</script>

<div
	bind:this={muntinElement}
	class="muntin"
	class:vertical={isVertical}
	class:horizontal={isHorizontal}
	data-sash-id={sash.id}
	data-resizable={isResizable}
	role="separator"
	aria-label={isVertical ? 'Vertical divider' : 'Horizontal divider'}
	aria-orientation={isVertical ? 'vertical' : 'horizontal'}
	aria-valuenow={isVertical ? sash.leftChild?.width : sash.topChild?.height}
	tabindex={isResizable ? 0 : -1}
	style:width
	style:height
	style:top
	style:left
></div>
