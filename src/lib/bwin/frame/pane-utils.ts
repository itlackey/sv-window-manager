import { parseSize, genId } from '../utils.js';
import { Position } from '../position.js';
import type { ReactiveSash } from '../sash.svelte.js';

/**
 * Options for adding a pane sash to an existing sash
 */
export interface AddPaneOptions {
	/** Size of the new pane (percentage as 0-1 decimal, or absolute pixels) */
	size?: string | number;
	/** Custom ID for the new sash (auto-generated if not provided) */
	id?: string;
}

/**
 * Options for adding a pane with position specification
 */
export interface AddPaneSashOptions extends AddPaneOptions {
	/** Position relative to target pane (top, right, bottom, left) */
	position: string;
}

/**
 * Create a pane element for a sash
 *
 * Creates a custom `<bw-pane>` element with inline styles matching the sash's
 * dimensions and position. Sets required attributes for sash ID and position.
 *
 * @param sash - The sash to create a pane for
 * @returns The created pane element with dimensions and attributes
 *
 * @example
 * ```typescript
 * const sash = new ReactiveSash({
 *   position: Position.Left,
 *   left: 0, top: 0,
 *   width: 400, height: 600
 * });
 *
 * const paneEl = createPaneElement(sash);
 * // → <bw-pane> with style and attributes set
 * container.appendChild(paneEl);
 * ```
 */
export function createPaneElement(sash: ReactiveSash): HTMLElement {
	const paneEl = document.createElement('bw-pane');
	paneEl.style.top = `${sash.top}px`;
	paneEl.style.left = `${sash.left}px`;
	paneEl.style.width = `${sash.width}px`;
	paneEl.style.height = `${sash.height}px`;
	paneEl.setAttribute('sash-id', sash.id);
	paneEl.setAttribute('position', sash.position);

	return paneEl;
}

/**
 * Update a pane element to match sash dimensions
 *
 * Synchronizes an existing pane element's styles and attributes with the
 * current sash state. Used during resize operations to keep DOM in sync
 * with the sash tree.
 *
 * @param sash - The sash with updated dimensions
 * @returns The updated pane element, or null if sash has no domNode
 *
 * @example
 * ```typescript
 * // After resizing the sash
 * sash.width = 500;
 * const paneEl = updatePaneElement(sash);
 * // → paneEl now has width: 500px in inline styles
 * ```
 */
export function updatePaneElement(sash: ReactiveSash): HTMLElement | null {
	const paneEl = sash.domNode;
	if (!paneEl) return null;
	paneEl.style.top = `${sash.top}px`;
	paneEl.style.left = `${sash.left}px`;
	paneEl.style.width = `${sash.width}px`;
	paneEl.style.height = `${sash.height}px`;
	paneEl.setAttribute('position', sash.position);

	return paneEl;
}

/**
 * Add a pane sash to the left of a target pane sash
 *
 * Splits the target pane horizontally, creating a new left pane and adjusting
 * the original pane to the right. The target sash becomes a muntin (parent node).
 *
 * @param targetPaneSash - The sash to split
 * @param options - Size and ID options for the new pane
 * @returns The newly created left sash
 *
 * @internal This is called by addPaneSash() based on position
 */
function addPaneSashToLeft(
	targetPaneSash: ReactiveSash,
	{ size, id }: AddPaneOptions
): ReactiveSash {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newLeftSashWidth = targetPaneSash.width / 2;

	if (sizeParsed) {
		if (sizeParsed < 1) {
			newLeftSashWidth = targetPaneSash.width * sizeParsed;
		} else {
			newLeftSashWidth = sizeParsed;
		}
	}

	const newLeftSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id,
		top: targetPaneSash.top,
		left: targetPaneSash.left,
		width: newLeftSashWidth,
		height: targetPaneSash.height,
		position: Position.Left
	});

	const newRightSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id: targetPaneSash.id,
		top: targetPaneSash.top,
		left: targetPaneSash.left + newLeftSash.width,
		width: targetPaneSash.width - newLeftSashWidth,
		height: targetPaneSash.height,
		position: Position.Right,
		domNode: targetPaneSash.domNode,
		store: targetPaneSash.store
	});

	targetPaneSash.addChild(newLeftSash);
	targetPaneSash.addChild(newRightSash);
	targetPaneSash.domNode = null;
	// Generate a new ID for original target sash to be a new muntin during `update` call
	// @ts-expect-error - id is readonly but we need to reassign it here
	targetPaneSash.id = genId();

	return newLeftSash;
}

/**
 * Add a pane sash to the right of a target pane sash
 *
 * Splits the target pane horizontally, creating a new right pane and adjusting
 * the original pane to the left. The target sash becomes a muntin (parent node).
 *
 * @param targetPaneSash - The sash to split
 * @param options - Size and ID options for the new pane
 * @returns The newly created right sash
 *
 * @internal This is called by addPaneSash() based on position
 */
function addPaneSashToRight(
	targetPaneSash: ReactiveSash,
	{ size, id }: AddPaneOptions
): ReactiveSash {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newRightSashWidth = targetPaneSash.width / 2;

	if (sizeParsed) {
		if (sizeParsed < 1) {
			newRightSashWidth = targetPaneSash.width * sizeParsed;
		} else {
			newRightSashWidth = sizeParsed;
		}
	}

	const newLeftSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id: targetPaneSash.id,
		left: targetPaneSash.left,
		top: targetPaneSash.top,
		width: targetPaneSash.width - newRightSashWidth,
		height: targetPaneSash.height,
		position: Position.Left,
		domNode: targetPaneSash.domNode,
		store: targetPaneSash.store
	});

	const newRightSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id,
		left: targetPaneSash.left + newLeftSash.width,
		top: targetPaneSash.top,
		width: newRightSashWidth,
		height: targetPaneSash.height,
		position: Position.Right
	});

	targetPaneSash.addChild(newLeftSash);
	targetPaneSash.addChild(newRightSash);
	targetPaneSash.domNode = null;
	// @ts-expect-error - id is readonly but we need to reassign it here
	targetPaneSash.id = genId();

	return newRightSash;
}

/**
 * Add a pane sash to the top of a target pane sash
 *
 * Splits the target pane vertically, creating a new top pane and adjusting
 * the original pane to the bottom. The target sash becomes a muntin (parent node).
 *
 * @param targetPaneSash - The sash to split
 * @param options - Size and ID options for the new pane
 * @returns The newly created top sash
 *
 * @internal This is called by addPaneSash() based on position
 */
function addPaneSashToTop(
	targetPaneSash: ReactiveSash,
	{ size, id }: AddPaneOptions
): ReactiveSash {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newTopSashHeight = targetPaneSash.height / 2;

	if (sizeParsed) {
		if (sizeParsed < 1) {
			newTopSashHeight = targetPaneSash.height * sizeParsed;
		} else {
			newTopSashHeight = sizeParsed;
		}
	}

	const newTopSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id,
		left: targetPaneSash.left,
		top: targetPaneSash.top,
		width: targetPaneSash.width,
		height: newTopSashHeight,
		position: Position.Top
	});

	const newBottomSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id: targetPaneSash.id,
		left: targetPaneSash.left,
		top: targetPaneSash.top + newTopSash.height,
		width: targetPaneSash.width,
		height: targetPaneSash.height - newTopSashHeight,
		position: Position.Bottom,
		domNode: targetPaneSash.domNode,
		store: targetPaneSash.store
	});

	targetPaneSash.addChild(newTopSash);
	targetPaneSash.addChild(newBottomSash);
	targetPaneSash.domNode = null;
	// @ts-expect-error - id is readonly but we need to reassign it here
	targetPaneSash.id = genId();

	return newTopSash;
}

/**
 * Add a pane sash to the bottom of a target pane sash
 *
 * Splits the target pane vertically, creating a new bottom pane and adjusting
 * the original pane to the top. The target sash becomes a muntin (parent node).
 *
 * @param targetPaneSash - The sash to split
 * @param options - Size and ID options for the new pane
 * @returns The newly created bottom sash
 *
 * @internal This is called by addPaneSash() based on position
 */
function addPaneSashToBottom(
	targetPaneSash: ReactiveSash,
	{ size, id }: AddPaneOptions
): ReactiveSash {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newBottomSashHeight = targetPaneSash.height / 2;

	if (sizeParsed) {
		if (sizeParsed < 1) {
			newBottomSashHeight = targetPaneSash.height * sizeParsed;
		} else {
			newBottomSashHeight = sizeParsed;
		}
	}

	const newTopSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id: targetPaneSash.id,
		top: targetPaneSash.top,
		left: targetPaneSash.left,
		width: targetPaneSash.width,
		height: targetPaneSash.height - newBottomSashHeight,
		position: Position.Top,
		domNode: targetPaneSash.domNode,
		store: targetPaneSash.store
	});

	const newBottomSash = new (targetPaneSash.constructor as typeof ReactiveSash)({
		id,
		top: targetPaneSash.top + newTopSash.height,
		left: targetPaneSash.left,
		width: targetPaneSash.width,
		height: newBottomSashHeight,
		position: Position.Bottom
	});

	targetPaneSash.addChild(newTopSash);
	targetPaneSash.addChild(newBottomSash);
	targetPaneSash.domNode = null;
	// @ts-expect-error - id is readonly but we need to reassign it here
	targetPaneSash.id = genId();

	return newBottomSash;
}

/**
 * Add a pane sash to a target pane sash
 *
 * High-level function to split a pane by adding a new child pane in the specified
 * position. This function delegates to position-specific helper functions and
 * transforms the target pane sash into a muntin (parent) node with two children.
 *
 * The original pane's domNode and store are preserved on one of the children
 * (the child that maintains the original position), while the target sash gets
 * a new generated ID and becomes a container node.
 *
 * @param targetPaneSash - The target pane sash to split
 * @param options - Options for the new pane (position, size, id)
 * @returns The newly created sash, or undefined if position is invalid
 *
 * @todo Add support for more Sash props (minWidth, minHeight, etc.)
 *
 * @example
 * ```typescript
 * // Split right with 40% size
 * const newPane = addPaneSash(rootSash, {
 *   position: Position.Right,
 *   size: '40%',
 *   id: 'editor-pane'
 * });
 *
 * // Split bottom with absolute size
 * const terminalPane = addPaneSash(editorPane, {
 *   position: Position.Bottom,
 *   size: 200  // 200px
 * });
 * ```
 */
export function addPaneSash(
	targetPaneSash: ReactiveSash,
	{ position, size, id }: AddPaneSashOptions
): ReactiveSash | undefined {
	if (position === Position.Left) {
		return addPaneSashToLeft(targetPaneSash, { size, id });
	} else if (position === Position.Right) {
		return addPaneSashToRight(targetPaneSash, { size, id });
	} else if (position === Position.Top) {
		return addPaneSashToTop(targetPaneSash, { size, id });
	} else if (position === Position.Bottom) {
		return addPaneSashToBottom(targetPaneSash, { size, id });
	}
}
