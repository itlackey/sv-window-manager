// ============================================================================
// SV Window Manager - Public API
// ============================================================================
// This barrel export provides a clean, tree-shakeable API for consumers.
// Exports are organized into logical groups for better discoverability.

// ============================================================================
// PRIMARY COMPONENTS
// ============================================================================

/**
 * Core Svelte components for advanced usage.
 * These are typically used internally but can be used directly for custom layouts.
 */
export { default as BinaryWindow } from './bwin/binary-window/BinaryWindow.svelte';
export { default as Frame } from './bwin/frame/Frame.svelte';
export { default as Pane } from './bwin/frame/Pane.svelte';
export { default as Muntin } from './bwin/frame/Muntin.svelte';
export { default as Glass } from './bwin/binary-window/Glass.svelte';
export { default as Sill } from './bwin/binary-window/Sill.svelte';

// ============================================================================
// EXAMPLES
// ============================================================================

/**
 * Example components demonstrating library features.
 * Use these as references for your own implementations.
 */
// TODO: Add SnippetExample once created
// export { default as SnippetExample } from './bwin/examples/SnippetExample.svelte';

// ============================================================================
// SVELTE ACTIONS
// ============================================================================

/**
 * Svelte actions for drag-drop and resizing functionality.
 * Use these to add interactive behaviors to custom components.
 */
export { resize } from './bwin/actions/resize.svelte';
export { drag } from './bwin/actions/drag.svelte';
export { drop } from './bwin/actions/drop.svelte';

// ============================================================================
// WINDOW ACTIONS
// ============================================================================

/**
 * Window action handlers for close, minimize, and maximize operations.
 * These are typically used with Glass component actions.
 */
export { default as closeAction } from './bwin/binary-window/actions.close.js';
export { default as minimizeAction } from './bwin/binary-window/actions.minimize.js';
export { default as maximizeAction } from './bwin/binary-window/actions.maximize.js';

// ============================================================================
// CORE UTILITIES
// ============================================================================

/**
 * Core utilities for working with sashes, positions, and configurations.
 */
export { Sash } from './bwin/sash.js';
export { Position } from './bwin/position.js';
export { SashConfig } from './bwin/config/sash-config.js';
export { ConfigRoot } from './bwin/config/config-root.js';

// ============================================================================
// MANAGERS
// ============================================================================

/**
 * Manager classes for handling glass and sill lifecycle with Svelte 5 reactive state.
 *
 * **LEGACY API (deprecated)**: The class-based GlassManager and SillManager are kept
 * for backward compatibility but are deprecated. Use the modern state modules instead.
 *
 * **MODERN API (recommended)**: GlassState and SillState are module-level reactive state
 * modules using Svelte 5 runes. They provide the same functionality with a simpler,
 * more functional API.
 *
 * @example
 * ```typescript
 * // Legacy (deprecated):
 * import { GlassManager, SillManager } from 'sv-window-manager';
 * const glassManager = new GlassManager(bwinContext, debug);
 * glassManager.removeGlass(sashId);
 *
 * // Modern (recommended):
 * import { GlassState, SillState } from 'sv-window-manager';
 * GlassState.initialize(bwinContext, debug);
 * GlassState.removeGlass(sashId);
 * ```
 */
export { GlassManager } from './bwin/managers/glass-manager.svelte.js';
export { SillManager } from './bwin/managers/sill-manager.svelte.js';
export * as GlassState from './bwin/managers/glass-state.svelte.js';
export * as SillState from './bwin/managers/sill-state.svelte.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Size constants for layout calculations.
 */
export { MUNTIN_SIZE, TRIM_SIZE, MIN_WIDTH, MIN_HEIGHT } from './bwin/constants.js';

/**
 * CSS class names used by the window manager.
 * Use these for custom styling or selectors.
 */
export { CSS_CLASSES } from './bwin/constants.js';

/**
 * Data attribute names used for DOM manipulation.
 * Use these when working with DOM elements directly.
 */
export { DATA_ATTRIBUTES } from './bwin/constants.js';

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Type-safe context utilities for Svelte 5
 *
 * These functions provide type safety and runtime validation for accessing
 * window manager context in Svelte components.
 *
 * **Window Context** - Access the BinaryWindow instance and its methods:
 * ```typescript
 * // In BinaryWindow.svelte (sets the context)
 * import { setWindowContext } from 'sv-window-manager';
 * setWindowContext(bwinContext);
 *
 * // In child components (gets the context)
 * import { getWindowContext } from 'sv-window-manager';
 * const bwin = getWindowContext();
 * bwin.addPane('root', { position: 'right', title: 'New Pane' });
 * ```
 *
 * **Layout Context** - Access frame-level layout settings:
 * ```typescript
 * // In Frame.svelte (sets the context)
 * import { setLayoutContext } from 'sv-window-manager';
 * setLayoutContext(frameContext);
 *
 * // In child components (gets the context)
 * import { getLayoutContext } from 'sv-window-manager';
 * const frame = getLayoutContext();
 * const isDebug = frame.debug;
 * ```
 *
 * **Safe Context Access** - Use try* variants when context might not exist:
 * ```typescript
 * import { tryGetWindowContext } from 'sv-window-manager';
 * const bwin = tryGetWindowContext(); // Returns undefined instead of throwing
 * if (bwin) {
 *   bwin.addPane(...);
 * }
 * ```
 */
export {
	setWindowContext,
	getWindowContext,
	tryGetWindowContext,
	setLayoutContext,
	getLayoutContext,
	tryGetLayoutContext
} from './bwin/context.js';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Error classes and factories for consistent error handling.
 */
export { BwinError, BwinErrors } from './bwin/errors.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * TypeScript type definitions for the library.
 * All types are re-exported for convenient importing.
 */

// High-level library types (from src/lib/types.ts)
export type { BwinConfig, PaneConfig, BwinHostProps, SessionComponentProps } from './types.js';

// Core bwin types (from src/lib/bwin/types.ts)
export type {
	Sash as SashInterface,
	GlassAction,
	GlassProps,
	BwinContext,
	FrameComponent,
	FrameContext,
	ResizeActionParams,
	DragActionParams,
	DropActionParams,
	PaneRenderEvent,
	MuntinRenderEvent,
	PaneDropEvent,
	PaneEvents,
	MuntinEvents
} from './bwin/types.js';

// Manager types (from src/lib/bwin/managers/types.ts)
export type {
	GlassInstance,
	UserComponentInstance,
	CreateGlassProps,
	MinimizedGlassData
} from './bwin/managers/types.js';

// ============================================================================
// EVENTS (Types + Dispatcher)
// ============================================================================

/**
 * Typed pane lifecycle events and dispatcher utilities.
 * Consumers can subscribe to specific events or use the generic API.
 */
export type { PanePayload, PaneEventType, PaneEvent, PaneContext } from './events/types.js';

export {
	addEventHandler,
	removeEventHandler,
	emitPaneEvent,
	// Convenience helpers for specific events
	onpaneadded,
	onpaneremoved,
	onpaneminimized,
	onpanemaximized,
	onpanerestored,
	onpaneresized,
	onpanefocused,
	onpaneblurred,
	onpaneorderchanged,
	onpanetitlechanged
} from './events/dispatcher.js';

export { buildPanePayload } from './events/payload.js';
