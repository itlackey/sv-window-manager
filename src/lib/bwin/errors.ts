/**
 * Custom error class for bwin library errors
 *
 * This class extends the standard Error class to provide consistent error handling
 * across the bwin library. All errors include a [bwin] prefix for easy identification
 * and can include optional error codes, context for debugging, recovery hints, and
 * "did you mean?" suggestions.
 *
 * @example
 * ```typescript
 * // Basic error
 * throw new BwinError('Frame not initialized', 'FRAME_NOT_INIT');
 *
 * // Error with recovery hint
 * throw new BwinError('Frame not initialized', 'FRAME_NOT_INIT', undefined, {
 *   hint: 'Ensure BinaryWindow component is mounted before calling methods'
 * });
 *
 * // Error with "did you mean?" suggestion
 * throw new BwinError('Invalid position: diagnol', 'INVALID_POSITION', { position: 'diagnol' }, {
 *   suggestion: 'Did you mean "diagonal"?'
 * });
 * ```
 */
export class BwinError extends Error {
	/**
	 * Optional recovery hint for the user
	 */
	public hint?: string;

	/**
	 * Optional "did you mean?" suggestion
	 */
	public suggestion?: string;

	/**
	 * Documentation URL for this error
	 */
	public docsUrl?: string;

	constructor(
		message: string,
		public code?: string,
		public context?: Record<string, unknown>,
		options?: {
			hint?: string;
			suggestion?: string;
			docsUrl?: string;
		}
	) {
		// Build enhanced error message
		let fullMessage = `[bwin] ${message}`;

		if (options?.suggestion) {
			fullMessage += `\n  💡 ${options.suggestion}`;
		}

		if (options?.hint) {
			fullMessage += `\n  ℹ️  Hint: ${options.hint}`;
		}

		if (options?.docsUrl) {
			fullMessage += `\n  📖 Docs: ${options.docsUrl}`;
		}

		super(fullMessage);
		this.name = 'BwinError';
		this.hint = options?.hint;
		this.suggestion = options?.suggestion;
		this.docsUrl = options?.docsUrl;
	}
}

/**
 * Calculates Levenshtein distance between two strings
 * Used for "Did you mean?" suggestions
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1 // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Finds the closest match from a list of valid options
 * @param input - The invalid input string
 * @param validOptions - Array of valid option strings
 * @param maxDistance - Maximum Levenshtein distance to consider (default: 3)
 * @returns The closest match or undefined if no close match found
 */
export function findClosestMatch(
	input: string,
	validOptions: string[],
	maxDistance = 3
): string | undefined {
	let closestMatch: string | undefined;
	let minDistance = Infinity;

	for (const option of validOptions) {
		const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
		if (distance < minDistance && distance <= maxDistance) {
			minDistance = distance;
			closestMatch = option;
		}
	}

	return closestMatch;
}

/**
 * Valid position values
 */
const VALID_POSITIONS = ['top', 'right', 'bottom', 'left', 'root'];

/**
 * Documentation base URL
 */
const DOCS_BASE_URL = 'https://github.com/itlackey/sv-window-manager#';

/**
 * Predefined error factory functions for common error scenarios
 *
 * This object provides convenient factory functions for creating common bwin errors.
 * Each function returns a fully-configured BwinError with appropriate error codes,
 * context information, recovery hints, and suggestions where applicable.
 *
 * @example
 * ```typescript
 * // Simple error without context
 * throw BwinErrors.frameNotInitialized();
 *
 * // Error with context
 * throw BwinErrors.paneNotFound('ABC-123');
 *
 * // Error with validation context and suggestions
 * throw BwinErrors.invalidPosition('diagnol');
 * ```
 */
export const BwinErrors = {
	/**
	 * Error thrown when attempting to use a frame component that hasn't been initialized
	 *
	 * @returns {BwinError} Frame not initialized error
	 */
	frameNotInitialized: () =>
		new BwinError('Frame not initialized', 'FRAME_NOT_INIT', undefined, {
			hint: 'Ensure the BinaryWindow component is mounted before calling methods. Use $effect() to wait for initialization.',
			docsUrl: `${DOCS_BASE_URL}initialization`
		}),

	/**
	 * Error thrown when a pane or sash cannot be found by ID
	 *
	 * @param {string} id - The ID of the pane/sash that was not found
	 * @param {string[]} [availableIds] - List of available IDs for suggestions
	 * @returns {BwinError} Pane not found error with context
	 */
	paneNotFound: (id: string, availableIds?: string[]) => {
		const options: Parameters<typeof BwinError>[3] = {
			hint: 'Check that the pane ID exists in your layout. Use getAllLeafDescendants() to see all available pane IDs.',
			docsUrl: `${DOCS_BASE_URL}pane-management`
		};

		// Add "Did you mean?" suggestion if we have available IDs
		if (availableIds && availableIds.length > 0) {
			const closest = findClosestMatch(id, availableIds);
			if (closest) {
				options.suggestion = `Did you mean "${closest}"?`;
			}
		}

		return new BwinError(`Pane not found: ${id}`, 'PANE_NOT_FOUND', { sashId: id }, options);
	},

	/**
	 * Error thrown when an invalid position value is provided
	 *
	 * @param {string} pos - The invalid position value
	 * @returns {BwinError} Invalid position error with context
	 */
	invalidPosition: (pos: string) => {
		const closest = findClosestMatch(pos, VALID_POSITIONS);
		const options: Parameters<typeof BwinError>[3] = {
			hint: `Valid positions are: ${VALID_POSITIONS.join(', ')}`,
			docsUrl: `${DOCS_BASE_URL}positioning`
		};

		if (closest) {
			options.suggestion = `Did you mean "${closest}"?`;
		}

		return new BwinError(`Invalid position: ${pos}`, 'INVALID_POSITION', { position: pos }, options);
	},

	/**
	 * Error thrown when a sash ID attribute is missing from a DOM element
	 *
	 * @param {HTMLElement} [element] - The element missing the sash ID
	 * @returns {BwinError} Missing sash ID error with context
	 */
	missingSashId: (element?: HTMLElement) =>
		new BwinError(
			'Sash ID not found on element',
			'MISSING_SASH_ID',
			{ element: element?.className },
			{
				hint: 'Ensure the element has a data-sash-id attribute. This is typically set automatically by the Frame component.',
				docsUrl: `${DOCS_BASE_URL}data-attributes`
			}
		),

	/**
	 * Error thrown when invalid dimensions are provided
	 *
	 * @param {number} width - The invalid width value
	 * @param {number} height - The invalid height value
	 * @returns {BwinError} Invalid dimensions error with context
	 */
	invalidDimensions: (width: number, height: number) => {
		const issues: string[] = [];
		if (width <= 0) issues.push('width must be > 0');
		if (height <= 0) issues.push('height must be > 0');
		if (isNaN(width)) issues.push('width must be a number');
		if (isNaN(height)) issues.push('height must be a number');

		return new BwinError(
			`Invalid dimensions: ${width}x${height}`,
			'INVALID_DIMENSIONS',
			{ width, height },
			{
				hint: `Dimension issues: ${issues.join(', ')}`,
				docsUrl: `${DOCS_BASE_URL}configuration`
			}
		);
	},

	/**
	 * Error thrown when a component is not ready for use
	 *
	 * @param {string} component - The name of the component that's not ready
	 * @returns {BwinError} Component not ready error with context
	 */
	componentNotReady: (component: string) =>
		new BwinError(
			`${component} component not ready`,
			'COMPONENT_NOT_READY',
			{ component },
			{
				hint: `Wait for ${component} to mount before accessing its methods. Use $effect(() => { if (${component.toLowerCase()}) { ... } })`,
				docsUrl: `${DOCS_BASE_URL}lifecycle`
			}
		),

	/**
	 * Error thrown when an invalid configuration is provided
	 *
	 * @param {string} message - Description of the configuration error
	 * @returns {BwinError} Invalid configuration error
	 */
	invalidConfiguration: (message: string) =>
		new BwinError(`Invalid configuration: ${message}`, 'INVALID_CONFIG', undefined, {
			hint: 'Validate your configuration object matches the expected structure. Check property names and value types.',
			docsUrl: `${DOCS_BASE_URL}configuration`
		}),

	/**
	 * Error thrown when a pane element is not found in the DOM
	 *
	 * @returns {BwinError} Pane element not found error
	 */
	paneElementNotFound: () =>
		new BwinError('Pane element not found', 'PANE_ELEMENT_NOT_FOUND', undefined, {
			hint: 'The pane element may have been removed from the DOM. Ensure the pane is mounted before accessing it.',
			docsUrl: `${DOCS_BASE_URL}dom-lifecycle`
		}),

	/**
	 * Error thrown when a pane element is missing the required data-sash-id attribute
	 *
	 * @returns {BwinError} Pane element missing sash ID attribute error
	 */
	paneElementMissingSashId: () =>
		new BwinError('Pane element missing data-sash-id attribute', 'PANE_MISSING_SASH_ID', undefined, {
			hint: 'Pane elements must be rendered by the Frame component to have the data-sash-id attribute.',
			docsUrl: `${DOCS_BASE_URL}data-attributes`
		}),

	/**
	 * Error thrown when the sill element is not found during minimize operations
	 *
	 * @returns {BwinError} Sill element not found error
	 */
	sillElementNotFound: () =>
		new BwinError('Sill element not found when minimizing', 'SILL_NOT_FOUND', undefined, {
			hint: 'The sill container may not be rendered. Ensure the BinaryWindow is fully initialized.',
			docsUrl: `${DOCS_BASE_URL}minimize`
		}),

	/**
	 * Error thrown when minimized glass element creation fails
	 *
	 * @returns {BwinError} Failed to create minimized glass error
	 */
	minimizedGlassCreationFailed: () =>
		new BwinError('Failed to create minimized glass element', 'MINIMIZED_GLASS_FAILED', undefined, {
			hint: 'Check browser console for additional errors. This may indicate a DOM manipulation issue.',
			docsUrl: `${DOCS_BASE_URL}minimize`
		}),

	/**
	 * Error thrown when sibling positions are not opposite (e.g., left/right, top/bottom)
	 *
	 * @returns {BwinError} Sibling position validation error
	 */
	siblingsNotOpposite: () =>
		new BwinError(
			'Sibling position and current position are not opposite',
			'SIBLINGS_NOT_OPPOSITE',
			undefined,
			{
				hint: 'Siblings must have opposite positions: left/right or top/bottom. Check your pane configuration.',
				docsUrl: `${DOCS_BASE_URL}binary-tree-structure`
			}
		),

	/**
	 * Error thrown when sibling sizes don't sum to 1 (for percentage-based layouts)
	 *
	 * @returns {BwinError} Sibling size sum validation error
	 */
	siblingSizesSumNot1: () =>
		new BwinError('Sum of sibling sizes is not equal to 1', 'SIBLING_SIZES_SUM', undefined, {
			hint: 'Sibling size percentages must sum to 1.0 (100%). Adjust your size values to total 1.0.',
			docsUrl: `${DOCS_BASE_URL}sizing`
		}),

	/**
	 * Error thrown when sibling sizes don't sum to parent width
	 *
	 * @returns {BwinError} Sibling width sum validation error
	 */
	siblingSizesSumNotWidth: () =>
		new BwinError('Sum of sibling sizes is not equal to parent width', 'SIBLING_SIZES_WIDTH', undefined, {
			hint: 'Total sibling widths must equal the parent width. Check horizontal sizing calculations.',
			docsUrl: `${DOCS_BASE_URL}sizing`
		}),

	/**
	 * Error thrown when sibling sizes don't sum to parent height
	 *
	 * @returns {BwinError} Sibling height sum validation error
	 */
	siblingSizesSumNotHeight: () =>
		new BwinError('Sum of sibling sizes is not equal to parent height', 'SIBLING_SIZES_HEIGHT', undefined, {
			hint: 'Total sibling heights must equal the parent height. Check vertical sizing calculations.',
			docsUrl: `${DOCS_BASE_URL}sizing`
		}),

	/**
	 * Error thrown when an invalid size value is provided
	 *
	 * @param {number | string} size - The invalid size value
	 * @returns {BwinError} Invalid size error with context
	 */
	invalidSize: (size: number | string) =>
		new BwinError(`Invalid size value: ${size}`, 'INVALID_SIZE', { size }, {
			hint: 'Size must be a positive number (pixels) or a percentage string (e.g., "50%").',
			docsUrl: `${DOCS_BASE_URL}sizing`
		}),

	/**
	 * Error thrown when an invalid config value type is provided
	 *
	 * @param {unknown} config - The invalid config value
	 * @returns {BwinError} Invalid config value error
	 */
	invalidConfigValue: (config: unknown) =>
		new BwinError(`Invalid config value: ${config}`, 'INVALID_CONFIG_VALUE', { config }, {
			hint: 'Configuration values must match expected types. Check the documentation for valid formats.',
			docsUrl: `${DOCS_BASE_URL}configuration`
		}),

	/**
	 * Error thrown when a sash position is required but not provided
	 *
	 * @returns {BwinError} Sash position required error
	 */
	sashPositionRequired: () =>
		new BwinError('Sash position is required', 'SASH_POSITION_REQUIRED', undefined, {
			hint: 'Every sash (except root) must have a position: top, right, bottom, or left.',
			docsUrl: `${DOCS_BASE_URL}positioning`
		}),

	/**
	 * Error thrown when a sash is not found during ID swapping operations
	 *
	 * @returns {BwinError} Sash not found during swap error
	 */
	sashNotFoundWhenSwapping: () =>
		new BwinError('Sash not found when swapping IDs', 'SASH_SWAP_FAILED', undefined, {
			hint: 'Ensure both sashes exist in the tree before attempting ID swap operations.',
			docsUrl: `${DOCS_BASE_URL}advanced-operations`
		}),

	/**
	 * Error thrown when attempting to add more than 2 children to a sash node
	 *
	 * @returns {BwinError} Maximum children exceeded error
	 */
	maxChildrenExceeded: () =>
		new BwinError('Maximum 2 children allowed', 'MAX_CHILDREN_EXCEEDED', undefined, {
			hint: 'Binary tree nodes can only have 2 children. To add more panes, split an existing child pane.',
			docsUrl: `${DOCS_BASE_URL}binary-tree-structure`
		}),

	/**
	 * Error thrown when a parameter is not a positive integer
	 *
	 * @returns {BwinError} Parameter validation error
	 */
	parameterMustBePositiveInteger: () =>
		new BwinError('Parameter must be a positive integer', 'PARAM_NOT_POSITIVE_INT', undefined, {
			hint: 'The parameter must be a whole number greater than zero.',
			docsUrl: `${DOCS_BASE_URL}api-reference`
		}),

	/**
	 * Error thrown when parameters are not non-negative numbers
	 *
	 * @returns {BwinError} Parameter validation error
	 */
	parametersMustBeNonNegative: () =>
		new BwinError('Parameters must be non-negative numbers', 'PARAMS_NOT_NON_NEGATIVE', undefined, {
			hint: 'Parameters must be numbers greater than or equal to zero.',
			docsUrl: `${DOCS_BASE_URL}api-reference`
		}),

	/**
	 * Error thrown when a key already exists during strict assignment
	 *
	 * @param {string} key - The duplicate key
	 * @returns {BwinError} Duplicate key error with context
	 */
	keyAlreadyExists: (key: string) =>
		new BwinError(`Key "${key}" already exists in target object`, 'KEY_ALREADY_EXISTS', { key }, {
			hint: 'Use a different key name or enable overwriting in your configuration.',
			docsUrl: `${DOCS_BASE_URL}state-management`
		})
} as const;
