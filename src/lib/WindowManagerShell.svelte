<script lang="ts">
	import type { ShellConfig, ReadyDetail, AppearanceConfig } from './types.js';
	import { createEventDispatcher, type Snippet } from 'svelte';
	import ExamplePanel from './ExamplePanel.svelte';

	// Props contract (Svelte 5 runes)
	interface Props {
		config?: ShellConfig;
		title?: string; // workspace title for initial ready payload
		showPanel?: boolean; // convenience override for visibility
		children?: { workspace?: Snippet } | undefined;
	}

	const { config = {}, title = 'Workspace', showPanel, children }: Props = $props();

	// Derived appearance/panel with conservative defaults
	const appearance: AppearanceConfig = $derived({
		zoom: config.appearance?.zoom ?? 1.0,
		opacity: config.appearance?.opacity ?? 1.0,
		transparent: config.appearance?.transparent ?? false,
		backgroundColor: config.appearance?.backgroundColor ?? undefined,
		backgroundImage: config.appearance?.backgroundImage ?? undefined,
		blur: config.appearance?.blur ?? 0
	});

	// Simple reveal gate (US1 implementation will extend this)
	let revealed = $state(false);

	// Emit a single `ready` event shortly after mount (≤100ms target per spec)
	let readyEmitted = false;
	const dispatch = createEventDispatcher<{ ready: ReadyDetail }>();
	function emitReady() {
		if (readyEmitted) return;
		readyEmitted = true;
		const detail: ReadyDetail = { title };
		dispatch('ready', detail);
	}

	$effect(() => {
		// Defer to next microtask to avoid flicker; real impl will gate on data/appearance
		queueMicrotask(() => {
			revealed = true;
			setTimeout(emitReady, 0);
		});
	});

	const zoomStyle = $derived(`--wm-zoom: ${appearance.zoom};`);
	const opacityStyle = $derived(`--wm-opacity: ${appearance.opacity};`);
	const blurStyle = $derived(`--wm-blur: ${appearance.blur}px;`);
	const bgColorStyle = $derived(
		appearance.backgroundColor ? `--wm-bg: ${appearance.backgroundColor};` : ''
	);

	const rootStyle = $derived(`${zoomStyle}${opacityStyle}${blurStyle}${bgColorStyle}`);

	// Local reactive state for panel visibility/width (session persistence later)
	let panelVisible = $state(showPanel ?? config.panel?.visible ?? false);
	let panelWidth = $state(config.panel?.widthPx ?? 360);

	function togglePanel() {
		panelVisible = !panelVisible;
	}
</script>

<div class="wm-root" data-revealed={revealed} style={rootStyle}>
	<header class="wm-toolbar" role="toolbar">
		<div class="title" aria-live="polite">{title}</div>
		<div class="spacer"></div>
		<button aria-pressed={panelVisible} onclick={togglePanel} class="panel-toggle">
			Toggle Panel
		</button>
	</header>

	<div class="wm-body">
		<main class="wm-main">
			{#if children?.workspace}
				{@render children.workspace()}
			{:else}
				Main workspace
			{/if}
		</main>
		{#if panelVisible}
			<aside class="wm-panel" aria-label="Side panel" style={`width:${panelWidth}px`}>
				<ExamplePanel />
			</aside>
		{/if}
	</div>
</div>

<style>
	.wm-root {
		position: relative;
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		width: 100%;
		opacity: var(--wm-opacity, 1);
		background: var(--wm-bg, transparent);
		backdrop-filter: blur(var(--wm-blur, 0));
	}
	.wm-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-bottom: 1px solid color-mix(in oklab, currentColor 15%, transparent);
	}
	.wm-body {
		display: grid;
		grid-template-columns: 1fr auto;
		min-height: 0; /* allow children to shrink */
	}
	.wm-main {
		min-width: 0;
		overflow: auto;
		padding: 0.5rem;
	}
	.wm-panel {
		min-width: 200px;
		max-width: 800px;
		border-left: 1px solid color-mix(in oklab, currentColor 15%, transparent);
		overflow: auto;
	}
	.title {
		font-weight: 600;
	}
	.spacer {
		flex: 1 1 auto;
	}
	.panel-toggle {
		font: inherit;
	}
</style>
