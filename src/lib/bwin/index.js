import './css/vars.css';
import './css/body.css';
import './css/frame.css';
import './css/glass.css';
import './css/sill.css';

// Legacy JS exports (still available for backwards compatibility)
export { Frame } from './frame/frame.js';
export { BinaryWindow } from './binary-window/binary-window.js';
export { BUILTIN_ACTIONS } from './binary-window/actions.js';
export { Sash } from './sash.js';
export { SashConfig } from './config/sash-config.js';
export { ConfigRoot } from './config/config-root.js';
export { Position } from './position.js';

// New Svelte component exports
export { default as FrameSvelte } from './frame/Frame.svelte';
export { default as BinaryWindowSvelte } from './binary-window/BinaryWindow.svelte';
export { default as PaneSvelte } from './frame/Pane.svelte';
export { default as MuntinSvelte } from './frame/Muntin.svelte';
export { default as GlassSvelte } from './binary-window/Glass.svelte';

// Svelte action exports
export { resize } from './actions/resize.svelte';
export { drag } from './actions/drag.svelte';
export { drop } from './actions/drop.svelte';
