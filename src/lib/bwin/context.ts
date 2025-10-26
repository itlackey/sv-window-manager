import type { BwinContext, FrameContext } from './types.js';

// Legacy context keys for backward compatibility
// DEPRECATED: Use the new type-safe context utilities below
export const BWIN_CONTEXT = Symbol('bwin-context');
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
