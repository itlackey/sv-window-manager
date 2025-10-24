import { parseSize, genId } from '../utils.js';
import { Position } from '../position.js';
import { Sash } from '../sash.js';

/**
 * Create a pane element for a sash
 *
 * @param {import('../sash.js').Sash} sash - The sash to create a pane for
 * @returns {HTMLElement} The created pane element
 */
export function createPaneElement(sash) {
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
 * @param {import('../sash.js').Sash} sash - The sash with updated dimensions
 * @returns {HTMLElement | null} The updated pane element
 */
export function updatePaneElement(sash) {
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
 * @param {import('../sash.js').Sash} targetPaneSash
 * @param {{ size?: string | number; id?: string }} options
 * @returns {import('../sash.js').Sash}
 */
function addPaneSashToLeft(targetPaneSash, { size, id }) {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newLeftSashWidth = targetPaneSash.width / 2;

	if (sizeParsed) {
		sizeParsed < 1
			? (newLeftSashWidth = targetPaneSash.width * sizeParsed)
			: (newLeftSashWidth = sizeParsed);
	}

	const newLeftSash = new Sash({
		id,
		top: targetPaneSash.top,
		left: targetPaneSash.left,
		width: newLeftSashWidth,
		height: targetPaneSash.height,
		position: Position.Left
	});

	const newRightSash = new Sash({
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
	targetPaneSash.id = genId();

	return newLeftSash;
}

/**
 * @param {import('../sash.js').Sash} targetPaneSash
 * @param {{ size?: string | number; id?: string }} options
 * @returns {import('../sash.js').Sash}
 */
function addPaneSashToRight(targetPaneSash, { size, id }) {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newRightSashWidth = targetPaneSash.width / 2;

	if (sizeParsed) {
		sizeParsed < 1
			? (newRightSashWidth = targetPaneSash.width * sizeParsed)
			: (newRightSashWidth = sizeParsed);
	}

	const newLeftSash = new Sash({
		id: targetPaneSash.id,
		left: targetPaneSash.left,
		top: targetPaneSash.top,
		width: targetPaneSash.width - newRightSashWidth,
		height: targetPaneSash.height,
		position: Position.Left,
		domNode: targetPaneSash.domNode,
		store: targetPaneSash.store
	});

	const newRightSash = new Sash({
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
	targetPaneSash.id = genId();

	return newRightSash;
}

/**
 * @param {import('../sash.js').Sash} targetPaneSash
 * @param {{ size?: string | number; id?: string }} options
 * @returns {import('../sash.js').Sash}
 */
function addPaneSashToTop(targetPaneSash, { size, id }) {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newTopSashHeight = targetPaneSash.height / 2;

	if (sizeParsed) {
		sizeParsed < 1
			? (newTopSashHeight = targetPaneSash.height * sizeParsed)
			: (newTopSashHeight = sizeParsed);
	}

	const newTopSash = new Sash({
		id,
		left: targetPaneSash.left,
		top: targetPaneSash.top,
		width: targetPaneSash.width,
		height: newTopSashHeight,
		position: Position.Top
	});

	const newBottomSash = new Sash({
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
	targetPaneSash.id = genId();

	return newTopSash;
}

/**
 * @param {import('../sash.js').Sash} targetPaneSash
 * @param {{ size?: string | number; id?: string }} options
 * @returns {import('../sash.js').Sash}
 */
function addPaneSashToBottom(targetPaneSash, { size, id }) {
	const sizeParsed = size !== undefined ? parseSize(size) : null;
	let newBottomSashHeight = targetPaneSash.height / 2;

	if (sizeParsed) {
		sizeParsed < 1
			? (newBottomSashHeight = targetPaneSash.height * sizeParsed)
			: (newBottomSashHeight = sizeParsed);
	}

	const newTopSash = new Sash({
		id: targetPaneSash.id,
		top: targetPaneSash.top,
		left: targetPaneSash.left,
		width: targetPaneSash.width,
		height: targetPaneSash.height - newBottomSashHeight,
		position: Position.Top,
		domNode: targetPaneSash.domNode,
		store: targetPaneSash.store
	});

	const newBottomSash = new Sash({
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
	targetPaneSash.id = genId();

	return newBottomSash;
}

/**
 * Add a pane sash to a target pane sash
 *
 * @param {import('../sash.js').Sash} targetPaneSash - The target pane sash
 * @param {{ position: string; size?: string | number; id?: string }} options - Options for the new pane
 * @returns {import('../sash.js').Sash | undefined} The new sash
 * @todo add pane with more Sash props e.g. minWidth, minHeight, etc.
 */
export function addPaneSash(targetPaneSash, { position, size, id }) {
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
