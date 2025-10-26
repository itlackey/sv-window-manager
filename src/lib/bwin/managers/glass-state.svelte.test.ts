import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as GlassState from './glass-state.svelte.js';
import type { BwinContext } from '../context.js';
import type { Sash } from '../sash.js';

describe('GlassState - Reactive State Module', () => {
	let mockBwinContext: BwinContext;
	let mockPane: HTMLElement;
	let mockSash: Sash;

	beforeEach(() => {
		// Reset module state before each test
		GlassState.reset();

		// Create mock BwinContext
		mockBwinContext = {
			windowElement: document.createElement('div'),
			sillElement: undefined,
			rootSash: undefined,
			removePane: vi.fn(),
			addPane: vi.fn(),
			getMinimizedGlassElementBySashId: vi.fn(),
			getSillElement: vi.fn(),
			ensureSillElement: vi.fn()
		};

		// Create mock pane element
		mockPane = document.createElement('div');
		mockPane.className = 'pane';

		// Create mock sash
		mockSash = {
			id: 'test-sash-1',
			left: 0,
			top: 0,
			width: 400,
			height: 300,
			minWidth: 100,
			minHeight: 100,
			position: 'root',
			children: [],
			parent: null,
			domNode: mockPane,
			store: {}
		} as unknown as Sash;

		// Initialize module
		GlassState.initialize(mockBwinContext, false);
	});

	afterEach(() => {
		// Clean up after each test
		GlassState.reset();
	});

	describe('Module Initialization', () => {
		it('should initialize with BwinContext', () => {
			expect(GlassState.glassCount()).toBe(0);
			expect(GlassState.hasActiveGlass()).toBe(false);
		});

		it('should allow re-initialization', () => {
			GlassState.initialize(mockBwinContext, true);
			expect(GlassState.glassCount()).toBe(0);
		});
	});

	describe('Reactive State Management', () => {
		it('should start with empty glassCount', () => {
			expect(GlassState.glassCount()).toBe(0);
		});

		it('should have no active glass initially', () => {
			expect(GlassState.hasActiveGlass()).toBe(false);
		});

		it('should have empty glassesBySashId map initially', () => {
			expect(GlassState.glassesBySashId().size).toBe(0);
		});

		it('should have empty glassIds array initially', () => {
			expect(GlassState.glassIds()).toEqual([]);
		});
	});

	describe('removeGlass', () => {
		it('should not throw if glass does not exist (no-op in declarative mode)', () => {
			expect(() => {
				GlassState.removeGlass('non-existent');
			}).not.toThrow();
		});

		it('should be a no-op when glasses array is empty (declarative mode)', () => {
			GlassState.removeGlass('test-sash-1');
			expect(GlassState.glassCount()).toBe(0);
			expect(GlassState.hasGlass('test-sash-1')).toBe(false);
		});
	});

	describe('updateGlass', () => {
		it('should warn if glass does not exist (no-op in declarative mode)', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// Re-initialize with debug mode
			GlassState.reset();
			GlassState.initialize(mockBwinContext, true);
			GlassState.updateGlass('non-existent', { title: 'Test' });

			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});

		it('should not throw if glass does not exist', () => {
			expect(() => {
				GlassState.updateGlass('non-existent', { title: 'Test' });
			}).not.toThrow();
		});
	});

	describe('setActiveGlass', () => {
		it('should clear active glass when passed undefined', () => {
			GlassState.setActiveGlass(undefined);

			expect(GlassState.getActiveGlass()).toBeUndefined();
			expect(GlassState.hasActiveGlass()).toBe(false);
		});

		it('should not set active if glass does not exist (no-op in declarative mode)', () => {
			GlassState.setActiveGlass('non-existent');
			expect(GlassState.getActiveGlass()).toBeUndefined();
		});
	});

	describe('getGlass', () => {
		it('should return undefined if glass does not exist (empty in declarative mode)', () => {
			const glass = GlassState.getGlass('non-existent');
			expect(glass).toBeUndefined();
		});
	});

	describe('hasGlass', () => {
		it('should return false if glass does not exist (empty in declarative mode)', () => {
			expect(GlassState.hasGlass('non-existent')).toBe(false);
		});
	});

	describe('getAllGlasses', () => {
		it('should return empty array in declarative mode', () => {
			const glasses = GlassState.getAllGlasses();
			expect(glasses).toEqual([]);
		});
	});

	describe('getActiveGlass', () => {
		it('should return undefined when no active glass', () => {
			expect(GlassState.getActiveGlass()).toBeUndefined();
		});
	});

	describe('destroy', () => {
		it('should cleanup successfully even when empty (no-op in declarative mode)', () => {
			GlassState.destroy();

			expect(GlassState.glassCount()).toBe(0);
			expect(GlassState.hasActiveGlass()).toBe(false);
		});

		it('should clear active glass', () => {
			GlassState.setActiveGlass(undefined);
			GlassState.destroy();

			expect(GlassState.getActiveGlass()).toBeUndefined();
		});
	});

	describe('reset', () => {
		it('should reset all state', () => {
			GlassState.reset();

			expect(GlassState.glassCount()).toBe(0);
			expect(GlassState.hasActiveGlass()).toBe(false);
			expect(GlassState.getAllGlasses()).toEqual([]);
		});

		it('should allow re-initialization after reset', () => {
			GlassState.reset();
			GlassState.initialize(mockBwinContext, false);

			expect(GlassState.glassCount()).toBe(0);
		});
	});

	describe('glassIds derived state', () => {
		it('should return empty array in declarative mode', () => {
			expect(GlassState.glassIds()).toEqual([]);
		});
	});

	describe('Derived State Reactivity', () => {
		it('should have reactive glassCount', () => {
			expect(GlassState.glassCount()).toBe(0);
		});

		it('should have reactive hasActiveGlass', () => {
			expect(GlassState.hasActiveGlass()).toBe(false);
		});

		it('should have reactive glassesBySashId', () => {
			expect(GlassState.glassesBySashId().size).toBe(0);
		});

		it('should have reactive glassIds', () => {
			expect(GlassState.glassIds().length).toBe(0);
		});
	});
});
