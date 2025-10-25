/**
 * Type-safe context for BinaryWindow
 *
 * This module provides Svelte 5 context utilities for accessing the BinaryWindow
 * context from child components. It uses the createContext pattern to ensure
 * type-safety and proper runtime checks.
 *
 * @module window-context
 */

import { getContext, setContext } from 'svelte';
import type { BwinContext } from '../types.js';

const WINDOW_CONTEXT_KEY = Symbol('bwin-window');

/**
 * Sets the BinaryWindow context for child components.
 *
 * This should only be called from the BinaryWindow component itself.
 * Child components can access this context using getWindowContext().
 *
 * @param context - The BinaryWindow context object
 *
 * @example
 * ```typescript
 * // In BinaryWindow.svelte
 * const bwinContext: BwinContext = {
 *   get windowElement() { return frameComponent?.windowElement; },
 *   removePane,
 *   addPane,
 *   // ...other methods
 * };
 *
 * setWindowContext(bwinContext);
 * ```
 */
export function setWindowContext(context: BwinContext): void {
	setContext(WINDOW_CONTEXT_KEY, context);
}

/**
 * Gets the BinaryWindow context from a parent BinaryWindow component.
 *
 * This function throws an error if called outside of a BinaryWindow component tree,
 * ensuring that context access is always valid.
 *
 * @returns The BinaryWindow context object
 * @throws {Error} If called outside of a BinaryWindow component
 *
 * @example
 * ```typescript
 * // In a child component (Glass.svelte, Pane.svelte, etc.)
 * const bwin = getWindowContext();
 *
 * function handleClose() {
 *   bwin.removePane(sash.id);
 * }
 * ```
 */
export function getWindowContext(): BwinContext {
	const context = getContext<BwinContext>(WINDOW_CONTEXT_KEY);

	if (!context) {
		throw new Error(
			'getWindowContext() must be called within a BinaryWindow component tree. ' +
				'Ensure the component is a descendant of <BinaryWindow>.'
		);
	}

	return context;
}

/**
 * Gets the BinaryWindow context safely, returning undefined if not available.
 *
 * Use this variant when the component may be used both inside and outside
 * of a BinaryWindow component tree, and you want to handle the absence gracefully.
 *
 * @returns The BinaryWindow context object, or undefined if not in a BinaryWindow tree
 *
 * @example
 * ```typescript
 * // In a component that may or may not be in a BinaryWindow tree
 * const bwin = tryGetWindowContext();
 *
 * if (bwin) {
 *   // Use BinaryWindow features
 *   bwin.removePane(sash.id);
 * } else {
 *   // Fallback behavior
 *   console.warn('Not inside a BinaryWindow component');
 * }
 * ```
 */
export function tryGetWindowContext(): BwinContext | undefined {
	return getContext<BwinContext>(WINDOW_CONTEXT_KEY);
}
