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
		it('should reactively update glassCount when glass is added', () => {
			expect(manager.glassCount).toBe(0);

			manager.createGlass(mockPane, mockSash, { title: 'Test' });

			expect(manager.glassCount).toBe(1);
		});

		it('should reactively update glassCount when glass is removed', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			expect(manager.glassCount).toBe(1);

			manager.removeGlass('test-sash-1');

			expect(manager.glassCount).toBe(0);
		});

		it('should reactively update glassesBySashId derived state', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });

			expect(manager.glassesBySashId.has('test-sash-1')).toBe(true);
			expect(manager.glassesBySashId.get('test-sash-1')?.props.title).toBe('Test');
		});

		it('should reactively update hasActiveGlass', () => {
			expect(manager.hasActiveGlass).toBe(false);

			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			manager.setActiveGlass('test-sash-1');

			expect(manager.hasActiveGlass).toBe(true);
		});

		it('should reactively clear active glass on removal', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			manager.setActiveGlass('test-sash-1');
			expect(manager.hasActiveGlass).toBe(true);

			manager.removeGlass('test-sash-1');

			expect(manager.hasActiveGlass).toBe(false);
			expect(manager.activeGlass).toBeUndefined();
		});

		it('should track multiple glasses in reactive array', () => {
			const mockSash2 = { ...mockSash, id: 'test-sash-2' } as unknown as Sash;
			const mockPane2 = document.createElement('div');

			manager.createGlass(mockPane, mockSash, { title: 'Test 1' });
			manager.createGlass(mockPane2, mockSash2, { title: 'Test 2' });

			expect(manager.glassCount).toBe(2);
			expect(manager.glassIds).toEqual(['test-sash-1', 'test-sash-2']);
		});
	});

	describe('createGlass', () => {
		it('should create and mount a Glass component', () => {
			const result = manager.createGlass(mockPane, mockSash, {
				title: 'Test Glass',
				content: 'Test content'
			});

			expect(result).toBeDefined();
			expect(result?.sashId).toBe('test-sash-1');
			expect(manager.hasGlass('test-sash-1')).toBe(true);
		});

		it('should return null if paneEl is null', () => {
			const result = manager.createGlass(null as any, mockSash, {});
			expect(result).toBeNull();
		});

		it('should cleanup existing glass before creating new one', () => {
			manager.createGlass(mockPane, mockSash, { title: 'First' });
			expect(manager.glassCount).toBe(1);

			manager.createGlass(mockPane, mockSash, { title: 'Second' });
			expect(manager.glassCount).toBe(1); // Still 1, replaced
		});

		it('should append glass element to pane', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			expect(mockPane.children.length).toBeGreaterThan(0);
		});

		it('should handle glass with only title', () => {
			const result = manager.createGlass(mockPane, mockSash, { title: 'Title Only' });
			expect(result?.props.title).toBe('Title Only');
		});

		it('should handle glass with content element', () => {
			const contentEl = document.createElement('div');
			contentEl.textContent = 'Content';

			const result = manager.createGlass(mockPane, mockSash, {
				title: 'Test',
				content: contentEl
			});

			expect(result?.props.content).toBe(contentEl);
		});

		it('should preserve all glass props in instance', () => {
			const props = {
				title: 'Test',
				tabs: ['Tab 1', 'Tab 2'],
				draggable: true,
				customProp: 'custom'
			};

			const result = manager.createGlass(mockPane, mockSash, props);

			expect(result?.props).toMatchObject(props);
		});
	});

	describe('removeGlass', () => {
		it('should remove glass instance', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			expect(manager.hasGlass('test-sash-1')).toBe(true);

			manager.removeGlass('test-sash-1');
			expect(manager.hasGlass('test-sash-1')).toBe(false);
		});

		it('should not throw if glass does not exist', () => {
			expect(() => {
				manager.removeGlass('non-existent');
			}).not.toThrow();
		});

		it('should clear active glass if removed glass was active', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			manager.setActiveGlass('test-sash-1');

			manager.removeGlass('test-sash-1');

			expect(manager.activeGlass).toBeUndefined();
		});

		it('should not affect other glasses when removing one', () => {
			const mockSash2 = { ...mockSash, id: 'test-sash-2' } as unknown as Sash;
			const mockPane2 = document.createElement('div');

			manager.createGlass(mockPane, mockSash, { title: 'Test 1' });
			manager.createGlass(mockPane2, mockSash2, { title: 'Test 2' });

			manager.removeGlass('test-sash-1');

			expect(manager.glassCount).toBe(1);
			expect(manager.hasGlass('test-sash-2')).toBe(true);
		});
	});

	describe('updateGlass', () => {
		it('should update glass properties reactively', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Original' });

			manager.updateGlass('test-sash-1', { title: 'Updated' });

			const glass = manager.getGlass('test-sash-1');
			expect(glass?.props.title).toBe('Updated');
		});

		it('should warn if glass does not exist', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const debugManager = new GlassManager(mockBwinContext, true);
			debugManager.updateGlass('non-existent', { title: 'Test' });

			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});

		it('should merge new props with existing props', () => {
			manager.createGlass(mockPane, mockSash, {
				title: 'Original',
				customProp: 'value'
			});

			manager.updateGlass('test-sash-1', { title: 'Updated' });

			const glass = manager.getGlass('test-sash-1');
			expect(glass?.props.title).toBe('Updated');
			expect(glass?.props.customProp).toBe('value');
		});
	});

	describe('setActiveGlass', () => {
		it('should set active glass by sash ID', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });

			manager.setActiveGlass('test-sash-1');

			expect(manager.activeGlass?.sashId).toBe('test-sash-1');
			expect(manager.hasActiveGlass).toBe(true);
		});

		it('should clear active glass when passed undefined', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			manager.setActiveGlass('test-sash-1');

			manager.setActiveGlass(undefined);

			expect(manager.activeGlass).toBeUndefined();
			expect(manager.hasActiveGlass).toBe(false);
		});

		it('should not set active if glass does not exist', () => {
			manager.setActiveGlass('non-existent');
			expect(manager.activeGlass).toBeUndefined();
		});
	});

	describe('getGlass', () => {
		it('should return glass instance by sash ID', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });

			const glass = manager.getGlass('test-sash-1');

			expect(glass).toBeDefined();
			expect(glass?.sashId).toBe('test-sash-1');
		});

		it('should return undefined if glass does not exist', () => {
			const glass = manager.getGlass('non-existent');
			expect(glass).toBeUndefined();
		});
	});

	describe('hasGlass', () => {
		it('should return true if glass exists', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			expect(manager.hasGlass('test-sash-1')).toBe(true);
		});

		it('should return false if glass does not exist', () => {
			expect(manager.hasGlass('non-existent')).toBe(false);
		});
	});

	describe('getAllGlasses', () => {
		it('should return reactive array of all glass instances', () => {
			const mockSash2 = { ...mockSash, id: 'test-sash-2' } as unknown as Sash;
			const mockPane2 = document.createElement('div');

			manager.createGlass(mockPane, mockSash, { title: 'Test 1' });
			manager.createGlass(mockPane2, mockSash2, { title: 'Test 2' });

			const glasses = manager.getAllGlasses();
			expect(glasses).toHaveLength(2);
			expect(glasses[0].props.title).toBe('Test 1');
			expect(glasses[1].props.title).toBe('Test 2');
		});

		it('should return empty array if no glasses exist', () => {
			const glasses = manager.getAllGlasses();
			expect(glasses).toEqual([]);
		});
	});

	describe('destroy', () => {
		it('should cleanup all glasses', () => {
			const mockSash2 = { ...mockSash, id: 'test-sash-2' } as unknown as Sash;
			const mockPane2 = document.createElement('div');

			manager.createGlass(mockPane, mockSash, { title: 'Test 1' });
			manager.createGlass(mockPane2, mockSash2, { title: 'Test 2' });

			expect(manager.glassCount).toBe(2);

			manager.destroy();

			expect(manager.glassCount).toBe(0);
			expect(manager.hasActiveGlass).toBe(false);
		});

		it('should cleanup all user components', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });

			manager.destroy();

			expect(manager.userComponents.size).toBe(0);
		});

		it('should clear active glass', () => {
			manager.createGlass(mockPane, mockSash, { title: 'Test' });
			manager.setActiveGlass('test-sash-1');

			manager.destroy();

			expect(manager.activeGlass).toBeUndefined();
		});
	});

	describe('Debug Mode', () => {
		it('should log debug messages when enabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const debugManager = new GlassManager(mockBwinContext, true);

			debugManager.createGlass(mockPane, mockSash, { title: 'Test' });

			expect(logSpy).toHaveBeenCalled();
			logSpy.mockRestore();
		});

		it('should not log debug messages when disabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			manager.createGlass(mockPane, mockSash, { title: 'Test' });

			expect(logSpy).not.toHaveBeenCalled();
			logSpy.mockRestore();
		});
	});

	describe('glassIds derived state', () => {
		it('should return array of sash IDs', () => {
			const mockSash2 = { ...mockSash, id: 'test-sash-2' } as unknown as Sash;
			const mockPane2 = document.createElement('div');

			manager.createGlass(mockPane, mockSash, { title: 'Test 1' });
			manager.createGlass(mockPane2, mockSash2, { title: 'Test 2' });

			expect(manager.glassIds).toEqual(['test-sash-1', 'test-sash-2']);
		});

		it('should return empty array when no glasses exist', () => {
			expect(manager.glassIds).toEqual([]);
		});
	});
});
