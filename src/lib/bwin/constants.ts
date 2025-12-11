import type { Component } from 'svelte';
import PlaceholderPane from './binary-window/PlaceholderPane.svelte';

/**
 * Size of the muntin (divider) between panes in pixels.
 *
 * Muntins are the draggable dividers that allow users to resize panes.
 * This constant determines their visual thickness and hit area.
 *
 * @constant {number}
 * @default 4
 *
 * @example
 * ```typescript
 * // Used in muntin rendering
 * muntinEl.style.width = `${MUNTIN_SIZE}px`;
 * ```
 */
export const MUNTIN_SIZE = 4;

/**
 * Size of the trim (gap) around panes in pixels.
 *
 * Trim creates visual spacing between panes and the window edges,
 * preventing content from touching the borders. This is applied as
 * padding/offset when positioning panes and muntins.
 *
 * @constant {number}
 * @default 8
 *
 * @example
 * ```typescript
 * // Used when calculating pane positions
 * pane.style.top = `${position.top + TRIM_SIZE / 2}px`;
 * ```
 */
export const TRIM_SIZE = 8;

/**
 * Minimum width for a pane in pixels.
 *
 * Prevents panes from being resized below this width, ensuring
 * content remains usable. Enforced during resize operations.
 *
 * @constant {number}
 * @default 50
 *
 * @example
 * ```typescript
 * // Used in resize validation
 * if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
 * ```
 */
export const MIN_WIDTH = 50;

/**
 * Minimum height for a pane in pixels.
 *
 * Prevents panes from being resized below this height, ensuring
 * content remains usable. Enforced during resize operations.
 *
 * @constant {number}
 * @default 50
 *
 * @example
 * ```typescript
 * // Used in resize validation
 * if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
 * ```
 */
export const MIN_HEIGHT = 50;

/**
 * CSS class names used throughout the bwin components.
 *
 * Centralized constant object for all CSS classes to ensure consistency
 * and enable easy refactoring. Use these instead of hardcoded strings.
 *
 * @constant {Object}
 * @property {string} PANE - Class for pane elements (content containers)
 * @property {string} MUNTIN - Class for muntin elements (dividers)
 * @property {string} GLASS - Class for glass elements (pane content wrappers)
 * @property {string} GLASS_HEADER - Class for glass header section
 * @property {string} GLASS_TITLE - Class for glass title element
 * @property {string} GLASS_TABS - Class for glass tabs container
 * @property {string} GLASS_TAB - Class for individual glass tab
 * @property {string} GLASS_CONTENT - Class for glass content area
 * @property {string} GLASS_ACTIONS - Class for glass actions container
 * @property {string} GLASS_ACTION - Class for individual action button
 * @property {string} SILL - Class for sill element (minimized glass bar)
 * @property {string} WINDOW - Class for window element (frame container)
 * @property {string} MINIMIZED_GLASS - Class for minimized glass buttons
 *
 * @example
 * ```typescript
 * // Query panes
 * const panes = container.querySelectorAll(`.${CSS_CLASSES.PANE}`);
 *
 * // Add class to element
 * element.classList.add(CSS_CLASSES.GLASS);
 * ```
 */
export const CSS_CLASSES = {
	PANE: 'pane',
	MUNTIN: 'muntin',
	GLASS: 'glass',
	GLASS_HEADER: 'glass-header',
	GLASS_TITLE: 'glass-title',
	GLASS_TABS: 'glass-tabs',
	GLASS_TAB: 'glass-tab',
	GLASS_CONTENT: 'glass-content',
	GLASS_ACTIONS: 'glass-actions',
	GLASS_ACTION: 'glass-action',
	SILL: 'sill',
	WINDOW: 'window',
	MINIMIZED_GLASS: 'sw-minimized-glass'
} as const;

/**
 * Data attribute names used for DOM element metadata.
 *
 * Centralized constant object for all data attributes to ensure consistency.
 * These attributes store state and identifiers on DOM elements.
 *
 * @constant {Object}
 * @property {string} SASH_ID - Attribute storing the sash ID on pane elements
 * @property {string} DROP_AREA - Attribute indicating drop target area (top/right/bottom/left/center)
 * @property {string} CAN_DROP - Attribute marking elements as valid drop targets
 * @property {string} CAN_DRAG - Attribute marking elements as draggable
 * @property {string} POSITION - Attribute storing position value (top/right/bottom/left)
 * @property {string} RESIZABLE - Attribute marking elements as resizable
 * @property {string} MAXIMIZED - Attribute indicating maximized state
 *
 * @example
 * ```typescript
 * // Get sash ID from pane element
 * const sashId = paneEl.getAttribute(DATA_ATTRIBUTES.SASH_ID);
 *
 * // Mark element as drop target
 * element.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');
 *
 * // Query by attribute
 * const pane = window.querySelector(`[${DATA_ATTRIBUTES.SASH_ID}="root"]`);
 * ```
 */
export const DATA_ATTRIBUTES = {
	SASH_ID: 'data-sash-id',
	DROP_AREA: 'data-drop-area',
	CAN_DROP: 'data-can-drop',
	CAN_DRAG: 'data-can-drag',
	POSITION: 'data-position',
	RESIZABLE: 'data-resizable',
	MAXIMIZED: 'data-maximized'
} as const;

/**
 * ID for the placeholder pane shown when window has no panes.
 *
 * This placeholder is automatically created when a BinaryWindow is initialized
 * with no children, and is automatically removed when the first real pane is added.
 *
 * @constant {string}
 * @default '__bwin_placeholder__'
 *
 * @example
 * ```typescript
 * // Check if current pane is the placeholder
 * if (sash.id === PLACEHOLDER_PANE_ID) {
 *   // This is the placeholder
 * }
 * ```
 */
export const PLACEHOLDER_PANE_ID = '__bwin_placeholder__';

/**
 * Default content for the placeholder pane.
 *
 * This content is shown when a BinaryWindow is initialized with no panes.
 * It provides helpful instructions to guide users on how to add their first pane.
 *
 * @constant {Object}
 * @property {string} title - The title shown in the placeholder glass header
 * @property {Component} component - Svelte component shown in the placeholder glass body
 *
 * @example
 * ```typescript
 * // Use in config
 * const placeholderStore = {
 *   id: PLACEHOLDER_PANE_ID,
 *   ...PLACEHOLDER_CONTENT
 * };
 * ```
 */
export const PLACEHOLDER_CONTENT = {
	title: 'Empty Window',
	component: PlaceholderPane as Component<any>
} as const;
