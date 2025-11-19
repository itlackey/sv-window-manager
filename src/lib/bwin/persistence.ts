/**
 * State Persistence Module - SV Window Manager
 *
 * Provides serialization and deserialization of window manager tree state.
 * Enables saving and restoring layouts for:
 * - Session persistence across page reloads
 * - Layout templates and presets
 * - Undo/redo functionality
 * - State export/import
 *
 * **Features:**
 * - JSON-based serialization (human-readable, portable)
 * - Selective property serialization (configurable)
 * - Component reference handling (via component mapping)
 * - LocalStorage integration (browser-based persistence)
 * - Validation on deserialization
 *
 * **Usage:**
 * ```typescript
 * import { serializeTree, deserializeTree } from 'sv-window-manager';
 *
 * // Save state
 * const state = serializeTree(rootSash);
 * localStorage.setItem('layout', JSON.stringify(state));
 *
 * // Restore state
 * const saved = JSON.parse(localStorage.getItem('layout'));
 * const newRoot = deserializeTree(saved, { componentMap });
 * ```
 *
 * @module persistence
 */

import { ReactiveSash, type SashConstructorParams } from './sash.svelte.js';
import { Position } from './position.js';
import type { Component } from 'svelte';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Serialized representation of a sash node
 */
export interface SerializedSash {
	/** Unique identifier */
	id: string;

	/** Position relative to parent */
	position: string;

	/** Dimensions */
	left: number;
	top: number;
	width: number;
	height: number;

	/** Constraints */
	minWidth: number;
	minHeight: number;

	/** Resize strategy */
	resizeStrategy: 'classic' | 'natural';

	/** Arbitrary store properties (excluding non-serializable values) */
	store: Record<string, unknown>;

	/** Component reference (stored as string key) */
	componentKey?: string;

	/** Component props */
	componentProps?: Record<string, unknown>;

	/** Child sashes */
	children: SerializedSash[];
}

/**
 * Options for tree serialization
 */
export interface SerializeOptions {
	/** Include DOM node references (default: false) */
	includeDomNodes?: boolean;

	/** Custom property filter function */
	filterStore?: (key: string, value: unknown) => boolean;

	/** Component to key mapping function */
	componentToKey?: (component: Component) => string | undefined;
}

/**
 * Options for tree deserialization
 */
export interface DeserializeOptions {
	/** Component mapping: key -> Component */
	componentMap?: Record<string, Component>;

	/** Custom store property validator */
	validateStore?: (key: string, value: unknown) => boolean;

	/** Skip validation (default: false) */
	skipValidation?: boolean;
}

/**
 * Result of save operation
 */
export interface SaveResult {
	success: boolean;
	key: string;
	timestamp: number;
	error?: string;
}

/**
 * Result of load operation
 */
export interface LoadResult<T = SerializedSash> {
	success: boolean;
	data?: T;
	timestamp?: number;
	error?: string;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serializes a sash tree to a JSON-compatible object
 *
 * Converts the reactive sash tree into a plain JavaScript object that can be:
 * - Saved to localStorage
 * - Sent over network
 * - Stored in database
 * - Used for undo/redo
 *
 * **Component Handling:**
 * Components cannot be directly serialized. You must provide a `componentToKey`
 * function that maps components to string identifiers. During deserialization,
 * these keys will be used to look up components from a `componentMap`.
 *
 * @param sash - Root sash to serialize
 * @param options - Serialization options
 * @returns Serialized tree structure
 *
 * @example
 * ```typescript
 * import ChatSession from './ChatSession.svelte';
 * import TerminalSession from './TerminalSession.svelte';
 *
 * const componentToKey = (component) => {
 *   if (component === ChatSession) return 'ChatSession';
 *   if (component === TerminalSession) return 'TerminalSession';
 *   return undefined;
 * };
 *
 * const serialized = serializeTree(rootSash, { componentToKey });
 * ```
 */
export function serializeTree(
	sash: ReactiveSash,
	options: SerializeOptions = {}
): SerializedSash {
	const { includeDomNodes = false, filterStore, componentToKey } = options;

	// Filter store properties
	const filteredStore: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(sash.store)) {
		// Skip non-serializable values
		if (value === undefined || value === null) continue;
		if (typeof value === 'function') continue;
		if (value instanceof HTMLElement && !includeDomNodes) continue;

		// Apply custom filter
		if (filterStore && !filterStore(key, value)) continue;

		// Skip component reference (handled separately)
		if (key === 'component') continue;
		if (key === 'componentProps') continue;

		filteredStore[key] = value;
	}

	// Extract component reference
	let componentKey: string | undefined;
	if (sash.store.component && componentToKey) {
		componentKey = componentToKey(sash.store.component as Component);
	}

	// Serialize children recursively
	const children = sash.children.map((child) => serializeTree(child, options));

	return {
		id: sash.id,
		position: sash.position,
		left: sash.left,
		top: sash.top,
		width: sash.width,
		height: sash.height,
		minWidth: sash.minWidth,
		minHeight: sash.minHeight,
		resizeStrategy: sash.resizeStrategy,
		store: filteredStore,
		componentKey,
		componentProps: sash.store.componentProps as Record<string, unknown> | undefined,
		children
	};
}

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Deserializes a sash tree from a JSON-compatible object
 *
 * Reconstructs a reactive sash tree from previously serialized data.
 * Component references are resolved using the provided `componentMap`.
 *
 * @param data - Serialized tree structure
 * @param options - Deserialization options
 * @returns Reconstructed ReactiveSash tree
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * import ChatSession from './ChatSession.svelte';
 * import TerminalSession from './TerminalSession.svelte';
 *
 * const componentMap = {
 *   ChatSession,
 *   TerminalSession
 * };
 *
 * const rootSash = deserializeTree(serialized, { componentMap });
 * ```
 */
export function deserializeTree(
	data: SerializedSash,
	options: DeserializeOptions = {}
): ReactiveSash {
	const { componentMap = {}, validateStore, skipValidation = false } = options;

	// Validate structure (unless skipped)
	if (!skipValidation) {
		validateSerializedSash(data);
	}

	// Reconstruct store
	const store: Record<string, unknown> = { ...data.store };

	// Resolve component reference
	if (data.componentKey && componentMap[data.componentKey]) {
		store.component = componentMap[data.componentKey];
		store.componentProps = data.componentProps;
	}

	// Apply custom validation
	if (validateStore) {
		for (const [key, value] of Object.entries(store)) {
			if (!validateStore(key, value)) {
				delete store[key];
			}
		}
	}

	// Create sash parameters
	const params: SashConstructorParams = {
		id: data.id,
		position: data.position,
		left: data.left,
		top: data.top,
		width: data.width,
		height: data.height,
		minWidth: data.minWidth,
		minHeight: data.minHeight,
		resizeStrategy: data.resizeStrategy,
		store,
		parent: null // Will be set when adding children
	};

	// Create sash
	const sash = new ReactiveSash(params);

	// Recursively deserialize children
	for (const childData of data.children) {
		const child = deserializeTree(childData, options);
		// Set parent reference
		(child as any).parent = sash;
		sash.children.push(child);
	}

	return sash;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates a serialized sash structure
 *
 * @param data - Data to validate
 * @throws Error if validation fails
 */
function validateSerializedSash(data: SerializedSash): void {
	// Required properties
	if (!data.id || typeof data.id !== 'string') {
		throw new Error('Invalid serialized sash: missing or invalid id');
	}

	if (!data.position || typeof data.position !== 'string') {
		throw new Error('Invalid serialized sash: missing or invalid position');
	}

	// Dimensions
	if (typeof data.left !== 'number' || typeof data.top !== 'number') {
		throw new Error('Invalid serialized sash: invalid dimensions (left/top)');
	}

	if (typeof data.width !== 'number' || typeof data.height !== 'number') {
		throw new Error('Invalid serialized sash: invalid dimensions (width/height)');
	}

	if (data.width < 0 || data.height < 0) {
		throw new Error('Invalid serialized sash: negative dimensions');
	}

	// Constraints
	if (typeof data.minWidth !== 'number' || typeof data.minHeight !== 'number') {
		throw new Error('Invalid serialized sash: invalid constraints');
	}

	if (data.minWidth < 0 || data.minHeight < 0) {
		throw new Error('Invalid serialized sash: negative constraints');
	}

	// Resize strategy
	if (data.resizeStrategy !== 'classic' && data.resizeStrategy !== 'natural') {
		throw new Error('Invalid serialized sash: invalid resizeStrategy');
	}

	// Store
	if (!data.store || typeof data.store !== 'object') {
		throw new Error('Invalid serialized sash: invalid store');
	}

	// Children
	if (!Array.isArray(data.children)) {
		throw new Error('Invalid serialized sash: invalid children');
	}

	// Validate children recursively
	for (const child of data.children) {
		validateSerializedSash(child);
	}
}

// ============================================================================
// LOCALSTORAGE INTEGRATION
// ============================================================================

/**
 * Saves a sash tree to browser localStorage
 *
 * **SSR-Safe:** Returns error result if localStorage is not available
 *
 * @param key - Storage key
 * @param sash - Root sash to save
 * @param options - Serialization options
 * @returns Save result
 *
 * @example
 * ```typescript
 * const result = saveToLocalStorage('my-layout', rootSash, { componentToKey });
 * if (result.success) {
 *   console.log('Saved at', new Date(result.timestamp));
 * }
 * ```
 */
export function saveToLocalStorage(
	key: string,
	sash: ReactiveSash,
	options: SerializeOptions = {}
): SaveResult {
	// Check if localStorage is available (SSR-safe)
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return {
			success: false,
			key,
			timestamp: Date.now(),
			error: 'localStorage not available (SSR or unsupported browser)'
		};
	}

	try {
		const serialized = serializeTree(sash, options);
		const data = {
			version: 1,
			timestamp: Date.now(),
			tree: serialized
		};

		localStorage.setItem(key, JSON.stringify(data));

		return {
			success: true,
			key,
			timestamp: data.timestamp
		};
	} catch (error) {
		return {
			success: false,
			key,
			timestamp: Date.now(),
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Loads a sash tree from browser localStorage
 *
 * **SSR-Safe:** Returns error result if localStorage is not available
 *
 * @param key - Storage key
 * @param options - Deserialization options
 * @returns Load result with tree data or error
 *
 * @example
 * ```typescript
 * const result = loadFromLocalStorage('my-layout', { componentMap });
 * if (result.success && result.data) {
 *   const rootSash = result.data;
 *   console.log('Loaded from', new Date(result.timestamp));
 * }
 * ```
 */
export function loadFromLocalStorage(
	key: string,
	options: DeserializeOptions = {}
): LoadResult<ReactiveSash> {
	// Check if localStorage is available (SSR-safe)
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return {
			success: false,
			error: 'localStorage not available (SSR or unsupported browser)'
		};
	}

	try {
		const stored = localStorage.getItem(key);
		if (!stored) {
			return {
				success: false,
				error: `No data found for key: ${key}`
			};
		}

		const parsed = JSON.parse(stored);

		// Validate format
		if (!parsed.version || !parsed.tree) {
			return {
				success: false,
				error: 'Invalid stored format (missing version or tree)'
			};
		}

		const sash = deserializeTree(parsed.tree, options);

		return {
			success: true,
			data: sash,
			timestamp: parsed.timestamp
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Removes saved state from localStorage
 *
 * @param key - Storage key
 * @returns True if removed, false if not found or error
 */
export function removeFromLocalStorage(key: string): boolean {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return false;
	}

	try {
		localStorage.removeItem(key);
		return true;
	} catch {
		return false;
	}
}

/**
 * Lists all saved layouts in localStorage
 *
 * Scans localStorage for keys matching the pattern and returns metadata.
 *
 * @param prefix - Key prefix to filter (e.g., 'layout-')
 * @returns Array of layout metadata
 */
export function listSavedLayouts(
	prefix = 'sv-window-manager-'
): Array<{ key: string; timestamp: number; version: number }> {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return [];
	}

	const layouts: Array<{ key: string; timestamp: number; version: number }> = [];

	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || !key.startsWith(prefix)) continue;

			const stored = localStorage.getItem(key);
			if (!stored) continue;

			try {
				const parsed = JSON.parse(stored);
				if (parsed.version && parsed.timestamp) {
					layouts.push({
						key,
						timestamp: parsed.timestamp,
						version: parsed.version
					});
				}
			} catch {
				// Skip invalid entries
			}
		}
	} catch {
		// Return empty array on error
	}

	return layouts.sort((a, b) => b.timestamp - a.timestamp);
}
