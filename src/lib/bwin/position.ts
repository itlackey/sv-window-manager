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
export enum Position {
	Top = 'top',
	Right = 'right',
	Bottom = 'bottom',
	Left = 'left',
	Center = 'center',
	Root = 'root',
	Unknown = 'unknown',
	Outside = 'outside'
}

/**
 * Get the opposite position of a given position
 *
 * @param position - The position to get the opposite of
 * @returns The opposite position
 * @throws {BwinError} INVALID_POSITION - If position is not a directional position
 */
export function getOppositePosition(position: Position): Position {
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
 * Coordinates for diagonal calculations
 */
interface DiagonalParams {
	width: number;
	height: number;
}

interface MainDiagonalYParams extends DiagonalParams {
	x: number;
}

interface MainDiagonalXParams extends DiagonalParams {
	y: number;
}

/**
 * Calculate the Y coordinate on the main diagonal line at a given X
 */
function getMainDiagonalY({ width, height, x }: MainDiagonalYParams): number {
	return (height / width) * x;
}

/**
 * Calculate the X coordinate on the main diagonal line at a given Y
 */
function getMainDiagonalX({ width, height, y }: MainDiagonalXParams): number {
	return (width / height) * y;
}

/**
 * Calculate the Y coordinate on the minor diagonal line at a given X
 */
function getMinorDiagonalY({ width, height, x }: MainDiagonalYParams): number {
	return height - (height / width) * x;
}

/**
 * Calculate the X coordinate on the minor diagonal line at a given Y
 */
function getMinorDiagonalX({ width, height, y }: MainDiagonalXParams): number {
	return width - (width / height) * y;
}

/**
 * Mouse coordinates
 */
export interface CursorCoordinates {
	clientX: number;
	clientY: number;
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
 * @param element - The element to check position relative to
 * @param coords - The mouse coordinates
 * @returns One of Position enum values (Top, Right, Bottom, Left, Center, Unknown, Outside)
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
export function getCursorPosition(
	element: HTMLElement,
	{ clientX, clientY }: CursorCoordinates
): Position {
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
 * @param position - The position to check
 * @returns True if the position is one of the main positions
 */
export function isTopRightBottomLeftOrCenter(position: Position): boolean {
	return (
		position === Position.Top ||
		position === Position.Right ||
		position === Position.Bottom ||
		position === Position.Left ||
		position === Position.Center
	);
}
