<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { BwinContext } from '../context.js';
	import { CSS_CLASSES } from '../constants.js';
	import * as SillState from '../managers/sill-state.svelte.js';

	/**
	 * Props for the Sill component
	 *
	 * Sill represents the bottom taskbar/dock area where minimized panes are displayed.
	 * It provides a traditional taskbar-like interface for managing minimized windows.
	 *
	 * @property {BwinContext} binaryWindow - Reference to the parent BinaryWindow context
	 */
	interface SillProps {
		binaryWindow: BwinContext;
	}

	let { binaryWindow }: SillProps = $props();

	let sillElement = $state<HTMLElement>();

	// Register the sill element with SillState when mounted
	onMount(() => {
		if (sillElement) {
			SillState.registerSillElement(sillElement);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		SillState.unregisterSillElement();
	});
</script>

<div bind:this={sillElement} class={CSS_CLASSES.SILL} role="complementary" aria-label="Minimized windows">
	<!-- Minimized glass buttons will be dynamically added here -->
</div>

<style>
	/* Sill-specific component styles can go here if needed */
</style>
