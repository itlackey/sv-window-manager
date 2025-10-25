/**
 * Debug utility for creating namespaced debug loggers
 *
 * Provides consistent debug output format with namespace prefixes
 * and ability to toggle debug mode per namespace.
 *
 * @example
 * ```typescript
 * const debug = createDebugger('GlassManager', true);
 * debug.log('Created glass for sash', sashId);
 * debug.warn('Glass not found for sash', sashId);
 * debug.error('Failed to mount component', error);
 * ```
 */

export interface Debugger {
	log(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}

/**
 * Creates a debug logger with namespace prefix
 *
 * @param namespace - The namespace for the logger (e.g., 'GlassManager', 'SillManager')
 * @param enabled - Whether debug logging is enabled for this namespace
 * @returns A debugger object with log, warn, and error methods
 */
export function createDebugger(namespace: string, enabled = false): Debugger {
	const prefix = `[${namespace}]`;

	return {
		log(...args: unknown[]): void {
			if (enabled) {
				console.log(prefix, ...args);
			}
		},

		warn(...args: unknown[]): void {
			if (enabled) {
				console.warn(prefix, ...args);
			}
		},

		error(...args: unknown[]): void {
			if (enabled) {
				console.error(prefix, ...args);
			}
		}
	};
}
