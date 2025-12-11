<script lang="ts">
	import type { Sash } from '../sash.js';
	import { MUNTIN_SIZE } from '../constants.js';
	import { onMount } from 'svelte';

	interface MuntinProps {
		sash: Sash;
		muntinSize?: number;
		/** @deprecated Use onmuntinrender callback instead. Will be removed in v2.0 */
		onMuntinRender?: (muntinEl: HTMLElement, sash: Sash) => void;
		/** Svelte 5 callback for muntin render */
		onmuntinrender?: (muntinEl: HTMLElement, sash: Sash) => void;
	}

	let { sash, muntinSize = MUNTIN_SIZE, onMuntinRender, onmuntinrender }: MuntinProps = $props();

	const isVertical = $derived(!!sash.leftChild);
	const isHorizontal = $derived(!!sash.topChild);
	const isResizable = $derived(sash.store.resizable !== false);

	let muntinElement = $state<HTMLElement>();

	// REFACTORED: Use onMount lifecycle hook instead of $effect
	// This runs ONCE when the muntin mounts, preventing infinite loops
	onMount(() => {
		if (muntinElement) {
			// Call new callback prop API (same signature as old one)
			if (onmuntinrender) {
				onmuntinrender(muntinElement, sash);
			}

			// Support deprecated callback for backward compatibility
			if (onMuntinRender) {
				console.warn(
					'[Muntin] onMuntinRender callback prop is deprecated and will be removed in v2.0. Use onmuntinrender callback instead.'
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

<!--
	Per ARIA spec, a separator with aria-valuemin/max/now becomes an interactive widget
	that MUST be focusable. Svelte's a11y checker doesn't recognize this pattern.
	See: https://www.w3.org/TR/wai-aria-1.2/#separator
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
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
	aria-valuenow={isResizable
		? isVertical
			? sash.leftChild?.width
			: sash.topChild?.height
		: undefined}
	aria-valuemin={isResizable ? 0 : undefined}
	aria-valuemax={isResizable ? (isVertical ? sash.width : sash.height) : undefined}
	tabindex={isResizable ? 0 : -1}
	style:width
	style:height
	style:top
	style:left
></div>
