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
 */
export { GlassManager } from './bwin/managers/glass-manager.svelte.js';
export { SillManager } from './bwin/managers/sill-manager.svelte.js';

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
 * Svelte context keys for accessing window manager state.
 * @deprecated BWIN_CONTEXT and FRAME_CONTEXT are deprecated.
 * Use the new type-safe context utilities instead (see below).
 */
export { BWIN_CONTEXT, FRAME_CONTEXT } from './bwin/context.js';

/**
 * Type-safe context utilities for Svelte 5 (RECOMMENDED)
 *
 * These functions provide better type safety and runtime validation
 * compared to the legacy symbol-based context approach.
 *
 * Usage:
 * ```typescript
 * // In BinaryWindow.svelte
 * import { setWindowContext } from 'sv-window-manager';
 * setWindowContext(bwinContext);
 *
 * // In child components
 * import { getWindowContext } from 'sv-window-manager';
 * const bwin = getWindowContext();
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
	DropActionParams
} from './bwin/types.js';

// Manager types (from src/lib/bwin/managers/types.ts)
export type {
	GlassInstance,
	UserComponentInstance,
	CreateGlassProps,
	MinimizedGlassData
} from './bwin/managers/types.js';
