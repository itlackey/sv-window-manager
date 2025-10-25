/**
 * Performance Benchmarks: Reactive vs Legacy Sash
 *
 * This benchmark suite compares the performance of the reactive Svelte 5 Sash
 * implementation against the legacy vanilla JS implementation.
 *
 * **Performance Targets**:
 * - Critical: 10-pane resize < 16ms (60fps requirement)
 * - Important: Deep tree resize < 50ms
 * - Nice-to-have: Property access < 1ms per 100 accesses
 *
 * **How to Run**:
 * ```bash
 * # Benchmark reactive implementation
 * VITE_USE_REACTIVE_SASH=true npm run test:unit -- --run sash.performance.bench.ts
 *
 * # Benchmark legacy implementation
 * VITE_USE_REACTIVE_SASH=false npm run test:unit -- --run sash.performance.bench.ts
 * ```
 *
 * **Analysis**:
 * Compare the results from both runs to determine if reactive implementation
 * meets performance targets. The reactive version should be within 20% of
 * legacy performance for most operations.
 */

import { describe, bench } from 'vitest';
import { ReactiveSash } from './sash.svelte';
import { Sash as LegacySash } from './sash.legacy';
import { Position } from './position';

// Target: < 16ms for 60fps
const TARGET_60FPS_MS = 16;
const TARGET_DEEP_TREE_MS = 50;

describe('Performance: Reactive vs Legacy Sash', () => {
	// ============================================================================
	// CRITICAL BENCHMARKS (60fps requirement)
	// ============================================================================

	bench('Reactive: 10-pane resize (CRITICAL < 16ms)', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		// Create 10-pane tree
		// Root -> Left/Right
		sash.split({ position: Position.Right });
		// Left -> Top/Bottom
		sash.leftChild?.split({ position: Position.Bottom });
		// Right -> Top/Bottom
		sash.rightChild?.split({ position: Position.Bottom });
		// Left-Top -> Left/Right
		sash.leftChild?.topChild?.split({ position: Position.Right });
		// Left-Bottom -> Left/Right
		sash.leftChild?.bottomChild?.split({ position: Position.Right });
		// Right-Top -> Left/Right
		sash.rightChild?.topChild?.split({ position: Position.Right });
		// Right-Bottom -> Left/Right
		sash.rightChild?.bottomChild?.split({ position: Position.Right });

		// Count panes
		let paneCount = 0;
		sash.walk((s) => {
			if (!s.isSplit) paneCount++;
		});
		// Should have 10 panes
		if (paneCount !== 10) {
			throw new Error(`Expected 10 panes, got ${paneCount}`);
		}

		// Benchmark resize operation (this is the hot path)
		sash.width = 800;
	});

	bench('Legacy: 10-pane resize (baseline)', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		// Create identical 10-pane tree
		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.split({ position: Position.Right });
		sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });

		sash.width = 800;
	});

	// ============================================================================
	// IMPORTANT BENCHMARKS (Deep tree operations)
	// ============================================================================

	bench('Reactive: Deep tree resize (5 levels, target < 50ms)', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		// Create 5-level deep tree
		let current: any = sash;
		for (let i = 0; i < 5; i++) {
			current.split({ position: Position.Right });
			current = current.rightChild;
		}

		// Resize root (should propagate through 5 levels)
		sash.width = 800;
	});

	bench('Legacy: Deep tree resize (5 levels)', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		let current: any = sash;
		for (let i = 0; i < 5; i++) {
			current.split({ position: Position.Right });
			current = current.rightChild;
		}

		sash.width = 800;
	});

	bench('Reactive: Wide tree resize (16 panes)', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		// Create wide tree with 16 leaf panes
		// Level 1: Left/Right split
		sash.split({ position: Position.Right });
		// Level 2: Split both children
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		// Level 3: Split all 4 children
		sash.leftChild?.topChild?.split({ position: Position.Right });
		sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });
		// Level 4: Split all 8 children
		sash.leftChild?.topChild?.leftChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.bottomChild?.leftChild?.split({ position: Position.Bottom });
		sash.leftChild?.bottomChild?.rightChild?.split({ position: Position.Bottom });
		sash.rightChild?.topChild?.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.topChild?.rightChild?.split({ position: Position.Bottom });
		sash.rightChild?.bottomChild?.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.bottomChild?.rightChild?.split({ position: Position.Bottom });

		sash.width = 800;
	});

	bench('Legacy: Wide tree resize (16 panes)', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.split({ position: Position.Right });
		sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });
		sash.leftChild?.topChild?.leftChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.bottomChild?.leftChild?.split({ position: Position.Bottom });
		sash.leftChild?.bottomChild?.rightChild?.split({ position: Position.Bottom });
		sash.rightChild?.topChild?.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.topChild?.rightChild?.split({ position: Position.Bottom });
		sash.rightChild?.bottomChild?.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.bottomChild?.rightChild?.split({ position: Position.Bottom });

		sash.width = 800;
	});

	// ============================================================================
	// PROPERTY ACCESS BENCHMARKS (Hot path)
	// ============================================================================

	bench('Reactive: Property access hot path (100 iterations)', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		// Simulate hot path property access
		for (let i = 0; i < 100; i++) {
			const w = sash.width;
			const h = sash.height;
			const left = sash.leftChild;
			const right = sash.rightChild;
			const isSplit = sash.isSplit;
		}
	});

	bench('Legacy: Property access hot path (100 iterations)', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		for (let i = 0; i < 100; i++) {
			const w = sash.width;
			const h = sash.height;
			const left = sash.leftChild;
			const right = sash.rightChild;
			const isSplit = sash.isSplit;
		}
	});

	// ============================================================================
	// TREE TRAVERSAL BENCHMARKS
	// ============================================================================

	bench('Reactive: Tree walk (10-pane tree)', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.split({ position: Position.Right });
		sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });

		let count = 0;
		sash.walk(() => {
			count++;
		});
	});

	bench('Legacy: Tree walk (10-pane tree)', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.split({ position: Position.Right });
		sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });

		let count = 0;
		sash.walk(() => {
			count++;
		});
	});

	// ============================================================================
	// ID LOOKUP BENCHMARKS
	// ============================================================================

	bench('Reactive: getById lookup (10-pane tree)', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.split({ position: Position.Right });
		const target = sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });

		// Lookup the target pane (should traverse tree)
		const found = sash.getById(target!.id);
	});

	bench('Legacy: getById lookup (10-pane tree)', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });
		sash.rightChild?.split({ position: Position.Bottom });
		sash.leftChild?.topChild?.split({ position: Position.Right });
		const target = sash.leftChild?.bottomChild?.split({ position: Position.Right });
		sash.rightChild?.topChild?.split({ position: Position.Right });
		sash.rightChild?.bottomChild?.split({ position: Position.Right });

		const found = sash.getById(target!.id);
	});

	// ============================================================================
	// SPLIT OPERATION BENCHMARKS
	// ============================================================================

	bench('Reactive: Split operation', () => {
		const sash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
	});

	bench('Legacy: Split operation', () => {
		const sash = new LegacySash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });
	});

	// ============================================================================
	// MEMORY STRESS TEST (Create/Destroy many sashes)
	// ============================================================================

	bench('Reactive: Create and destroy 100 sashes', () => {
		for (let i = 0; i < 100; i++) {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 1000,
				height: 600
			});

			sash.split({ position: Position.Right });
			// Sash goes out of scope and gets garbage collected
		}
	});

	bench('Legacy: Create and destroy 100 sashes', () => {
		for (let i = 0; i < 100; i++) {
			const sash = new LegacySash({
				position: Position.Root,
				width: 1000,
				height: 600
			});

			sash.split({ position: Position.Right });
		}
	});
});

// ============================================================================
// INSTRUCTIONS FOR ANALYSIS
// ============================================================================

/*
 * After running benchmarks, compare results:
 *
 * 1. CRITICAL (60fps requirement):
 *    - 10-pane resize MUST be < 16ms for BOTH implementations
 *    - If reactive is > 16ms, optimization is required
 *    - If reactive is < 20ms and within 20% of legacy, ACCEPTABLE
 *
 * 2. IMPORTANT (Deep tree operations):
 *    - Deep tree resize should be < 50ms
 *    - Wide tree resize should be < 30ms
 *    - If reactive is within 30% of legacy, ACCEPTABLE
 *
 * 3. NICE-TO-HAVE (Property access):
 *    - Property access should be < 1ms per 100 accesses
 *    - This is not a blocker if slightly slower
 *
 * 4. MEMORY:
 *    - Create/destroy benchmark should show no memory leaks
 *    - Run with Chrome DevTools memory profiler
 *
 * Example acceptable results:
 * - Reactive 10-pane resize: 12ms (Legacy: 10ms) ✅ PASS
 * - Reactive deep tree: 45ms (Legacy: 35ms) ✅ PASS
 * - Reactive property access: 0.8ms (Legacy: 0.5ms) ✅ PASS
 *
 * Example unacceptable results:
 * - Reactive 10-pane resize: 20ms (Legacy: 10ms) ❌ FAIL (exceeds 16ms target)
 * - Reactive deep tree: 80ms (Legacy: 35ms) ❌ FAIL (too slow)
 */
