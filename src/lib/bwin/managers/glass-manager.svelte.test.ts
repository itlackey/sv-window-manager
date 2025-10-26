import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlassManager } from './glass-manager.svelte.js';
import type { BwinContext } from '../context.js';
import type { Sash } from '../sash.js';

describe('GlassManager - Reactive State', () => {
	let mockBwinContext: BwinContext;
	let manager: GlassManager;
	let mockPane: HTMLElement;
	let mockSash: Sash;

	beforeEach(() => {
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

		// Initialize manager
		manager = new GlassManager(mockBwinContext, false);
	});

	describe('Reactive State Management', () => {
		it('should start with empty glassCount', () => {
			expect(manager.glassCount).toBe(0);
		});

		it('should have no active glass initially', () => {
			expect(manager.hasActiveGlass).toBe(false);
		});

		it('should have empty glassesBySashId map initially', () => {
			expect(manager.glassesBySashId.size).toBe(0);
		});

		it('should have empty glassIds array initially', () => {
			expect(manager.glassIds).toEqual([]);
		});
	});


	describe('removeGlass', () => {
		it('should not throw if glass does not exist (no-op in declarative mode)', () => {
			expect(() => {
				manager.removeGlass('non-existent');
			}).not.toThrow();
		});

		it('should be a no-op when glasses array is empty (declarative mode)', () => {
			manager.removeGlass('test-sash-1');
			expect(manager.glassCount).toBe(0);
			expect(manager.hasGlass('test-sash-1')).toBe(false);
		});
	});

	describe('updateGlass', () => {
		it('should warn if glass does not exist (no-op in declarative mode)', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const debugManager = new GlassManager(mockBwinContext, true);
			debugManager.updateGlass('non-existent', { title: 'Test' });

			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});
	});

	describe('setActiveGlass', () => {
		it('should clear active glass when passed undefined', () => {
			manager.setActiveGlass(undefined);

			expect(manager.activeGlass).toBeUndefined();
			expect(manager.hasActiveGlass).toBe(false);
		});

		it('should not set active if glass does not exist (no-op in declarative mode)', () => {
			manager.setActiveGlass('non-existent');
			expect(manager.activeGlass).toBeUndefined();
		});
	});

	describe('getGlass', () => {
		it('should return undefined if glass does not exist (empty in declarative mode)', () => {
			const glass = manager.getGlass('non-existent');
			expect(glass).toBeUndefined();
		});
	});

	describe('hasGlass', () => {
		it('should return false if glass does not exist (empty in declarative mode)', () => {
			expect(manager.hasGlass('non-existent')).toBe(false);
		});
	});

	describe('getAllGlasses', () => {
		it('should return empty array in declarative mode', () => {
			const glasses = manager.getAllGlasses();
			expect(glasses).toEqual([]);
		});
	});

	describe('destroy', () => {
		it('should cleanup successfully even when empty (no-op in declarative mode)', () => {
			manager.destroy();

			expect(manager.glassCount).toBe(0);
			expect(manager.hasActiveGlass).toBe(false);
			expect(manager.userComponents.size).toBe(0);
		});

		it('should clear active glass', () => {
			manager.setActiveGlass(undefined);
			manager.destroy();

			expect(manager.activeGlass).toBeUndefined();
		});
	});

	describe('glassIds derived state', () => {
		it('should return empty array in declarative mode', () => {
			expect(manager.glassIds).toEqual([]);
		});
	});
});
