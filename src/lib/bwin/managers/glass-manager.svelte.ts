import { mount as svelteMount, unmount } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { Component } from 'svelte';
import Glass from '../binary-window/Glass.svelte';
import type { Sash } from '../sash.js';
import type { BwinContext } from '../context.js';
import type { GlassInstance, UserComponentInstance, CreateGlassProps} from './types.js';
import { CSS_CLASSES } from '../constants.js';
import { createDebugger, type Debugger } from '../utils/debug.svelte.js';

/**
 * Manages Glass component lifecycle using Svelte 5 reactive state
 *
 * Key Svelte 5 Patterns:
 * - Uses $state() for reactive arrays/maps
 * - Uses $derived() for computed properties
 * - Automatic reactivity when state changes
 * - Shared via context API for type-safe access
 *
 * Responsibilities:
 * - Create and mount Glass components for panes
 * - Mount user-provided Svelte components
 * - Track all Glass and component instances reactively
 * - Clean up instances on removal
 * - Provide computed state (count, active, etc.)
 */
export class GlassManager {
	// ============================================================================
	// REACTIVE STATE (Svelte 5 runes)
	// ============================================================================

	/** All glass instances (reactive array)
	 * Using $state.raw to prevent Svelte from wrapping component instances in proxies
	 * This avoids "state_proxy_unmount" errors when calling unmount()
	 */
	glasses = $state.raw<GlassInstance[]>([]);

	/** User components mapped by sash ID (reactive map)
	 * Using SvelteMap for automatic reactivity without proxy wrapping issues
	 */
	userComponents = new SvelteMap<string, UserComponentInstance>();

	/** Currently active glass instance */
	activeGlass = $state<GlassInstance | undefined>();

	// ============================================================================
	// DERIVED STATE (computed automatically)
	// ============================================================================

	/** Number of active glasses (auto-updates) */
	glassCount = $derived(this.glasses.length);

	/** Whether there's an active glass */
	hasActiveGlass = $derived(this.activeGlass !== undefined);

	/** Map of glasses by sash ID (computed from array) */
	glassesBySashId = $derived.by(() => {
		const map = new Map<string, GlassInstance>();
		this.glasses.forEach((glass) => map.set(glass.sashId, glass));
		return map;
	});

	/** Array of sash IDs with glasses */
	glassIds = $derived(this.glasses.map((g) => g.sashId));

	// ============================================================================
	// CONSTRUCTOR
	// ============================================================================

	private bwinContext: BwinContext;
	private debugger: Debugger;

	constructor(bwinContext: BwinContext, debug = false) {
		this.bwinContext = bwinContext;
		this.debugger = createDebugger('GlassManager', debug);
	}

	// ============================================================================
	// PUBLIC METHODS
	// ============================================================================

	/**
	 * Creates and mounts a Glass component for a pane
	 *
	 * This method is reactive - creating a glass automatically updates
	 * all derived state and triggers UI updates in components watching
	 * the glasses array.
	 *
	 * @param paneEl - The pane DOM element to render into
	 * @param sash - The sash data for this pane
	 * @param props - Glass properties (title, content, tabs, actions, etc.)
	 * @returns The created Glass instance
	 *
	 * @example
	 * ```typescript
	 * // Glass automatically appears in glassesBySashId, glassCount updates
	 * glassManager.createGlass(paneElement, sash, {
	 *   title: 'Editor',
	 *   content: editorElement,
	 *   tabs: ['File', 'Edit', 'View']
	 * });
	 * ```
	 */
	createGlass(paneEl: HTMLElement, sash: Sash, props: CreateGlassProps): GlassInstance | null {
		if (!paneEl) {
			this.debugWarn('createGlass: paneEl is null/undefined');
			return null;
		}

		// Cleanup existing glass instance for this sash if it exists
		// This happens when Frame re-renders and recreates pane elements
		this.removeGlass(sash.id);

		// If a user component is provided, mount it first
		let glassProps = { ...props };
		if (props.component) {
			const userComponent = this.mountUserComponent(
				sash.id,
				props.component,
				props.componentProps || {}
			);

			if (userComponent) {
				// Use mounted component's element as content
				glassProps.content = userComponent.element;
				// Preserve component info for restore after minimize
				glassProps.component = props.component;
				glassProps.componentProps = props.componentProps;
			}
		}

		// Create container for Glass component
		const container = document.createElement('div');

		// Mount Glass component
		const glassInstance = svelteMount(Glass, {
			target: container,
			props: {
				...glassProps,
				sash,
				binaryWindow: this.bwinContext
			} as any // Type assertion needed - glassProps has user-defined properties
		});

		// Create instance object
		const instance: GlassInstance = {
			container,
			instance: glassInstance,
			sashId: sash.id,
			props: glassProps
		};

		// Add to reactive array - need to reassign to trigger reactivity with $state.raw
		this.glasses = [...this.glasses, instance];

		// Append Glass element to pane
		paneEl.innerHTML = '';
		const glassElement = container.firstElementChild;
		if (glassElement) {
			paneEl.append(glassElement);
		}

		// Add debug ID if enabled
		if (this.debug) {
			const contentEl = paneEl.querySelector(`.${CSS_CLASSES.GLASS_CONTENT}`);
			if (contentEl) {
				contentEl.prepend(document.createTextNode(sash.id));
			}
		}

		this.debugLog('createGlass: Created glass for sash', sash.id);
		return instance;
	}

	/**
	 * Removes a Glass component and associated user component
	 *
	 * Reactive - removal automatically updates all derived state
	 * and triggers UI updates.
	 *
	 * @param sashId - The sash ID to remove
	 */
	removeGlass(sashId: string): void {
		this.cleanupUserComponent(sashId);

		// Find and remove from reactive array
		const index = this.glasses.findIndex((g) => g.sashId === sashId);
		if (index !== -1) {
			const glassData = this.glasses[index];
			unmount(glassData.instance);
			// Need to reassign to trigger reactivity with $state.raw
			this.glasses = this.glasses.filter((g) => g.sashId !== sashId);

			// Clear active if this was active
			if (this.activeGlass?.sashId === sashId) {
				this.activeGlass = undefined;
			}
		}

		this.debugLog('removeGlass: Removed glass for sash', sashId);
	}

	/**
	 * Updates Glass properties for an existing instance
	 *
	 * @param sashId - Sash ID to update
	 * @param props - New properties to apply
	 */
	updateGlass(sashId: string, props: Partial<CreateGlassProps>): void {
		const glass = this.glassesBySashId.get(sashId);
		if (!glass) {
			this.debugWarn('updateGlass: Glass not found for sash', sashId);
			return;
		}

		// Update stored props (triggers reactivity if needed)
		glass.props = { ...glass.props, ...props };

		// Force array update to trigger reactivity
		this.glasses = [...this.glasses];

		this.debugLog('updateGlass: Updated glass for sash', sashId);
	}

	/**
	 * Sets the active glass instance
	 *
	 * @param sashId - Sash ID to set as active (or undefined to clear)
	 */
	setActiveGlass(sashId: string | undefined): void {
		if (sashId === undefined) {
			this.activeGlass = undefined;
			return;
		}

		const glass = this.glassesBySashId.get(sashId);
		if (glass) {
			this.activeGlass = glass;
		}
	}

	/**
	 * Gets a Glass instance by sash ID (uses derived map)
	 */
	getGlass(sashId: string): GlassInstance | undefined {
		return this.glassesBySashId.get(sashId);
	}

	/**
	 * Checks if a Glass exists for a sash ID
	 */
	hasGlass(sashId: string): boolean {
		return this.glassesBySashId.has(sashId);
	}

	/**
	 * Gets all Glass instances (reactive array)
	 */
	getAllGlasses(): GlassInstance[] {
		return this.glasses;
	}

	/**
	 * Destroys all Glass and user component instances
	 * Call this on component cleanup
	 */
	destroy(): void {
		this.debugLog('destroy: Cleaning up all glasses and components');

		// Cleanup all glasses
		this.glasses.forEach((glassData) => {
			unmount(glassData.instance);
		});
		this.glasses = []; // Clear reactive array

		// Cleanup all user components
		this.userComponents.forEach((component) => {
			unmount(component.instance);
		});
		this.userComponents.clear();

		this.activeGlass = undefined;
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	/**
	 * Mounts a user-provided Svelte component
	 *
	 * @param sashId - Sash ID to associate with component
	 * @param component - Svelte component class
	 * @param props - Props to pass to component
	 * @returns The mounted component instance
	 */
	private mountUserComponent(
		sashId: string,
		component: Component,
		props: Record<string, unknown>
	): UserComponentInstance | null {
		// Cleanup existing component if any
		this.cleanupUserComponent(sashId);

		// Create container element
		const contentElem = document.createElement('div');
		contentElem.style.height = '100%';
		contentElem.style.width = '100%';
		contentElem.style.overflow = 'hidden';

		try {
			// Mount component
			const componentInstance = svelteMount(component, {
				target: contentElem,
				props
			});

			const instance: UserComponentInstance = {
				instance: componentInstance,
				sashId,
				element: contentElem
			};

			this.userComponents.set(sashId, instance);
			this.debugLog('mountUserComponent: Mounted component for sash', sashId);
			return instance;
		} catch (error) {
			this.debugWarn('mountUserComponent: Failed to mount component', error);
			return null;
		}
	}

	/**
	 * Cleanup a specific user component instance
	 */
	private cleanupUserComponent(sashId: string): void {
		const userComponent = this.userComponents.get(sashId);
		if (userComponent) {
			unmount(userComponent.instance);
			this.userComponents.delete(sashId);
		}
	}

	// ============================================================================
	// DEBUG UTILITIES
	// ============================================================================

	private debugLog(...args: unknown[]): void {
		this.debugger.log(...args);
	}

	private debugWarn(...args: unknown[]): void {
		this.debugger.warn(...args);
	}
}
