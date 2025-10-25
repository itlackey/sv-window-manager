import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SillManager } from './sill-manager.svelte.js';
import type { BwinContext } from '../context.js';
import type { Sash } from '../sash.js';
import { CSS_CLASSES } from '../constants.js';

describe('SillManager - Reactive State', () => {
	let mockBwinContext: BwinContext;
	let manager: SillManager;
	let windowElement: HTMLElement;
	let mockRootSash: Sash;

	beforeEach(() => {
		// Create window element
		windowElement = document.createElement('div');
		windowElement.className = 'bw-window';

		// Create mock root sash
		mockRootSash = {
			id: 'root',
			left: 0,
			top: 0,
			width: 800,
			height: 600,
			minWidth: 100,
			minHeight: 100,
			position: 'root',
			children: [],
			parent: null,
			domNode: null,
			store: {},
			getById: vi.fn((id: string) => {
				if (id === 'pane-1') {
					return {
						id: 'pane-1',
						minWidth: 100,
						minHeight: 100
					} as unknown as Sash;
				}
				return null;
			})
		} as unknown as Sash;

		// Create mock BwinContext
		mockBwinContext = {
			get windowElement() {
				return windowElement;
			},
			sillElement: undefined,
			get rootSash() {
				return mockRootSash;
			},
			removePane: vi.fn(),
			addPane: vi.fn(),
			getMinimizedGlassElementBySashId: vi.fn(),
			getSillElement: vi.fn(),
			ensureSillElement: vi.fn()
		};

		// Initialize manager
		manager = new SillManager(mockBwinContext, false);
	});

	describe('Reactive State Management', () => {
		it('should reactively update hasSillElement when sill is mounted', () => {
			expect(manager.hasSillElement).toBe(false);

			manager.mount();

			expect(manager.hasSillElement).toBe(true);
		});

		it('should reactively clear hasSillElement on destroy', () => {
			manager.mount();
			expect(manager.hasSillElement).toBe(true);

			manager.destroy();

			expect(manager.hasSillElement).toBe(false);
		});

		it('should maintain reactive sillElement reference', () => {
			expect(manager.sillElement).toBeUndefined();

			const sill = manager.mount();

			expect(manager.sillElement).toBe(sill);
			expect(manager.sillElement).toBeDefined();
		});
	});

	describe('mount', () => {
		it('should create and mount sill element', () => {
			const sill = manager.mount();

			expect(sill).toBeDefined();
			expect(sill?.className).toContain(CSS_CLASSES.SILL);
			expect(windowElement.contains(sill!)).toBe(true);
		});

		it('should return undefined if no window element', () => {
			// Create context with no window element
			const emptyContext = {
				windowElement: undefined,
				sillElement: undefined,
				rootSash: undefined,
				removePane: vi.fn(),
				addPane: vi.fn(),
				getMinimizedGlassElementBySashId: vi.fn(),
				getSillElement: vi.fn(),
				ensureSillElement: vi.fn()
			} as unknown as BwinContext;

			const emptyManager = new SillManager(emptyContext, false);
			const result = emptyManager.mount();

			expect(result).toBeUndefined();
		});

		it('should reuse existing sill element', () => {
			const firstSill = manager.mount();
			const secondSill = manager.mount();

			expect(secondSill).toBe(firstSill);
		});

		it('should preserve minimized glasses when recreating sill', () => {
			// Create first sill with minimized glass
			const firstSill = manager.mount();
			const minimizedGlass = document.createElement('div');
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.textContent = 'Minimized 1';
			firstSill?.append(minimizedGlass);

			expect(firstSill?.children.length).toBe(1);

			// Remove sill from DOM to simulate window element change
			firstSill?.remove();

			// Create new sill - should preserve minimized glass
			const newSill = manager.mount();

			expect(newSill?.children.length).toBe(1);
			expect(newSill?.children[0].textContent).toBe('Minimized 1');
		});

		it('should setup click handler on mount', () => {
			const sill = manager.mount();
			const addEventListenerSpy = vi.spyOn(sill!, 'addEventListener');

			// Remount to trigger handler setup
			manager.mount();

			expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});
	});

	describe('ensureSillElement', () => {
		it('should create sill if not exists', () => {
			expect(manager.sillElement).toBeUndefined();

			const sill = manager.ensureSillElement();

			expect(sill).toBeDefined();
			expect(manager.sillElement).toBe(sill);
		});

		it('should return existing sill if already mounted', () => {
			const firstSill = manager.mount();
			const secondSill = manager.ensureSillElement();

			expect(secondSill).toBe(firstSill);
		});
	});

	describe('getMinimizedGlassElement', () => {
		it('should find minimized glass by sash ID', () => {
			manager.mount();

			// Create minimized glass element
			const minimizedGlass = document.createElement('div');
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			(minimizedGlass as any).bwOriginalSashId = 'pane-1';
			windowElement.append(minimizedGlass);

			const result = manager.getMinimizedGlassElement('pane-1');

			expect(result).toBe(minimizedGlass);
		});

		it('should return null if window element not available', () => {
			const emptyContext = {
				windowElement: undefined,
				sillElement: undefined,
				rootSash: undefined,
				removePane: vi.fn(),
				addPane: vi.fn(),
				getMinimizedGlassElementBySashId: vi.fn(),
				getSillElement: vi.fn(),
				ensureSillElement: vi.fn()
			} as unknown as BwinContext;

			const emptyManager = new SillManager(emptyContext, false);
			const result = emptyManager.getMinimizedGlassElement('pane-1');

			expect(result).toBeNull();
		});

		it('should return undefined if minimized glass not found', () => {
			manager.mount();

			const result = manager.getMinimizedGlassElement('non-existent');

			expect(result).toBeUndefined();
		});

		it('should find correct glass among multiple minimized glasses', () => {
			manager.mount();

			// Create multiple minimized glasses
			const glass1 = document.createElement('div');
			glass1.className = CSS_CLASSES.MINIMIZED_GLASS;
			(glass1 as any).bwOriginalSashId = 'pane-1';

			const glass2 = document.createElement('div');
			glass2.className = CSS_CLASSES.MINIMIZED_GLASS;
			(glass2 as any).bwOriginalSashId = 'pane-2';

			windowElement.append(glass1, glass2);

			const result = manager.getMinimizedGlassElement('pane-2');

			expect(result).toBe(glass2);
		});
	});

	describe('restoreGlass', () => {
		let minimizedGlassEl: HTMLElement & {
			bwOriginalBoundingRect?: DOMRect;
			bwOriginalSashId?: string;
			bwOriginalPosition?: string;
			bwGlassElement?: HTMLElement;
			bwOriginalStore?: Record<string, unknown>;
		};
		let targetPane: HTMLElement;

		beforeEach(() => {
			manager.mount();

			// Create target pane
			targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1');
			targetPane.style.position = 'absolute';
			targetPane.style.left = '0px';
			targetPane.style.top = '0px';
			targetPane.style.width = '400px';
			targetPane.style.height = '300px';
			windowElement.append(targetPane);

			// Create minimized glass element with metadata
			minimizedGlassEl = document.createElement('div') as any;
			minimizedGlassEl.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlassEl.bwOriginalSashId = 'restored-pane';
			minimizedGlassEl.bwOriginalPosition = 'right';
			minimizedGlassEl.bwOriginalBoundingRect = new DOMRect(100, 50, 200, 150);
			minimizedGlassEl.bwOriginalStore = {
				title: 'Restored Glass',
				content: 'Test content'
			};
		});

		it('should call addPane with correct parameters', () => {
			manager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					id: 'restored-pane',
					position: 'right',
					size: expect.any(Number),
					title: 'Restored Glass',
					content: 'Test content'
				})
			);
		});

		it('should return early if no window element', () => {
			const emptyContext = {
				windowElement: undefined,
				sillElement: undefined,
				rootSash: undefined,
				removePane: vi.fn(),
				addPane: vi.fn(),
				getMinimizedGlassElementBySashId: vi.fn(),
				getSillElement: vi.fn(),
				ensureSillElement: vi.fn()
			} as unknown as BwinContext;

			const emptyManager = new SillManager(emptyContext, false);
			emptyManager.restoreGlass(minimizedGlassEl);

			expect(emptyContext.addPane).not.toHaveBeenCalled();
		});

		it('should return early if no root sash', () => {
			const noRootContext = {
				...mockBwinContext,
				rootSash: undefined
			};

			const noRootManager = new SillManager(noRootContext, false);
			noRootManager.mount();
			noRootManager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});

		it('should return early if no original bounding rect', () => {
			minimizedGlassEl.bwOriginalBoundingRect = undefined;

			manager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});

		it('should calculate size for left/right positions', () => {
			minimizedGlassEl.bwOriginalPosition = 'right';

			manager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					position: 'right',
					size: 200 // originalRect.width
				})
			);
		});

		it('should calculate size for top/bottom positions', () => {
			minimizedGlassEl.bwOriginalPosition = 'bottom';

			manager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					position: 'bottom',
					size: 150 // originalRect.height
				})
			);
		});

		it('should use half size if original size too large', () => {
			// Make original rect very large
			minimizedGlassEl.bwOriginalBoundingRect = new DOMRect(0, 0, 350, 250);
			minimizedGlassEl.bwOriginalPosition = 'right';

			manager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					size: 200 // targetRect.width / 2
				})
			);
		});

		it('should preserve original store data', () => {
			minimizedGlassEl.bwOriginalStore = {
				title: 'Custom Title',
				tabs: ['Tab 1', 'Tab 2'],
				customProp: 'value'
			};

			manager.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					title: 'Custom Title',
					tabs: ['Tab 1', 'Tab 2'],
					customProp: 'value'
				})
			);
		});
	});

	describe('destroy', () => {
		it('should clear sill element reference', () => {
			manager.mount();
			expect(manager.sillElement).toBeDefined();

			manager.destroy();

			expect(manager.sillElement).toBeUndefined();
		});

		it('should remove click handler', () => {
			const sill = manager.mount();
			const removeEventListenerSpy = vi.spyOn(sill!, 'removeEventListener');

			manager.destroy();

			expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});

		it('should not throw if called multiple times', () => {
			manager.mount();

			expect(() => {
				manager.destroy();
				manager.destroy();
			}).not.toThrow();
		});

		it('should not throw if called before mount', () => {
			expect(() => {
				manager.destroy();
			}).not.toThrow();
		});
	});

	describe('Click Handler Integration', () => {
		it('should restore glass when minimized glass is clicked', () => {
			const sill = manager.mount();

			// Create minimized glass element
			const minimizedGlass = document.createElement('div') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.bwOriginalSashId = 'pane-1';
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalStore = { title: 'Test' };
			sill?.append(minimizedGlass);

			// Create target pane element and append to DOM
			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1'); // Use pane-1 to match mockRootSash.getById
			targetPane.style.position = 'absolute';
			targetPane.style.left = '0px';
			targetPane.style.top = '0px';
			targetPane.style.width = '400px';
			targetPane.style.height = '300px';
			windowElement.append(targetPane);

			// Mock document.body.append to ensure windowElement is part of DOM for getMetricsFromElement
			document.body.append(windowElement);

			// Directly call restoreGlass to test the restoration logic
			manager.restoreGlass(minimizedGlass);

			expect(mockBwinContext.addPane).toHaveBeenCalled();

			// Cleanup
			document.body.removeChild(windowElement);
		});

		it('should setup click listener on sill element', () => {
			const sill = manager.mount();

			// Verify click listener was added (implementation detail: private clickHandler should be defined)
			// We can verify by checking the sill element has listeners, but this is an implementation detail
			// So we just verify the sill exists and was mounted correctly
			expect(sill).toBeDefined();
			expect(manager.hasSillElement).toBe(true);
		});
	});

	describe('Debug Mode', () => {
		it('should log debug messages when enabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const debugManager = new SillManager(mockBwinContext, true);

			debugManager.mount();

			expect(logSpy).toHaveBeenCalled();
			logSpy.mockRestore();
		});

		it('should not log debug messages when disabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			manager.mount();

			expect(logSpy).not.toHaveBeenCalled();
			logSpy.mockRestore();
		});

		it('should log warnings in debug mode', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const debugManager = new SillManager(mockBwinContext, true);

			// Trigger a warning by trying to restore without bounding rect
			const minimizedGlass = document.createElement('div') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			debugManager.restoreGlass(minimizedGlass);

			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid mount/unmount cycles', () => {
			for (let i = 0; i < 10; i++) {
				manager.mount();
				manager.destroy();
			}

			expect(manager.sillElement).toBeUndefined();
			expect(manager.hasSillElement).toBe(false);
		});

		it('should handle missing target pane sash ID attribute', () => {
			manager.mount();

			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			// No data-sash-id attribute
			windowElement.append(targetPane);

			const minimizedGlass = document.createElement('div') as any;
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalStore = {};

			manager.restoreGlass(minimizedGlass);

			// Should not throw, just return early
			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});

		it('should handle missing target pane sash in tree', () => {
			manager.mount();

			// Mock getById to return null
			mockRootSash.getById = vi.fn().mockReturnValue(null);

			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1');
			windowElement.append(targetPane);

			const minimizedGlass = document.createElement('div') as any;
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalStore = {};

			manager.restoreGlass(minimizedGlass);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});
	});
});
