import { describe, it, expect } from 'vitest';
import { ReactiveSash } from './sash.svelte.js';
import { Position } from './position.js';

describe('ReactiveSash - Edge Cases', () => {
	describe('Deep Nesting', () => {
		it('handles deeply nested tree (10+ levels)', () => {
			// Create a deeply nested tree
			let current = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			const root = current;

			// Create 15 levels of nesting
			for (let i = 1; i <= 15; i++) {
				const left = new ReactiveSash({
					id: `level-${i}-left`,
					position: Position.Left,
					width: current.width / 2,
					height: current.height,
					parent: current
				});

				const right = new ReactiveSash({
					id: `level-${i}-right`,
					position: Position.Right,
					width: current.width / 2,
					height: current.height,
					parent: current
				});

				current.children.push(left, right);
				current = left; // Continue nesting on left side
			}

			// Verify we can traverse the entire tree
			const allNodes: ReactiveSash[] = [];
			root.walk((sash) => {
				allNodes.push(sash);
			});

			// Should have root + 15 levels * 2 nodes per level = 31 nodes
			expect(allNodes.length).toBeGreaterThan(30);

			// Verify we can find deeply nested node
			const deepNode = root.getById('level-15-right');
			expect(deepNode).toBeDefined();
			expect(deepNode!.id).toBe('level-15-right');
		});

		it('handles deep nesting without stack overflow', () => {
			let current = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 1000,
				height: 1000
			});

			const root = current;

			// Create 100 levels (stress test)
			for (let i = 1; i <= 100; i++) {
				const child = new ReactiveSash({
					id: `level-${i}`,
					position: Position.Left,
					width: current.width,
					height: current.height,
					parent: current
				});

				current.children.push(child);
				current = child;
			}

			// Should not stack overflow
			expect(() => {
				root.walk(() => {});
			}).not.toThrow();

			// Should be able to find the deepest node
			const deepest = root.getById('level-100');
			expect(deepest).toBeDefined();
		});
	});

	describe('Rapid Operations', () => {
		it('handles rapid add/remove operations', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Rapidly add and remove children
			for (let i = 0; i < 100; i++) {
				const child = new ReactiveSash({
					id: `child-${i}`,
					position: i % 2 === 0 ? Position.Left : Position.Right,
					width: root.width / 2,
					height: root.height,
					parent: root
				});

				root.children.push(child);

				// Remove immediately if even
				if (i % 2 === 0) {
					root.children = root.children.filter((c) => c.id !== `child-${i}`);
				}
			}

			// Should have only odd-numbered children left (50 children)
			expect(root.children.length).toBe(50);

			// Verify IDs
			root.children.forEach((child, index) => {
				const expectedId = `child-${index * 2 + 1}`;
				expect(child.id).toBe(expectedId);
			});
		});

		it('handles concurrent modifications during traversal', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Add initial children
			for (let i = 0; i < 10; i++) {
				root.children.push(
					new ReactiveSash({
						id: `child-${i}`,
						position: Position.Left,
						width: 100,
						height: 100,
						parent: root
					})
				);
			}

			// Modify tree during traversal
			const visited: string[] = [];
			root.walk((sash) => {
				visited.push(sash.id);

				// Add a child during traversal (won't be visited in this walk)
				if (sash.id === 'child-5') {
					sash.children.push(
						new ReactiveSash({
							id: 'added-during-walk',
							position: Position.Left,
							width: 50,
							height: 50,
							parent: sash
						})
					);
				}
			});

			// Should have visited original nodes
			expect(visited).toContain('root');
			expect(visited).toContain('child-5');

			// New child exists but wasn't visited in this walk
			const newChild = root.getById('added-during-walk');
			expect(newChild).toBeDefined();
		});
	});

	describe('Boundary Conditions', () => {
		it('handles minimum dimensions correctly', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 10, // Very small
				height: 10,
				minWidth: 50,
				minHeight: 50
			});

			// calcMinWidth/Height should respect constraints
			expect(sash.calcMinWidth()).toBe(50);
			expect(sash.calcMinHeight()).toBe(50);
		});

		it('handles zero dimensions gracefully', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 0,
				height: 0
			});

			expect(sash.width).toBe(0);
			expect(sash.height).toBe(0);

			// Should not crash when calculating minimum sizes
			expect(() => sash.calcMinWidth()).not.toThrow();
			expect(() => sash.calcMinHeight()).not.toThrow();
		});

		it('handles negative positions', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				left: -100,
				top: -200,
				width: 800,
				height: 600
			});

			expect(sash.left).toBe(-100);
			expect(sash.top).toBe(-200);

			// Setters should work with negative values
			sash.left = -50;
			sash.top = -75;

			expect(sash.left).toBe(-50);
			expect(sash.top).toBe(-75);
		});

		it('handles very large dimensions', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 1000000, // 1 million pixels
				height: 1000000
			});

			expect(sash.width).toBe(1000000);
			expect(sash.height).toBe(1000000);

			// Operations should still work
			sash.width = 2000000;
			expect(sash.width).toBe(2000000);
		});
	});

	describe('Tree Structure Edge Cases', () => {
		it('handles single-child parent (invalid BSP, but should not crash)', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			const singleChild = new ReactiveSash({
				id: 'only-child',
				position: Position.Left,
				width: 800,
				height: 600,
				parent: root
			});

			root.children.push(singleChild);

			// Should not crash when querying structure
			expect(root.leftChild).toBeDefined();
			expect(root.rightChild).toBeUndefined();
			expect(root.isLeftRightSplit()).toBe(false); // Not a valid split
		});

		it('handles empty children array', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 800,
				height: 600
			});

			expect(sash.children.length).toBe(0);
			expect(sash.leftChild).toBeUndefined();
			expect(sash.rightChild).toBeUndefined();
			expect(sash.topChild).toBeUndefined();
			expect(sash.bottomChild).toBeUndefined();

			// getAllLeafDescendants should return self when no children
			const leaves = sash.getAllLeafDescendants();
			expect(leaves).toHaveLength(1);
			expect(leaves[0]).toBe(sash);
		});

		it('handles more than 2 children (invalid BSP)', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Add 3 children (invalid for binary tree)
			for (let i = 0; i < 3; i++) {
				root.children.push(
					new ReactiveSash({
						id: `child-${i}`,
						position: Position.Left,
						width: 200,
						height: 600,
						parent: root
					})
				);
			}

			// Should not crash
			expect(root.children.length).toBe(3);

			// walk should still traverse all
			const visited: string[] = [];
			root.walk((s) => visited.push(s.id));
			expect(visited.length).toBe(4); // root + 3 children
		});
	});

	describe('Search and Traversal Edge Cases', () => {
		it('getById returns null for non-existent ID', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			const result = root.getById('non-existent');
			expect(result).toBeNull();
		});

		it('getById handles duplicate IDs (returns first match)', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			const child1 = new ReactiveSash({
				id: 'duplicate',
				position: Position.Left,
				width: 400,
				height: 600,
				parent: root
			});

			const child2 = new ReactiveSash({
				id: 'duplicate', // Same ID
				position: Position.Right,
				width: 400,
				height: 600,
				parent: root
			});

			root.children.push(child1, child2);

			// Should return first match
			const result = root.getById('duplicate');
			expect(result).toBe(child1);
		});

		it('getAllIds returns all IDs in tree', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			for (let i = 0; i < 5; i++) {
				root.children.push(
					new ReactiveSash({
						id: `child-${i}`,
						position: Position.Left,
						width: 100,
						height: 600,
						parent: root
					})
				);
			}

			const allIds = root.getAllIds();

			expect(allIds).toContain('root');
			expect(allIds).toContain('child-0');
			expect(allIds).toContain('child-4');
			expect(allIds.length).toBe(6); // root + 5 children
		});

		it('walk stops when callback returns false', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			for (let i = 0; i < 10; i++) {
				root.children.push(
					new ReactiveSash({
						id: `child-${i}`,
						position: Position.Left,
						width: 100,
						height: 600,
						parent: root
					})
				);
			}

			const visited: string[] = [];
			root.walk((sash) => {
				visited.push(sash.id);
				// Stop after visiting 5 nodes
				return visited.length < 5;
			});

			expect(visited.length).toBe(5);
		});
	});

	describe('Circular Reference Prevention', () => {
		it('does not follow circular parent references', () => {
			const parent = new ReactiveSash({
				id: 'parent',
				position: Position.Root,
				width: 800,
				height: 600
			});

			const child = new ReactiveSash({
				id: 'child',
				position: Position.Left,
				width: 400,
				height: 600,
				parent: parent
			});

			parent.children.push(child);

			// Walk should not go up to parent
			const visited: string[] = [];
			child.walk((s) => visited.push(s.id));

			// Should only visit child (doesn't walk up the tree)
			expect(visited).toEqual(['child']);
		});
	});

	describe('getAllLeafDescendants Edge Cases', () => {
		it('returns only leaf nodes (no internal nodes)', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			const branch1 = new ReactiveSash({
				id: 'branch1',
				position: Position.Left,
				width: 400,
				height: 600,
				parent: root
			});

			const leaf1 = new ReactiveSash({
				id: 'leaf1',
				position: Position.Left,
				width: 200,
				height: 600,
				parent: branch1
			});

			const leaf2 = new ReactiveSash({
				id: 'leaf2',
				position: Position.Right,
				width: 200,
				height: 600,
				parent: branch1
			});

			const leaf3 = new ReactiveSash({
				id: 'leaf3',
				position: Position.Right,
				width: 400,
				height: 600,
				parent: root
			});

			branch1.children.push(leaf1, leaf2);
			root.children.push(branch1, leaf3);

			const leaves = root.getAllLeafDescendants();

			// Should have 3 leaf nodes (not root or branch1)
			expect(leaves).toHaveLength(3);
			expect(leaves.map((l) => l.id).sort()).toEqual(['leaf1', 'leaf2', 'leaf3']);
		});

		it('returns empty array for node with no descendants', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Root has no children, so it IS a leaf
			const leaves = root.getAllLeafDescendants();
			expect(leaves).toHaveLength(1);
			expect(leaves[0].id).toBe('root');
		});
	});

	describe('Memory and Performance', () => {
		it('handles large number of siblings efficiently', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 10000,
				height: 600
			});

			// Add 1000 children (stress test)
			const startTime = performance.now();

			for (let i = 0; i < 1000; i++) {
				root.children.push(
					new ReactiveSash({
						id: `child-${i}`,
						position: Position.Left,
						width: 10,
						height: 600,
						parent: root
					})
				);
			}

			const endTime = performance.now();

			expect(root.children.length).toBe(1000);

			// Should complete quickly (< 1 second)
			expect(endTime - startTime).toBeLessThan(1000);

			// Verify we can still search efficiently
			const searchStart = performance.now();
			const found = root.getById('child-999');
			const searchEnd = performance.now();

			expect(found).toBeDefined();
			expect(searchEnd - searchStart).toBeLessThan(100); // < 100ms
		});
	});
});
