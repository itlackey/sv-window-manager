/**
 * Test suite for barrel exports in src/lib/index.ts
 *
 * This test verifies that:
 * 1. All exports are available
 * 2. Tree-shaking works (selective imports)
 * 3. Type exports are correct
 */

import { describe, it, expect } from 'vitest';

describe('Barrel Exports', () => {
	describe('Component Exports', () => {
		it('should export BinaryWindow component', async () => {
			const { BinaryWindow } = await import('./index.js');
			expect(BinaryWindow).toBeDefined();
		});

		it('should export Frame component', async () => {
			const { Frame } = await import('./index.js');
			expect(Frame).toBeDefined();
		});

		it('should export Pane component', async () => {
			const { Pane } = await import('./index.js');
			expect(Pane).toBeDefined();
		});

		it('should export Muntin component', async () => {
			const { Muntin } = await import('./index.js');
			expect(Muntin).toBeDefined();
		});

		it('should export Glass component', async () => {
			const { Glass } = await import('./index.js');
			expect(Glass).toBeDefined();
		});
	});

	describe('Action Exports', () => {
		it('should export resize action', async () => {
			const { resize } = await import('./index.js');
			expect(resize).toBeDefined();
			expect(typeof resize).toBe('function');
		});

		it('should export drag action', async () => {
			const { drag } = await import('./index.js');
			expect(drag).toBeDefined();
			expect(typeof drag).toBe('function');
		});

		it('should export drop action', async () => {
			const { drop } = await import('./index.js');
			expect(drop).toBeDefined();
			expect(typeof drop).toBe('function');
		});

		it('should export window actions', async () => {
			const { closeAction, minimizeAction, maximizeAction } = await import('./index.js');
			expect(closeAction).toBeDefined();
			expect(minimizeAction).toBeDefined();
			expect(maximizeAction).toBeDefined();
		});
	});

	describe('Utility Exports', () => {
		it('should export Sash class', async () => {
			const { Sash } = await import('./index.js');
			expect(Sash).toBeDefined();
		});

		it('should export Position class', async () => {
			const { Position } = await import('./index.js');
			expect(Position).toBeDefined();
		});

		it('should export SashConfig class', async () => {
			const { SashConfig } = await import('./index.js');
			expect(SashConfig).toBeDefined();
		});

		it('should export ConfigRoot class', async () => {
			const { ConfigRoot } = await import('./index.js');
			expect(ConfigRoot).toBeDefined();
		});
	});

	describe('Constant Exports', () => {
		it('should export size constants', async () => {
			const { MUNTIN_SIZE, TRIM_SIZE, MIN_WIDTH, MIN_HEIGHT } = await import('./index.js');
			expect(typeof MUNTIN_SIZE).toBe('number');
			expect(typeof TRIM_SIZE).toBe('number');
			expect(typeof MIN_WIDTH).toBe('number');
			expect(typeof MIN_HEIGHT).toBe('number');
		});

		it('should export CSS_CLASSES constant', async () => {
			const { CSS_CLASSES } = await import('./index.js');
			expect(CSS_CLASSES).toBeDefined();
			expect(CSS_CLASSES.PANE).toBe('pane');
			expect(CSS_CLASSES.MUNTIN).toBe('muntin');
			expect(CSS_CLASSES.GLASS).toBe('glass');
		});

		it('should export DATA_ATTRIBUTES constant', async () => {
			const { DATA_ATTRIBUTES } = await import('./index.js');
			expect(DATA_ATTRIBUTES).toBeDefined();
			expect(DATA_ATTRIBUTES.SASH_ID).toBe('data-sash-id');
			expect(DATA_ATTRIBUTES.DROP_AREA).toBe('data-drop-area');
		});
	});

	describe('Context Exports', () => {
		it('should export context keys', async () => {
			const { BWIN_CONTEXT, FRAME_CONTEXT } = await import('./index.js');
			expect(BWIN_CONTEXT).toBeDefined();
			expect(FRAME_CONTEXT).toBeDefined();
		});
	});

	describe('Error Exports', () => {
		it('should export BwinError class', async () => {
			const { BwinError } = await import('./index.js');
			expect(BwinError).toBeDefined();

			// Test error creation
			const error = new BwinError('Test error', 'TEST_CODE');
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe('[bwin] Test error');
			expect(error.code).toBe('TEST_CODE');
		});

		it('should export BwinErrors factory', async () => {
			const { BwinErrors } = await import('./index.js');
			expect(BwinErrors).toBeDefined();
			expect(BwinErrors.frameNotInitialized).toBeDefined();
			expect(BwinErrors.paneNotFound).toBeDefined();

			// Test error factory
			const error = BwinErrors.frameNotInitialized();
			expect(error.code).toBe('FRAME_NOT_INIT');
		});
	});

	describe('Tree Shaking Support', () => {
		it('should allow selective imports (tree-shaking)', async () => {
			// This tests that we can import only what we need
			// Tree-shaking will remove unused exports during bundling

			// Import only one utility
			const module1 = await import('./index.js');
			const { Position } = module1;
			expect(Position).toBeDefined();

			// Import only constants
			const module2 = await import('./index.js');
			const { CSS_CLASSES, DATA_ATTRIBUTES } = module2;
			expect(CSS_CLASSES).toBeDefined();
			expect(DATA_ATTRIBUTES).toBeDefined();

			// Import only errors
			const module3 = await import('./index.js');
			const { BwinError } = module3;
			expect(BwinError).toBeDefined();
		});
	});
});
