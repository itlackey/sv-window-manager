/**
 * Custom error class for bwin library errors
 *
 * This class extends the standard Error class to provide consistent error handling
 * across the bwin library. All errors include a [bwin] prefix for easy identification
 * and can include optional error codes and context for debugging.
 *
 * @example
 * ```typescript
 * throw new BwinError('Frame not initialized', 'FRAME_NOT_INIT');
 * ```
 */
export class BwinError extends Error {
	constructor(
		message: string,
		public code?: string,
		public context?: Record<string, unknown>
	) {
		super(`[bwin] ${message}`);
		this.name = 'BwinError';
	}
}

/**
 * Predefined error factory functions for common error scenarios
 *
 * This object provides convenient factory functions for creating common bwin errors.
 * Each function returns a fully-configured BwinError with appropriate error codes
 * and context information.
 *
 * @example
 * ```typescript
 * // Simple error without context
 * throw BwinErrors.frameNotInitialized();
 *
 * // Error with context
 * throw BwinErrors.paneNotFound('ABC-123');
 *
 * // Error with validation context
 * throw BwinErrors.invalidPosition('diagonal');
 * ```
 */
export const BwinErrors = {
	/**
	 * Error thrown when attempting to use a frame component that hasn't been initialized
	 *
	 * @returns {BwinError} Frame not initialized error
	 */
	frameNotInitialized: () => new BwinError('Frame not initialized', 'FRAME_NOT_INIT'),

	/**
	 * Error thrown when a pane or sash cannot be found by ID
	 *
	 * @param {string} id - The ID of the pane/sash that was not found
	 * @returns {BwinError} Pane not found error with context
	 */
	paneNotFound: (id: string) =>
		new BwinError(`Pane not found: ${id}`, 'PANE_NOT_FOUND', { sashId: id }),

	/**
	 * Error thrown when an invalid position value is provided
	 *
	 * @param {string} pos - The invalid position value
	 * @returns {BwinError} Invalid position error with context
	 */
	invalidPosition: (pos: string) =>
		new BwinError(`Invalid position: ${pos}`, 'INVALID_POSITION', { position: pos }),

	/**
	 * Error thrown when a sash ID attribute is missing from a DOM element
	 *
	 * @param {HTMLElement} [element] - The element missing the sash ID
	 * @returns {BwinError} Missing sash ID error with context
	 */
	missingSashId: (element?: HTMLElement) =>
		new BwinError('Sash ID not found on element', 'MISSING_SASH_ID', {
			element: element?.className
		}),

	/**
	 * Error thrown when invalid dimensions are provided
	 *
	 * @param {number} width - The invalid width value
	 * @param {number} height - The invalid height value
	 * @returns {BwinError} Invalid dimensions error with context
	 */
	invalidDimensions: (width: number, height: number) =>
		new BwinError(`Invalid dimensions: ${width}x${height}`, 'INVALID_DIMENSIONS', {
			width,
			height
		}),

	/**
	 * Error thrown when a component is not ready for use
	 *
	 * @param {string} component - The name of the component that's not ready
	 * @returns {BwinError} Component not ready error with context
	 */
	componentNotReady: (component: string) =>
		new BwinError(`${component} component not ready`, 'COMPONENT_NOT_READY', { component }),

	/**
	 * Error thrown when an invalid configuration is provided
	 *
	 * @param {string} message - Description of the configuration error
	 * @returns {BwinError} Invalid configuration error
	 */
	invalidConfiguration: (message: string) =>
		new BwinError(`Invalid configuration: ${message}`, 'INVALID_CONFIG'),

	/**
	 * Error thrown when a pane element is not found in the DOM
	 *
	 * @returns {BwinError} Pane element not found error
	 */
	paneElementNotFound: () => new BwinError('Pane element not found', 'PANE_ELEMENT_NOT_FOUND'),

	/**
	 * Error thrown when a pane element is missing the required data-sash-id attribute
	 *
	 * @returns {BwinError} Pane element missing sash ID attribute error
	 */
	paneElementMissingSashId: () =>
		new BwinError('Pane element missing data-sash-id attribute', 'PANE_MISSING_SASH_ID'),

	/**
	 * Error thrown when the sill element is not found during minimize operations
	 *
	 * @returns {BwinError} Sill element not found error
	 */
	sillElementNotFound: () =>
		new BwinError('Sill element not found when minimizing', 'SILL_NOT_FOUND'),

	/**
	 * Error thrown when minimized glass element creation fails
	 *
	 * @returns {BwinError} Failed to create minimized glass error
	 */
	minimizedGlassCreationFailed: () =>
		new BwinError('Failed to create minimized glass element', 'MINIMIZED_GLASS_FAILED'),

	/**
	 * Error thrown when sibling positions are not opposite (e.g., left/right, top/bottom)
	 *
	 * @returns {BwinError} Sibling position validation error
	 */
	siblingsNotOpposite: () =>
		new BwinError(
			'Sibling position and current position are not opposite',
			'SIBLINGS_NOT_OPPOSITE'
		),

	/**
	 * Error thrown when sibling sizes don't sum to 1 (for percentage-based layouts)
	 *
	 * @returns {BwinError} Sibling size sum validation error
	 */
	siblingSizesSumNot1: () =>
		new BwinError('Sum of sibling sizes is not equal to 1', 'SIBLING_SIZES_SUM'),

	/**
	 * Error thrown when sibling sizes don't sum to parent width
	 *
	 * @returns {BwinError} Sibling width sum validation error
	 */
	siblingSizesSumNotWidth: () =>
		new BwinError('Sum of sibling sizes is not equal to parent width', 'SIBLING_SIZES_WIDTH'),

	/**
	 * Error thrown when sibling sizes don't sum to parent height
	 *
	 * @returns {BwinError} Sibling height sum validation error
	 */
	siblingSizesSumNotHeight: () =>
		new BwinError('Sum of sibling sizes is not equal to parent height', 'SIBLING_SIZES_HEIGHT'),

	/**
	 * Error thrown when an invalid size value is provided
	 *
	 * @param {number | string} size - The invalid size value
	 * @returns {BwinError} Invalid size error with context
	 */
	invalidSize: (size: number | string) =>
		new BwinError(`Invalid size value: ${size}`, 'INVALID_SIZE', { size }),

	/**
	 * Error thrown when an invalid config value type is provided
	 *
	 * @param {unknown} config - The invalid config value
	 * @returns {BwinError} Invalid config value error
	 */
	invalidConfigValue: (config: unknown) =>
		new BwinError(`Invalid config value: ${config}`, 'INVALID_CONFIG_VALUE', { config }),

	/**
	 * Error thrown when a sash position is required but not provided
	 *
	 * @returns {BwinError} Sash position required error
	 */
	sashPositionRequired: () => new BwinError('Sash position is required', 'SASH_POSITION_REQUIRED'),

	/**
	 * Error thrown when a sash is not found during ID swapping operations
	 *
	 * @returns {BwinError} Sash not found during swap error
	 */
	sashNotFoundWhenSwapping: () =>
		new BwinError('Sash not found when swapping IDs', 'SASH_SWAP_FAILED'),

	/**
	 * Error thrown when attempting to add more than 2 children to a sash node
	 *
	 * @returns {BwinError} Maximum children exceeded error
	 */
	maxChildrenExceeded: () => new BwinError('Maximum 2 children allowed', 'MAX_CHILDREN_EXCEEDED'),

	/**
	 * Error thrown when a parameter is not a positive integer
	 *
	 * @returns {BwinError} Parameter validation error
	 */
	parameterMustBePositiveInteger: () =>
		new BwinError('Parameter must be a positive integer', 'PARAM_NOT_POSITIVE_INT'),

	/**
	 * Error thrown when parameters are not non-negative numbers
	 *
	 * @returns {BwinError} Parameter validation error
	 */
	parametersMustBeNonNegative: () =>
		new BwinError('Parameters must be non-negative numbers', 'PARAMS_NOT_NON_NEGATIVE'),

	/**
	 * Error thrown when a key already exists during strict assignment
	 *
	 * @param {string} key - The duplicate key
	 * @returns {BwinError} Duplicate key error with context
	 */
	keyAlreadyExists: (key: string) =>
		new BwinError(`Key "${key}" already exists in target object`, 'KEY_ALREADY_EXISTS', { key })
} as const;
