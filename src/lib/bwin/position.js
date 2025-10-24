import { BwinErrors } from './errors.js';

/**
 * Position constants for pane placement and cursor detection.
 *
 * These constants define all possible positions in the window management system:
 * - Directional positions (Top, Right, Bottom, Left) for pane splitting
 * - Center position for pane swapping via drag-and-drop
 * - Root position for the top-level sash
 * - Special positions (Unknown, Outside) for edge cases in cursor detection
 *
 * @constant {Object}
 * @property {string} Top - Position above the target pane
 * @property {string} Right - Position to the right of the target pane
 * @property {string} Bottom - Position below the target pane
 * @property {string} Left - Position to the left of the target pane
 * @property {string} Center - Center position (used for swapping panes)
 * @property {string} Root - Root position (only for the top-level sash)
 * @property {string} Unknown - Unknown position (cursor on boundary/diagonal)
 * @property {string} Outside - Outside the element bounds
 *
 * @example
 * ```javascript
 * // Add a pane to the right
 * binaryWindow.addPane('root', {
 *   position: Position.Right,
 *   size: '40%'
 * });
 *
 * // Check cursor position during drag
 * const cursorPos = getCursorPosition(paneEl, { clientX, clientY });
 * if (cursorPos === Position.Center) {
 *   // Swap panes
 * } else if (cursorPos === Position.Top) {
 *   // Split horizontally above
 * }
 * ```
 */
export const Position = {
	Top: 'top',
	Right: 'right',
	Bottom: 'bottom',
	Left: 'left',
	Center: 'center',
	Root: 'root',
	Unknown: 'unknown',
	Outside: 'outside'
};

/**
 * Get the opposite position of a given position
 *
 * @param {string} position - The position to get the opposite of
 * @returns {string} The opposite position
 */
export function getOppositePosition(position) {
	switch (position) {
		case Position.Top:
			return Position.Bottom;
		case Position.Right:
			return Position.Left;
		case Position.Bottom:
			return Position.Top;
		case Position.Left:
			return Position.Right;
		default:
			throw BwinErrors.invalidPosition(position);
	}
}

/**
 * @param {{ width: number; height: number; x: number }} params
 * @returns {number}
 */
function getMainDiagonalY({ width, height, x }) {
	return (height / width) * x;
}

/**
 * @param {{ width: number; height: number; y: number }} params
 * @returns {number}
 */
function getMainDiagonalX({ width, height, y }) {
	return (width / height) * y;
}

/**
 * @param {{ width: number; height: number; x: number }} params
 * @returns {number}
 */
function getMinorDiagonalY({ width, height, x }) {
	return height - (height / width) * x;
}

/**
 * @param {{ width: number; height: number; y: number }} params
 * @returns {number}
 */
function getMinorDiagonalX({ width, height, y }) {
	return width - (width / height) * y;
}

/**
 * Get the cursor position relative to an element using diagonal-based zone detection.
 *
 * This function divides an element into zones (top, right, bottom, left, center) using
 * diagonal lines and detects which zone contains the cursor. Used primarily for
 * drag-and-drop operations to determine drop behavior.
 *
 * Zone Detection Algorithm:
 * - Uses two diagonal lines (main and minor) to divide the rectangle
 * - Creates a center zone (30% of width/height)
 * - Remaining space is divided into 4 edge zones
 * - Returns Position.Unknown for boundary/diagonal areas
 * - Returns Position.Outside if cursor is outside element bounds
 *
 * @param {HTMLElement} element - The element to check position relative to
 * @param {{ clientX: number; clientY: number }} coords - The mouse coordinates
 * @returns {string} One of Position constants (Top, Right, Bottom, Left, Center, Unknown, Outside)
 *
 * @example
 * ```javascript
 * // In a drop handler
 * paneEl.addEventListener('dragover', (e) => {
 *   const position = getCursorPosition(paneEl, e);
 *
 *   switch(position) {
 *     case Position.Center:
 *       // Show swap indicator
 *       break;
 *     case Position.Top:
 *       // Show top split indicator
 *       break;
 *     case Position.Right:
 *       // Show right split indicator
 *       break;
 *   }
 * });
 * ```
 */
export function getCursorPosition(element, { clientX, clientY }) {
	const rect = element.getBoundingClientRect();
	const { width, height } = rect;

	const deltaX = clientX - rect.left;
	const deltaY = clientY - rect.top;

	if (deltaX < 0 || deltaX > width || deltaY < 0 || deltaY > height) {
		return Position.Outside;
	}
	const centerRadio = 0.3;

	const mainDiagonalY = getMainDiagonalY({ width, height, x: deltaX });
	const minorDiagonalY = getMinorDiagonalY({ width, height, x: deltaX });
	const mainDiagonalX = getMainDiagonalX({ width, height, y: deltaY });
	const minorDiagonalX = getMinorDiagonalX({ width, height, y: deltaY });

	if (
		deltaX < width * (0.5 - centerRadio / 2) &&
		deltaY > mainDiagonalY &&
		deltaY < minorDiagonalY
	) {
		return Position.Left;
	} else if (
		deltaX > width * (0.5 + centerRadio / 2) &&
		deltaY < mainDiagonalY &&
		deltaY > minorDiagonalY
	) {
		return Position.Right;
	} else if (
		deltaY < height * (0.5 - centerRadio / 2) &&
		deltaX > mainDiagonalX &&
		deltaX < minorDiagonalX
	) {
		return Position.Top;
	} else if (
		deltaY > height * (0.5 + centerRadio / 2) &&
		deltaX < mainDiagonalX &&
		deltaX > minorDiagonalX
	) {
		return Position.Bottom;
	} else if (
		deltaX > width * (0.5 - centerRadio / 2) &&
		deltaX < width * (0.5 + centerRadio / 2) &&
		deltaY > height * (0.5 - centerRadio / 2) &&
		deltaY < height * (0.5 + centerRadio / 2)
	) {
		return Position.Center;
	}

	// When cursor is on boundaries
	// e.g. borders of center, borders of container, diagonals, etc
	return Position.Unknown;
}

/**
 * Check if the position is one of the main positions (top, right, bottom, left, or center)
 *
 * @param {string} position - The position to check
 * @returns {boolean} True if the position is one of the main positions
 */
export function isTopRightBottomLeftOrCenter(position) {
	return (
		position === Position.Top ||
		position === Position.Right ||
		position === Position.Bottom ||
		position === Position.Left ||
		position === Position.Center
	);
}
