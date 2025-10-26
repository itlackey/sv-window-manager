<script lang="ts">
	import { mount as svelteMount, unmount, onDestroy, setContext } from 'svelte';
	import type { Component } from 'svelte';
	import { Position } from '../position.js';
	import { getMetricsFromElement } from '../utils.js';
	import { getSashIdFromPane } from '../frame/frame-utils.js';
	import { getIntersectRect } from '../rect.js';
	import Frame from '../frame/Frame.svelte';
	import Glass from './Glass.svelte';
	import Sill from './Sill.svelte';
	import { drag } from '../actions/drag.svelte';
	import type { Sash } from '../sash.js';
	import { type BwinContext, setWindowContext } from '../context.js';
	import type { FrameComponent } from '../types.js';
	import type { SashConfig } from '../config/sash-config.js';
	import type { ConfigRoot } from '../config/config-root.js';
	import { TRIM_SIZE, CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
	import { BwinErrors } from '../errors.js';
	import * as GlassState from '../managers/glass-state.svelte.js';
	import * as SillState from '../managers/sill-state.svelte.js';
	import '../css/index.css';
	const DEBUG = false;

	// Throttle timeout for ResizeObserver
	let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Props for the BinaryWindow component
	 *
	 * @property {SashConfig | ConfigRoot | Record<string, unknown>} settings - Initial window configuration
	 * @property {boolean} [debug=false] - Enable debug logging to console
	 * @property {boolean} [fitContainer=true] - Automatically resize to fit parent container
	 */
	interface BinaryWindowProps {
		settings: SashConfig | ConfigRoot | Record<string, unknown>;
		debug?: boolean;
		fitContainer?: boolean;
	}

	let {
		settings,
		debug = DEBUG,
		fitContainer = true // Default to true for responsive behavior
	}: BinaryWindowProps = $props();

	// Debug utility to gate console logs
	function debugLog(...args: any[]) {
		if (debug) console.log('[BinaryWindow]', ...args);
	}

	function debugWarn(...args: any[]) {
		if (debug) console.warn('[BinaryWindow]', ...args);
	}

	// Support fitContainer from settings object or from prop
	const shouldFitContainer = $derived(
		'fitContainer' in settings ? settings.fitContainer : fitContainer
	);

	// Frame component binding
	let frameComponent = $state<FrameComponent>();
	let rootElement = $state<HTMLElement | undefined>();

	// State for muntin size (needed for trim)
	const muntinSize = TRIM_SIZE;

	// Tree version counter - increments whenever panes are added/removed
	// This allows parent components to reactively track tree changes
	let treeVersion = $state(0);

	// Drag state
	let activeDragGlassEl = $state<HTMLElement | null>(null);

	// Provide context for child components via Frame
	// Use getters to ensure reactive values are always fresh
	const bwinContext: BwinContext = {
		get windowElement() {
			return frameComponent?.windowElement;
		},
		get sillElement() {
			return SillState.getSillElement();
		},
		get rootSash() {
			return frameComponent?.rootSash;
		},
		removePane,
		addPane,
		getMinimizedGlassElementBySashId: (sashId: string) =>
			SillState.getMinimizedGlassElement(sashId),
		getSillElement: () => SillState.getSillElement(),
		ensureSillElement: () => SillState.ensureSillElement()
	};

	// Set context using type-safe context API
	setWindowContext(bwinContext);

	// Initialize state modules - must happen after bwinContext is created
	GlassState.initialize(bwinContext, debug);
	SillState.initialize(bwinContext, debug);

	// Share state modules via context for child components (for backward compatibility)
	// Components can now import state modules directly or use context
	setContext('glassManager', GlassState);
	setContext('sillManager', SillState);

	// Muntin render callback - apply trim
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleMuntinRender(muntinEl: HTMLElement, _sash: Sash) {
		trimMuntin(muntinEl);
	}

	// Trim muntin (adjust muntin position to create gap)
	function trimMuntin(muntinEl: HTMLElement) {
		if (muntinEl.classList.contains('vertical')) {
			muntinEl.style.top = `${parseFloat(muntinEl.style.top) + muntinSize / 2}px`;
			muntinEl.style.height = `${parseFloat(muntinEl.style.height) - muntinSize}px`;
		} else if (muntinEl.classList.contains('horizontal')) {
			muntinEl.style.left = `${parseFloat(muntinEl.style.left) + muntinSize / 2}px`;
			muntinEl.style.width = `${parseFloat(muntinEl.style.width) - muntinSize}px`;
		}
	}

	// Pane drop callback - handle glass dragging
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handlePaneDrop(_event: DragEvent, sash: Sash, _dropArea: string) {
		if (!activeDragGlassEl || !frameComponent?.windowElement) return;

		const activeDropPaneEl = frameComponent.windowElement.querySelector(
			`.${CSS_CLASSES.PANE}[${DATA_ATTRIBUTES.DROP_AREA}]`
		);
		if (!activeDropPaneEl) return;

		const actualDropArea = activeDropPaneEl.getAttribute(DATA_ATTRIBUTES.DROP_AREA);

		// Swap the content of the two panes
		if (actualDropArea === 'center') {
			const sourcePaneEl = activeDragGlassEl.closest(`.${CSS_CLASSES.PANE}`);
			if (sourcePaneEl) {
				frameComponent.swapPanes(sourcePaneEl, activeDropPaneEl);
			}
			return;
		}
		// Add the pane of glass next to the current pane, vertically or horizontally
		else {
			const oldSashId = getSashIdFromPane(activeDragGlassEl);

			// Preserve the store (title, content, etc.) before removing the pane
			const oldSash = frameComponent.rootSash?.getById(oldSashId);
			const oldStore = oldSash?.store || {};

			removePane(oldSashId);

			// Add new pane with preserved store
			addPane(sash.id, {
				position: actualDropArea,
				id: oldSashId,
				...oldStore // Preserve title, content, and other Glass props
			});

			// The new pane already has a Glass component created by addPane
			// No need to append the old glass element - the new one has the correct store
		}
	}

	// Drag action callbacks
	function handleDragStart(glassEl: HTMLElement) {
		activeDragGlassEl = glassEl;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleDragEnd(_glassEl: HTMLElement) {
		activeDragGlassEl = null;
	}

	/**
	 * Adds a new pane to the window at the specified position relative to a target pane.
	 *
	 * This method creates a new pane with a Glass component and inserts it into the window
	 * layout tree. The new pane is positioned relative to an existing pane and can optionally
	 * have a custom size and ID. The method automatically creates and mounts the Glass component
	 * with any provided properties (title, tabs, actions, etc.).
	 *
	 * A Svelte component must be provided to render in the pane. The component will be mounted
	 * automatically and cleaned up when the pane is removed.
	 *
	 * @param {string} targetPaneSashId - The ID of the target pane to position relative to
	 * @param {Object} props - Pane configuration object
	 * @param {string} props.position - Position relative to target: 'top', 'right', 'bottom', 'left'
	 * @param {string|number} [props.size] - Size of new pane (px, %, or ratio). If omitted, splits evenly
	 * @param {string} [props.id] - Optional custom ID for the pane. Auto-generated if omitted
	 * @param {Component} props.component - Svelte component class to mount in the pane (required)
	 * @param {Object} [props.componentProps] - Props to pass to the mounted component
	 * @param {string|HTMLElement} [props.title] - Title text or element for the Glass header
	 * @param {Array} [props.tabs] - Array of tab labels for tabbed interface
	 * @param {Array|boolean} [props.actions] - Custom action buttons or false to hide defaults
	 * @param {boolean} [props.draggable=true] - Whether the Glass can be dragged to reposition
	 * @returns {Sash} The newly created sash representing the pane
	 *
	 * @throws {BwinError} FRAME_NOT_INIT - If frame component is not initialized
	 * @throws {BwinError} PANE_NOT_FOUND - If target pane ID doesn't exist
	 * @throws {BwinError} INVALID_POSITION - If position is not a valid direction
	 *
	 * @example
	 * ```typescript
	 * // Add a pane with a Svelte component
	 * import MyComponent from './MyComponent.svelte';
	 * binaryWindow.addPane('root', {
	 *   position: 'right',
	 *   size: '40%',
	 *   title: 'Component View',
	 *   component: MyComponent,
	 *   componentProps: { data: myData, onUpdate: handleUpdate }
	 * });
	 *
	 * // Add a pane with tabs and custom actions
	 * import EditorComponent from './EditorComponent.svelte';
	 * binaryWindow.addPane('pane-1', {
	 *   position: 'bottom',
	 *   size: 200, // 200px
	 *   component: EditorComponent,
	 *   componentProps: { filename: 'README.md' },
	 *   tabs: ['Tab 1', 'Tab 2', 'Tab 3'],
	 *   actions: [
	 *     { label: 'Save', onClick: handleSave },
	 *     { label: 'Close', onClick: handleClose }
	 *   ]
	 * });
	 * ```
	 */
	export function addPane(targetPaneSashId: string, props: Record<string, unknown>) {
		const { position, size, id, component, componentProps, ...glassProps } = props;

		// Validate frame component is initialized
		if (!frameComponent) throw BwinErrors.frameNotInitialized();

		// Check if target is the placeholder pane - if so, replace it instead of adding alongside
		const targetSash = frameComponent.rootSash?.getById(targetPaneSashId);
		if (targetSash?.store?.isPlaceholder) {
			debugLog('[addPane] Target is placeholder - replacing placeholder content');

			// Store glass props (title, content, etc.) in the sash's store
			// Remove the isPlaceholder marker
			const fullGlassProps = { ...glassProps, component, componentProps };
			targetSash.store = fullGlassProps;

			// Increment tree version to trigger reactive updates
			treeVersion++;

			debugLog('[addPane] Placeholder replaced with pane:', targetSash.id);
			return targetSash;
		}

		// Validate required position parameter (only required when not replacing placeholder)
		if (!position || typeof position !== 'string') {
			throw BwinErrors.invalidPosition(String(position || 'undefined'));
		}

		// Validate position is one of the valid directional values
		const validPositions: Position[] = [
			Position.Top,
			Position.Right,
			Position.Bottom,
			Position.Left
		];
		if (!validPositions.includes(position as Position)) {
			throw BwinErrors.invalidPosition(position as string);
		}

		// Validate component/componentProps combination
		if (componentProps && !component) {
			debugWarn(
				'componentProps provided without component - props will be ignored',
				componentProps
			);
		}

		const newPaneSash = frameComponent.addPane(targetPaneSashId, { position, size, id });
		if (!newPaneSash) {
			throw BwinErrors.paneNotFound(targetPaneSashId);
		}

		// Store glass props (title, content, etc.) in the sash's store
		// IMPORTANT: Include component and componentProps so handlePaneRender can access them
		const fullGlassProps = { ...glassProps, component, componentProps };
		newPaneSash.store = fullGlassProps;

		// Note: domNode is not available yet - it's created asynchronously by Frame
		// The Glass component will be created via handlePaneRender callback when Frame renders the pane
		// This is the correct flow and not an error

		// Increment tree version to trigger reactive updates
		treeVersion++;

		return newPaneSash;
	}

	/**
	 * Removes a pane from the window by its sash ID.
	 *
	 * This method removes a pane from the layout tree, cleans up its Glass component,
	 * and reflows the remaining panes. If the pane is minimized, it removes the minimized
	 * glass button from the sill. The removal automatically triggers a tree update to
	 * reflect changes in the UI.
	 *
	 * @param {string} sashId - The unique ID of the pane/sash to remove
	 *
	 * @example
	 * ```typescript
	 * // Remove a specific pane
	 * binaryWindow.removePane('pane-123');
	 *
	 * // Remove a pane retrieved from a sash
	 * const sash = binaryWindow.getRootSash()?.getById('editor-pane');
	 * if (sash) {
	 *   binaryWindow.removePane(sash.id);
	 * }
	 * ```
	 */
	export function removePane(sashId: string) {
		if (!frameComponent) return;

		const paneEl = frameComponent.windowElement?.querySelector(
			`[${DATA_ATTRIBUTES.SASH_ID}="${sashId}"]`
		);

		if (paneEl) {
			// Cleanup glass and user component via GlassState
			GlassState.removeGlass(sashId);

			frameComponent.removePane(sashId);

			// Increment tree version to trigger reactive updates
			treeVersion++;
			return;
		}

		// Remove minimized glass element if pane is minimized
		const minimizedGlassEl = SillState.getMinimizedGlassElement(sashId);
		if (minimizedGlassEl) {
			(minimizedGlassEl as HTMLElement).remove();
			// Increment tree version to trigger reactive updates
			treeVersion++;
		}
	}

	/**
	 * Reflows the window layout to fit the current container dimensions.
	 *
	 * This method updates all pane sizes and positions to match the container's current
	 * width and height. Useful after manual container resizing or when fitContainer is
	 * disabled. When fitContainer is enabled, this happens automatically.
	 *
	 * @example
	 * ```typescript
	 * // Manually trigger a reflow after container resize
	 * containerElement.style.width = '1200px';
	 * binaryWindow.fit();
	 * ```
	 */
	export function fit() {
		frameComponent?.fit();
	}

	/**
	 * Mounts the window to a specific container element.
	 *
	 * This method associates the window with a container element, enabling the window
	 * to read the container's dimensions for layout calculations. This is typically
	 * called automatically when fitContainer is enabled, but can be called manually
	 * if you need explicit control over the mounting process.
	 *
	 * @param {HTMLElement} containerEl - The container element to mount the window into
	 *
	 * @example
	 * ```typescript
	 * // Mount to a specific container
	 * const container = document.getElementById('window-container');
	 * binaryWindow.mount(container);
	 * ```
	 */
	export function mount(containerEl: HTMLElement) {
		frameComponent?.mount(containerEl);
	}

	// Track pane count reactively using DOM query
	// This $derived recalculates whenever the windowElement changes or treeVersion updates
	const paneCount = $derived(
		frameComponent?.windowElement?.querySelectorAll(`.${CSS_CLASSES.PANE}`).length || 0
	);

	// Update action button disabled states when pane count changes
	// Single-pane windows disable close/minimize/maximize buttons
	// Multi-pane windows enable all buttons
	$effect(() => {
		const windowEl = frameComponent?.windowElement;
		if (!windowEl) return;

		// Access paneCount to make this effect reactive to pane count changes
		const count = paneCount;

		const updateButton = (cssSelector: string) => {
			if (count === 1) {
				const el = windowEl.querySelector(cssSelector);
				el && el.setAttribute('disabled', '');
			} else {
				windowEl.querySelectorAll(cssSelector).forEach((el) => {
					(el as HTMLElement).removeAttribute('disabled');
				});
			}
		};

		updateButton('.glass-action--close');
		updateButton('.glass-action--minimize');
		updateButton('.glass-action--maximize');
	});

	// Note: Sill component now handles its own mounting via the Sill.svelte component
	// No need to call SillState.mount() - it registers itself when mounted

	// Cleanup state modules when component is destroyed
	// Ensures proper teardown of observers, event listeners, and DOM elements
	onDestroy(() => {
		GlassState.destroy();
		SillState.destroy();
	});

	/**
	 * Setup container fit behavior - observes size changes and updates dimensions
	 * Implements throttled ResizeObserver with proper cleanup
	 * Returns cleanup function to disconnect observer and clear timeout
	 */
	function setupFitContainer() {
		// Early return with noop cleanup if conditions not met
		if (!shouldFitContainer || !rootElement || !frameComponent?.rootSash) return () => {};

		const containerElement = rootElement.parentElement;
		if (!containerElement) return () => {};

		// Mount the container element so fit() can work properly
		frameComponent.mount(containerElement);

		// Set initial dimensions using double-RAF to ensure layout is complete
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (!frameComponent?.rootSash) return;

				const { width, height } = getMetricsFromElement(containerElement);

				debugLog('[fitContainer] Initial setup:', {
					containerWidth: width,
					containerHeight: height,
					rootElement,
					hasFrameComponent: !!frameComponent
				});

				// Guard against invalid dimensions - skip if not ready yet
				if (!width || !height) {
					debugLog('[fitContainer] Skipping invalid dimensions, will be set by ResizeObserver');
					return;
				}

				// Set dimensions directly on rootSash without modifying settings prop
				// Modifying settings would trigger Frame's $derived rootSash and cause effect loop
				frameComponent.rootSash.width = width;
				frameComponent.rootSash.height = height;
				frameComponent.fit();
				debugLog('[fitContainer] Set dimensions:', { width, height });
			});
		});

		// Throttled resize handler (~60fps)
		const handleResize = (entries: ResizeObserverEntry[]) => {
			if (resizeTimeoutId) {
				clearTimeout(resizeTimeoutId);
			}

			resizeTimeoutId = setTimeout(() => {
				requestAnimationFrame(() => {
					for (const entry of entries) {
						if (
							entry.target === containerElement &&
							shouldFitContainer &&
							frameComponent?.rootSash
						) {
							const { width, height } = getMetricsFromElement(containerElement);

							if (width && height) {
								frameComponent.rootSash.width = width;
								frameComponent.rootSash.height = height;
								frameComponent.fit();
							}
						}
					}
				});
			}, 16); // ~60fps throttle
		};

		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(containerElement);

		return () => {
			resizeObserver.disconnect();
			if (resizeTimeoutId) {
				clearTimeout(resizeTimeoutId);
				resizeTimeoutId = null;
			}
		};
	}

	// Setup automatic container fitting when fitContainer is enabled
	// Observes parent container size changes and adjusts window dimensions accordingly
	// This effect runs when rootElement or rootSash becomes available
	// The cleanup function disconnects the ResizeObserver
	$effect(() => {
		return setupFitContainer();
	});

	/**
	 * Gets the root sash of the layout tree.
	 *
	 * The root sash represents the top-level container of the entire window layout.
	 * You can traverse the tree using methods like getById(), walk(), or access
	 * child sashes through the children property.
	 *
	 * @returns {Sash | undefined} The root sash, or undefined if frame not initialized
	 *
	 * @example
	 * ```typescript
	 * // Find a pane by ID
	 * const rootSash = binaryWindow.getRootSash();
	 * const editorPane = rootSash?.getById('editor');
	 *
	 * // Walk the entire tree
	 * rootSash?.walk((sash) => {
	 *   console.log(`Pane ${sash.id}: ${sash.width}x${sash.height}`);
	 * });
	 * ```
	 */
	export function getRootSash() {
		return frameComponent?.rootSash;
	}

	/**
	 * Gets the window element containing all panes and muntins.
	 *
	 * The window element is the DOM container that holds the frame layout.
	 * Useful for querying panes, adding event listeners, or inspecting the DOM structure.
	 *
	 * @returns {HTMLElement | undefined} The window element, or undefined if frame not initialized
	 *
	 * @example
	 * ```typescript
	 * // Query all panes
	 * const windowEl = binaryWindow.getWindowElement();
	 * const panes = windowEl?.querySelectorAll('.pane');
	 * ```
	 */
	export function getWindowElement() {
		return frameComponent?.windowElement;
	}

	/**
	 * Gets the container element that the window is mounted to.
	 *
	 * This is the parent container element passed to mount() or automatically
	 * detected when fitContainer is enabled.
	 *
	 * @returns {HTMLElement | undefined} The container element, or undefined if not mounted
	 *
	 * @example
	 * ```typescript
	 * const container = binaryWindow.getContainerElement();
	 * console.log(`Container size: ${container?.clientWidth}x${container?.clientHeight}`);
	 * ```
	 */
	export function getContainerElement() {
		return frameComponent?.containerElement;
	}

	/**
	 * Gets the sill element used for minimized glass buttons.
	 *
	 * The sill is a bar at the bottom of the window that displays buttons for
	 * minimized panes. Clicking a button restores the pane to its original position.
	 *
	 * @returns {HTMLElement | undefined} The sill element, or undefined if not created
	 *
	 * @example
	 * ```typescript
	 * const sill = binaryWindow.getSillElement();
	 * const minimizedCount = sill?.querySelectorAll('.bw-minimized-glass').length;
	 * ```
	 */
	export function getSillElement() {
		return SillState.getSillElement();
	}

	/**
	 * Ensures the sill element exists and returns it.
	 *
	 * If the sill doesn't exist yet, this method triggers its creation.
	 * Useful when you need to programmatically add minimized glasses or
	 * ensure the sill is ready before performing operations on it.
	 *
	 * @returns {HTMLElement | undefined} The sill element
	 *
	 * @example
	 * ```typescript
	 * // Ensure sill exists before adding custom elements
	 * const sill = binaryWindow.ensureSillElement();
	 * if (sill) {
	 *   sill.appendChild(customElement);
	 * }
	 * ```
	 */
	export function ensureSillElement() {
		return SillState.ensureSillElement();
	}

	/**
	 * Gets the current debug mode state.
	 *
	 * @returns {boolean} True if debug logging is enabled, false otherwise
	 *
	 * @example
	 * ```typescript
	 * if (binaryWindow.getDebug()) {
	 *   console.log('Debug mode is active');
	 * }
	 * ```
	 */
	export function getDebug() {
		return debug;
	}

	/**
	 * Gets the current tree version counter.
	 *
	 * The tree version increments whenever panes are added or removed, allowing
	 * parent components to track changes reactively. Useful for implementing
	 * custom reactive behaviors that depend on layout changes.
	 *
	 * @returns {number} The current tree version counter
	 *
	 * @example
	 * ```typescript
	 * let lastVersion = 0;
	 * $effect(() => {
	 *   const currentVersion = binaryWindow.getTreeVersion();
	 *   if (currentVersion !== lastVersion) {
	 *     console.log('Layout changed');
	 *     lastVersion = currentVersion;
	 *   }
	 * });
	 * ```
	 */
	export function getTreeVersion() {
		return treeVersion;
	}
</script>

<div
	bind:this={rootElement}
	class="bw-container"
	use:drag={{
		onDragStart: handleDragStart,
		onDragEnd: handleDragEnd
	}}
>
	<div class="bw-window-area">
		<Frame
			bind:this={frameComponent}
			{settings}
			{debug}
			{treeVersion}
			onmuntinrender={handleMuntinRender}
			onPaneDrop={handlePaneDrop}
		>
			{#snippet paneContent(sash)}
				<Glass
					title={sash.store.title}
					tabs={sash.store.tabs}
					actions={sash.store.actions}
					draggable={sash.store.draggable !== false}
					{sash}
					binaryWindow={bwinContext}
					component={sash.store.component}
					componentProps={sash.store.componentProps}
				/>
			{/snippet}
		</Frame>
	</div>
	<Sill binaryWindow={bwinContext} />
</div>

<style>
	.bw-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.bw-window-area {
		flex: 1;
		min-height: 0; /* Allow flex item to shrink below content size */
		position: relative;
	}
</style>
