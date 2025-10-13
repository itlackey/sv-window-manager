<script lang="ts">
	// SV Window Manager: WindowManagerShell
	// Purpose: Provides the top-level shell with reveal gating, appearance styling via CSS vars,
	// keyboard handling, context menu, a resizable/persistent side panel, and an integrated
	// Flash Error Overlay. This file favors small, explicit helpers and SSR-safe guards.
	import type { ShellConfig, ReadyDetail, AppearanceConfig } from './types.js';
	import { createEventDispatcher, type Snippet, onMount, onDestroy } from 'svelte';
	import ExamplePanel from './ExamplePanel.svelte';
	import FlashErrorOverlay from './components/FlashErrorOverlay.svelte';
	import type { FlashItem } from './types.js';

	// Internal lightweight context menu implementation
	interface MenuItem {
		id: string;
		label: string;
		enabled: boolean;
		action?: () => void;
	}

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

	// Simple reveal gate (US1): we gate initial paint to avoid flicker. In a real app this
	// would be tied to both appearance and minimal data readiness.
	let revealed = $state(false);

	// Emit a single `ready` event shortly after mount (≤100ms target per spec)
	// Note: We also dispatch a DOM CustomEvent on the root element so DOM-based test harnesses
	// and non-Svelte hosts can observe the same signal without Svelte component instance access.
	let readyEmitted = false;
	const dispatch = createEventDispatcher<{ ready: ReadyDetail }>();
	let rootEl: HTMLDivElement | null = null;
	function emitReady() {
		if (readyEmitted) return;
		readyEmitted = true;
		const detail: ReadyDetail = { title };
		dispatch('ready', detail);
		// Also emit on the root DOM element to support DOM-based test harnesses
		try {
			rootEl?.dispatchEvent?.(new CustomEvent('ready', { detail, bubbles: true }));
		} catch {
			/* no-op: dispatch may be unavailable in non-DOM test harness */
		}
	}

	$effect(() => {
		// Defer to next microtask to avoid flicker; a fuller impl would gate on data/appearance
		queueMicrotask(() => {
			revealed = true;
			// Small delay ensures listeners attach in tests/host; still ≤100ms per spec.
			setTimeout(emitReady, 10);
		});
	});

	const zoomStyle = $derived(`--wm-zoom: ${appearance.zoom};`);
	const opacityStyle = $derived(`--wm-opacity: ${appearance.opacity};`);
	const blurStyle = $derived(`--wm-blur: ${appearance.blur}px;`);
	const bgColorStyle = $derived(
		// Background color is optional; only set the CSS var when provided.
		appearance.backgroundColor ? `--wm-bg: ${appearance.backgroundColor};` : ''
	);

	const rootStyle = $derived(`${zoomStyle}${opacityStyle}${blurStyle}${bgColorStyle}`);

	// Local reactive state for panel visibility/width with session persistence and host precedence.
	// Rationale: The host (embedding app) should be the source of truth when provided, otherwise
	// we preserve a best-effort per-session UX using sessionStorage.
	const SESSION_VISIBLE_KEY = 'svwm:panel:visible';
	const SESSION_WIDTH_KEY = 'svwm:panel:width';
	function readSessionBool(key: string): boolean | undefined {
		try {
			const v = sessionStorage.getItem(key);
			if (v == null) return undefined;
			return v === 'true';
		} catch {
			return undefined;
		}
	}
	function readSessionNum(key: string): number | undefined {
		try {
			const v = sessionStorage.getItem(key);
			if (v == null) return undefined;
			const n = parseInt(v);
			return Number.isFinite(n) ? n : undefined;
		} catch {
			return undefined;
		}
	}
	function writeSession(key: string, value: string) {
		try {
			sessionStorage.setItem(key, value);
		} catch {
			// ignore
		}
	}

	// Host precedence: if config.panel provides values, use them; else fall back to session
	const sessionVisible =
		typeof window !== 'undefined' ? readSessionBool(SESSION_VISIBLE_KEY) : undefined;
	const sessionWidth =
		typeof window !== 'undefined' ? readSessionNum(SESSION_WIDTH_KEY) : undefined;
	let panelVisible = $state(showPanel ?? config.panel?.visible ?? sessionVisible ?? false);
	let panelWidth = $state(config.panel?.widthPx ?? sessionWidth ?? 360);

	function togglePanel() {
		panelVisible = !panelVisible;
		writeSession(SESSION_VISIBLE_KEY, String(panelVisible));
	}

	$effect(() => {
		// Persist width reacts
		writeSession(SESSION_WIDTH_KEY, String(panelWidth));
	});

	// Keyboard handling (config-driven)
	function normalizeKey(e: KeyboardEvent): string {
		const parts: string[] = [];
		if (e.ctrlKey) parts.push('Ctrl');
		if (e.altKey) parts.push('Alt');
		if (e.shiftKey) parts.push('Shift');
		const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
		// Special-case backtick to `, and keep printable keys uppercase for stable comparisons.
		const keyNorm = k === '`' ? '`' : k;
		parts.push(keyNorm);
		return parts.join('+');
	}
	function bindingFor(name: string): string | undefined {
		return (
			config.keyboard?.bindings?.[name as keyof NonNullable<typeof config.keyboard>['bindings']] ??
			// Default binding for MVP: Ctrl+` toggles the side panel.
			(name === 'togglePanel' ? 'Ctrl+`' : undefined)
		);
	}
	function shouldPreventFor(binding: string): boolean {
		const policy = config.keyboard?.overridePolicy ?? 'override-allowlist';
		// Policy semantics:
		// - override-all: preventDefault for all known bindings
		// - defer-to-os: never preventDefault (let the OS/browser win)
		// - override-allowlist (default): preventDefault only for allowlisted combos
		if (policy === 'override-all') return true;
		if (policy === 'defer-to-os') return false;
		const allow = config.keyboard?.allowlist ?? ['Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+`'];
		return allow.includes(binding);
	}
	function onKeydown(e: KeyboardEvent) {
		const key = normalizeKey(e);
		const tp = bindingFor('togglePanel');
		if (tp && key.toLowerCase() === tp.toLowerCase()) {
			if (shouldPreventFor(tp)) e.preventDefault();
			togglePanel();
			return;
		}
		// Extend for nextTab/prevTab in future
	}

	// Context menu state. We build items lazily using document selection and clipboard content.
	// Clipboard access is guarded and has a test fallback via a global shim to avoid permissions.
	let menuOpen = $state(false);
	let menuX = $state(0);
	let menuY = $state(0);
	let menuItems = $state<MenuItem[]>([]);
	const urlLike = (text: string): boolean => /https?:\/\//i.test(text);
	async function buildMenu() {
		const selection = (typeof window !== 'undefined' && window.getSelection?.()) || null;
		const selText = selection && selection.toString ? selection.toString() : '';
		let clip = '';
		try {
			// navigator.clipboard may be undefined in tests; guarded
			clip = (await navigator.clipboard?.readText?.()) ?? '';
		} catch {
			// Test fallback: allow injecting text via a global field
			clip =
				(globalThis as typeof globalThis & { __svwm_clipboard?: string }).__svwm_clipboard ?? '';
		}
		const hasSel = selText.trim().length > 0;
		const hasClip = clip.trim().length > 0;
		const items: MenuItem[] = [
			{ id: 'copy', label: 'Copy', enabled: hasSel, action: () => document.execCommand?.('copy') },
			{
				id: 'paste',
				label: 'Paste',
				enabled: hasClip,
				action: () => document.execCommand?.('paste')
			}
		];
		if (urlLike(selText) || urlLike(clip)) {
			items.push({ id: 'open-link', label: 'Open Link', enabled: true });
		}
		menuItems = items;
	}
	function openMenu(x: number, y: number) {
		menuX = x;
		menuY = y;
		menuOpen = true;
	}
	function closeMenu() {
		menuOpen = false;
	}
	function onContextMenu(e: MouseEvent) {
		e.preventDefault();
		buildMenu().then(() => openMenu(e.clientX, e.clientY));
	}

	// Resize behavior for side panel
	let resizing = false;
	let startX = 0;
	let startWidth = 0;
	function onResizerDown(e: PointerEvent) {
		resizing = true;
		startX = e.clientX;
		startWidth = panelWidth;
		try {
			if (typeof e.pointerId === 'number') {
				(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
			}
		} catch {
			// ignore in tests without active pointer
		}
	}
	function onPointerMove(e: PointerEvent) {
		if (!resizing) return;
		// Resizer is on the left edge of the panel. Dragging left increases panel width.
		// dx is inverted relative to pointer movement to reflect that geometry.
		const dx = startX - e.clientX;
		let w = startWidth + dx;
		if (w < 200) w = 200;
		if (w > 800) w = 800;
		panelWidth = w;
	}
	function onPointerUp() {
		if (!resizing) return;
		resizing = false;
	}

	// Flash error overlay integration (non-blocking queue).
	// External hosts may dispatch a DOM event `svwm:flash` with { message, expiresInMs? } detail
	// to surface an error without coupling to Svelte component internals.
	let flashQueue = $state<FlashItem[]>([]);
	function flashError(message: string, expiresInMs = 5000) {
		flashQueue = [...flashQueue, { id: `${Date.now()}-${Math.random()}`, message, expiresInMs }];
	}
	function onFlashDismiss(e: CustomEvent<{ id: string }>) {
		flashQueue = flashQueue.filter((f) => f.id !== e.detail.id);
	}

	onMount(() => {
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		const keydownListener: EventListener = (e) => onKeydown(e as KeyboardEvent);
		const contextMenuListener: EventListener = (e) => onContextMenu(e as MouseEvent);
		const flashListener = (e: Event) => {
			const ce = e as CustomEvent<{ message: string; expiresInMs?: number }>;
			if (ce?.detail?.message) flashError(ce.detail.message, ce.detail.expiresInMs ?? 5000);
		};
		window.addEventListener('keydown', keydownListener);
		window.addEventListener('contextmenu', contextMenuListener);
		window.addEventListener('svwm:flash', flashListener as EventListener);
		// teardown
		onDestroy(() => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('keydown', keydownListener);
			window.removeEventListener('contextmenu', contextMenuListener);
			window.removeEventListener('svwm:flash', flashListener as EventListener);
		});
	});
</script>

<div class="wm-root" bind:this={rootEl} data-revealed={revealed} style={rootStyle}>
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
				<div
					class="wm-resizer"
					onpointerdown={onResizerDown}
					role="separator"
					aria-orientation="vertical"
					aria-label="Resize panel"
				></div>
				<ExamplePanel />
			</aside>
		{/if}
	</div>

	{#if menuOpen}
		<!-- ARIA role to aid screen reader discovery of context menu -->
		<div
			class="wm-menu"
			role="menu"
			tabindex="0"
			style={`left:${menuX}px; top:${menuY}px`}
			onkeydown={(e) => e.key === 'Escape' && closeMenu()}
		>
			{#each menuItems as item (item.id)}
				<!-- items expose enabled state and keyboard focusability -->
				<button
					type="button"
					role="menuitem"
					class="wm-menu-item"
					data-id={item.id}
					aria-disabled={!item.enabled}
					tabindex={item.enabled ? 0 : -1}
					disabled={!item.enabled}
					onclick={() => (item.enabled && item.action ? item.action() : null)}
				>
					{item.label}
				</button>
			{/each}
		</div>
		<div
			class="wm-menu-backdrop"
			role="button"
			aria-label="Close menu"
			tabindex="0"
			onclick={closeMenu}
			onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeMenu()}
		></div>
	{/if}

	<!-- Flash Error Overlay -->
	<FlashErrorOverlay items={flashQueue} on:dismiss={onFlashDismiss} />
</div>

<style>
	.wm-root {
		position: relative;
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		width: 100%;
		opacity: var(--wm-opacity, 1); /* appearance variable; see computed rootStyle */
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
		position: relative;
	}
	.wm-resizer {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		cursor: ew-resize;
		background: color-mix(in oklab, currentColor 10%, transparent);
		opacity: 0.2;
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

	/* Simple context menu */
	.wm-menu {
		position: fixed;
		z-index: 1000;
		background: var(--wm-bg, #222);
		color: inherit;
		border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
		border-radius: 6px;
		padding: 4px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
		min-width: 180px;
	}
	.wm-menu-item {
		padding: 6px 10px;
		border-radius: 4px;
	}
	.wm-menu-item[aria-disabled='true'] {
		opacity: 0.5;
		pointer-events: none;
	}
	.wm-menu-item:focus {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	.wm-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
		background: transparent;
	}
</style>
