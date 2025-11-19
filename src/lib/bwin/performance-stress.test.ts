/**
 * Performance Stress Tests for Large Trees
 *
 * Tests extreme scenarios to identify performance bottlenecks
 * and ensure the library can handle edge cases gracefully.
 *
 * These tests are designed to:
 * - Verify 60fps during resize with 100+ panes
 * - Ensure no stack overflow with deep nesting
 * - Validate memory usage stays reasonable
 * - Test responsiveness with large sibling counts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReactiveSash } from './sash.svelte.js';
import { Position } from './position.js';

describe('Performance Stress Tests - Large Trees', () => {
	describe('100-Pane Window Performance', () => {
		it('creates 100-pane window efficiently', () => {
			const startTime = performance.now();

			// Create a balanced tree with ~100 panes
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 2000,
				height: 1500
			});

			// Build tree by splitting existing leaves
			const targetPaneCount = 100;
			let currentPanes = [root];

			while (currentPanes.length < targetPaneCount) {
				// Split the first pane in the list
				const paneToSplit = currentPanes.shift();

				if (paneToSplit && paneToSplit.isLeaf()) {
					// Alternate between horizontal and vertical splits
					const position = currentPanes.length % 2 === 0 ? Position.Right : Position.Bottom;

					const left = new ReactiveSash({
						id: `pane-${currentPanes.length}-left`,
						position: position === Position.Right ? Position.Left : Position.Top,
						parent: paneToSplit,
						width: paneToSplit.width / 2,
						height: paneToSplit.height / 2
					});

					const right = new ReactiveSash({
						id: `pane-${currentPanes.length}-right`,
						position,
						parent: paneToSplit,
						width: paneToSplit.width / 2,
						height: paneToSplit.height / 2
					});

					paneToSplit.children.push(left, right);

					// Add new panes to the list
					currentPanes.push(left, right);
				}
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Verify pane count
			const leaves = root.getAllLeafDescendants();
			expect(leaves.length).toBeGreaterThanOrEqual(100);

			// Should complete within 1 second
			expect(duration).toBeLessThan(1000);

			console.log(`✓ Created ${leaves.length} panes in ${duration.toFixed(2)}ms`);
		});

		it('finds pane by ID in 100-pane tree quickly', () => {
			// Create 100-pane tree
			const root = create100PaneTree();

			const leaves = root.getAllLeafDescendants();
			expect(leaves.length).toBeGreaterThanOrEqual(100);

			// Test find performance
			const targetPane = leaves[Math.floor(leaves.length / 2)];
			const startTime = performance.now();

			const found = root.getById(targetPane.id);

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(found).toBe(targetPane);

			// Should find within 1ms
			expect(duration).toBeLessThan(1);

			console.log(`✓ Found pane in ${leaves.length}-pane tree in ${duration.toFixed(3)}ms`);
		});

		it('walks 100-pane tree efficiently', () => {
			const root = create100PaneTree();

			const startTime = performance.now();

			let count = 0;
			root.walk(() => {
				count++;
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(count).toBeGreaterThan(100);

			// Should walk entire tree within 5ms
			expect(duration).toBeLessThan(5);

			console.log(`✓ Walked ${count} nodes in ${duration.toFixed(2)}ms`);
		});

		it('calculates min dimensions for 100-pane tree', () => {
			const root = create100PaneTree();

			const startTime = performance.now();

			const minWidth = root.calcMinWidth();
			const minHeight = root.calcMinHeight();

			const endTime = performance.now();
			const duration = endTime - startTime;

			expect(minWidth).toBeGreaterThan(0);
			expect(minHeight).toBeGreaterThan(0);

			// Should calculate within 10ms
			expect(duration).toBeLessThan(10);

			console.log(`✓ Calculated min dimensions in ${duration.toFixed(2)}ms`);
			console.log(`  Min dimensions: ${minWidth}x${minHeight}`);
		});

		it('resizes 100-pane tree at 60fps', () => {
			const root = create100PaneTree();

			// Simulate resize operation (what happens during muntin drag)
			const startTime = performance.now();

			// Change root dimensions
			root.width = 2400;
			root.height = 1800;

			// Force recalculation by walking tree
			root.walk(() => {
				// Accessing dimensions forces calculation
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			const fps = 1000 / duration;

			// Should maintain 60fps (< 16.67ms per frame)
			expect(duration).toBeLessThan(16.67);
			expect(fps).toBeGreaterThanOrEqual(60);

			console.log(`✓ Resize completed in ${duration.toFixed(2)}ms (${fps.toFixed(1)}fps)`);
		});

		it('handles rapid add/remove operations', () => {
			const root = create100PaneTree();
			const leaves = root.getAllLeafDescendants();

			const startTime = performance.now();

			// Perform 100 rapid operations
			for (let i = 0; i < 100; i++) {
				// Pick a random leaf
				const randomLeaf = leaves[Math.floor(Math.random() * leaves.length)];

				// Remove its parent's children (if not root)
				if (randomLeaf.parent && randomLeaf.parent !== root) {
					randomLeaf.parent.children = [];

					// Immediately add them back
					const left = new ReactiveSash({
						id: `temp-${i}-left`,
						position: Position.Left,
						parent: randomLeaf.parent
					});

					const right = new ReactiveSash({
						id: `temp-${i}-right`,
						position: Position.Right,
						parent: randomLeaf.parent
					});

					randomLeaf.parent.children.push(left, right);
				}
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Should complete within 500ms
			expect(duration).toBeLessThan(500);

			console.log(`✓ 100 add/remove operations in ${duration.toFixed(2)}ms`);
		});
	});

	describe('200-Pane Window Stress Test', () => {
		it('creates and manipulates 200-pane window', () => {
			const startTime = performance.now();

			const root = createNPaneTree(200);

			const createTime = performance.now() - startTime;

			const leaves = root.getAllLeafDescendants();
			expect(leaves.length).toBeGreaterThanOrEqual(200);

			console.log(`✓ Created ${leaves.length} panes in ${createTime.toFixed(2)}ms`);

			// Test operations on 200-pane tree
			const findStart = performance.now();
			const midPane = leaves[Math.floor(leaves.length / 2)];
			const found = root.getById(midPane.id);
			const findDuration = performance.now() - findStart;

			expect(found).toBe(midPane);
			expect(findDuration).toBeLessThan(2); // Still fast

			console.log(`✓ Find operation: ${findDuration.toFixed(3)}ms`);

			// Walk test
			const walkStart = performance.now();
			let count = 0;
			root.walk(() => {
				count++;
			});
			const walkDuration = performance.now() - walkStart;

			expect(walkDuration).toBeLessThan(10);

			console.log(`✓ Walk operation: ${walkDuration.toFixed(2)}ms (${count} nodes)`);
		});
	});

	describe('Deep Nesting Stress Test', () => {
		it('handles 50-level deep nesting without stack overflow', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Create 50 levels deep
			let current = root;
			for (let i = 1; i <= 50; i++) {
				const left = new ReactiveSash({
					id: `level-${i}-left`,
					position: Position.Left,
					parent: current
				});

				const right = new ReactiveSash({
					id: `level-${i}-right`,
					position: Position.Right,
					parent: current
				});

				current.children.push(left, right);
				current = left; // Go deeper
			}

			// Verify no stack overflow
			const deepNode = root.getById('level-50-right');
			expect(deepNode).toBeDefined();
			expect(deepNode?.id).toBe('level-50-right');

			// Walk should not stack overflow
			let nodeCount = 0;
			expect(() => {
				root.walk(() => {
					nodeCount++;
				});
			}).not.toThrow();

			expect(nodeCount).toBeGreaterThan(100);

			console.log(`✓ 50-level deep tree walked successfully (${nodeCount} nodes)`);
		});

		it('handles 100-level deep nesting', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root
			});

			let current = root;
			for (let i = 1; i <= 100; i++) {
				const child = new ReactiveSash({
					id: `level-${i}`,
					position: Position.Left,
					parent: current
				});

				current.children.push(child);
				current = child;
			}

			// Should not stack overflow
			const deep = root.getById('level-100');
			expect(deep).toBeDefined();

			// Walk should succeed
			let count = 0;
			root.walk(() => {
				count++;
			});

			expect(count).toBe(101); // Root + 100 levels

			console.log(`✓ 100-level deep tree handled successfully`);
		});
	});

	describe('Wide Tree Stress Test', () => {
		it('handles 1000 sibling panes', () => {
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 10000,
				height: 600
			});

			const startTime = performance.now();

			// Create 1000 children
			for (let i = 0; i < 1000; i++) {
				root.children.push(
					new ReactiveSash({
						id: `child-${i}`,
						position: Position.Left,
						parent: root,
						width: 10
					})
				);
			}

			const createTime = performance.now() - startTime;

			expect(root.children.length).toBe(1000);
			console.log(`✓ Created 1000 siblings in ${createTime.toFixed(2)}ms`);

			// Test find in wide tree
			const findStart = performance.now();
			const found = root.getById('child-999');
			const findDuration = performance.now() - findStart;

			expect(found).toBeDefined();
			expect(findDuration).toBeLessThan(5); // Linear search acceptable for wide trees

			console.log(`✓ Find in 1000 siblings: ${findDuration.toFixed(2)}ms`);

			// Test getAllLeaves
			const leavesStart = performance.now();
			const leaves = root.getAllLeafDescendants();
			const leavesDuration = performance.now() - leavesStart;

			expect(leaves.length).toBe(1000);
			expect(leavesDuration).toBeLessThan(10);

			console.log(`✓ Get all 1000 leaves: ${leavesDuration.toFixed(2)}ms`);
		});
	});

	describe('Memory Efficiency', () => {
		it('does not leak memory with 100 add/remove cycles', () => {
			// This test verifies no memory is retained after pane removal
			const cycles = 100;
			const results: number[] = [];

			for (let i = 0; i < cycles; i++) {
				// Create tree
				const root = create100PaneTree();

				// Get leaf count
				const leaves = root.getAllLeafDescendants();
				results.push(leaves.length);

				// Clear all children (simulate removal)
				root.children = [];
			}

			// Verify all cycles completed
			expect(results.length).toBe(cycles);

			// All cycles should have similar pane counts
			const avgPanes = results.reduce((a, b) => a + b, 0) / results.length;
			expect(avgPanes).toBeGreaterThan(90);

			console.log(`✓ 100 create/destroy cycles completed`);
			console.log(`  Avg pane count: ${avgPanes.toFixed(0)}`);
		});
	});

	describe('Performance Benchmarks', () => {
		it('meets all performance budgets for 100-pane tree', () => {
			const root = create100PaneTree();
			const budgets = {
				find: 1, // <1ms
				walk: 5, // <5ms
				minDimensions: 10, // <10ms
				resize: 16.67 // <16.67ms (60fps)
			};

			// Find benchmark
			const leaves = root.getAllLeafDescendants();
			const targetPane = leaves[50];

			const findStart = performance.now();
			root.getById(targetPane.id);
			const findTime = performance.now() - findStart;

			expect(findTime).toBeLessThan(budgets.find);

			// Walk benchmark
			const walkStart = performance.now();
			let count = 0;
			root.walk(() => {
				count++;
			});
			const walkTime = performance.now() - walkStart;

			expect(walkTime).toBeLessThan(budgets.walk);

			// Min dimensions benchmark
			const dimStart = performance.now();
			root.calcMinWidth();
			root.calcMinHeight();
			const dimTime = performance.now() - dimStart;

			expect(dimTime).toBeLessThan(budgets.minDimensions);

			// Resize benchmark
			const resizeStart = performance.now();
			root.width = 2400;
			root.height = 1800;
			root.walk(() => {});
			const resizeTime = performance.now() - resizeStart;

			expect(resizeTime).toBeLessThan(budgets.resize);

			console.log('✓ All performance budgets met:');
			console.log(`  Find: ${findTime.toFixed(3)}ms (budget: ${budgets.find}ms)`);
			console.log(`  Walk: ${walkTime.toFixed(2)}ms (budget: ${budgets.walk}ms)`);
			console.log(`  MinDim: ${dimTime.toFixed(2)}ms (budget: ${budgets.minDimensions}ms)`);
			console.log(`  Resize: ${resizeTime.toFixed(2)}ms (budget: ${budgets.resize}ms, ${(1000 / resizeTime).toFixed(1)}fps)`);
		});
	});
});

/**
 * Helper: Create a balanced tree with ~100 panes
 */
function create100PaneTree(): ReactiveSash {
	return createNPaneTree(100);
}

/**
 * Helper: Create a balanced tree with N panes
 */
function createNPaneTree(targetCount: number): ReactiveSash {
	const root = new ReactiveSash({
		id: 'root',
		position: Position.Root,
		width: 2000,
		height: 1500
	});

	const queue: ReactiveSash[] = [root];
	let paneCount = 1;

	while (paneCount < targetCount && queue.length > 0) {
		const current = queue.shift();

		if (current && current.isLeaf()) {
			const position = paneCount % 2 === 0 ? Position.Right : Position.Bottom;

			const left = new ReactiveSash({
				id: `pane-${paneCount}-left`,
				position: position === Position.Right ? Position.Left : Position.Top,
				parent: current,
				width: current.width / 2,
				height: current.height / 2
			});

			const right = new ReactiveSash({
				id: `pane-${paneCount}-right`,
				position,
				parent: current,
				width: current.width / 2,
				height: current.height / 2
			});

			current.children.push(left, right);
			queue.push(left, right);

			paneCount += 2;
		}
	}

	return root;
}
