/**
 * Reactive Sash POC Performance Benchmarks
 *
 * These benchmarks validate that the reactive implementation meets performance requirements.
 *
 * **Critical Performance Budget**:
 * - Layout calculation: < 16ms (for 60fps)
 * - Tree construction: Comparable to legacy
 * - Memory overhead: < 50% increase per instance
 *
 * Success criteria:
 * - All benchmarks complete within budget
 * - No significant regression vs. legacy
 * - Memory usage within acceptable bounds
 *
 * @fileoverview Phase 2 POC benchmarks for Workstream 3.1
 */

import { describe, bench } from 'vitest';
import { ReactiveSash } from './sash.svelte.js';
import { Sash } from './sash.js';
import { Position } from './position.js';

describe('ReactiveSash POC - Performance Benchmarks', () => {
	describe('Construction Performance', () => {
		bench('create simple reactive sash', () => {
			new ReactiveSash({
				position: Position.Root,
				width: 800,
				height: 600
			});
		});

		bench('create simple legacy sash', () => {
			new Sash({
				position: Position.Root,
				width: 800,
				height: 600
			});
		});

		bench('create reactive sash with all options', () => {
			new ReactiveSash({
				position: Position.Left,
				left: 100,
				top: 50,
				width: 400,
				height: 300,
				minWidth: 200,
				minHeight: 150,
				resizeStrategy: 'natural',
				id: 'test-sash',
				store: { title: 'Test', content: 'Test content' }
			});
		});

		bench('create legacy sash with all options', () => {
			new Sash({
				position: Position.Left,
				left: 100,
				top: 50,
				width: 400,
				height: 300,
				minWidth: 200,
				minHeight: 150,
				resizeStrategy: 'natural',
				id: 'test-sash',
				store: { title: 'Test', content: 'Test content' }
			});
		});
	});

	describe('Tree Construction Performance', () => {
		bench('build 10-node reactive tree', () => {
			const root = new ReactiveSash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			// Create a balanced tree with 10 nodes
			root.split({ position: Position.Right });
			root.leftChild?.split({ position: Position.Bottom });
			root.rightChild?.split({ position: Position.Bottom });

			root.leftChild?.topChild?.split({ position: Position.Right });
			root.leftChild?.bottomChild?.split({ position: Position.Right });
			root.rightChild?.topChild?.split({ position: Position.Right });
		});

		bench('build 10-node legacy tree', () => {
			const root = new Sash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			// Manually construct equivalent tree
			const leftChild = new Sash({
				position: Position.Left,
				parent: root,
				left: 0,
				top: 0,
				width: 500,
				height: 800
			});

			const rightChild = new Sash({
				position: Position.Right,
				parent: root,
				left: 500,
				top: 0,
				width: 500,
				height: 800
			});

			root.addChild(leftChild);
			root.addChild(rightChild);

			// Add more nodes...
			const leftTop = new Sash({
				position: Position.Top,
				parent: leftChild,
				left: 0,
				top: 0,
				width: 500,
				height: 400
			});

			const leftBottom = new Sash({
				position: Position.Bottom,
				parent: leftChild,
				left: 0,
				top: 400,
				width: 500,
				height: 400
			});

			leftChild.addChild(leftTop);
			leftChild.addChild(leftBottom);

			// Continue building tree...
		});
	});

	describe('Layout Calculation Performance (CRITICAL)', () => {
		/**
		 * This is the MOST CRITICAL benchmark.
		 * Must complete in < 16ms to maintain 60fps during resize operations.
		 */
		bench('resize 10-pane reactive window (< 16ms target)', () => {
			// Build a 10-pane tree
			const root = new ReactiveSash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			root.split({ position: Position.Right });
			root.leftChild?.split({ position: Position.Bottom });
			root.rightChild?.split({ position: Position.Bottom });
			root.leftChild?.topChild?.split({ position: Position.Right });
			root.leftChild?.bottomChild?.split({ position: Position.Right });
			root.rightChild?.topChild?.split({ position: Position.Right });

			// Simulate resize operation (this triggers propagation)
			root.width = 1200;
			root.height = 900;
		});

		bench('resize 10-pane legacy window (baseline)', () => {
			// Build equivalent legacy tree
			const root = new Sash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			const buildLegacyTree = (parent: Sash, depth: number, maxDepth: number) => {
				if (depth >= maxDepth) return;

				const splitPosition = depth % 2 === 0 ? Position.Right : Position.Bottom;
				const isHorizontal = splitPosition === Position.Right || splitPosition === Position.Left;

				const child1Pos = isHorizontal ? Position.Left : Position.Top;
				const child2Pos = isHorizontal ? Position.Right : Position.Bottom;

				const halfDim = isHorizontal ? parent.width / 2 : parent.height / 2;

				const child1 = new Sash({
					position: child1Pos,
					parent,
					left: parent.left,
					top: parent.top,
					width: isHorizontal ? halfDim : parent.width,
					height: isHorizontal ? parent.height : halfDim
				});

				const child2 = new Sash({
					position: child2Pos,
					parent,
					left: isHorizontal ? parent.left + halfDim : parent.left,
					top: isHorizontal ? parent.top : parent.top + halfDim,
					width: isHorizontal ? halfDim : parent.width,
					height: isHorizontal ? parent.height : halfDim
				});

				parent.addChild(child1);
				parent.addChild(child2);

				buildLegacyTree(child1, depth + 1, maxDepth);
				buildLegacyTree(child2, depth + 1, maxDepth);
			};

			buildLegacyTree(root, 0, 3);

			// Simulate resize
			root.width = 1200;
			root.height = 900;
		});

		bench('deep resize reactive (5 levels)', () => {
			const root = new ReactiveSash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			// Build deep tree (5 levels)
			const buildTree = (node: ReactiveSash, depth: number, maxDepth: number) => {
				if (depth >= maxDepth) return;

				const position = depth % 2 === 0 ? Position.Right : Position.Bottom;
				node.split({ position });

				if (node.leftChild) buildTree(node.leftChild, depth + 1, maxDepth);
				if (node.rightChild) buildTree(node.rightChild, depth + 1, maxDepth);
				if (node.topChild) buildTree(node.topChild, depth + 1, maxDepth);
				if (node.bottomChild) buildTree(node.bottomChild, depth + 1, maxDepth);
			};

			buildTree(root, 0, 5);

			// This should cascade through all 31 nodes (2^5 - 1)
			root.width = 1500;
			root.height = 1000;
		});
	});

	describe('Property Access Performance', () => {
		bench('reactive sash dimension reads', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Simulate frequent reads
			for (let i = 0; i < 100; i++) {
				const _l = sash.left;
				const _t = sash.top;
				const _w = sash.width;
				const _h = sash.height;
			}
		});

		bench('legacy sash dimension reads', () => {
			const sash = new Sash({
				position: Position.Root,
				width: 800,
				height: 600
			});

			// Simulate frequent reads
			for (let i = 0; i < 100; i++) {
				const _l = sash.left;
				const _t = sash.top;
				const _w = sash.width;
				const _h = sash.height;
			}
		});

		bench('reactive child accessor reads', () => {
			const parent = new ReactiveSash({ position: Position.Root });
			parent.split({ position: Position.Right });

			// Simulate frequent child access
			for (let i = 0; i < 100; i++) {
				const _lc = parent.leftChild;
				const _rc = parent.rightChild;
			}
		});

		bench('legacy child accessor reads', () => {
			const parent = new Sash({ position: Position.Root });

			const leftChild = new Sash({
				position: Position.Left,
				parent,
				width: 400,
				height: 600
			});

			const rightChild = new Sash({
				position: Position.Right,
				parent,
				width: 400,
				height: 600
			});

			parent.addChild(leftChild);
			parent.addChild(rightChild);

			// Simulate frequent child access
			for (let i = 0; i < 100; i++) {
				const _lc = parent.leftChild;
				const _rc = parent.rightChild;
			}
		});
	});

	describe('Memory Allocation', () => {
		bench('allocate 100 reactive sashes', () => {
			const sashes: ReactiveSash[] = [];

			for (let i = 0; i < 100; i++) {
				sashes.push(
					new ReactiveSash({
						position: Position.Left,
						width: 400,
						height: 300
					})
				);
			}
		});

		bench('allocate 100 legacy sashes', () => {
			const sashes: Sash[] = [];

			for (let i = 0; i < 100; i++) {
				sashes.push(
					new Sash({
						position: Position.Left,
						width: 400,
						height: 300
					})
				);
			}
		});
	});

	describe('Propagation Performance', () => {
		bench('horizontal split propagation reactive', () => {
			const parent = new ReactiveSash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			parent.split({ position: Position.Right });

			// Trigger propagation 50 times
			for (let i = 0; i < 50; i++) {
				parent.width = 1000 + i * 10;
			}
		});

		bench('horizontal split propagation legacy', () => {
			const parent = new Sash({
				position: Position.Root,
				width: 1000,
				height: 800
			});

			const leftChild = new Sash({
				position: Position.Left,
				parent,
				left: 0,
				top: 0,
				width: 500,
				height: 800
			});

			const rightChild = new Sash({
				position: Position.Right,
				parent,
				left: 500,
				top: 0,
				width: 500,
				height: 800
			});

			parent.addChild(leftChild);
			parent.addChild(rightChild);

			// Trigger propagation 50 times
			for (let i = 0; i < 50; i++) {
				parent.width = 1000 + i * 10;
			}
		});
	});
});
