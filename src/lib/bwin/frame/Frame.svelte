<script lang="ts">
	import type { Sash } from '../sash.js';
	import type { Snippet } from 'svelte';
	import { SashConfig } from '../config/sash-config.js';
	import { ConfigRoot } from '../config/config-root.js';
	import { addPaneSash } from './pane-utils.js';
	import { genId } from '../utils.js';
	import { Position } from '../position.js';
	import Pane from './Pane.svelte';
	import Muntin from './Muntin.svelte';
	import { resize } from '../actions/resize.svelte';
	import { drop } from '../actions/drop.svelte';
	import {
		type FrameContext,
		setLayoutContext
	} from '../context.js';

	/**
	 * Props for the Frame component
	 *
	 * @property {SashConfig | ConfigRoot | Record<string, unknown>} settings - Initial layout configuration
	 * @property {boolean} [debug=false] - Enable debug logging to console
	 * @property {Function} [onPaneRender] - @deprecated Use onpanerender event. Callback when a pane is rendered, receives (paneEl, sash)
	 * @property {Function} [onMuntinRender] - @deprecated Use onmuntinrender event. Callback when a muntin is rendered, receives (muntinEl, sash)
	 * @property {Function} [onpanerender] - Callback when a pane is rendered (Svelte 5 event)
	 * @property {Function} [onmuntinrender] - Callback when a muntin is rendered (Svelte 5 event)
	 * @property {Function} [onPaneDrop] - Callback when a drop occurs on a pane, receives (event, sash, dropArea)
	 * @property {Snippet} [paneContent] - Optional snippet to render custom content inside each pane (receives sash as parameter)
	 */
	interface FrameProps {
		settings: SashConfig | ConfigRoot | Record<string, unknown>;
		debug?: boolean;
		/** @deprecated Use onpanerender callback instead. Will be removed in v2.0 */
		onPaneRender?: (paneEl: HTMLElement, sash: Sash) => void;
		/** @deprecated Use onmuntinrender callback instead. Will be removed in v2.0 */
		onMuntinRender?: (muntinEl: HTMLElement, sash: Sash) => void;
		/** Svelte 5 callback for pane render */
		onpanerender?: (paneEl: HTMLElement, sash: Sash) => void;
		/** Svelte 5 callback for muntin render */
		onmuntinrender?: (muntinEl: HTMLElement, sash: Sash) => void;
		onPaneDrop?: (event: DragEvent, sash: Sash, dropArea: string) => void;
		/** Optional snippet to render custom content inside each pane */
		paneContent?: Snippet<[Sash]>;
		/** Tree version counter to trigger reactivity when tree structure changes */
		treeVersion?: number;
	}

	let { settings, debug = false, onPaneRender, onMuntinRender, onpanerender, onmuntinrender, onPaneDrop, paneContent, treeVersion = 0 }: FrameProps = $props();

	// Initialize sash tree from settings
	let rootSash = $derived.by(() => {
		if (settings instanceof SashConfig) {
			return settings;
		}
		const config = new ConfigRoot(settings);
		return config.buildSashTree({ resizeStrategy: config.resizeStrategy });
	});

	// Collect panes and muntins from tree
	// Include treeVersion in the derivation to trigger reactivity when tree structure changes
	const panes = $derived.by(() => {
		// Access treeVersion to make this reactive to tree changes
		const _ = treeVersion;
		if (!rootSash) return [];
		const result: Sash[] = [];
		rootSash.walk((sash) => {
			if (sash.children.length === 0) result.push(sash);
		});
		return result;
	});

	const muntins = $derived.by(() => {
		// Access treeVersion to make this reactive to tree changes
		const _ = treeVersion;
		if (!rootSash) return [];
		const result: Sash[] = [];
		rootSash.walk((sash) => {
			if (sash.children.length > 0) result.push(sash);
		});
		return result;
	});

	// DOM element references
	let windowElement = $state<HTMLElement | undefined>();
	let containerElement = $state<HTMLElement | undefined>();

	// Share context using type-safe context API
	const frameContext: FrameContext = { debug };
	setLayoutContext(frameContext);

	/**
	 * Adds a new pane to the layout tree at the specified position.
	 *
	 * This is the core layout manipulation method that inserts a new pane into
	 * the sash tree structure. It automatically handles splitting the target pane
	 * and rebalancing the layout. This method is typically called by BinaryWindow.addPane()
	 * rather than directly.
	 *
	 * @param {string} targetId - The ID of the target sash to position relative to
	 * @param {Object} options - Pane configuration options
	 * @param {string} options.position - Position relative to target: 'top', 'right', 'bottom', 'left'
	 * @param {string|number} [options.size] - Size of new pane (px, %, or ratio). If omitted, splits evenly
	 * @param {string} [options.id] - Optional custom ID for the pane. Auto-generated if omitted
	 * @returns {Sash | null} The newly created sash, or null if target not found or invalid
	 *
	 * @example
	 * ```typescript
	 * // Add a 300px pane to the right of 'root'
	 * const newSash = frame.addPane('root', {
	 *   position: 'right',
	 *   size: 300,
	 *   id: 'sidebar'
	 * });
	 * ```
	 */
	export function addPane(targetId: string, options: Record<string, unknown>): Sash | null {
		const { position, size, id } = options;
		if (!position || !rootSash) return null;

		const targetSash = rootSash.getById(targetId);
		if (!targetSash) return null;

		const newSash = addPaneSash(targetSash, {
			position: position as string,
			size: size as string | number | undefined,
			id: id as string | undefined
		});
		return newSash || null;
	}

	/**
	 * Removes a pane from the layout tree by its ID.
	 *
	 * This method removes a pane and promotes its sibling to take the parent's place,
	 * effectively collapsing the split. The sibling pane expands to fill the space
	 * previously occupied by both panes. This handles all the necessary tree
	 * restructuring and dimension recalculations.
	 *
	 * @param {string} id - The ID of the pane/sash to remove
	 *
	 * @example
	 * ```typescript
	 * // Remove a pane by ID
	 * frame.removePane('sidebar');
	 * ```
	 */
	export function removePane(id: string) {
		if (!rootSash) return;

		const parentSash = rootSash.getDescendantParentById(id);
		if (!parentSash) return;

		const siblingSash = parentSash.getChildSiblingById(id);
		if (!siblingSash) return;

		if (siblingSash.children.length === 0) {
			parentSash.id = siblingSash.id;
			parentSash.domNode = siblingSash.domNode;
			parentSash.store = siblingSash.store;
			parentSash.children = [];
		} else {
			parentSash.id = genId();
			parentSash.children = siblingSash.children;

			if (siblingSash.position === Position.Left || siblingSash.position === Position.Right) {
				siblingSash.width = parentSash.width;
				if (siblingSash.position === Position.Right) {
					siblingSash.left = parentSash.left;
				}
			} else {
				siblingSash.height = parentSash.height;
				if (siblingSash.position === Position.Bottom) {
					siblingSash.top = parentSash.top;
				}
			}
		}
	}

	/**
	 * Swaps the content of two panes in the layout.
	 *
	 * This method exchanges the store data (title, content, etc.) between two panes
	 * without changing their positions or sizes. The panes' Glass components are
	 * recreated with the swapped stores, effectively swapping their visual content.
	 * This is used primarily for drag-and-drop pane reordering.
	 *
	 * @param {HTMLElement | Element | null} sourcePaneEl - The source pane DOM element
	 * @param {HTMLElement | Element | null} targetPaneEl - The target pane DOM element
	 *
	 * @example
	 * ```typescript
	 * // Swap two panes by their DOM elements
	 * const sourcePane = document.querySelector('[data-sash-id="pane-1"]');
	 * const targetPane = document.querySelector('[data-sash-id="pane-2"]');
	 * frame.swapPanes(sourcePane, targetPane);
	 * ```
	 */
	export function swapPanes(
		sourcePaneEl: HTMLElement | Element | null,
		targetPaneEl: HTMLElement | Element | null
	) {
		if (!sourcePaneEl || !targetPaneEl || !rootSash) return;

		// Swap the stores in the sashes
		const sourceSashId = (sourcePaneEl as HTMLElement).getAttribute('data-sash-id');
		const targetSashId = (targetPaneEl as HTMLElement).getAttribute('data-sash-id');

		if (sourceSashId && targetSashId) {
			const sourceSash = rootSash.getById(sourceSashId);
			const targetSash = rootSash.getById(targetSashId);

			if (sourceSash && targetSash) {
				// Swap stores - reactive Sash will automatically trigger re-render
				const tempStore = sourceSash.store;
				sourceSash.store = targetSash.store;
				targetSash.store = tempStore;
			}
		}
	}

	/**
	 * Mounts the frame to a container element.
	 *
	 * Associates the frame with a container element for dimension calculations.
	 * This is required before calling fit() to resize the layout.
	 *
	 * @param {HTMLElement} containerEl - The container element to mount to
	 *
	 * @example
	 * ```typescript
	 * const container = document.getElementById('frame-container');
	 * frame.mount(container);
	 * ```
	 */
	export function mount(containerEl: HTMLElement) {
		containerElement = containerEl;
	}

	/**
	 * Reflows the layout to match the container's current dimensions.
	 *
	 * Updates the root sash dimensions to match the container's clientWidth
	 * and clientHeight, then triggers a re-render to update all pane positions
	 * and sizes. Requires mount() to be called first.
	 *
	 * @example
	 * ```typescript
	 * // Resize to fit container after window resize
	 * window.addEventListener('resize', () => {
	 *   frame.fit();
	 * });
	 * ```
	 */
	export function fit() {
		if (!containerElement || !rootSash) return;
		rootSash.width = containerElement.clientWidth;
		rootSash.height = containerElement.clientHeight;
	}

	export { rootSash, windowElement, containerElement, panes };
</script>

{#if rootSash}
	<div
		bind:this={windowElement}
		class="window"
		data-root-sash-id={rootSash.id}
		role="application"
		aria-label="Window manager"
		use:resize={{ rootSash }}
		use:drop={{ rootSash, onDrop: onPaneDrop }}
	>
		{#each panes as sash (sash.id)}
			<Pane
				{sash}
				{onPaneRender}
				{onpanerender}
			>
				{#if paneContent}
					{@render paneContent(sash)}
				{/if}
			</Pane>
		{/each}

		{#each muntins as sash (sash.id)}
			<Muntin
				{sash}
				{onMuntinRender}
				{onmuntinrender}
			/>
		{/each}
	</div>
{/if}
