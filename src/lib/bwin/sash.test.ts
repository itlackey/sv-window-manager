import { describe, it, expect, beforeEach } from 'vitest';
import { Sash, DEFAULTS } from './sash.js';
import { Position } from './position.js';
import { BwinErrors } from './errors.js';

describe('Sash class', () => {
	describe('constructor', () => {
		it('creates a sash with default values', () => {
			const sash = new Sash({ position: Position.Root });

			expect(sash.position).toBe(Position.Root);
			expect(sash.top).toBe(DEFAULTS.top);
			expect(sash.left).toBe(DEFAULTS.left);
			expect(sash.width).toBe(DEFAULTS.width);
			expect(sash.height).toBe(DEFAULTS.height);
			expect(sash.minWidth).toBe(DEFAULTS.minWidth);
			expect(sash.minHeight).toBe(DEFAULTS.minHeight);
			expect(sash.resizeStrategy).toBe(DEFAULTS.resizeStrategy);
			expect(sash.children).toEqual([]);
			expect(sash.parent).toBeNull();
			expect(sash.domNode).toBeNull();
			expect(sash.store).toEqual({});
		});

		it('creates a sash with custom values', () => {
			const customStore = { title: 'Test Pane' };
			const parentSash = new Sash({ position: Position.Root });

			const sash = new Sash({
				position: Position.Left,
				left: 100,
				top: 50,
				width: 300,
				height: 400,
				minWidth: 100,
				minHeight: 100,
				resizeStrategy: 'natural',
				parent: parentSash,
				store: customStore,
				id: 'test-id'
			});

			expect(sash.position).toBe(Position.Left);
			expect(sash.left).toBe(100);
			expect(sash.top).toBe(50);
			expect(sash.width).toBe(300);
			expect(sash.height).toBe(400);
			expect(sash.minWidth).toBe(100);
			expect(sash.minHeight).toBe(100);
			expect(sash.resizeStrategy).toBe('natural');
			expect(sash.parent).toBe(parentSash);
			expect(sash.store).toBe(customStore);
			expect(sash.id).toBe('test-id');
		});

		it('generates a unique ID when not provided', () => {
			const sash1 = new Sash({ position: Position.Root });
			const sash2 = new Sash({ position: Position.Root });

			expect(sash1.id).toBeDefined();
			expect(sash2.id).toBeDefined();
			expect(sash1.id).not.toBe(sash2.id);
			expect(typeof sash1.id).toBe('string');
		});

		it('throws error when position is not provided', () => {
			expect(() => new Sash({})).toThrow();
		});

		it('throws BwinError when position is missing', () => {
			expect(() => new Sash({})).toThrow(BwinErrors.sashPositionRequired().message);
		});
	});

	describe('tree structure methods', () => {
		describe('isLeaf', () => {
			it('returns true when sash has no children', () => {
				const sash = new Sash({ position: Position.Root });
				expect(sash.isLeaf()).toBe(true);
			});

			it('returns false when sash has children', () => {
				const parent = new Sash({ position: Position.Root });
				const child = new Sash({ position: Position.Left, parent });
				parent.addChild(child);

				expect(parent.isLeaf()).toBe(false);
			});
		});

		describe('isSplit', () => {
			it('returns false when sash has no children', () => {
				const sash = new Sash({ position: Position.Root });
				expect(sash.isSplit()).toBe(false);
			});

			it('returns true when sash has children', () => {
				const parent = new Sash({ position: Position.Root });
				const child = new Sash({ position: Position.Left, parent });
				parent.addChild(child);

				expect(parent.isSplit()).toBe(true);
			});
		});

		describe('isLeftRightSplit', () => {
			it('returns true when sash has left child', () => {
				const parent = new Sash({ position: Position.Root });
				const leftChild = new Sash({ position: Position.Left, parent });
				parent.addChild(leftChild);

				expect(parent.isLeftRightSplit()).toBe(true);
			});

			it('returns true when sash has right child', () => {
				const parent = new Sash({ position: Position.Root });
				const rightChild = new Sash({ position: Position.Right, parent });
				parent.addChild(rightChild);

				expect(parent.isLeftRightSplit()).toBe(true);
			});

			it('returns false when sash has only top/bottom children', () => {
				const parent = new Sash({ position: Position.Root });
				const topChild = new Sash({ position: Position.Top, parent });
				parent.addChild(topChild);

				expect(parent.isLeftRightSplit()).toBe(false);
			});

			it('returns false when sash has no children', () => {
				const sash = new Sash({ position: Position.Root });
				expect(sash.isLeftRightSplit()).toBe(false);
			});
		});

		describe('isTopBottomSplit', () => {
			it('returns true when sash has top child', () => {
				const parent = new Sash({ position: Position.Root });
				const topChild = new Sash({ position: Position.Top, parent });
				parent.addChild(topChild);

				expect(parent.isTopBottomSplit()).toBe(true);
			});

			it('returns true when sash has bottom child', () => {
				const parent = new Sash({ position: Position.Root });
				const bottomChild = new Sash({ position: Position.Bottom, parent });
				parent.addChild(bottomChild);

				expect(parent.isTopBottomSplit()).toBe(true);
			});

			it('returns false when sash has only left/right children', () => {
				const parent = new Sash({ position: Position.Root });
				const leftChild = new Sash({ position: Position.Left, parent });
				parent.addChild(leftChild);

				expect(parent.isTopBottomSplit()).toBe(false);
			});

			it('returns false when sash has no children', () => {
				const sash = new Sash({ position: Position.Root });
				expect(sash.isTopBottomSplit()).toBe(false);
			});
		});

		describe('child getters', () => {
			let parent;
			let leftChild, rightChild, topChild, bottomChild;

			beforeEach(() => {
				parent = new Sash({ position: Position.Root, width: 800, height: 600 });
			});

			it('returns left child correctly', () => {
				leftChild = new Sash({ position: Position.Left, parent });
				parent.addChild(leftChild);

				expect(parent.leftChild).toBe(leftChild);
			});

			it('returns right child correctly', () => {
				rightChild = new Sash({ position: Position.Right, parent });
				parent.addChild(rightChild);

				expect(parent.rightChild).toBe(rightChild);
			});

			it('returns top child correctly', () => {
				topChild = new Sash({ position: Position.Top, parent });
				parent.addChild(topChild);

				expect(parent.topChild).toBe(topChild);
			});

			it('returns bottom child correctly', () => {
				bottomChild = new Sash({ position: Position.Bottom, parent });
				parent.addChild(bottomChild);

				expect(parent.bottomChild).toBe(bottomChild);
			});

			it('returns undefined when child does not exist', () => {
				expect(parent.leftChild).toBeUndefined();
				expect(parent.rightChild).toBeUndefined();
				expect(parent.topChild).toBeUndefined();
				expect(parent.bottomChild).toBeUndefined();
			});
		});

		describe('getChildren', () => {
			it('returns array in order [top, right, bottom, left]', () => {
				const parent = new Sash({ position: Position.Root });
				const leftChild = new Sash({ position: Position.Left, parent });
				const rightChild = new Sash({ position: Position.Right, parent });

				parent.addChild(leftChild);
				parent.addChild(rightChild);

				const [top, right, bottom, left] = parent.getChildren();

				expect(top).toBeNull();
				expect(right).toBe(rightChild);
				expect(bottom).toBeNull();
				expect(left).toBe(leftChild);
			});

			it('returns nulls for missing children', () => {
				const parent = new Sash({ position: Position.Root });
				const [top, right, bottom, left] = parent.getChildren();

				expect(top).toBeNull();
				expect(right).toBeNull();
				expect(bottom).toBeNull();
				expect(left).toBeNull();
			});
		});

		describe('addChild', () => {
			it('adds a child successfully', () => {
				const parent = new Sash({ position: Position.Root });
				const child = new Sash({ position: Position.Left, parent });

				parent.addChild(child);

				expect(parent.children).toContain(child);
				expect(parent.children.length).toBe(1);
			});

			it('allows adding up to 2 children', () => {
				const parent = new Sash({ position: Position.Root });
				const child1 = new Sash({ position: Position.Left, parent });
				const child2 = new Sash({ position: Position.Right, parent });

				parent.addChild(child1);
				parent.addChild(child2);

				expect(parent.children.length).toBe(2);
				expect(parent.children).toContain(child1);
				expect(parent.children).toContain(child2);
			});

			it('throws error when adding more than 2 children', () => {
				const parent = new Sash({ position: Position.Root });
				const child1 = new Sash({ position: Position.Left, parent });
				const child2 = new Sash({ position: Position.Right, parent });
				const child3 = new Sash({ position: Position.Top, parent });

				parent.addChild(child1);
				parent.addChild(child2);

				expect(() => parent.addChild(child3)).toThrow(BwinErrors.maxChildrenExceeded().message);
			});
		});
	});

	describe('tree traversal methods', () => {
		describe('walk', () => {
			it('calls callback for a single node', () => {
				const root = new Sash({ position: Position.Root });
				const visited = [];

				root.walk((sash) => visited.push(sash.id));

				expect(visited.length).toBe(1);
				expect(visited[0]).toBe(root.id);
			});

			it('calls callback in depth-first post-order', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const right = new Sash({ position: Position.Right, parent: root, id: 'right' });

				root.addChild(left);
				root.addChild(right);

				const visited = [];
				root.walk((sash) => visited.push(sash.id));

				// Post-order: children first, then parent
				expect(visited).toEqual(['left', 'right', 'root']);
			});

			it('handles deep nesting correctly', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const right = new Sash({ position: Position.Right, parent: root, id: 'right' });
				const leftLeft = new Sash({ position: Position.Left, parent: left, id: 'left-left' });
				const leftRight = new Sash({ position: Position.Right, parent: left, id: 'left-right' });

				root.addChild(left);
				root.addChild(right);
				left.addChild(leftLeft);
				left.addChild(leftRight);

				const visited = [];
				root.walk((sash) => visited.push(sash.id));

				// Post-order traversal
				expect(visited).toEqual(['left-left', 'left-right', 'left', 'right', 'root']);
			});
		});

		describe('getAllLeafDescendants', () => {
			it('returns empty array for leaf node', () => {
				const root = new Sash({ position: Position.Root });
				const leaves = root.getAllLeafDescendants();

				expect(leaves.length).toBe(1);
				expect(leaves[0]).toBe(root);
			});

			it('returns all leaf nodes', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const right = new Sash({ position: Position.Right, parent: root, id: 'right' });

				root.addChild(left);
				root.addChild(right);

				const leaves = root.getAllLeafDescendants();

				expect(leaves.length).toBe(2);
				expect(leaves).toContain(left);
				expect(leaves).toContain(right);
			});

			it('only returns leaf nodes from deep tree', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const right = new Sash({ position: Position.Right, parent: root, id: 'right' });
				const leftLeft = new Sash({ position: Position.Left, parent: left, id: 'left-left' });
				const leftRight = new Sash({ position: Position.Right, parent: left, id: 'left-right' });

				root.addChild(left);
				root.addChild(right);
				left.addChild(leftLeft);
				left.addChild(leftRight);

				const leaves = root.getAllLeafDescendants();

				expect(leaves.length).toBe(3);
				expect(leaves).toContain(leftLeft);
				expect(leaves).toContain(leftRight);
				expect(leaves).toContain(right);
				expect(leaves).not.toContain(root);
				expect(leaves).not.toContain(left);
			});
		});
	});

	describe('ID management', () => {
		describe('getById', () => {
			it('finds self by ID', () => {
				const sash = new Sash({ position: Position.Root, id: 'test-id' });
				const found = sash.getById('test-id');

				expect(found).toBe(sash);
			});

			it('finds child by ID', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child = new Sash({ position: Position.Left, parent: root, id: 'child' });
				root.addChild(child);

				const found = root.getById('child');

				expect(found).toBe(child);
			});

			it('finds deep descendant by ID', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const leftLeft = new Sash({ position: Position.Left, parent: left, id: 'left-left' });

				root.addChild(left);
				left.addChild(leftLeft);

				const found = root.getById('left-left');

				expect(found).toBe(leftLeft);
			});

			it('returns null when ID not found', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const found = root.getById('nonexistent');

				expect(found).toBeNull();
			});
		});

		describe('getAllIds', () => {
			it('returns only self ID when no children', () => {
				const sash = new Sash({ position: Position.Root, id: 'test-id' });
				const ids = sash.getAllIds();

				expect(ids).toEqual(['test-id']);
			});

			it('returns all IDs from tree', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const right = new Sash({ position: Position.Right, parent: root, id: 'right' });

				root.addChild(left);
				root.addChild(right);

				const ids = root.getAllIds();

				expect(ids).toContain('root');
				expect(ids).toContain('left');
				expect(ids).toContain('right');
				expect(ids.length).toBe(3);
			});

			it('returns all IDs from deep tree', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const leftLeft = new Sash({ position: Position.Left, parent: left, id: 'left-left' });

				root.addChild(left);
				left.addChild(leftLeft);

				const ids = root.getAllIds();

				expect(ids).toEqual(['root', 'left', 'left-left']);
			});
		});

		describe('swapIds', () => {
			it('swaps IDs of two sashes', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child1 = new Sash({ position: Position.Left, parent: root, id: 'child1' });
				const child2 = new Sash({ position: Position.Right, parent: root, id: 'child2' });

				root.addChild(child1);
				root.addChild(child2);

				root.swapIds('child1', 'child2');

				expect(child1.id).toBe('child2');
				expect(child2.id).toBe('child1');
			});

			it('throws error when first sash not found', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child = new Sash({ position: Position.Left, parent: root, id: 'child' });
				root.addChild(child);

				expect(() => root.swapIds('nonexistent', 'child')).toThrow(
					BwinErrors.sashNotFoundWhenSwapping().message
				);
			});

			it('throws error when second sash not found', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child = new Sash({ position: Position.Left, parent: root, id: 'child' });
				root.addChild(child);

				expect(() => root.swapIds('child', 'nonexistent')).toThrow(
					BwinErrors.sashNotFoundWhenSwapping().message
				);
			});
		});
	});

	describe('parent-child relationship methods', () => {
		describe('getDescendantParentById', () => {
			it('returns parent of direct child', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child = new Sash({ position: Position.Left, parent: root, id: 'child' });
				root.addChild(child);

				const parent = root.getDescendantParentById('child');

				expect(parent).toBe(root);
			});

			it('returns parent of deep descendant', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const left = new Sash({ position: Position.Left, parent: root, id: 'left' });
				const leftLeft = new Sash({ position: Position.Left, parent: left, id: 'left-left' });

				root.addChild(left);
				left.addChild(leftLeft);

				const parent = root.getDescendantParentById('left-left');

				expect(parent).toBe(left);
			});

			it('returns null when ID not found', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const parent = root.getDescendantParentById('nonexistent');

				expect(parent).toBeNull();
			});

			it('returns null for self ID', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const parent = root.getDescendantParentById('root');

				expect(parent).toBeNull();
			});
		});

		describe('getChildSiblingById', () => {
			it('returns the sibling of a child', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child1 = new Sash({ position: Position.Left, parent: root, id: 'child1' });
				const child2 = new Sash({ position: Position.Right, parent: root, id: 'child2' });

				root.addChild(child1);
				root.addChild(child2);

				const sibling = root.getChildSiblingById('child1');

				expect(sibling).toBe(child2);
			});

			it('returns undefined when no sibling exists', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const child = new Sash({ position: Position.Left, parent: root, id: 'child' });

				root.addChild(child);

				const sibling = root.getChildSiblingById('child');

				expect(sibling).toBeUndefined();
			});

			it('returns undefined when child not found', () => {
				const root = new Sash({ position: Position.Root, id: 'root' });
				const sibling = root.getChildSiblingById('nonexistent');

				expect(sibling).toBeUndefined();
			});
		});
	});

	describe('minimum size calculations', () => {
		describe('calcMinWidth', () => {
			it('returns minWidth for leaf node', () => {
				const sash = new Sash({ position: Position.Root, minWidth: 100 });
				expect(sash.calcMinWidth()).toBe(100);
			});

			it('returns sum of left/right children minWidths', () => {
				const root = new Sash({ position: Position.Root, minWidth: 50 });
				const left = new Sash({ position: Position.Left, parent: root, minWidth: 100 });
				const right = new Sash({ position: Position.Right, parent: root, minWidth: 150 });

				root.addChild(left);
				root.addChild(right);

				// Sum of children (100 + 150 = 250) is greater than parent minWidth (50)
				expect(root.calcMinWidth()).toBe(250);
			});

			it('returns max of top/bottom children minWidths', () => {
				const root = new Sash({ position: Position.Root, minWidth: 50 });
				const top = new Sash({ position: Position.Top, parent: root, minWidth: 100 });
				const bottom = new Sash({ position: Position.Bottom, parent: root, minWidth: 150 });

				root.addChild(top);
				root.addChild(bottom);

				// Max of children (150) is greater than parent minWidth (50)
				expect(root.calcMinWidth()).toBe(150);
			});

			it('returns parent minWidth when greater than children', () => {
				const root = new Sash({ position: Position.Root, minWidth: 300 });
				const left = new Sash({ position: Position.Left, parent: root, minWidth: 100 });
				const right = new Sash({ position: Position.Right, parent: root, minWidth: 100 });

				root.addChild(left);
				root.addChild(right);

				// Parent minWidth (300) is greater than sum of children (200)
				expect(root.calcMinWidth()).toBe(300);
			});
		});

		describe('calcMinHeight', () => {
			it('returns minHeight for leaf node', () => {
				const sash = new Sash({ position: Position.Root, minHeight: 100 });
				expect(sash.calcMinHeight()).toBe(100);
			});

			it('returns sum of top/bottom children minHeights', () => {
				const root = new Sash({ position: Position.Root, minHeight: 50 });
				const top = new Sash({ position: Position.Top, parent: root, minHeight: 100 });
				const bottom = new Sash({ position: Position.Bottom, parent: root, minHeight: 150 });

				root.addChild(top);
				root.addChild(bottom);

				// Sum of children (100 + 150 = 250) is greater than parent minHeight (50)
				expect(root.calcMinHeight()).toBe(250);
			});

			it('returns max of left/right children minHeights', () => {
				const root = new Sash({ position: Position.Root, minHeight: 50 });
				const left = new Sash({ position: Position.Left, parent: root, minHeight: 100 });
				const right = new Sash({ position: Position.Right, parent: root, minHeight: 150 });

				root.addChild(left);
				root.addChild(right);

				// Max of children (150) is greater than parent minHeight (50)
				expect(root.calcMinHeight()).toBe(150);
			});

			it('returns parent minHeight when greater than children', () => {
				const root = new Sash({ position: Position.Root, minHeight: 300 });
				const top = new Sash({ position: Position.Top, parent: root, minHeight: 100 });
				const bottom = new Sash({ position: Position.Bottom, parent: root, minHeight: 100 });

				root.addChild(top);
				root.addChild(bottom);

				// Parent minHeight (300) is greater than sum of children (200)
				expect(root.calcMinHeight()).toBe(300);
			});
		});
	});

	describe('position setters and dimension propagation', () => {
		describe('top setter', () => {
			it('updates top position', () => {
				const sash = new Sash({ position: Position.Root, top: 0 });
				sash.top = 50;

				expect(sash.top).toBe(50);
			});

			it('propagates top change to left/right children', () => {
				const root = new Sash({ position: Position.Root, top: 0, width: 800, height: 600 });
				const left = new Sash({
					position: Position.Left,
					parent: root,
					top: 0,
					width: 400,
					height: 600
				});
				const right = new Sash({
					position: Position.Right,
					parent: root,
					top: 0,
					width: 400,
					height: 600
				});

				root.addChild(left);
				root.addChild(right);

				root.top = 100;

				expect(root.top).toBe(100);
				expect(left.top).toBe(100);
				expect(right.top).toBe(100);
			});

			it('propagates top change to top/bottom children', () => {
				const root = new Sash({ position: Position.Root, top: 0, width: 800, height: 600 });
				const top = new Sash({
					position: Position.Top,
					parent: root,
					top: 0,
					width: 800,
					height: 300
				});
				const bottom = new Sash({
					position: Position.Bottom,
					parent: root,
					top: 300,
					width: 800,
					height: 300
				});

				root.addChild(top);
				root.addChild(bottom);

				root.top = 100;

				expect(root.top).toBe(100);
				expect(top.top).toBe(100);
				expect(bottom.top).toBe(400); // 300 + 100
			});
		});

		describe('left setter', () => {
			it('updates left position', () => {
				const sash = new Sash({ position: Position.Root, left: 0 });
				sash.left = 50;

				expect(sash.left).toBe(50);
			});

			it('propagates left change to left/right children', () => {
				const root = new Sash({ position: Position.Root, left: 0, width: 800, height: 600 });
				const left = new Sash({
					position: Position.Left,
					parent: root,
					left: 0,
					width: 400,
					height: 600
				});
				const right = new Sash({
					position: Position.Right,
					parent: root,
					left: 400,
					width: 400,
					height: 600
				});

				root.addChild(left);
				root.addChild(right);

				root.left = 100;

				expect(root.left).toBe(100);
				expect(left.left).toBe(100);
				expect(right.left).toBe(500); // 400 + 100
			});

			it('propagates left change to top/bottom children', () => {
				const root = new Sash({ position: Position.Root, left: 0, width: 800, height: 600 });
				const top = new Sash({
					position: Position.Top,
					parent: root,
					left: 0,
					width: 800,
					height: 300
				});
				const bottom = new Sash({
					position: Position.Bottom,
					parent: root,
					left: 0,
					width: 800,
					height: 300
				});

				root.addChild(top);
				root.addChild(bottom);

				root.left = 100;

				expect(root.left).toBe(100);
				expect(top.left).toBe(100);
				expect(bottom.left).toBe(100);
			});
		});

		describe('width setter', () => {
			it('updates width', () => {
				const sash = new Sash({ position: Position.Root, width: 100 });
				sash.width = 200;

				expect(sash.width).toBe(200);
			});

			it('propagates width change to top/bottom children', () => {
				const root = new Sash({ position: Position.Root, width: 800, height: 600 });
				const top = new Sash({ position: Position.Top, parent: root, width: 800, height: 300 });
				const bottom = new Sash({
					position: Position.Bottom,
					parent: root,
					width: 800,
					height: 300
				});

				root.addChild(top);
				root.addChild(bottom);

				root.width = 1000;

				expect(root.width).toBe(1000);
				expect(top.width).toBe(1000);
				expect(bottom.width).toBe(1000);
			});

			it('distributes width change proportionally to left/right children', () => {
				const root = new Sash({ position: Position.Root, width: 800, height: 600, left: 0 });
				const left = new Sash({
					position: Position.Left,
					parent: root,
					width: 400,
					height: 600,
					left: 0
				});
				const right = new Sash({
					position: Position.Right,
					parent: root,
					width: 400,
					height: 600,
					left: 400
				});

				root.addChild(left);
				root.addChild(right);

				// Increase width by 200 (from 800 to 1000)
				root.width = 1000;

				// Should distribute proportionally: each child gets 100px more
				expect(root.width).toBe(1000);
				expect(left.width).toBe(500);
				expect(right.width).toBe(500);
			});
		});

		describe('height setter', () => {
			it('updates height', () => {
				const sash = new Sash({ position: Position.Root, height: 100 });
				sash.height = 200;

				expect(sash.height).toBe(200);
			});

			it('propagates height change to left/right children', () => {
				const root = new Sash({ position: Position.Root, width: 800, height: 600 });
				const left = new Sash({ position: Position.Left, parent: root, width: 400, height: 600 });
				const right = new Sash({ position: Position.Right, parent: root, width: 400, height: 600 });

				root.addChild(left);
				root.addChild(right);

				root.height = 800;

				expect(root.height).toBe(800);
				expect(left.height).toBe(800);
				expect(right.height).toBe(800);
			});

			it('distributes height change proportionally to top/bottom children', () => {
				const root = new Sash({ position: Position.Root, width: 800, height: 600, top: 0 });
				const top = new Sash({
					position: Position.Top,
					parent: root,
					width: 800,
					height: 300,
					top: 0
				});
				const bottom = new Sash({
					position: Position.Bottom,
					parent: root,
					width: 800,
					height: 300,
					top: 300
				});

				root.addChild(top);
				root.addChild(bottom);

				// Increase height by 200 (from 600 to 800)
				root.height = 800;

				// Should distribute proportionally: each child gets 100px more
				expect(root.height).toBe(800);
				expect(top.height).toBe(400);
				expect(bottom.height).toBe(400);
			});
		});
	});

	describe('resize strategies', () => {
		describe('natural resize strategy - left position', () => {
			it('adjusts only right child width when expanding left sash', () => {
				const root = new Sash({
					position: Position.Root,
					width: 800,
					height: 600,
					left: 0,
					resizeStrategy: 'natural'
				});
				const left = new Sash({
					position: Position.Left,
					parent: root,
					width: 400,
					height: 600,
					left: 0,
					position: Position.Left,
					resizeStrategy: 'natural'
				});
				const right = new Sash({
					position: Position.Right,
					parent: root,
					width: 400,
					height: 600,
					left: 400
				});

				root.addChild(left);
				root.addChild(right);

				// Create a nested split within left sash
				const leftChild = new Sash({
					position: Position.Left,
					parent: left,
					width: 200,
					height: 600,
					left: 0
				});
				const rightChild = new Sash({
					position: Position.Right,
					parent: left,
					width: 200,
					height: 600,
					left: 200
				});
				left.addChild(leftChild);
				left.addChild(rightChild);

				// When left sash expands by 100px with natural resize
				left.width = 500;

				// In natural mode with Left position, left child stays same, right child grows
				expect(leftChild.width).toBe(200);
				expect(rightChild.width).toBe(300);
			});
		});

		describe('natural resize strategy - right position', () => {
			it('adjusts only left child width when expanding right sash', () => {
				const root = new Sash({
					position: Position.Root,
					width: 800,
					height: 600,
					left: 0,
					resizeStrategy: 'natural'
				});
				const left = new Sash({
					position: Position.Left,
					parent: root,
					width: 400,
					height: 600,
					left: 0
				});
				const right = new Sash({
					position: Position.Right,
					parent: root,
					width: 400,
					height: 600,
					left: 400,
					position: Position.Right,
					resizeStrategy: 'natural'
				});

				root.addChild(left);
				root.addChild(right);

				// Create a nested split within right sash
				const leftChild = new Sash({
					position: Position.Left,
					parent: right,
					width: 200,
					height: 600,
					left: 400
				});
				const rightChild = new Sash({
					position: Position.Right,
					parent: right,
					width: 200,
					height: 600,
					left: 600
				});
				right.addChild(leftChild);
				right.addChild(rightChild);

				// When right sash expands by 100px with natural resize
				right.width = 500;

				// In natural mode with Right position, left child grows, right child stays same
				expect(leftChild.width).toBe(300);
				expect(rightChild.width).toBe(200);
			});
		});

		describe('classic resize strategy (default)', () => {
			it('distributes width change proportionally to both children', () => {
				const root = new Sash({ position: Position.Root, width: 800, height: 600, left: 0 });
				const left = new Sash({
					position: Position.Left,
					parent: root,
					width: 400,
					height: 600,
					left: 0
				});
				const right = new Sash({
					position: Position.Right,
					parent: root,
					width: 400,
					height: 600,
					left: 400
				});

				root.addChild(left);
				root.addChild(right);

				// Create a nested split with classic strategy
				const leftChild = new Sash({
					position: Position.Left,
					parent: left,
					width: 200,
					height: 600,
					left: 0
				});
				const rightChild = new Sash({
					position: Position.Right,
					parent: left,
					width: 200,
					height: 600,
					left: 200
				});
				left.addChild(leftChild);
				left.addChild(rightChild);

				// When left sash expands by 100px
				left.width = 500;

				// Both children should grow proportionally (50px each)
				expect(leftChild.width).toBe(250);
				expect(rightChild.width).toBe(250);
			});
		});
	});

	describe('minimum width constraints during resize', () => {
		it('respects minimum width when shrinking left child', () => {
			const root = new Sash({ position: Position.Root, width: 800, height: 600, left: 0 });
			const left = new Sash({
				position: Position.Left,
				parent: root,
				width: 400,
				height: 600,
				left: 0,
				minWidth: 300
			});
			const right = new Sash({
				position: Position.Right,
				parent: root,
				width: 400,
				height: 600,
				left: 400,
				minWidth: 100
			});

			root.addChild(left);
			root.addChild(right);

			// Try to shrink root to 600px (would try to shrink each proportionally by 100px)
			root.width = 600;

			// When shrinking, if new left width would be below minWidth, left stays at current width
			// and right takes all the shrinkage. So left stays 400px, but proportional distribution
			// would make left=300, right=300. Since 300 >= 300 (minWidth), both get proportional.
			expect(left.width).toBe(300);
			expect(right.width).toBe(300);
		});

		it('respects minimum width when shrinking right child', () => {
			const root = new Sash({ position: Position.Root, width: 800, height: 600, left: 0 });
			const left = new Sash({
				position: Position.Left,
				parent: root,
				width: 400,
				height: 600,
				left: 0,
				minWidth: 100
			});
			const right = new Sash({
				position: Position.Right,
				parent: root,
				width: 400,
				height: 600,
				left: 400,
				minWidth: 300
			});

			root.addChild(left);
			root.addChild(right);

			// Try to shrink root to 600px
			root.width = 600;

			// Proportional distribution makes both 300px, which satisfies both minWidths
			expect(left.width).toBe(300);
			expect(right.width).toBe(300);
		});
	});

	describe('minimum height constraints during resize', () => {
		it('respects minimum height when shrinking top child', () => {
			const root = new Sash({ position: Position.Root, width: 800, height: 600, top: 0 });
			const top = new Sash({
				position: Position.Top,
				parent: root,
				width: 800,
				height: 300,
				top: 0,
				minHeight: 200
			});
			const bottom = new Sash({
				position: Position.Bottom,
				parent: root,
				width: 800,
				height: 300,
				top: 300,
				minHeight: 100
			});

			root.addChild(top);
			root.addChild(bottom);

			// Try to shrink root to 400px
			root.height = 400;

			// Proportional distribution makes both 200px, which satisfies both minHeights
			expect(top.height).toBe(200);
			expect(bottom.height).toBe(200);
		});

		it('respects minimum height when shrinking bottom child', () => {
			const root = new Sash({ position: Position.Root, width: 800, height: 600, top: 0 });
			const top = new Sash({
				position: Position.Top,
				parent: root,
				width: 800,
				height: 300,
				top: 0,
				minHeight: 100
			});
			const bottom = new Sash({
				position: Position.Bottom,
				parent: root,
				width: 800,
				height: 300,
				top: 300,
				minHeight: 200
			});

			root.addChild(top);
			root.addChild(bottom);

			// Try to shrink root to 400px
			root.height = 400;

			// Proportional distribution makes both 200px, which satisfies both minHeights
			expect(top.height).toBe(200);
			expect(bottom.height).toBe(200);
		});
	});
});
