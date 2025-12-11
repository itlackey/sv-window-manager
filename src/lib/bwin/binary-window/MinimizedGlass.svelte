<script lang="ts">
	/**
	 * MinimizedGlass Component
	 *
	 * Represents a minimized glass in the sill (tab bar).
	 * When clicked, restores the minimized pane to its original position.
	 * Displays an optional icon and truncated title.
	 *
	 * Styling is provided by the global sill.css file which defines
	 * the .sw-minimized-glass class with hover effects and transitions.
	 */

	interface MinimizedGlassProps {
		/**
		 * Title to display in the minimized button
		 */
		title: string;

		/**
		 * Optional icon to display alongside the title (URL, emoji, or HTML string)
		 */
		icon?: string | null;

		/**
		 * Click handler to restore the minimized glass
		 */
		onclick: (event: MouseEvent) => void;
	}

	let { title, icon = null, onclick }: MinimizedGlassProps = $props();

	// Helper to check if icon is a URL (for image icons)
	function isImageUrl(value: string | null | undefined): boolean {
		if (!value) return false;
		return (
			value.startsWith('http://') ||
			value.startsWith('https://') ||
			value.startsWith('/') ||
			value.startsWith('data:image/')
		);
	}
</script>

<button
	class="sw-minimized-glass"
	{onclick}
	type="button"
	aria-label={`Restore ${title}`}
	title={`Restore ${title}`}
>
	{#if icon}
		<span class="sw-minimized-glass-icon">
			{#if isImageUrl(icon)}
				<img src={icon} alt="" class="sw-minimized-glass-icon-img" />
			{:else}
				{@html icon}
			{/if}
		</span>
	{/if}
	<span class="sw-minimized-glass-title">{title}</span>
</button>

<!--
  Styling is defined in src/lib/bwin/css/sill.css
  The .sw-minimized-glass class provides:
  - Base dimensions and appearance
  - Hover effects (lift and shadow)
  - Focus-visible outline
  - Active state transform
  - Transition animations
  - Icon and title layout with truncation
-->
