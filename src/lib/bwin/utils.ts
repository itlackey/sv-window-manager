import { BwinErrors } from './errors.js';

/**
 * Generate a random color string in the format of "rgba(r, g, b, a)"
 *
 * @param maxOpacity - The maximum opacity value (0 to 1)
 * @returns The generated RGBA color string
 */
export function genColor(maxOpacity: number = 0.5): string {
	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	const opacity = Math.random() * maxOpacity;

	return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate a bright random color string in the format of "rgba(r, g, b, a)"
 *
 * @param maxOpacity - The maximum opacity value (0.5 to 1)
 * @param minBrightness - The minimum brightness value (0 to 255)
 * @returns The generated bright RGBA color string
 */
export function genBrightColor(maxOpacity: number = 0.7, minBrightness: number = 128): string {
	const brightnessRange = 256 - minBrightness;

	const r = Math.floor(Math.random() * brightnessRange + minBrightness);
	const g = Math.floor(Math.random() * brightnessRange + minBrightness);
	const b = Math.floor(Math.random() * brightnessRange + minBrightness);
	const opacity = Math.max(0.5, Math.random() * maxOpacity);

	return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate a random string of digits
 *
 * @param length - The length of the string
 * @returns The generated digit string
 * @throws {BwinError} PARAMS_NOT_POSITIVE_INTEGER - If length is not a positive integer
 */
export function genDigits(length: number = 5): string {
	if (length <= 0 || !Number.isInteger(length)) {
		throw BwinErrors.parameterMustBePositiveInteger();
	}

	const max = Math.pow(10, length);
	const num = Math.floor(Math.random() * max);
	return num.toString().padStart(length, '0');
}

/**
 * Generate a random ID in the format of "AB-123".
 *
 * Creates a unique identifier combining random uppercase letters and digits,
 * separated by a hyphen. Used throughout the library for sash IDs when
 * custom IDs are not provided.
 *
 * @param alphabetLength - The length of the alphabet part (default: 2)
 * @param digitLength - The length of the digit part (default: 3)
 * @returns The generated ID (e.g., "XY-789", "AB-123")
 *
 * @throws {BwinError} PARAMS_NOT_NON_NEGATIVE - If either length parameter is negative
 *
 * @example
 * ```javascript
 * genId()           // → "AB-123" (random)
 * genId(3, 4)       // → "XYZ-1234" (random)
 * genId(1, 2)       // → "A-12" (random)
 *
 * // Used internally when no ID provided
 * const newSash = new Sash({ position: 'left' });
 * console.log(newSash.id); // → "MK-472" (auto-generated)
 * ```
 */
export function genId(alphabetLength: number = 2, digitLength: number = 3): string {
	if (alphabetLength < 0 || digitLength < 0) {
		throw BwinErrors.parametersMustBeNonNegative();
	}

	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const digits = '0123456789';

	let result = '';
	for (let i = 0; i < alphabetLength; i++) {
		const randomIndex = Math.floor(Math.random() * alphabet.length);
		result += alphabet[randomIndex];
	}

	result += '-';

	for (let i = 0; i < digitLength; i++) {
		const randomIndex = Math.floor(Math.random() * digits.length);
		result += digits[randomIndex];
	}

	return result;
}

/**
 * Move all child nodes from one DOM element to another
 *
 * @param toNode - The destination node
 * @param fromNode - The source node
 */
export function moveChildNodes(toNode: HTMLElement, fromNode: HTMLElement): void {
	while (fromNode.firstChild) {
		toNode.appendChild(fromNode.firstChild);
	}
}

/**
 * Swap two DOM nodes' child nodes
 *
 * @param parentNode1 - The parent node
 * @param parentNode2 - Another parent node
 */
export function swapChildNodes(parentNode1: HTMLElement, parentNode2: HTMLElement): void {
	const tempNode = document.createElement('div');

	moveChildNodes(tempNode, parentNode1);
	moveChildNodes(parentNode1, parentNode2);
	moveChildNodes(parentNode2, tempNode);
}

/**
 * Parse a size string into a number for layout calculations.
 *
 * Supports multiple size formats:
 * - Numbers: returned as-is (e.g., 100 → 100)
 * - Pixel strings: "100px" → 100
 * - Percentage strings: "50%" → 0.5 (as decimal ratio)
 * - Bare number strings: "100" → 100
 *
 * Returns NaN for invalid inputs.
 *
 * @param size - The size value to parse
 * @returns The parsed size (px values and bare numbers as-is, percentages as 0-1 ratio)
 *
 * @example
 * ```javascript
 * parseSize(100)        // → 100
 * parseSize("200px")    // → 200
 * parseSize("50%")      // → 0.5
 * parseSize("0.3")      // → 0.3
 * parseSize("invalid")  // → NaN
 *
 * // Used in pane sizing
 * const targetWidth = 800;
 * const size = parseSize("40%"); // 0.4
 * const paneWidth = size < 1 ? targetWidth * size : size; // 320px
 * ```
 */
export function parseSize(size: string | number): number {
	if (typeof size === 'number' && !isNaN(size)) {
		return size;
	}

	if (typeof size === 'string') {
		const trimmed = size.trim();

		if (trimmed.endsWith('%')) {
			const withoutPercent = trimmed.slice(0, -1);
			if (!withoutPercent) return NaN;
			const number = Number(withoutPercent);
			return !isNaN(number) ? number / 100 : NaN;
		}

		if (trimmed.endsWith('px')) {
			const withoutPx = trimmed.slice(0, -2);
			if (!withoutPx) return NaN;
			const number = Number(withoutPx);
			return !isNaN(number) ? number : NaN;
		}

		return Number(trimmed);
	}

	return NaN;
}

/**
 * Check if a value is a plain object, not array, null, etc
 *
 * @param value - The value to check
 * @returns True if the value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) === Object.prototype
	);
}

/**
 * Assign properties from source object if they don't already exist in target object
 *
 * @param target - The target object
 * @param source - The source object
 * @returns The target object with assigned properties
 * @throws {BwinError} KEY_ALREADY_EXISTS - If a key from source already exists in target
 */
export function strictAssign<T extends Record<string, unknown>, S extends Record<string, unknown>>(
	target: T,
	source: S
): T & S {
	for (const key in source) {
		if (Object.hasOwn(target, key)) {
			throw BwinErrors.keyAlreadyExists(key);
		}
		(target as Record<string, unknown>)[key] = source[key];
	}
	return target as T & S;
}

/**
 * Throttle a function to run at most once every `limit` milliseconds
 *
 * @param func - The function to throttle
 * @param limit - The time limit in milliseconds
 * @returns The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle = false;

	return function (this: unknown, ...args: Parameters<T>): void {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;

			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

/**
 * Create a DocumentFragment from an HTML string
 *
 * @param htmlString - The HTML string
 * @returns The created DocumentFragment
 */
export function createFragment(htmlString: string): DocumentFragment {
	const templateEl = document.createElement('template');
	templateEl.innerHTML = htmlString.trim();
	return templateEl.content;
}

/**
 * Create a DOM node from a string or a node
 *
 * @param content - The content to create a node from
 * @returns A DOM node or null if the content is empty
 */
export function createDomNode(content: unknown): Node | null {
	if (content === null || content === undefined || content === '') {
		return null;
	}

	if (typeof content === 'string') {
		try {
			const frag = createFragment(content);

			if (frag.childNodes.length === 1) {
				return frag.firstChild;
			}

			return frag;
		} catch {
			return document.createTextNode(content);
		}
	}

	if (content instanceof Node) {
		return content;
	}

	return document.createTextNode(String(content));
}

/**
 * Metrics object representing position and size of an element
 */
export interface ElementMetrics {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Get the metrics (position and size) from an element's inline styles.
 *
 * Extracts the left, top, width, and height values from an element's inline
 * style attribute. Returns 0 for any missing values. Used throughout the
 * library to read pane dimensions that were set via style properties.
 *
 * Note: This reads from inline styles, NOT computed styles. Elements must
 * have their metrics set via element.style.* properties.
 *
 * @param element - The element to get metrics from
 * @returns Metrics object in pixels
 *
 * @example
 * ```javascript
 * // Element has inline styles
 * paneEl.style.left = '100px';
 * paneEl.style.top = '50px';
 * paneEl.style.width = '400px';
 * paneEl.style.height = '300px';
 *
 * const metrics = getMetricsFromElement(paneEl);
 * // → { left: 100, top: 50, width: 400, height: 300 }
 *
 * // Used to read current pane dimensions
 * const containerMetrics = getMetricsFromElement(containerEl);
 * rootSash.width = containerMetrics.width;
 * ```
 */
export function getMetricsFromElement(element: HTMLElement): ElementMetrics {
	// Try inline styles first (for positioned elements)
	const left = parseFloat(element.style.left) || 0;
	const top = parseFloat(element.style.top) || 0;

	// For width/height, prefer inline styles but fallback to computed/bounding rect
	let width = parseFloat(element.style.width);
	let height = parseFloat(element.style.height);

	// If no inline styles, use computed dimensions
	if (!width || !height) {
		const rect = element.getBoundingClientRect();
		if (!width) width = rect.width;
		if (!height) height = rect.height;
	}

	return { left, top, width, height };
}
