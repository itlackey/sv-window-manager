// CSS imports (side effects - must be imported for styling to work)
import './css/vars.css';
import './css/body.css';
import './css/frame.css';
import './css/glass.css';
import './css/sill.css';

// Core utilities and types
export { Sash } from './sash.js';
export { SashConfig } from './config/sash-config.js';
export { ConfigRoot } from './config/config-root.js';
export { Position } from './position.js';

// Error handling utilities
export { BwinError, BwinErrors } from './errors.js';

// Type definitions and constants
export * from './types.js';
export * from './constants.js';
export { BWIN_CONTEXT, FRAME_CONTEXT } from './context.js';
// Note: BwinContext and FrameContext types are exported from types.js

// Individual action modules
export { default as closeAction } from './binary-window/actions.close.js';
export { default as minimizeAction } from './binary-window/actions.minimize.js';
export { default as maximizeAction } from './binary-window/actions.maximize.js';

// Svelte component exports
export { default as FrameSvelte } from './frame/Frame.svelte';
export { default as BinaryWindowSvelte } from './binary-window/BinaryWindow.svelte';
export { default as PaneSvelte } from './frame/Pane.svelte';
export { default as MuntinSvelte } from './frame/Muntin.svelte';
export { default as GlassSvelte } from './binary-window/Glass.svelte';

// Svelte action exports
export { resize } from './actions/resize.svelte.js';
export { drag } from './actions/drag.svelte.js';
export { drop } from './actions/drop.svelte.js';
