/**
 * Reactive Sash Class - Svelte 5 Full Implementation
 *
 * This is the PRODUCTION-READY implementation of a reactive Sash class using Svelte 5 runes.
 * It provides full feature parity with the legacy sash.js implementation while adding
 * automatic reactivity through Svelte 5's fine-grained reactive system.
 *
 * **Design Philosophy: Hybrid Reactive Pattern**
 * - `$state` for reactive properties (dimensions, children, domNode, store)
 * - Setter-based propagation (maintains synchronous, predictable updates)
 * - Derived getters for child accessors (leftChild, rightChild, etc.)
 * - Plain methods for expensive calculations (calcMinWidth/Height)
 * - Full support for both 'classic' and 'natural' resize strategies
 * - Complete minimum size constraint enforcement
 *
 * **Full Implementation Features**:
 * - All 23 methods from legacy implementation
 * - Complete tree traversal (walk, getAllLeafDescendants)
 * - ID management (getById, swapIds, getAllIds)
 * - Parent-child relationships (getDescendantParentById, getChildSiblingById)
 * - Split type detection (isLeftRightSplit, isTopBottomSplit)
 * - Natural and classic resize strategies with full constraint handling
 * - TypeScript types throughout
 * - Comprehensive JSDoc documentation
 *
 * @fileoverview Phase 3 Full Implementation for Workstream 3.1 (reactive-sash-class)
 */

import { genId } from './utils.js';
import { Position } from './position.js';
import { BwinErrors } from './errors.js';

const MIN_WIDTH = 50;
const MIN_HEIGHT = 50;

export const DEFAULTS = {
	left: 0,
	top: 0,
	width: 150,
	height: 150,
	minWidth: MIN_WIDTH,
	minHeight: MIN_HEIGHT,
	resizeStrategy: 'classic' as const
};

/**
 * Constructor parameters for ReactiveSash
 */
export interface SashConstructorParams {
	left?: number;
	top?: number;
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	resizeStrategy?: 'classic' | 'natural';
	parent?: ReactiveSash | null;
	domNode?: HTMLElement | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Store holds arbitrary user-defined data
	store?: Record<string, any>;
	position: string; // Required
	id?: string;
}

/**
 * ReactiveSash - Reactive binary tree node for window management
 *
 * A fully-featured reactive implementation of the Sash data structure using Svelte 5 runes.
 * Each ReactiveSash represents either a pane (leaf node) or a split container (parent node)
 * in the binary tree layout system.
 *
 * **Reactive Properties**:
 * - Dimensions (_left, _top, _width, _height) as `$state` - Auto-propagate to children
 * - Children array as `$state` - Triggers updates when tree structure changes
 * - domNode as `$state` - Reactive DOM reference for pane rendering
 * - store as `$state` - Arbitrary properties (content, title, tabs, etc.)
 *
 * **Derived Accessors**:
 * - leftChild, rightChild, topChild, bottomChild - Auto-computed from children array
 *
 * **Key Design Decisions**:
 * 1. Setters trigger immediate propagation (synchronous, predictable behavior)
 * 2. `$state` enables automatic reactivity for UI consumers
 * 3. Getters for child accessors (derived from children array)
 * 4. Plain methods for expensive operations (calcMinWidth/Height)
 * 5. Full support for 'classic' and 'natural' resize strategies
 * 6. Comprehensive minimum size constraint enforcement
 *
 * @example
 * ```typescript
 * // Create a root sash
 * const root = new ReactiveSash({
 *   position: Position.Root,
 *   width: 800,
 *   height: 600
 * });
 *
 * // Split horizontally
 * root.split({ position: Position.Right });
 *
 * // Resize triggers automatic propagation
 * root.width = 1000; // Children update proportionally
 * ```
 */
export class ReactiveSash {
	// ==========================================
	// REACTIVE STATE
	// ==========================================

	/**
	 * Private reactive dimension properties
	 * These use $state to enable automatic reactivity
	 */
	private _left = $state<number>(0);
	private _top = $state<number>(0);
	private _width = $state<number>(150);
	private _height = $state<number>(150);

	/**
	 * Reactive children array
	 * Automatically triggers updates when children added/removed
	 */
	children = $state<ReactiveSash[]>([]);

	/**
	 * Reactive DOM reference
	 * May update when pane is rendered
	 */
	domNode = $state<HTMLElement | null>(null);

	/**
	 * Reactive store for arbitrary properties
	 * Used for content, title, tabs, actions, etc.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Store holds arbitrary user-defined data
	store = $state<Record<string, any>>({});

	// ==========================================
	// IMMUTABLE PROPERTIES
	// ==========================================

	/**
	 * Unique identifier (immutable after construction)
	 */
	readonly id: string;

	/**
	 * Position relative to parent (immutable after construction)
	 * One of: 'root', 'top', 'right', 'bottom', 'left'
	 */
	readonly position: string;

	/**
	 * Parent sash reference (immutable after construction)
	 */
	readonly parent: ReactiveSash | null;

	// ==========================================
	// CONFIGURATION PROPERTIES
	// ==========================================

	/**
	 * Minimum width constraint
	 * Used during resize to prevent shrinking below this value
	 */
	minWidth: number;

	/**
	 * Minimum height constraint
	 * Used during resize to prevent shrinking below this value
	 */
	minHeight: number;

	/**
	 * Resize strategy
	 * - 'classic': Proportional distribution to both children
	 * - 'natural': Only one child resizes (based on position)
	 */
	resizeStrategy: 'classic' | 'natural';

	// ==========================================
	// DERIVED CHILD ACCESSORS
	// ==========================================

	/**
	 * Left child accessor (derived from children array)
	 * Auto-updates when children array changes
	 */
	get leftChild(): ReactiveSash | undefined {
		return this.children.find((c) => c.position === Position.Left);
	}

	/**
	 * Right child accessor (derived from children array)
	 */
	get rightChild(): ReactiveSash | undefined {
		return this.children.find((c) => c.position === Position.Right);
	}

	/**
	 * Top child accessor (derived from children array)
	 */
	get topChild(): ReactiveSash | undefined {
		return this.children.find((c) => c.position === Position.Top);
	}

	/**
	 * Bottom child accessor (derived from children array)
	 */
	get bottomChild(): ReactiveSash | undefined {
		return this.children.find((c) => c.position === Position.Bottom);
	}

	// ==========================================
	// CONSTRUCTOR
	// ==========================================

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
	}: SashConstructorParams) {
		// Validate required position
		if (!position) {
			throw BwinErrors.sashPositionRequired();
		}

		// Initialize immutable properties
		this.id = id ?? genId();
		this.position = position;
		this.parent = parent;

		// Initialize reactive dimension state
		this._left = left;
		this._top = top;
		this._width = width;
		this._height = height;

		// Initialize configuration
		this.minWidth = minWidth;
		this.minHeight = minHeight;
		this.resizeStrategy = resizeStrategy;

		// Initialize reactive DOM/store
		this.domNode = domNode;
		this.store = store;
	}

	// ==========================================
	// REACTIVE DIMENSION GETTERS/SETTERS
	// ==========================================

	/**
	 * Get left position
	 */
	get left(): number {
		return this._left;
	}

	/**
	 * Set left position with propagation to children
	 *
	 * When left changes, all children shift by the same distance.
	 * This maintains the relative positions of the entire subtree.
	 */
	set left(value: number) {
		const dist = value - this._left;
		this._left = value; // Triggers reactivity

		const leftChild = this.leftChild;
		const rightChild = this.rightChild;
		const topChild = this.topChild;
		const bottomChild = this.bottomChild;

		if (leftChild && rightChild) {
			leftChild.left += dist;
			rightChild.left += dist;
		}

		if (topChild && bottomChild) {
			topChild.left += dist;
			bottomChild.left += dist;
		}
	}

	/**
	 * Get top position
	 */
	get top(): number {
		return this._top;
	}

	/**
	 * Set top position with propagation to children
	 *
	 * When top changes, all children shift by the same distance.
	 * This maintains the relative positions of the entire subtree.
	 */
	set top(value: number) {
		const dist = value - this._top;
		this._top = value; // Triggers reactivity

		const leftChild = this.leftChild;
		const rightChild = this.rightChild;
		const topChild = this.topChild;
		const bottomChild = this.bottomChild;

		if (topChild && bottomChild) {
			topChild.top += dist;
			bottomChild.top += dist;
		}

		if (leftChild && rightChild) {
			leftChild.top += dist;
			rightChild.top += dist;
		}
	}

	/**
	 * Get width
	 */
	get width(): number {
		return this._width;
	}

	/**
	 * Set width with propagation to children
	 *
	 * Complex logic:
	 * 1. For left/right splits: Distributes width proportionally (or naturally)
	 * 2. For top/bottom splits: Passes width down unchanged
	 * 3. Respects minimum width constraints
	 */
	set width(value: number) {
		const dist = value - this._width;
		this._width = value; // Triggers reactivity

		const leftChild = this.leftChild;
		const rightChild = this.rightChild;
		const topChild = this.topChild;
		const bottomChild = this.bottomChild;

		if (leftChild && rightChild) {
			// Horizontal split: Distribute width based on resize strategy
			const totalWidth = leftChild.width + rightChild.width;
			const leftDist = dist * (leftChild.width / totalWidth);

			const newTotalWidth = totalWidth + dist;

			let newLeftChildWidth: number;
			let newRightChildWidth: number;
			let newRightChildLeft: number;

			// Apply resize strategy
			if (this.resizeStrategy === 'natural' && this.position === Position.Left) {
				// Natural left: Keep left child same size, adjust right child
				newLeftChildWidth = leftChild.width;
				newRightChildWidth = rightChild.width + dist;
				newRightChildLeft = rightChild.left;
			} else if (this.resizeStrategy === 'natural' && this.position === Position.Right) {
				// Natural right: Keep right child same size, adjust left child
				newLeftChildWidth = leftChild.width + dist;
				newRightChildWidth = rightChild.width;
				newRightChildLeft = leftChild.left + newLeftChildWidth;
			} else {
				// Classic: Distribute proportionally
				newLeftChildWidth = leftChild.width + leftDist;
				newRightChildWidth = newTotalWidth - newLeftChildWidth;
				newRightChildLeft = rightChild.left + leftDist;
			}

			// Apply minimum width constraints when shrinking
			if (dist < 0) {
				const leftChildMinWidth = leftChild.calcMinWidth();
				const rightChildMinWidth = rightChild.calcMinWidth();

				if (newLeftChildWidth < leftChildMinWidth && newRightChildWidth > rightChildMinWidth) {
					// Left child would be too small, keep it at current width
					newLeftChildWidth = leftChild.width;
					newRightChildWidth = newTotalWidth - newLeftChildWidth;
					newRightChildLeft = leftChild.left + newLeftChildWidth;
				} else if (
					newRightChildWidth < rightChildMinWidth &&
					newLeftChildWidth > leftChildMinWidth
				) {
					// Right child would be too small, keep it at current width
					newRightChildWidth = rightChild.width;
					newLeftChildWidth = newTotalWidth - newRightChildWidth;
					newRightChildLeft = leftChild.left + newLeftChildWidth;
				}
			}

			// Apply changes
			leftChild.width = newLeftChildWidth;
			rightChild.width = newRightChildWidth;
			rightChild.left = newRightChildLeft;
		}

		if (topChild && bottomChild) {
			// Vertical split: Pass width down unchanged
			topChild.width = this._width;
			bottomChild.width = this._width;
		}
	}

	/**
	 * Get height
	 */
	get height(): number {
		return this._height;
	}

	/**
	 * Set height with propagation to children
	 *
	 * Complex logic:
	 * 1. For top/bottom splits: Distributes height proportionally (or naturally)
	 * 2. For left/right splits: Passes height down unchanged
	 * 3. Respects minimum height constraints
	 */
	set height(value: number) {
		const dist = value - this._height;
		this._height = value; // Triggers reactivity

		const leftChild = this.leftChild;
		const rightChild = this.rightChild;
		const topChild = this.topChild;
		const bottomChild = this.bottomChild;

		if (topChild && bottomChild) {
			// Vertical split: Distribute height based on resize strategy
			const totalHeight = topChild.height + bottomChild.height;
			const topDist = dist * (topChild.height / totalHeight);

			const newTotalHeight = totalHeight + dist;

			let newTopChildHeight: number;
			let newBottomChildHeight: number;
			let newBottomChildTop: number;

			// Apply resize strategy
			if (this.resizeStrategy === 'natural' && this.position === Position.Top) {
				// Natural top: Keep top child same size, adjust bottom child
				newTopChildHeight = topChild.height;
				newBottomChildHeight = bottomChild.height + dist;
				newBottomChildTop = bottomChild.top;
			} else if (this.resizeStrategy === 'natural' && this.position === Position.Bottom) {
				// Natural bottom: Keep bottom child same size, adjust top child
				newTopChildHeight = topChild.height + dist;
				newBottomChildHeight = bottomChild.height;
				newBottomChildTop = topChild.top + newTopChildHeight;
			} else {
				// Classic: Distribute proportionally
				newTopChildHeight = topChild.height + topDist;
				newBottomChildHeight = newTotalHeight - newTopChildHeight;
				newBottomChildTop = bottomChild.top + topDist;
			}

			// Apply minimum height constraints when shrinking
			if (dist < 0) {
				const topChildMinHeight = topChild.calcMinHeight();
				const bottomChildMinHeight = bottomChild.calcMinHeight();

				if (newTopChildHeight < topChildMinHeight && newBottomChildHeight > bottomChildMinHeight) {
					// Top child would be too small, keep it at current height
					newTopChildHeight = topChild.height;
					newBottomChildHeight = newTotalHeight - newTopChildHeight;
					newBottomChildTop = topChild.top + newTopChildHeight;
				} else if (
					newBottomChildHeight < bottomChildMinHeight &&
					newTopChildHeight > topChildMinHeight
				) {
					// Bottom child would be too small, keep it at current height
					newBottomChildHeight = bottomChild.height;
					newTopChildHeight = newTotalHeight - newBottomChildHeight;
					newBottomChildTop = topChild.top + newTopChildHeight;
				}
			}

			// Apply changes
			topChild.height = newTopChildHeight;
			bottomChild.height = newBottomChildHeight;
			bottomChild.top = newBottomChildTop;
		}

		if (leftChild && rightChild) {
			// Horizontal split: Pass height down unchanged
			leftChild.height = this._height;
			rightChild.height = this._height;
		}
	}

	// ==========================================
	// MINIMUM SIZE CALCULATIONS
	// ==========================================

	/**
	 * Calculate the minimum width based on children's minimum widths
	 *
	 * For leaf nodes, returns this sash's minWidth.
	 * For split nodes:
	 * - Horizontal splits (left/right): Returns sum of children's min widths
	 * - Vertical splits (top/bottom): Returns max of children's min widths
	 *
	 * Always returns at least this sash's own minWidth.
	 *
	 * @returns The minimum width this sash can be resized to
	 */
	calcMinWidth(): number {
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
	 * For leaf nodes, returns this sash's minHeight.
	 * For split nodes:
	 * - Vertical splits (top/bottom): Returns sum of children's min heights
	 * - Horizontal splits (left/right): Returns max of children's min heights
	 *
	 * Always returns at least this sash's own minHeight.
	 *
	 * @returns The minimum height this sash can be resized to
	 */
	calcMinHeight(): number {
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
	 * Split this sash into two children
	 *
	 * Creates two child sashes and distributes dimensions according to percent parameter.
	 * Default is 50/50 split if percent is not provided.
	 *
	 * @param options - Split configuration
	 * @param options.position - Where to place the new pane ('right', 'left', 'top', 'bottom')
	 * @param options.percent - Percentage (0-1) for first child size (default: 0.5)
	 */
	split({ position, percent = 0.5 }: { position: string; percent?: number }): void {
		// Create two children
		let child1: ReactiveSash;
		let child2: ReactiveSash;

		if (position === Position.Right || position === Position.Left) {
			// Horizontal split
			const firstWidth = this._width * percent;
			const secondWidth = this._width - firstWidth;

			child1 = new ReactiveSash({
				position: Position.Left,
				left: this._left,
				top: this._top,
				width: firstWidth,
				height: this._height,
				parent: this,
				resizeStrategy: this.resizeStrategy
			});

			child2 = new ReactiveSash({
				position: Position.Right,
				left: this._left + firstWidth,
				top: this._top,
				width: secondWidth,
				height: this._height,
				parent: this,
				resizeStrategy: this.resizeStrategy
			});
		} else {
			// Vertical split
			const firstHeight = this._height * percent;
			const secondHeight = this._height - firstHeight;

			child1 = new ReactiveSash({
				position: Position.Top,
				left: this._left,
				top: this._top,
				width: this._width,
				height: firstHeight,
				parent: this,
				resizeStrategy: this.resizeStrategy
			});

			child2 = new ReactiveSash({
				position: Position.Bottom,
				left: this._left,
				top: this._top + firstHeight,
				width: this._width,
				height: secondHeight,
				parent: this,
				resizeStrategy: this.resizeStrategy
			});
		}

		this.children.push(child1, child2);
	}

	// ==========================================
	// BASIC HELPER METHODS
	// ==========================================

	/**
	 * Check if this is a leaf node (no children)
	 */
	isLeaf(): boolean {
		return this.children.length === 0;
	}

	/**
	 * Check if this is a split node (has children)
	 */
	isSplit(): boolean {
		return this.children.length > 0;
	}

	/**
	 * Get all children in fixed order: [top, right, bottom, left]
	 */
	getChildren(): [
		ReactiveSash | null,
		ReactiveSash | null,
		ReactiveSash | null,
		ReactiveSash | null
	] {
		return [
			this.topChild ?? null,
			this.rightChild ?? null,
			this.bottomChild ?? null,
			this.leftChild ?? null
		];
	}

	/**
	 * Add a child sash
	 */
	addChild(sash: ReactiveSash): void {
		if (this.children.length >= 2) {
			throw BwinErrors.maxChildrenExceeded();
		}

		this.children.push(sash);
	}

	// ==========================================
	// SPLIT TYPE CHECKS
	// ==========================================

	/**
	 * Check if this node has left/right children
	 *
	 * @returns True if this node has at least one left or right child
	 */
	isLeftRightSplit(): boolean {
		return this.children.some(
			(child) => child.position === Position.Left || child.position === Position.Right
		);
	}

	/**
	 * Check if this node has top/bottom children
	 *
	 * @returns True if this node has at least one top or bottom child
	 */
	isTopBottomSplit(): boolean {
		return this.children.some(
			(child) => child.position === Position.Top || child.position === Position.Bottom
		);
	}

	// ==========================================
	// TREE TRAVERSAL METHODS
	// ==========================================

	/**
	 * Walk the tree and call the callback on each node (depth-first, post-order)
	 *
	 * Post-order means children are visited before their parents. This is useful
	 * for operations that need to process leaf nodes first, then work up the tree.
	 *
	 * @param callback - Function to call on each node
	 *
	 * @example
	 * ```typescript
	 * root.walk((sash) => {
	 *   console.log(`${sash.id}: ${sash.width}x${sash.height}`);
	 * });
	 * ```
	 */
	walk(callback: (sash: ReactiveSash) => void): void {
		// Visit children first (depth-first)
		this.children.forEach((child) => child.walk(callback));

		// Visit this node last (post-order)
		callback(this);
	}

	/**
	 * Get all leaf descendants (nodes with no children)
	 *
	 * Uses walk() to traverse the tree and collect all leaf nodes.
	 * Leaf nodes represent actual panes in the UI.
	 *
	 * @returns Array of leaf sashes
	 *
	 * @example
	 * ```typescript
	 * const panes = root.getAllLeafDescendants();
	 * console.log(`Total panes: ${panes.length}`);
	 * ```
	 */
	getAllLeafDescendants(): ReactiveSash[] {
		const leafDescendants: ReactiveSash[] = [];

		this.walk((node) => {
			if (node.children.length === 0) {
				leafDescendants.push(node);
			}
		});

		return leafDescendants;
	}

	// ==========================================
	// ID MANAGEMENT METHODS
	// ==========================================

	/**
	 * Get self or descendant by ID
	 *
	 * Searches the tree starting from this node for a sash with the given ID.
	 * Returns the first match found (using depth-first search).
	 *
	 * @param id - The ID to search for
	 * @returns The found sash or null if not found
	 *
	 * @example
	 * ```typescript
	 * const editorPane = root.getById('editor-pane-1');
	 * if (editorPane) {
	 *   editorPane.width = 500;
	 * }
	 * ```
	 */
	getById(id: string): ReactiveSash | null {
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
	 * Useful for rearranging panes while maintaining their visual positions.
	 * Both sashes must exist in the tree.
	 *
	 * @param id1 - First ID
	 * @param id2 - Second ID
	 * @throws {Error} If either sash is not found
	 *
	 * @example
	 * ```typescript
	 * root.swapIds('pane-1', 'pane-2');
	 * ```
	 */
	swapIds(id1: string, id2: string): void {
		const sash1 = this.getById(id1);
		const sash2 = this.getById(id2);

		if (!sash1 || !sash2) {
			throw BwinErrors.sashNotFoundWhenSwapping();
		}

		// Swap IDs using a temporary variable
		const tempId = sash1.id;
		// @ts-expect-error - id is readonly but we need to swap it
		sash1.id = sash2.id;
		// @ts-expect-error - id is readonly but we need to swap it
		sash2.id = tempId;
	}

	/**
	 * Get all IDs of self and descendants
	 *
	 * Returns an array of all sash IDs in the tree, in depth-first order.
	 *
	 * @returns Array of all IDs
	 *
	 * @example
	 * ```typescript
	 * const allIds = root.getAllIds();
	 * console.log(`Total nodes: ${allIds.length}`);
	 * ```
	 */
	getAllIds(): string[] {
		const ids = [this.id];

		for (const child of this.children) {
			ids.push(...child.getAllIds());
		}

		return ids;
	}

	// ==========================================
	// PARENT-CHILD RELATIONSHIP METHODS
	// ==========================================

	/**
	 * Get the parent of a descendant by its ID
	 *
	 * Searches the tree for a sash with the given ID and returns its parent.
	 * Returns null if the ID is not found or if it's this node's ID.
	 *
	 * @param descendantId - The ID of the descendant
	 * @returns The parent sash or null
	 *
	 * @example
	 * ```typescript
	 * const parent = root.getDescendantParentById('child-pane-1');
	 * if (parent) {
	 *   console.log(`Parent of child-pane-1 is ${parent.id}`);
	 * }
	 * ```
	 */
	getDescendantParentById(descendantId: string): ReactiveSash | null {
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
	 * Returns the other child of this sash (since sashes have at most 2 children).
	 * Returns undefined if the child is not found or has no sibling.
	 *
	 * @param childId - The ID of the child
	 * @returns The sibling sash or undefined
	 *
	 * @example
	 * ```typescript
	 * const sibling = parent.getChildSiblingById('left-pane');
	 * if (sibling) {
	 *   console.log(`Sibling is ${sibling.id}`);
	 * }
	 * ```
	 */
	getChildSiblingById(childId: string): ReactiveSash | undefined {
		return this.children.find((child) => child.id !== childId);
	}
}
