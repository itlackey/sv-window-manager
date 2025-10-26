/**
 * Performance Benchmarks for BinaryWindow
 *
 * Establishes performance baselines:
 * - Initial render: < 500ms for 10 panes
 * - Pane addition: < 50ms per pane
 * - Resize operation: 60fps minimum (< 16.67ms per frame)
 * - Memory usage: < 10MB for typical usage
 * - No memory leaks on pane churn
 */

import { bench, describe } from 'vitest';
import { ConfigRoot } from './config/config-root.js';
import { ConfigNode } from './config/config-node.js';
import { Position } from './position.js';
import { Sash } from './sash.js';

/**
 * Helper to create a complex multi-pane configuration
 */
function createComplexConfig(paneCount: number): ConfigRoot {
	if (paneCount === 1) {
		return new ConfigRoot({
			width: 800,
			height: 600,
			id: 'root'
		});
	}

	// For larger configs, create a nested children structure
	// Build a balanced tree by recursively creating splits
	function createNestedConfig(depth: number, baseId: string): unknown[] {
		if (depth <= 0) {
			return [];
		}

		return [
			{
				id: `${baseId}-left`,
				children: depth > 1 ? createNestedConfig(depth - 1, `${baseId}-left`) : []
			},
			{
				id: `${baseId}-right`,
				children: depth > 1 ? createNestedConfig(depth - 1, `${baseId}-right`) : []
			}
		];
	}

	// Calculate depth needed for pane count (log2)
	const depth = Math.ceil(Math.log2(paneCount));

	return new ConfigRoot({
		width: 800,
		height: 600,
		id: 'root',
		children: createNestedConfig(depth, 'pane')
	});
}

/**
 * Helper to measure memory usage (if available)
 */
function getMemoryUsage(): number {
	if (typeof performance !== 'undefined' && 'memory' in performance) {
		return (performance as any).memory.usedJSHeapSize;
	}
	if (typeof process !== 'undefined' && process.memoryUsage) {
		return process.memoryUsage().heapUsed;
	}
	return 0;
}

/**
 * Helper to force garbage collection if available
 */
function forceGC() {
	if (typeof global !== 'undefined' && (global as any).gc) {
		(global as any).gc();
	}
}

/**
 * Helper to calculate FPS from frame time
 */
function calculateFPS(frameTimeMs: number): number {
	return 1000 / frameTimeMs;
}

/**
 * Helper to format bytes to MB
 */
function bytesToMB(bytes: number): number {
	return bytes / (1024 * 1024);
}

describe('BinaryWindow Performance Benchmarks', () => {
	/**
	 * Benchmark 1: Pane Addition Performance
	 * Target: < 50ms per pane when adding 20 panes sequentially
	 */
	describe('Pane Addition Performance', () => {
		bench(
			'adding 20 panes sequentially',
			() => {
				const config = new ConfigRoot({
					width: 800,
					height: 600,
					id: 'root'
				});

				const sash = config.buildSashTree();

				// Add 20 panes sequentially by splitting
				let currentId = 'root';
				for (let i = 0; i < 20; i++) {
					const targetSash = sash.getById(currentId);
					if (targetSash && targetSash.isLeaf()) {
						// Split the target pane
						targetSash.split({
							position: i % 2 === 0 ? Position.Right : Position.Bottom,
							percent: 0.5
						});

						// Cycle through panes for next addition
						if (i % 3 === 0 && targetSash.children.length > 0) {
							currentId = targetSash.children[0].id;
						}
					}
				}
			},
			{
				iterations: 100,
				time: 5000 // 5 seconds max
			}
		);

		bench(
			'adding single pane to 10-pane window',
			() => {
				const config = createComplexConfig(10);
				const sash = config.buildSashTree();

				// Find a leaf pane to split
				const leaves = sash.getAllLeafDescendants();
				if (leaves.length > 0) {
					const targetSash = leaves[Math.floor(leaves.length / 2)];
					targetSash.split({
						position: Position.Right,
						percent: 0.5
					});
				}
			},
			{
				iterations: 200,
				time: 3000
			}
		);
	});

	/**
	 * Benchmark 2: Resize Performance
	 * Target: >= 60fps (< 16.67ms per frame)
	 */
	describe('Resize Performance', () => {
		bench(
			'resize 10-pane window maintains 60fps',
			() => {
				const config = createComplexConfig(10);
				const sash = config.buildSashTree();

				// Simulate resize operation - this is what happens during muntin drag
				// Resize from 800x600 to 1200x800
				const startTime = performance.now();

				sash.width = 1200;
				sash.height = 800;

				// Walk tree to ensure all children are updated
				sash.walk(() => {
					// Accessing dimensions forces calculation
				});

				const endTime = performance.now();
				const frameTime = endTime - startTime;

				// Assert 60fps requirement
				const fps = calculateFPS(frameTime);
				if (fps < 60) {
					throw new Error(`Resize too slow: ${fps.toFixed(2)}fps (< 60fps)`);
				}
			},
			{
				iterations: 100,
				time: 3000
			}
		);

		bench(
			'resize 5-pane window',
			() => {
				const config = createComplexConfig(5);
				const sash = config.buildSashTree();

				sash.width = 1000;
				sash.height = 700;

				sash.walk(() => {
					// Force dimension calculations
				});
			},
			{
				iterations: 200,
				time: 3000
			}
		);
	});

	/**
	 * Benchmark 3: Initial Render Performance
	 * Target: < 500ms for 10-pane window
	 */
	describe('Initial Render Performance', () => {
		bench(
			'initial render with 10 panes',
			() => {
				const config = createComplexConfig(10);
				const sash = config.buildSashTree();

				// Walk the tree to simulate rendering
				sash.walk((node) => {
					// Simulate DOM measurements and calculations
					const _ = node.left + node.top + node.width + node.height;
					const minW = node.calcMinWidth();
					const minH = node.calcMinHeight();
					// Simulate some calculation overhead
					const dummy = minW + minH;
				});
			},
			{
				iterations: 100,
				time: 5000
			}
		);

		bench(
			'initial render with 5 panes',
			() => {
				const config = createComplexConfig(5);
				const sash = config.buildSashTree();

				sash.walk((node) => {
					const _ = node.left + node.top + node.width + node.height;
					const minW = node.calcMinWidth();
					const minH = node.calcMinHeight();
					const dummy = minW + minH;
				});
			},
			{
				iterations: 200,
				time: 3000
			}
		);

		bench(
			'initial render with 20 panes',
			() => {
				const config = createComplexConfig(20);
				const sash = config.buildSashTree();

				sash.walk((node) => {
					const _ = node.left + node.top + node.width + node.height;
					const minW = node.calcMinWidth();
					const minH = node.calcMinHeight();
					const dummy = minW + minH;
				});
			},
			{
				iterations: 50,
				time: 5000
			}
		);
	});

	/**
	 * Benchmark 4: Memory Leak Detection
	 * Target: < 1MB leak after 100 add/remove cycles
	 */
	describe('Memory Leak Detection', () => {
		bench(
			'adding and removing 100 panes does not leak memory',
			() => {
				// Force GC before starting
				forceGC();

				const initialMemory = getMemoryUsage();

				// Add and remove panes 100 times
				for (let cycle = 0; cycle < 100; cycle++) {
					const config = new ConfigRoot({
						width: 800,
						height: 600,
						id: 'root'
					});

					const sash = config.buildSashTree();

					// Split to add a pane
					if (sash.isLeaf()) {
						sash.split({
							position: Position.Right,
							percent: 0.5
						});
					}

					// Remove children by clearing array
					sash.children = [];
				}

				// Force GC after operations
				forceGC();

				const finalMemory = getMemoryUsage();
				const memoryLeak = finalMemory - initialMemory;

				// Log memory usage for reporting
				if (memoryLeak > 0) {
					console.log(`Memory increase: ${bytesToMB(memoryLeak).toFixed(2)}MB (target: < 1MB)`);
				}

				// Assert < 1MB leak (allow some overhead for test infrastructure)
				const maxLeakMB = 1;
				if (bytesToMB(memoryLeak) > maxLeakMB) {
					throw new Error(
						`Memory leak detected: ${bytesToMB(memoryLeak).toFixed(2)}MB > ${maxLeakMB}MB`
					);
				}
			},
			{
				iterations: 10,
				time: 10000 // 10 seconds for memory test
			}
		);

		bench(
			'creating and destroying 50 complex windows',
			() => {
				forceGC();
				const initialMemory = getMemoryUsage();

				for (let i = 0; i < 50; i++) {
					const config = createComplexConfig(5);
					const sash = config.buildSashTree();

					// Walk tree to ensure full initialization
					sash.walk(() => {});

					// Clear references
					sash.children = [];
				}

				forceGC();
				const finalMemory = getMemoryUsage();
				const memoryLeak = finalMemory - initialMemory;

				if (memoryLeak > 0) {
					console.log(`Memory increase: ${bytesToMB(memoryLeak).toFixed(2)}MB (target: < 1MB)`);
				}
			},
			{
				iterations: 10,
				time: 10000
			}
		);
	});

	/**
	 * Benchmark 5: Tree Traversal Performance
	 * Measures performance of common tree operations
	 */
	describe('Tree Traversal Performance', () => {
		bench(
			'walk 20-pane tree',
			() => {
				const config = createComplexConfig(20);
				const sash = config.buildSashTree();

				let count = 0;
				sash.walk(() => {
					count++;
				});
			},
			{
				iterations: 200,
				time: 3000
			}
		);

		bench(
			'find pane by ID in 20-pane tree',
			() => {
				const config = createComplexConfig(20);
				const sash = config.buildSashTree();

				// Search for any leaf pane (since IDs are auto-generated in the tree)
				const leaves = sash.getAllLeafDescendants();
				if (leaves.length > 0) {
					const targetId = leaves[Math.floor(leaves.length / 2)].id;
					const found = sash.getById(targetId);
					if (!found) {
						throw new Error('Pane not found');
					}
				}
			},
			{
				iterations: 200,
				time: 3000
			}
		);

		bench(
			'get all leaf descendants from 20-pane tree',
			() => {
				const config = createComplexConfig(20);
				const sash = config.buildSashTree();

				const leaves = sash.getAllLeafDescendants();
				if (leaves.length === 0) {
					throw new Error('No leaves found');
				}
			},
			{
				iterations: 200,
				time: 3000
			}
		);
	});

	/**
	 * Benchmark 6: Dimension Calculation Performance
	 * Measures performance of min-width/height calculations
	 */
	describe('Dimension Calculation Performance', () => {
		bench(
			'calculate min dimensions for 10-pane tree',
			() => {
				const config = createComplexConfig(10);
				const sash = config.buildSashTree();

				const minWidth = sash.calcMinWidth();
				const minHeight = sash.calcMinHeight();

				if (minWidth === 0 || minHeight === 0) {
					throw new Error('Invalid min dimensions');
				}
			},
			{
				iterations: 200,
				time: 3000
			}
		);

		bench(
			'calculate min dimensions for 20-pane tree',
			() => {
				const config = createComplexConfig(20);
				const sash = config.buildSashTree();

				const minWidth = sash.calcMinWidth();
				const minHeight = sash.calcMinHeight();

				if (minWidth === 0 || minHeight === 0) {
					throw new Error('Invalid min dimensions');
				}
			},
			{
				iterations: 100,
				time: 5000
			}
		);
	});
});
