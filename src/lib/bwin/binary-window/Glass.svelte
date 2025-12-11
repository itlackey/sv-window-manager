<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { GlassAction, BwinContext } from '../types.js';
	import type { Snippet, Component } from 'svelte';
	import { mount as svelteMount, unmount, onDestroy } from 'svelte';
	import closeAction from './actions.close.js';
	import minimizeAction from './actions.minimize.js';
	import maximizeAction from './actions.maximize.js';
	import { emitPaneEvent } from '../../events/dispatcher.js';
	import { buildPanePayload } from '../../events/payload.js';
	//import DOMPurify from 'isomorphic-dompurify';

	/**
	 * Props for the Glass component
	 *
	 * Glass represents the content container within a pane, providing a header
	 * with title and action buttons, plus a content area for Svelte components.
	 *
	 * @property {string | HTMLElement | Snippet | null} [title] - Title text, element, or snippet for the header
	 * @property {string | null} [icon] - Icon to display alongside the title (URL, emoji, or HTML string)
	 * @property {GlassAction[] | boolean} [actions] - Action buttons or false to hide defaults
	 * @property {boolean} [draggable=true] - Whether the glass can be dragged to reposition
	 * @property {Sash} [sash] - The sash this glass is attached to
	 * @property {BwinContext} binaryWindow - Reference to the parent BinaryWindow context
	 * @property {Component} component - Svelte component to mount in the content area (required)
	 * @property {Record<string, unknown>} [componentProps] - Props to pass to the component
	 */
	interface GlassProps {
		title?: string | HTMLElement | Snippet | null;
		icon?: string | null;
		actions?: GlassAction[] | boolean;
		draggable?: boolean;
		sash?: Sash;
		binaryWindow: BwinContext;
		component: Component;
		componentProps?: Record<string, unknown>;
	}

	let {
		title = null,
		icon = null,
		actions = undefined,
		draggable = true,
		 
		sash: _sash,
		binaryWindow,
		component,
		componentProps = {}
	}: GlassProps = $props();

	// Track title changes and emit event
	let prevTitle: string | null | undefined = title as string | null | undefined;
	$effect(() => {
		const current = title as string | null | undefined;
		if (current !== prevTitle) {
			try {
				const payload = buildPanePayload(_sash as Sash, undefined);
				emitPaneEvent(
					'onpanetitlechanged',
					{
						...payload,
						title: current ?? null
					},
					{ previousTitle: typeof prevTitle === 'string' ? prevTitle : undefined }
				);
			} catch {
				// Ignore pane event emission errors
			}
			prevTitle = current;
		}
	});

	// Helper to check if value is a Snippet
	function isSnippet(value: unknown): value is Snippet {
		return typeof value === 'function';
	}

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

	let contentElement = $state<HTMLElement>();

	// Track mounted component instance for cleanup
	let mountedComponent: Record<string, unknown> | null = null;
	let componentContainer: HTMLElement | null = null;

	// Mount user component - always required
	// This effect runs when component/componentProps change or contentElement is ready
	$effect(() => {
		// Skip if no content element
		if (!contentElement) return;

		// Skip if component is not provided or not a function
		if (!component || typeof component !== 'function') {
			return;
		}

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
			// eslint-disable-next-line svelte/no-dom-manipulating -- Intentional: imperative Svelte component mounting
			contentElement.innerHTML = '';
			// eslint-disable-next-line svelte/no-dom-manipulating -- Intentional: imperative Svelte component mounting
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
		{#if icon || title}
			<div class="glass-title-container">
				{#if icon}
					<span class="glass-icon">
						{#if isImageUrl(icon)}
							<img src={icon} alt="" class="glass-icon-img" />
						{:else}
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- Icon can be emoji or HTML content -->
							{@html icon}
						{/if}
					</span>
				{/if}
				{#if title}
					<div class="glass-title">
						{#if isSnippet(title)}
							{@render title()}
						{:else}
							{title}
						{/if}
					</div>
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

	<!-- Content rendering: component is mounted via $effect -->
	<div class="glass-content" bind:this={contentElement}></div>
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

	.glass-title-container {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
		overflow: hidden;
	}

	.glass-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		line-height: 1;
	}

	.glass-icon-img {
		width: 1rem;
		height: 1rem;
		object-fit: contain;
	}

	.glass-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.glass-content {
		flex: 1;
		overflow: auto;
	}

	.glass-actions {
		display: flex;
		gap: 0.25rem;
	}
</style>
