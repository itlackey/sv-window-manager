/**
 * Type-safe context for Frame layout
 *
 * This module provides Svelte 5 context utilities for accessing the Frame
 * layout context from child components. It uses the createContext pattern
 * to ensure type-safety and proper runtime checks.
 *
 * @module layout-context
 */

import { getContext, setContext } from 'svelte';
import type { FrameContext } from '../types.js';

const LAYOUT_CONTEXT_KEY = Symbol('bwin-layout');

/**
 * Sets the Frame layout context for child components.
 *
 * This should only be called from the Frame component itself.
 * Child components can access this context using getLayoutContext().
 *
 * @param context - The Frame context object
 *
 * @example
 * ```typescript
 * // In Frame.svelte
 * const frameContext: FrameContext = {
 *   debug: props.debug
 * };
 *
 * setLayoutContext(frameContext);
 * ```
 */
export function setLayoutContext(context: FrameContext): void {
	setContext(LAYOUT_CONTEXT_KEY, context);
}

/**
 * Gets the Frame layout context from a parent Frame component.
 *
 * This function throws an error if called outside of a Frame component tree,
 * ensuring that context access is always valid.
 *
 * @returns The Frame context object
 * @throws {Error} If called outside of a Frame component
 *
 * @example
 * ```typescript
 * // In a child component (Pane.svelte, Muntin.svelte, etc.)
 * const layout = getLayoutContext();
 *
 * if (layout.debug) {
 *   console.log('Debug mode enabled');
 * }
 * ```
 */
export function getLayoutContext(): FrameContext {
	const context = getContext<FrameContext>(LAYOUT_CONTEXT_KEY);

	if (!context) {
		throw new Error(
			'getLayoutContext() must be called within a Frame component tree. ' +
				'Ensure the component is a descendant of <Frame>.'
		);
	}

	return context;
}

/**
 * Gets the Frame layout context safely, returning undefined if not available.
 *
 * Use this variant when the component may be used both inside and outside
 * of a Frame component tree, and you want to handle the absence gracefully.
 *
 * @returns The Frame context object, or undefined if not in a Frame tree
 *
 * @example
 * ```typescript
 * // In a component that may or may not be in a Frame tree
 * const layout = tryGetLayoutContext();
 *
 * if (layout?.debug) {
 *   console.log('Debug mode enabled');
 * } else {
 *   // No debug mode available
 * }
 * ```
 */
export function tryGetLayoutContext(): FrameContext | undefined {
	return getContext<FrameContext>(LAYOUT_CONTEXT_KEY);
}
