<script lang="ts">
	import { onDestroy } from 'svelte';
	import { CSS_CLASSES } from '../constants.js';
	import * as SillState from '../managers/sill-state.svelte.js';

	let sillElement = $state<HTMLElement>();

	// Register the sill element with SillState when it becomes available
	$effect(() => {
		if (sillElement) {
			SillState.registerSillElement(sillElement);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		SillState.unregisterSillElement();
	});
</script>

<div
	bind:this={sillElement}
	class={CSS_CLASSES.SILL}
	role="complementary"
	aria-label="Minimized windows"
></div>
