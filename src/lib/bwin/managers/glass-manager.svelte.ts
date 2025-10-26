import { unmount } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { BwinContext } from '../context.js';
import type { GlassInstance, UserComponentInstance, CreateGlassProps } from './types.js';
import { createDebugger, type Debugger } from '../utils/debug.svelte.js';

/**
 * Manages Glass component lifecycle using Svelte 5 reactive state
 *
 * LEGACY MODE: This manager is kept for backward compatibility but is largely
 * a no-op in the default declarative rendering mode. Glass components are now
 * rendered declaratively via BinaryWindow's {#each} loop and Svelte 5 snippets,
 * making imperative creation/mounting unnecessary.
 *
 * Key Svelte 5 Patterns:
 * - Uses $state() for reactive arrays/maps
 * - Uses $derived() for computed properties
 * - Automatic reactivity when state changes
 * - Shared via context API for type-safe access
 *
 * Responsibilities (legacy):
 * - Track Glass instances reactively (typically empty in declarative mode)
 * - Provide computed state (count, active, etc.)
 * - Clean up instances on removal (typically no-op in declarative mode)
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
	 * Removes a Glass component
	 *
	 * Note: In declarative rendering mode (which is now the default), Glass components
	 * are managed by Svelte's reactivity system and this method is a no-op. It's kept
	 * for backward compatibility and will be removed in a future release.
	 *
	 * Reactive - removal automatically updates all derived state
	 * and triggers UI updates.
	 *
	 * @param sashId - The sash ID to remove
	 */
	removeGlass(sashId: string): void {
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
	 * Destroys all Glass instances
	 * Call this on component cleanup
	 *
	 * Note: In declarative rendering mode (which is now the default), Glass components
	 * are managed by Svelte's reactivity system and this cleanup is typically a no-op.
	 * It's kept for backward compatibility and will be removed in a future release.
	 */
	destroy(): void {
		this.debugLog('destroy: Cleaning up all glasses');

		// Cleanup all glasses (typically empty in declarative mode)
		this.glasses.forEach((glassData) => {
			unmount(glassData.instance);
		});
		this.glasses = []; // Clear reactive array

		// Cleanup all user components (typically empty in declarative mode)
		this.userComponents.forEach((component) => {
			unmount(component.instance);
		});
		this.userComponents.clear();

		this.activeGlass = undefined;
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

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
