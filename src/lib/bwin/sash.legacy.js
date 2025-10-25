import { genId } from './utils.js';
import { Position } from './position.js';
import { BwinErrors } from './errors.js';

const MIN_WIDTH = Number(import.meta.env.VITE_DEFAULT_SASH_MIN_WIDTH);
const MIN_HEIGHT = Number(import.meta.env.VITE_DEFAULT_SASH_MIN_HEIGHT);

export const DEFAULTS = {
	left: 0,
	top: 0,
	width: 150,
	height: 150,
	// Initial min values, real min width/height is calculated based on children
	minWidth: MIN_WIDTH,
	minHeight: MIN_HEIGHT,
	// `classic` | `natural`, `natural` means only one child is updating its size
	resizeStrategy: 'classic'
};

/**
 * @typedef {Object} SashConstructorParams
 * @property {number} [left] - Left position
 * @property {number} [top] - Top position
 * @property {number} [width] - Width
 * @property {number} [height] - Height
 * @property {number} [minWidth] - Minimum width
 * @property {number} [minHeight] - Minimum height
 * @property {string} [resizeStrategy] - Resize strategy ('classic' or 'natural')
 * @property {Sash | null} [parent] - Parent sash
 * @property {HTMLElement | null} [domNode] - Associated DOM element
 * @property {Record<string, any>} [store] - Store for non-core properties
 * @property {string} [position] - Position relative to parent
 * @property {string} [id] - Unique identifier
 */

/**
 * Sash class - represents a node in the binary tree data structure for window management.
 *
 * A Sash is a fundamental building block of the window layout system. Each Sash represents
 * either a pane (leaf node) or a split container (parent node with 2 children). The tree
 * structure allows for recursive tiling layouts with arbitrary nesting.
 *
 * Key Concepts:
 * - Leaf nodes (no children) represent actual panes that display content
 * - Parent nodes (with children) represent splits between two sub-layouts
 * - Each Sash has a position relative to its parent (top/right/bottom/left)
 * - The root Sash has position 'root' and represents the entire window
 *
 * Properties:
 * - Dimensions: left, top, width, height (absolute coordinates)
 * - Constraints: minWidth, minHeight (enforced during resize)
 * - Hierarchy: parent, children (tree relationships)
 * - State: store (arbitrary data), domNode (associated DOM element)
 * - Behavior: resizeStrategy ('classic' or 'natural')
 *
 * The Sash tree is manipulated imperatively through methods like addChild(), and
 * the getters/setters automatically propagate dimension changes to children.
 *
 * @example
 * ```javascript
 * // Create a root sash
 * const root = new Sash({
 *   position: 'root',
 *   width: 800,
 *   height: 600
 * });
 *
 * // Find a sash by ID
 * const editorPane = root.getById('editor');
 *
 * // Walk the tree
 * root.walk((sash) => {
 *   console.log(`${sash.id}: ${sash.width}x${sash.height}`);
 * });
 *
 * // Check if it's a split or pane
 * if (sash.isLeaf()) {
 *   console.log('This is a pane');
 * } else {
 *   console.log('This is a split with', sash.children.length, 'children');
 * }
 * ```
 *
 * @think-about
 *   1. When minWidth/minHeight is set larger than its own width/height, what should happen?
 */
export class Sash {
	/**
	 * @param {SashConstructorParams} params
	 */
	constructor({
		left = DEFAULTS.left,
		top = DEFAULTS.top,
		width = DEFAULTS.width,
		height = DEFAULTS.height,
		minWidth = DEFAULTS.minWidth,
		minHeight = DEFAULTS.minHeight,
		resizeStrategy = DEFAULTS.resizeStrategy,
		parent = null,
		domNode = null,
		store = {},
		position,
		id
	} = DEFAULTS) {
		// Relative position to its parent
		this.id = id ?? genId();
		if (!position) {
			throw BwinErrors.sashPositionRequired();
		}
		this.position = position;
		this.domNode = domNode;
		this.parent = parent;

		this._top = top;
		this._left = left;
		this._width = width;
		this._height = height;

		/** @type {Sash[]} */
		this.children = [];
		this.minWidth = minWidth;
		this.minHeight = minHeight;
		this.resizeStrategy = resizeStrategy;
		// Store non-core props from `ConfigNode` e.g. content, title, tabs, actions, etc
		this.store = store;
	}

	/**
	 * Walk the tree and call the callback on each node (depth-first, post-order)
	 *
	 * @param {(sash: Sash) => void} callback - Function to call on each node
	 */
	walk(callback) {
		this.children.forEach((child) => child.walk(callback));

		// Visit the deepest node first
		callback(this);
	}

	/**
	 * @returns {boolean} True if this is a leaf node (no children)
	 */
	isLeaf() {
		return this.children.length === 0;
	}

	/**
	 * A sash that doesn't split is a leaf, in UI it's a pane
	 *
	 * @returns {boolean} True if this node has children
	 */
	isSplit() {
		return this.children.length > 0;
	}

	/**
	 * @returns {boolean} True if this node has left/right children
	 */
	isLeftRightSplit() {
		return this.children.some(
			(child) => child.position === Position.Left || child.position === Position.Right
		);
	}

	/**
	 * @returns {boolean} True if this node has top/bottom children
	 */
	isTopBottomSplit() {
		return this.children.some(
			(child) => child.position === Position.Top || child.position === Position.Bottom
		);
	}

	get leftChild() {
		return this.children.find((child) => child.position === Position.Left);
	}

	get rightChild() {
		return this.children.find((child) => child.position === Position.Right);
	}

	get topChild() {
		return this.children.find((child) => child.position === Position.Top);
	}

	get bottomChild() {
		return this.children.find((child) => child.position === Position.Bottom);
	}

	/**
	 * Get all children in a fixed order: [top, right, bottom, left]
	 *
	 * @returns {[Sash | null, Sash | null, Sash | null, Sash | null]} Array of children
	 */
	getChildren() {
		let leftChild = null;
		let rightChild = null;
		let topChild = null;
		let bottomChild = null;

		for (const child of this.children) {
			if (child.position === Position.Left) {
				leftChild = child;
			} else if (child.position === Position.Right) {
				rightChild = child;
			} else if (child.position === Position.Top) {
				topChild = child;
			} else if (child.position === Position.Bottom) {
				bottomChild = child;
			}
		}

		return [topChild, rightChild, bottomChild, leftChild];
	}

	/**
	 * Get all leaf descendants (nodes with no children)
	 *
	 * @returns {Sash[]} Array of leaf sashes
	 */
	getAllLeafDescendants() {
		/** @type {Sash[]} */
		const leafDescendants = [];

		this.walk((node) => {
			if (node.children.length === 0) {
				leafDescendants.push(node);
			}
		});

		return leafDescendants;
	}

	/**
	 * Calculate the minimum width based on children's minimum widths
	 *
	 * @returns {number} The minimum width
	 */
	calcMinWidth() {
		if (this.isLeaf()) {
			return this.minWidth;
		}

		const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

		if (leftChild && rightChild) {
			const childrenMinWidth = leftChild.calcMinWidth() + rightChild.calcMinWidth();
			return Math.max(this.minWidth, childrenMinWidth);
		}

		if (topChild && bottomChild) {
			const childrenMinWidth = Math.max(topChild.calcMinWidth(), bottomChild.calcMinWidth());
			return Math.max(this.minWidth, childrenMinWidth);
		}

		return this.minWidth;
	}

	/**
	 * Calculate the minimum height based on children's minimum heights
	 *
	 * @returns {number} The minimum height
	 */
	calcMinHeight() {
		if (this.isLeaf()) {
			return this.minHeight;
		}

		const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

		if (leftChild && rightChild) {
			const childrenMinHeight = Math.max(leftChild.calcMinHeight(), rightChild.calcMinHeight());
			return Math.max(this.minHeight, childrenMinHeight);
		}

		if (topChild && bottomChild) {
			const childrenMinHeight = topChild.calcMinHeight() + bottomChild.calcMinHeight();
			return Math.max(this.minHeight, childrenMinHeight);
		}

		return this.minHeight;
	}

	/**
	 * Get self or descendant by id
	 *
	 * @param {string} id - The ID to search for
	 * @returns {Sash | null} The found sash or null
	 */
	getById(id) {
		if (this.id === id) {
			return this;
		}

		for (const child of this.children) {
			const found = child.getById(id);
			if (found) {
				return found;
			}
		}

		return null;
	}

	/**
	 * Swap IDs of two sashes
	 *
	 * @param {string} id1 - First ID
	 * @param {string} id2 - Second ID
	 */
	swapIds(id1, id2) {
		const sash1 = this.getById(id1);
		const sash2 = this.getById(id2);

		if (!sash1 || !sash2) {
			throw BwinErrors.sashNotFoundWhenSwapping();
		}

		const tempId = sash1.id;
		sash1.id = sash2.id;
		sash2.id = tempId;
	}

	/**
	 * Get all ids of self and descendants
	 *
	 * @returns {string[]} Array of all IDs
	 */
	getAllIds() {
		const ids = [this.id];

		for (const child of this.children) {
			ids.push(...child.getAllIds());
		}

		return ids;
	}

	/**
	 * Add a child sash
	 *
	 * @param {Sash} sash - The sash to add as a child
	 */
	addChild(sash) {
		if (this.children.length >= 2) {
			throw BwinErrors.maxChildrenExceeded();
		}

		this.children.push(sash);
	}

	/**
	 * Get the parent of a descendant by its ID
	 *
	 * @param {string} descendantId - The ID of the descendant
	 * @returns {Sash | null} The parent sash or null
	 */
	getDescendantParentById(descendantId) {
		for (const child of this.children) {
			if (child.id === descendantId) {
				return this;
			}

			const found = child.getDescendantParentById(descendantId);
			if (found) {
				return found;
			}
		}

		return null;
	}

	/**
	 * Get the sibling of a child by the child's ID
	 *
	 * @param {string} childId - The ID of the child
	 * @returns {Sash | undefined} The sibling sash or undefined
	 */
	getChildSiblingById(childId) {
		return this.children.find((child) => child.id !== childId);
	}

	get top() {
		return this._top;
	}

	set top(value) {
		const dist = value - this._top;
		this._top = value;

		const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

		if (topChild && bottomChild) {
			topChild.top += dist;
			bottomChild.top += dist;
		}

		if (leftChild && rightChild) {
			leftChild.top += dist;
			rightChild.top += dist;
		}
	}

	get left() {
		return this._left;
	}

	set left(value) {
		const dist = value - this._left;
		this._left = value;

		const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

		if (leftChild && rightChild) {
			leftChild.left += dist;
			rightChild.left += dist;
		}

		if (topChild && bottomChild) {
			topChild.left += dist;
			bottomChild.left += dist;
		}
	}

	get width() {
		return this._width;
	}

	set width(value) {
		const dist = value - this._width;
		this._width = value;

		const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

		if (leftChild && rightChild) {
			const totalWidth = leftChild.width + rightChild.width;
			const leftDist = dist * (leftChild.width / totalWidth);

			const newTotalWidth = totalWidth + dist;

			let newLeftChildWidth;
			let newRightChildWidth;
			let newRightChildLeft;

			if (this.resizeStrategy === 'natural' && this.position === Position.Left) {
				newLeftChildWidth = leftChild.width;
				newRightChildWidth = rightChild.width + dist;
				newRightChildLeft = rightChild.left;
			} else if (this.resizeStrategy === 'natural' && this.position === Position.Right) {
				newLeftChildWidth = leftChild.width + dist;
				newRightChildWidth = rightChild.width;
				newRightChildLeft = leftChild.left + newLeftChildWidth;
			} else {
				// fallback to classic resize strategy
				newLeftChildWidth = leftChild.width + leftDist;
				newRightChildWidth = newTotalWidth - newLeftChildWidth;
				newRightChildLeft = rightChild.left + leftDist;
			}

			if (dist < 0) {
				const leftChildMinWidth = leftChild.calcMinWidth();
				const rightChildMinWidth = rightChild.calcMinWidth();

				if (newLeftChildWidth < leftChildMinWidth && newRightChildWidth > rightChildMinWidth) {
					newLeftChildWidth = leftChild.width;
					newRightChildWidth = newTotalWidth - newLeftChildWidth;
					newRightChildLeft = leftChild.left + newLeftChildWidth;
				} else if (
					newRightChildWidth < rightChildMinWidth &&
					newLeftChildWidth > leftChildMinWidth
				) {
					newRightChildWidth = rightChild.width;
					newLeftChildWidth = newTotalWidth - newRightChildWidth;
					newRightChildLeft = leftChild.left + newLeftChildWidth;
				}
			}

			leftChild.width = newLeftChildWidth;
			rightChild.width = newRightChildWidth;
			rightChild.left = newRightChildLeft;
		}

		if (topChild && bottomChild) {
			topChild.width += dist;
			bottomChild.width += dist;
		}
	}

	get height() {
		return this._height;
	}

	set height(value) {
		const dist = value - this._height;
		this._height = value;

		const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

		if (topChild && bottomChild) {
			const totalHeight = topChild.height + bottomChild.height;
			const topDist = dist * (topChild.height / totalHeight);

			const newTotalHeight = totalHeight + dist;

			let newTopChildHeight;
			let newBottomChildHeight;
			let newBottomChildTop;

			if (this.resizeStrategy === 'natural' && this.position === Position.Top) {
				newTopChildHeight = topChild.height;
				newBottomChildHeight = bottomChild.height + dist;
				newBottomChildTop = bottomChild.top;
			} else if (this.resizeStrategy === 'natural' && this.position === Position.Bottom) {
				newTopChildHeight = topChild.height + dist;
				newBottomChildHeight = bottomChild.height;
				newBottomChildTop = topChild.top + newTopChildHeight;
			} else {
				// fallback to classic resize strategy
				newTopChildHeight = topChild.height + topDist;
				newBottomChildHeight = newTotalHeight - newTopChildHeight;
				newBottomChildTop = bottomChild.top + topDist;
			}

			if (dist < 0) {
				const topChildMinHeight = topChild.calcMinHeight();
				const bottomChildMinHeight = bottomChild.calcMinHeight();

				if (newTopChildHeight < topChildMinHeight && newBottomChildHeight > bottomChildMinHeight) {
					newTopChildHeight = topChild.height;
					newBottomChildHeight = newTotalHeight - newTopChildHeight;
					newBottomChildTop = topChild.top + newTopChildHeight;
				} else if (
					newBottomChildHeight < bottomChildMinHeight &&
					newTopChildHeight > topChildMinHeight
				) {
					newBottomChildHeight = bottomChild.height;
					newTopChildHeight = newTotalHeight - newBottomChildHeight;
					newBottomChildTop = topChild.top + newTopChildHeight;
				}
			}

			topChild.height = newTopChildHeight;
			bottomChild.height = newBottomChildHeight;
			bottomChild.top = newBottomChildTop;
		}

		if (leftChild && rightChild) {
			leftChild.height += dist;
			rightChild.height += dist;
		}
	}
}
