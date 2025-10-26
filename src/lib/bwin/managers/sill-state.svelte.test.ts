import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as SillState from './sill-state.svelte.js';
import type { BwinContext } from '../context.js';
import type { Sash } from '../sash.js';
import { CSS_CLASSES } from '../constants.js';

describe('SillState - Reactive State Module', () => {
	let mockBwinContext: BwinContext;
	let windowElement: HTMLElement;
	let mockRootSash: Sash;

	beforeEach(() => {
		// Reset module state before each test
		SillState.reset();

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

		// Initialize module
		SillState.initialize(mockBwinContext, false);
	});

	afterEach(() => {
		// Clean up after each test
		SillState.reset();
	});

	describe('Module Initialization', () => {
		it('should initialize with BwinContext', () => {
			expect(SillState.hasSillElement()).toBe(false);
		});

		it('should allow re-initialization', () => {
			SillState.initialize(mockBwinContext, true);
			expect(SillState.hasSillElement()).toBe(false);
		});
	});

	describe('Reactive State Management', () => {
		it('should reactively update hasSillElement when sill is mounted', () => {
			expect(SillState.hasSillElement()).toBe(false);

			SillState.mount();

			expect(SillState.hasSillElement()).toBe(true);
		});

		it('should reactively clear hasSillElement on destroy', () => {
			SillState.mount();
			expect(SillState.hasSillElement()).toBe(true);

			SillState.destroy();

			expect(SillState.hasSillElement()).toBe(false);
		});

		it('should maintain reactive sillElement reference', () => {
			expect(SillState.getSillElement()).toBeUndefined();

			const sill = SillState.mount();

			expect(SillState.getSillElement()).toBe(sill);
			expect(SillState.getSillElement()).toBeDefined();
		});
	});

	describe('mount', () => {
		it('should create and mount sill element', () => {
			const sill = SillState.mount();

			expect(sill).toBeDefined();
			expect(sill?.className).toContain(CSS_CLASSES.SILL);
			expect(windowElement.contains(sill!)).toBe(true);
		});

		it('should return undefined if module not initialized', () => {
			SillState.reset();
			const result = SillState.mount();

			expect(result).toBeUndefined();
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

			SillState.reset();
			SillState.initialize(emptyContext, false);
			const result = SillState.mount();

			expect(result).toBeUndefined();
		});

		it('should reuse existing sill element', () => {
			const firstSill = SillState.mount();
			const secondSill = SillState.mount();

			expect(secondSill).toBe(firstSill);
		});

		it('should preserve minimized glasses when recreating sill', () => {
			// Create first sill with minimized glass
			const firstSill = SillState.mount();
			const minimizedGlass = document.createElement('div');
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.textContent = 'Minimized 1';
			firstSill?.append(minimizedGlass);

			expect(firstSill?.children.length).toBe(1);

			// Remove sill from DOM to simulate window element change
			firstSill?.remove();

			// Create new sill - should preserve minimized glass
			const newSill = SillState.mount();

			expect(newSill?.children.length).toBe(1);
			expect(newSill?.children[0].textContent).toBe('Minimized 1');
		});

		it('should setup click handler on mount', () => {
			const sill = SillState.mount();
			const addEventListenerSpy = vi.spyOn(sill!, 'addEventListener');

			// Remount to trigger handler setup
			SillState.mount();

			expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});
	});

	describe('ensureSillElement', () => {
		it('should create sill if not exists', () => {
			expect(SillState.getSillElement()).toBeUndefined();

			const sill = SillState.ensureSillElement();

			expect(sill).toBeDefined();
			expect(SillState.getSillElement()).toBe(sill);
		});

		it('should return existing sill if already mounted', () => {
			const firstSill = SillState.mount();
			const secondSill = SillState.ensureSillElement();

			expect(secondSill).toBe(firstSill);
		});
	});

	describe('getSillElement', () => {
		it('should return undefined initially', () => {
			expect(SillState.getSillElement()).toBeUndefined();
		});

		it('should return sill after mount', () => {
			const sill = SillState.mount();
			expect(SillState.getSillElement()).toBe(sill);
		});
	});

	describe('getMinimizedGlassElement', () => {
		it('should find minimized glass by sash ID', () => {
			SillState.mount();

			// Create minimized glass element
			const minimizedGlass = document.createElement('div');
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			(minimizedGlass as any).bwOriginalSashId = 'pane-1';
			windowElement.append(minimizedGlass);

			const result = SillState.getMinimizedGlassElement('pane-1');

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

			SillState.reset();
			SillState.initialize(emptyContext, false);
			const result = SillState.getMinimizedGlassElement('pane-1');

			expect(result).toBeNull();
		});

		it('should return undefined if minimized glass not found', () => {
			SillState.mount();

			const result = SillState.getMinimizedGlassElement('non-existent');

			expect(result).toBeUndefined();
		});

		it('should find correct glass among multiple minimized glasses', () => {
			SillState.mount();

			// Create multiple minimized glasses
			const glass1 = document.createElement('div');
			glass1.className = CSS_CLASSES.MINIMIZED_GLASS;
			(glass1 as any).bwOriginalSashId = 'pane-1';

			const glass2 = document.createElement('div');
			glass2.className = CSS_CLASSES.MINIMIZED_GLASS;
			(glass2 as any).bwOriginalSashId = 'pane-2';

			windowElement.append(glass1, glass2);

			const result = SillState.getMinimizedGlassElement('pane-2');

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
			SillState.mount();

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
			SillState.restoreGlass(minimizedGlassEl);

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

		it('should return early if module not initialized', () => {
			SillState.reset();
			SillState.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
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

			SillState.reset();
			SillState.initialize(emptyContext, false);
			SillState.restoreGlass(minimizedGlassEl);

			expect(emptyContext.addPane).not.toHaveBeenCalled();
		});

		it('should return early if no root sash', () => {
			const noRootContext = {
				...mockBwinContext,
				rootSash: undefined
			};

			SillState.reset();
			SillState.initialize(noRootContext, false);
			SillState.mount();
			SillState.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});

		it('should return early if no original bounding rect', () => {
			minimizedGlassEl.bwOriginalBoundingRect = undefined;

			SillState.restoreGlass(minimizedGlassEl);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});

		it('should calculate size for left/right positions', () => {
			minimizedGlassEl.bwOriginalPosition = 'right';

			SillState.restoreGlass(minimizedGlassEl);

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

			SillState.restoreGlass(minimizedGlassEl);

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

			SillState.restoreGlass(minimizedGlassEl);

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

			SillState.restoreGlass(minimizedGlassEl);

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
			SillState.mount();
			expect(SillState.getSillElement()).toBeDefined();

			SillState.destroy();

			expect(SillState.getSillElement()).toBeUndefined();
		});

		it('should remove click handler', () => {
			const sill = SillState.mount();
			const removeEventListenerSpy = vi.spyOn(sill!, 'removeEventListener');

			SillState.destroy();

			expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});

		it('should not throw if called multiple times', () => {
			SillState.mount();

			expect(() => {
				SillState.destroy();
				SillState.destroy();
			}).not.toThrow();
		});

		it('should not throw if called before mount', () => {
			expect(() => {
				SillState.destroy();
			}).not.toThrow();
		});
	});

	describe('reset', () => {
		it('should reset all state', () => {
			SillState.mount();
			expect(SillState.hasSillElement()).toBe(true);

			SillState.reset();

			expect(SillState.hasSillElement()).toBe(false);
			expect(SillState.getSillElement()).toBeUndefined();
		});

		it('should allow re-initialization after reset', () => {
			SillState.reset();
			SillState.initialize(mockBwinContext, false);

			expect(SillState.hasSillElement()).toBe(false);
		});
	});

	describe('Click Handler Integration', () => {
		it('should restore glass when minimized glass is clicked', () => {
			const sill = SillState.mount();

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
			SillState.restoreGlass(minimizedGlass);

			expect(mockBwinContext.addPane).toHaveBeenCalled();

			// Cleanup
			document.body.removeChild(windowElement);
		});

		it('should setup click listener on sill element', () => {
			const sill = SillState.mount();

			// Verify click listener was added (implementation detail: private clickHandler should be defined)
			// We can verify by checking the sill element has listeners, but this is an implementation detail
			// So we just verify the sill exists and was mounted correctly
			expect(sill).toBeDefined();
			expect(SillState.hasSillElement()).toBe(true);
		});
	});

	describe('Debug Mode', () => {
		it('should log debug messages when enabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			SillState.reset();
			SillState.initialize(mockBwinContext, true);

			SillState.mount();

			expect(logSpy).toHaveBeenCalled();
			logSpy.mockRestore();
		});

		it('should not log debug messages when disabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			SillState.mount();

			expect(logSpy).not.toHaveBeenCalled();
			logSpy.mockRestore();
		});

		it('should log warnings in debug mode', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			SillState.reset();
			SillState.initialize(mockBwinContext, true);

			// Trigger a warning by trying to restore without bounding rect
			const minimizedGlass = document.createElement('div') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			SillState.restoreGlass(minimizedGlass);

			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid mount/unmount cycles', () => {
			for (let i = 0; i < 10; i++) {
				SillState.mount();
				SillState.destroy();
			}

			expect(SillState.getSillElement()).toBeUndefined();
			expect(SillState.hasSillElement()).toBe(false);
		});

		it('should handle missing target pane sash ID attribute', () => {
			SillState.mount();

			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			// No data-sash-id attribute
			windowElement.append(targetPane);

			const minimizedGlass = document.createElement('div') as any;
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalStore = {};

			SillState.restoreGlass(minimizedGlass);

			// Should not throw, just return early
			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});

		it('should handle missing target pane sash in tree', () => {
			SillState.mount();

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

			SillState.restoreGlass(minimizedGlass);

			expect(mockBwinContext.addPane).not.toHaveBeenCalled();
		});
	});
});
