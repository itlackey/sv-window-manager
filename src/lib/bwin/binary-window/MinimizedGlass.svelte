<script lang="ts">
	/**
	 * MinimizedGlass Component
	 *
	 * Represents a minimized glass in the sill (tab bar).
	 * When clicked, restores the minimized pane to its original position.
	 *
	 * Styling is provided by the global sill.css file which defines
	 * the .bw-minimized-glass class with hover effects and transitions.
	 */

	interface MinimizedGlassProps {
		/**
		 * Title to display for accessibility
		 */
		title: string;

		/**
		 * Click handler to restore the minimized glass
		 */
		onclick: (event: MouseEvent) => void;
	}

	let { title, onclick }: MinimizedGlassProps = $props();
</script>

<button
	class="bw-minimized-glass"
	{onclick}
	type="button"
	aria-label={`Restore ${title}`}
	title={`Restore ${title}`}
></button>

<!--
  Styling is defined in src/lib/bwin/css/sill.css
  The .bw-minimized-glass class provides:
  - Base dimensions and appearance
  - Hover effects (lift and shadow)
  - Focus-visible outline
  - Active state transform
  - Transition animations
-->
