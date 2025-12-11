<!--
	Sill Component

	Renders a container for minimized window buttons. Can be placed anywhere on the page,
	not just within the BinaryWindow component tree. The component self-registers with
	SillState to receive minimized window buttons.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { CSS_CLASSES } from '../constants.js';
	import * as SillState from '../managers/sill-state.svelte.js';

	// Currently no props, but prepared for future expansion
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface SillProps {}

	// eslint-disable-next-line no-empty-pattern
	let {}: SillProps = $props();

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

<!-- Component can be placed anywhere on the page to receive minimized window buttons -->
<div
	bind:this={sillElement}
	class={CSS_CLASSES.SILL}
	role="complementary"
	aria-label="Minimized windows"
></div>
