// Export legacy class-based managers for backward compatibility
export { GlassManager } from './glass-manager.svelte.js';
export { SillManager } from './sill-manager.svelte.js';

// Export modern state modules (recommended for new code)
export * as GlassState from './glass-state.svelte.js';
export * as SillState from './sill-state.svelte.js';

// Export types
export type {
	GlassInstance,
	UserComponentInstance,
	CreateGlassProps,
	MinimizedGlassData
} from './types.js';
