<script lang="ts">
	import { mount as svelteMount, unmount } from 'svelte';
	import type { Component } from 'svelte';
	import { Position } from '../position.js';
	import { getMetricsFromElement } from '../utils.js';
	import { getSashIdFromPane } from '../frame/frame-utils.js';
	import { getIntersectRect } from '../rect.js';
	import Frame from '../frame/Frame.svelte';
	import Glass from './Glass.svelte';
	import { drag } from '../actions/drag.svelte';
	import { setContext } from 'svelte';
	import type { Sash } from '../sash.js';
	import { BWIN_CONTEXT, type BwinContext } from '../context.js';
	import type { FrameComponent } from '../types.js';
	import type { SashConfig } from '../config/sash-config.js';
	import type { ConfigRoot } from '../config/config-root.js';
	import { TRIM_SIZE, CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';
	import { BwinErrors } from '../errors.js';
	import '../css/index.css';
	const DEBUG = import.meta.env.VITE_DEBUG == 'true' ? true : false;

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

	// Support fitContainer from settings object (like bwin.js) or from prop
	const shouldFitContainer = $derived(
		'fitContainer' in settings ? settings.fitContainer : fitContainer
	);

	// Frame component binding
	let frameComponent = $state<FrameComponent>();
	let sillElement = $state<HTMLElement | undefined>();
	let rootElement = $state<HTMLElement | undefined>();

	// State for muntin size (needed for trim)
	const muntinSize = TRIM_SIZE;

	// Tree version counter - increments whenever panes are added/removed
	// This allows parent components to reactively track tree changes
	let treeVersion = $state(0);

	// Track glasses by sash ID
	let glassesBySashId = $state(
		new Map<string, { container: HTMLElement; instance: Record<string, unknown> }>()
	);

	// Track user-mounted components by sash ID for cleanup
	let userComponentsBySashId = $state(new Map<string, Record<string, unknown>>());

	// Drag state
	let activeDragGlassEl = $state<HTMLElement | null>(null);

	// Provide context for child components via Frame
	// Use getters to ensure reactive values are always fresh
	const bwinContext: BwinContext = {
		get windowElement() {
			return frameComponent?.windowElement;
		},
		get sillElement() {
			return sillElement;
		},
		get rootSash() {
			return frameComponent?.rootSash;
		},
		removePane,
		addPane,
		getMinimizedGlassElementBySashId,
		getSillElement: () => sillElement,
		ensureSillElement: () => {
			if (!sillElement) {
				setupSillElement();
			}
			return sillElement;
		}
	};

	setContext(BWIN_CONTEXT, bwinContext);

	// Create glass component for a pane
	function createGlassForPane(paneEl: HTMLElement, sash: Sash) {
		if (!paneEl) return;

		// Cleanup existing glass instance for this sash if it exists
		// This happens when Frame re-renders and recreates pane elements
		const existingGlass = glassesBySashId.get(sash.id);
		if (existingGlass) {
			unmount(existingGlass.instance);
			glassesBySashId.delete(sash.id);
		}

		const glassProps = sash.store;
		const container = document.createElement('div');

		const glassInstance = svelteMount(Glass, {
			target: container,
			props: {
				...glassProps,
				sash,
				binaryWindow: bwinContext
			}
		});

		glassesBySashId.set(sash.id, { container, instance: glassInstance });

		paneEl.innerHTML = '';
		const glassElement = container.firstElementChild;
		if (glassElement) {
			paneEl.append(glassElement);
		}

		if (debug) {
			const contentEl = paneEl.querySelector(`.${CSS_CLASSES.GLASS_CONTENT}`);
			if (contentEl) {
				contentEl.prepend(document.createTextNode(sash.id));
			}
		}
	}

	// Pane render callback
	function handlePaneRender(paneEl: HTMLElement, sash: Sash) {
		createGlassForPane(paneEl, sash);
	}

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
	 * with any provided properties (title, content, tabs, actions, etc.).
	 *
	 * You can provide either a static content element/string OR a Svelte component to render
	 * in the pane. If a component is provided, it will be mounted automatically and cleaned up
	 * when the pane is removed.
	 *
	 * @param {string} targetPaneSashId - The ID of the target pane to position relative to
	 * @param {Object} props - Pane configuration object
	 * @param {string} props.position - Position relative to target: 'top', 'right', 'bottom', 'left'
	 * @param {string|number} [props.size] - Size of new pane (px, %, or ratio). If omitted, splits evenly
	 * @param {string} [props.id] - Optional custom ID for the pane. Auto-generated if omitted
	 * @param {Component} [props.component] - Svelte component class to mount in the pane
	 * @param {Object} [props.componentProps] - Props to pass to the mounted component
	 * @param {string|HTMLElement} [props.title] - Title text or element for the Glass header
	 * @param {string|HTMLElement} [props.content] - Content to render in the Glass body (ignored if component is provided)
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
	 * // Add a pane with static content
	 * const newPane = binaryWindow.addPane('root', {
	 *   position: 'right',
	 *   size: '40%',
	 *   title: 'Editor',
	 *   content: editorElement
	 * });
	 *
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
	 * binaryWindow.addPane('pane-1', {
	 *   position: 'bottom',
	 *   size: 200, // 200px
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

		// Validate required position parameter
		if (!position || typeof position !== 'string') {
			throw BwinErrors.invalidPosition(String(position || 'undefined'));
		}

		// Validate position is one of the valid directional values
		const validPositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];
		if (!validPositions.includes(position)) {
			throw BwinErrors.invalidPosition(position);
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

		// If a Svelte component is provided, mount it and use as content
		if (component) {
			const contentElem = document.createElement('div');
			contentElem.style.height = '100%';
			contentElem.style.width = '100%';
			contentElem.style.overflow = 'hidden';

			const componentInstance = svelteMount(component as Component, {
				target: contentElem,
				props: componentProps || {}
			});

			// Store component instance for cleanup
			userComponentsBySashId.set(newPaneSash.id, componentInstance);

			// Use the mounted component's container as content
			glassProps.content = contentElem;

			// Preserve component info for potential restore after minimize
			glassProps.component = component;
			glassProps.componentProps = componentProps;
		}

		// Store glass props (title, content, etc.) in the sash's store
		newPaneSash.store = glassProps;

		// Create and mount Glass component
		if (newPaneSash.domNode) {
			createGlassForPane(newPaneSash.domNode, newPaneSash as unknown as Sash);
		}

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
			// Cleanup user component if it exists
			const userComponent = userComponentsBySashId.get(sashId);
			if (userComponent) {
				unmount(userComponent);
				userComponentsBySashId.delete(sashId);
			}

			// Cleanup glass component if it exists
			const glassData = glassesBySashId.get(sashId);
			if (glassData) {
				unmount(glassData.instance);
				glassesBySashId.delete(sashId);
			}

			frameComponent.removePane(sashId);

			// Increment tree version to trigger reactive updates
			treeVersion++;
			return;
		}

		// Remove minimized glass element if pane is minimized
		const minimizedGlassEl = getMinimizedGlassElementBySashId(sashId);
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

	// Restore minimized glass
	function restoreGlass(
		minimizedGlassEl: HTMLElement & {
			bwOriginalBoundingRect?: DOMRect;
			bwOriginalSashId?: string;
			bwOriginalPosition?: string;
			bwGlassElement?: HTMLElement;
			bwOriginalStore?: Record<string, unknown>;
		}
	) {
		debugLog('[restoreGlass] Starting restore:', {
			minimizedGlassEl,
			hasWindowElement: !!frameComponent?.windowElement,
			hasRootSash: !!frameComponent?.rootSash,
			originalBoundingRect: minimizedGlassEl.bwOriginalBoundingRect,
			originalSashId: minimizedGlassEl.bwOriginalSashId,
			originalPosition: minimizedGlassEl.bwOriginalPosition,
			glassElement: minimizedGlassEl.bwGlassElement
		});

		if (!frameComponent?.windowElement || !frameComponent?.rootSash) {
			debugWarn('[restoreGlass] Missing required components');
			return;
		}

		const originalRect = minimizedGlassEl.bwOriginalBoundingRect;
		if (!originalRect) {
			debugWarn('[restoreGlass] Missing original bounding rect');
			return;
		}

		let biggestIntersectArea = 0;
		let targetPaneEl: HTMLElement | null = null;

		frameComponent.windowElement.querySelectorAll(`.${CSS_CLASSES.PANE}`).forEach((paneEl) => {
			const paneRect = getMetricsFromElement(paneEl as HTMLElement);
			const intersectRect = getIntersectRect(originalRect, paneRect);

			if (intersectRect) {
				const intersectArea = intersectRect.width * intersectRect.height;

				if (intersectArea > biggestIntersectArea) {
					biggestIntersectArea = intersectArea;
					targetPaneEl = paneEl as HTMLElement;
				}
			}
		});

		debugLog('[restoreGlass] Target pane found:', {
			targetPaneEl,
			biggestIntersectArea
		});

		if (targetPaneEl && frameComponent?.rootSash) {
			const newPosition = minimizedGlassEl.bwOriginalPosition;
			const targetRect = getMetricsFromElement(targetPaneEl);
			const targetPaneSashId = (targetPaneEl as HTMLElement).getAttribute(DATA_ATTRIBUTES.SASH_ID);
			if (!targetPaneSashId) {
				debugWarn('[restoreGlass] Target pane missing sash ID');
				return;
			}

			const targetPaneSash = frameComponent.rootSash.getById(targetPaneSashId);
			if (!targetPaneSash) {
				debugWarn('[restoreGlass] Target pane sash not found');
				return;
			}

			debugLog('[restoreGlass] Restoring to pane:', {
				targetPaneSashId,
				newPosition,
				targetRect
			});

			let newSize = 0;

			if (newPosition === Position.Left || newPosition === Position.Right) {
				newSize =
					targetRect.width - originalRect.width < targetPaneSash.minWidth
						? targetRect.width / 2
						: originalRect.width;
			} else if (newPosition === Position.Top || newPosition === Position.Bottom) {
				newSize =
					targetRect.height - originalRect.height < targetPaneSash.minHeight
						? targetRect.height / 2
						: originalRect.height;
			} else {
				throw BwinErrors.invalidPosition(newPosition || 'unknown');
			}

			const originalSashId = minimizedGlassEl.bwOriginalSashId;
			const originalStore = minimizedGlassEl.bwOriginalStore || {};

			// addPane will create a new Glass component with the preserved store
			addPane((targetPaneEl as HTMLElement).getAttribute(DATA_ATTRIBUTES.SASH_ID)!, {
				id: originalSashId,
				position: newPosition,
				size: newSize,
				...originalStore // Preserve title, content, and other Glass props
			});
		}
	}

	// Get minimized glass element by sash ID
	function getMinimizedGlassElementBySashId(sashId: string) {
		if (!frameComponent?.windowElement) return null;
		const els = frameComponent.windowElement.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`);
		return Array.from(els).find(
			(el) => (el as HTMLElement & { bwOriginalSashId?: string }).bwOriginalSashId === sashId
		);
	}

	// Update disabled state of action buttons
	function updateDisabledStateOfActionButtons() {
		updateDisabledState('.glass-action--close');
		updateDisabledState('.glass-action--minimize');
		updateDisabledState('.glass-action--maximize');
	}

	function updateDisabledState(cssSelector: string) {
		if (!frameComponent?.windowElement) return;

		const paneCount = frameComponent.windowElement.querySelectorAll(`.${CSS_CLASSES.PANE}`).length;

		if (paneCount === 1) {
			const el = frameComponent.windowElement.querySelector(cssSelector);
			el && el.setAttribute('disabled', '');
		} else {
			frameComponent.windowElement.querySelectorAll(cssSelector).forEach((el) => {
				(el as HTMLElement).removeAttribute('disabled');
			});
		}
	}

	// Observe action buttons to update disabled state
	$effect(() => {
		if (!frameComponent?.windowElement) return;

		updateDisabledStateOfActionButtons();

		const paneCountObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					updateDisabledStateOfActionButtons();
				}
			});
		});

		paneCountObserver.observe(frameComponent.windowElement, {
			childList: true
		});

		return () => {
			paneCountObserver.disconnect();
		};
	});

	/**
	 * Setup sill element inside window element
	 * Creates or reuses existing sill, preserving minimized glasses
	 */
	function setupSillElement() {
		const winEl = frameComponent?.windowElement;
		if (!winEl) {
			sillElement = undefined;
			return;
		}

		// Check if sill already exists in this windowElement
		const existingSill = winEl.querySelector(`.${CSS_CLASSES.SILL}`);
		if (existingSill) {
			sillElement = existingSill as HTMLElement;
			debugLog('[Sill] Found existing sill in windowElement:', sillElement);
			return;
		}

		// Create new sill
		const sillEl = document.createElement('div');
		sillEl.className = CSS_CLASSES.SILL;

		// Preserve minimized glass buttons from old sill if it exists
		if (sillElement) {
			const minimizedGlasses = Array.from(
				sillElement.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`)
			);
			debugLog('[Sill] Preserving minimized glasses:', minimizedGlasses.length);
			minimizedGlasses.forEach((glassBtn) => {
				sillEl.append(glassBtn);
			});
		}

		winEl.append(sillEl);
		sillElement = sillEl;
		debugLog('[Sill] Created and appended sill element');
	}

	// Create and append sill element inside window element
	// Need to recreate sill whenever windowElement changes (e.g., when Frame re-renders due to {#key})
	$effect(() => {
		setupSillElement();
	});

	/**
	 * Setup click handler for restoring minimized glasses from sill
	 * Returns cleanup function to remove event listener
	 */
	function setupSillClickHandler() {
		if (!sillElement) {
			debugWarn('[Sill Click Handler] No sill element');
			return undefined;
		}

		debugLog('[Sill Click Handler] Setting up click handler on sill:', sillElement);

		function handleClick(event: MouseEvent) {
			debugLog('[Sill Click] Click detected on sill:', {
				target: event.target,
				targetMatches: (event.target as HTMLElement).matches(`.${CSS_CLASSES.MINIMIZED_GLASS}`),
				targetClassName: (event.target as HTMLElement).className
			});

			if (!(event.target as HTMLElement).matches(`.${CSS_CLASSES.MINIMIZED_GLASS}`)) {
				debugLog('[Sill Click] Target is not a minimized glass, ignoring');
				return;
			}

			debugLog('[Sill Click] Restoring minimized glass...');
			const minimizedGlassEl = event.target as HTMLElement;
			restoreGlass(minimizedGlassEl);
			minimizedGlassEl.remove();
			debugLog('[Sill Click] Minimized glass removed');
		}

		sillElement.addEventListener('click', handleClick);
		debugLog('[Sill Click Handler] Click listener attached to sill');

		// Return cleanup function
		return () => {
			sillElement?.removeEventListener('click', handleClick);
			debugLog('[Sill Click Handler] Click listener removed from sill');
		};
	}

	// Handle sill click for minimized glasses
	$effect(() => {
		const cleanup = setupSillClickHandler();
		// Return cleanup function or noop if sillElement not yet available
		return cleanup || (() => {});
	});

	// Cleanup all glasses on destroy
	$effect(() => {
		return () => {
			glassesBySashId.forEach((glassData) => {
				unmount(glassData.instance);
			});
			glassesBySashId.clear();
		};
	});

	// Cleanup all user components on destroy
	$effect(() => {
		return () => {
			userComponentsBySashId.forEach((instance) => {
				unmount(instance);
			});
			userComponentsBySashId.clear();
		};
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

				// Set defaults if not provided
				if (!settings.width) settings.width = width;
				if (!settings.height) settings.height = height;

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

	// Observe parent container size changes and update rootSash dimensions
	// This matches the bwin.js fitContainer feature implementation
	$effect(() => {
		// setupFitContainer always returns a cleanup function (or noop)
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
		return sillElement;
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
		if (!sillElement) {
			setupSillElement();
		}
		return sillElement;
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
	<Frame
		bind:this={frameComponent}
		{settings}
		{debug}
		onPaneRender={handlePaneRender}
		onMuntinRender={handleMuntinRender}
		onPaneDrop={handlePaneDrop}
	/>
</div>

<style>
	.bw-container {
		position: relative;
		width: 100%;
		height: 100%;
		/* Allow sill to overflow below the window without being clipped */
		overflow: visible;
	}
</style>
