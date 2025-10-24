import type { BwinContext, FrameContext } from './types.js';

// Use symbols for type-safe context keys
export const BWIN_CONTEXT = Symbol('bwin-context');
export const FRAME_CONTEXT = Symbol('frame-context');

// Re-export types for convenience
export type { BwinContext, FrameContext };
