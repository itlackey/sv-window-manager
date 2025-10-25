<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { GlassAction, BwinContext } from '../types.js';
	import type { Snippet, Component } from 'svelte';
	import { mount as svelteMount, unmount, onDestroy } from 'svelte';
	import closeAction from './actions.close.js';
	import minimizeAction from './actions.minimize.js';
	import maximizeAction from './actions.maximize.js';
	import DOMPurify from 'isomorphic-dompurify';

	/**
	 * Props for the Glass component
	 *
	 * Glass represents the content container within a pane, providing a header
	 * with title/tabs and action buttons, plus a content area for arbitrary DOM.
	 *
	 * @property {string | HTMLElement | Snippet | null} [title] - Title text, element, or snippet for the header
	 * @property {string | HTMLElement | Snippet | null} [content] - Content to render (HTML string, DOM element, or snippet). Ignored if component is provided.
	 * @property {Array<string | {label: string}>} [tabs] - Tab labels for tabbed interface
	 * @property {GlassAction[] | boolean} [actions] - Action buttons or false to hide defaults
	 * @property {boolean} [draggable=true] - Whether the glass can be dragged to reposition
	 * @property {Sash} [sash] - The sash this glass is attached to
	 * @property {BwinContext} binaryWindow - Reference to the parent BinaryWindow context
	 * @property {Component} [component] - Svelte component to mount in the content area
	 * @property {Record<string, unknown>} [componentProps] - Props to pass to the component
	 */
	interface GlassProps {
		title?: string | HTMLElement | Snippet | null;
		content?: string | HTMLElement | Snippet | null;
		tabs?: (string | { label: string })[];
		actions?: GlassAction[] | boolean;
		draggable?: boolean;
		sash?: Sash;
		binaryWindow: BwinContext;
		component?: Component;
		componentProps?: Record<string, unknown>;
	}

	let {
		title = null,
		content = null,
		tabs = [],
		actions = undefined,
		draggable = true,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		sash: _sash,
		binaryWindow,
		component = undefined,
		componentProps = {}
	}: GlassProps = $props();

	// Helper to check if value is a Snippet
	function isSnippet(value: unknown): value is Snippet {
		return typeof value === 'function';
	}

	let contentElement = $state<HTMLElement>();

	// Track mounted component instance for cleanup
	let mountedComponent: Record<string, unknown> | null = null;
	let componentContainer: HTMLElement | null = null;

	// Determine if content is a snippet (needs to be rendered in template)
	// vs DOM content (needs to be mounted via $effect)
	const isContentSnippet = $derived(isSnippet(content));

	// Mount user component when provided
	// This effect runs when component/componentProps change or contentElement is ready
	$effect(() => {
		// Skip if no component or no content element
		if (!component || !contentElement) return;

		// Create container for user component
		const container = document.createElement('div');
		container.style.height = '100%';
		container.style.width = '100%';
		container.style.overflow = 'hidden';

		try {
			// Mount the user component
			const instance = svelteMount(component, {
				target: container,
				props: componentProps
			});

			// Clear previous content and append component container
			contentElement.innerHTML = '';
			contentElement.appendChild(container);

			// Track for cleanup
			mountedComponent = instance;
			componentContainer = container;
		} catch (error) {
			console.error('[Glass] Failed to mount component:', error);
		}

		// Cleanup function
		return () => {
			if (mountedComponent) {
				unmount(mountedComponent);
				mountedComponent = null;
			}
			if (componentContainer) {
				componentContainer.remove();
				componentContainer = null;
			}
		};
	});

	// REFACTORED: Use $effect for DOM side effect (content mounting) - only for non-snippet, non-component content
	// This is a legitimate use of $effect because:
	// 1. It performs DOM manipulation (appendChild, innerHTML)
	// 2. It doesn't update reactive state
	// 3. It reacts to content prop changes
	// Security: This approach eliminates XSS vulnerabilities by:
	// 1. Directly appending DOM nodes without parsing (most common case via BwinHost)
	// 2. Sanitizing HTML strings with DOMPurify to remove malicious scripts
	// 3. Using strict sanitization config to prevent all script execution vectors
	// Note: Snippets are rendered declaratively in the template, so they skip this effect
	// Note: User components are handled by the component mounting effect above
	$effect(() => {
		// Skip if no content element, content is a snippet, or a component is being mounted
		if (!contentElement || isContentSnippet || component) return;

		// Clear previous content (only for DOM-based content)
		contentElement.innerHTML = '';

		if (!content) return;

		// If content is already a DOM element, append it directly (safe)
		if (content instanceof HTMLElement) {
			contentElement.appendChild(content);
		}
		// If content is an HTML string, sanitize it before rendering
		else if (typeof content === 'string') {
			// DOMPurify removes all dangerous HTML/JS while preserving safe markup
			const sanitized = DOMPurify.sanitize(content, {
				ALLOWED_TAGS: [
					'p',
					'div',
					'span',
					'h1',
					'h2',
					'h3',
					'h4',
					'h5',
					'h6',
					'strong',
					'em',
					'u',
					'br',
					'ul',
					'ol',
					'li'
				],
				ALLOWED_ATTR: ['style', 'class'],
				ALLOW_DATA_ATTR: false,
				// Prevent javascript: URLs in CSS
				FORBID_ATTR: ['onerror', 'onload', 'onclick'],
				SAFE_FOR_TEMPLATES: true
			});
			contentElement.innerHTML = sanitized;
		}
	});

	// Default built-in actions
	const BUILTIN_ACTIONS = [minimizeAction, maximizeAction, closeAction];

	const finalActions = $derived(
		actions === undefined ? BUILTIN_ACTIONS : Array.isArray(actions) ? actions : []
	);

	function handleActionClick(event: MouseEvent, action: GlassAction) {
		if (typeof action === 'object' && typeof action.onClick === 'function') {
			action.onClick(event, binaryWindow);
		}
	}

	// Get aria-label for action button
	function getActionAriaLabel(action: GlassAction): string {
		if (action === closeAction) return 'Close window';
		if (action === minimizeAction) return 'Minimize window';
		if (action === maximizeAction) return 'Maximize window';
		return action.label || 'Action';
	}

	// Handle keyboard events for tab navigation
	function handleTabKeyDown(event: KeyboardEvent, index: number) {
		if (!tabs || tabs.length === 0) return;
		if (!(event.currentTarget instanceof HTMLElement)) return;

		const key = event.key;
		const tabCount = tabs.length;

		if (key === 'ArrowLeft') {
			event.preventDefault();
			const prevIndex = index === 0 ? tabCount - 1 : index - 1;
			const prevTab = event.currentTarget.parentElement?.children[prevIndex] as HTMLElement;
			prevTab?.focus();
		} else if (key === 'ArrowRight') {
			event.preventDefault();
			const nextIndex = index === tabCount - 1 ? 0 : index + 1;
			const nextTab = event.currentTarget.parentElement?.children[nextIndex] as HTMLElement;
			nextTab?.focus();
		} else if (key === 'Home') {
			event.preventDefault();
			const firstTab = event.currentTarget.parentElement?.children[0] as HTMLElement;
			firstTab?.focus();
		} else if (key === 'End') {
			event.preventDefault();
			const lastTab = event.currentTarget.parentElement?.children[tabCount - 1] as HTMLElement;
			lastTab?.focus();
		}
	}

	// Cleanup mounted component on destroy (backup safety)
	onDestroy(() => {
		if (mountedComponent) {
			unmount(mountedComponent);
			mountedComponent = null;
		}
	});
</script>

<div class="glass" role="region" aria-label={title ? String(title) : 'Window pane'}>
	<header class="glass-header" data-can-drag={draggable}>
		{#if Array.isArray(tabs) && tabs.length > 0}
			<div class="glass-tabs" role="tablist">
				{#each tabs as tab, index (index)}
					<button
						class="glass-tab"
						role="tab"
						aria-selected={index === 0}
						tabindex={index === 0 ? 0 : -1}
						onkeydown={(e) => handleTabKeyDown(e, index)}
						type="button"
					>
						{typeof tab === 'string' ? tab : tab.label}
					</button>
				{/each}
			</div>
		{:else if title}
			<div class="glass-title">
				{#if isSnippet(title)}
					{@render title()}
				{:else}
					{title}
				{/if}
			</div>
		{/if}

		<div class="glass-actions" role="group" aria-label="Window actions">
			{#each finalActions as action, index (index)}
				<button
					class="glass-action {action.className || ''}"
					onclick={(e) => handleActionClick(e, action)}
					aria-label={getActionAriaLabel(action)}
					type="button"
				>
					{typeof action === 'string' ? action : action.label}
				</button>
			{/each}
		</div>
	</header>

	<!-- Content rendering: snippets use {@render}, DOM/string content uses $effect mounting -->
	<div class="glass-content" bind:this={contentElement} role="tabpanel" tabindex="0">
		{#if isContentSnippet && content}
			{@render content()}
		{/if}
	</div>
</div>

<style>
	.glass {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.glass-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #ccc;
	}

	.glass-content {
		flex: 1;
		overflow: auto;
	}

	.glass-actions {
		display: flex;
		gap: 0.25rem;
	}

	.glass-tabs {
		display: flex;
		gap: 0.25rem;
	}
</style>
