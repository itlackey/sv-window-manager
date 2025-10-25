import type { BwinContext, FrameContext } from './types.js';

// DEPRECATED: Use the new context utilities instead
// @deprecated Use setWindowContext/getWindowContext from './context/window-context.svelte.ts' instead
// These symbol-based contexts are maintained for backward compatibility but will be removed in v1.0.0
export const BWIN_CONTEXT = Symbol('bwin-context');

// @deprecated Use setLayoutContext/getLayoutContext from './context/layout-context.svelte.ts' instead
// These symbol-based contexts are maintained for backward compatibility but will be removed in v1.0.0
export const FRAME_CONTEXT = Symbol('frame-context');

// Re-export types for convenience
export type { BwinContext, FrameContext };

// Re-export new type-safe context utilities (recommended approach)
export {
	setWindowContext,
	getWindowContext,
	tryGetWindowContext
} from './context/window-context.svelte.js';

export {
	setLayoutContext,
	getLayoutContext,
	tryGetLayoutContext
} from './context/layout-context.svelte.js';
