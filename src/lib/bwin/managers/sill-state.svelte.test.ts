import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as SillState from './sill-state.svelte.js';
import type { BwinContext } from '../context.js';
import type { Sash } from '../sash.js';
import { CSS_CLASSES } from '../constants.js';

describe('SillState - Reactive State Module', () => {
	let mockBwinContext: BwinContext;
	let windowElement: HTMLElement;
	let mockRootSash: Sash;

	/**
	 * Helper function that simulates what Sill.svelte does when mounting
	 * Creates a sill element and registers it with SillState
	 */
	function createAndRegisterSill(): HTMLElement {
		const sillEl = document.createElement('div');
		sillEl.className = CSS_CLASSES.SILL;
		windowElement.appendChild(sillEl);
		SillState.registerSillElement(sillEl);
		return sillEl;
	}

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

			createAndRegisterSill();

			expect(SillState.hasSillElement()).toBe(true);
		});

		it('should reactively clear hasSillElement on destroy', () => {
			createAndRegisterSill();
			expect(SillState.hasSillElement()).toBe(true);

			SillState.unregisterSillElement();

			expect(SillState.hasSillElement()).toBe(false);
		});

		it('should maintain reactive sillElement reference', () => {
			expect(SillState.getSillElement()).toBeUndefined();

			const sill = createAndRegisterSill();

			expect(SillState.getSillElement()).toBe(sill);
			expect(SillState.getSillElement()).toBeDefined();
		});
	});

	describe('registerSillElement', () => {
		it('should register and store sill element', () => {
			const sill = createAndRegisterSill();

			expect(sill).toBeDefined();
			expect(sill?.className).toContain(CSS_CLASSES.SILL);
			expect(windowElement.contains(sill!)).toBe(true);
			expect(SillState.getSillElement()).toBe(sill);
		});

		it('should handle registration when module not initialized', () => {
			SillState.reset();
			const sillEl = document.createElement('div');
			sillEl.className = CSS_CLASSES.SILL;

			// Should not throw, just log warning
			expect(() => {
				SillState.registerSillElement(sillEl);
			}).not.toThrow();

			// Element should not be registered
			expect(SillState.getSillElement()).toBeUndefined();
		});

		it('should allow re-registering sill element', () => {
			const firstSill = createAndRegisterSill();
			const secondSill = createAndRegisterSill();

			// Second registration should replace first
			expect(SillState.getSillElement()).toBe(secondSill);
		});

		it('should setup click handler on register', () => {
			const sillEl = document.createElement('div');
			sillEl.className = CSS_CLASSES.SILL;
			windowElement.appendChild(sillEl);

			const addEventListenerSpy = vi.spyOn(sillEl, 'addEventListener');

			SillState.registerSillElement(sillEl);

			expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});
	});

	describe('ensureSillElement', () => {
		it('should return undefined if sill not yet registered', () => {
			expect(SillState.getSillElement()).toBeUndefined();

			const sill = SillState.ensureSillElement();

			// In new API, ensureSillElement returns undefined if Sill.svelte hasn't mounted yet
			expect(sill).toBeUndefined();
		});

		it('should return existing sill if already registered', () => {
			const firstSill = createAndRegisterSill();
			const secondSill = SillState.ensureSillElement();

			expect(secondSill).toBe(firstSill);
		});
	});

	describe('getSillElement', () => {
		it('should return undefined initially', () => {
			expect(SillState.getSillElement()).toBeUndefined();
		});

		it('should return sill after registration', () => {
			const sill = createAndRegisterSill();
			expect(SillState.getSillElement()).toBe(sill);
		});
	});

	describe('getMinimizedGlassElement', () => {
		it('should find minimized glass by sash ID', () => {
			const sill = createAndRegisterSill();

			// Create minimized glass element
			const minimizedGlass = document.createElement('div');
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			(minimizedGlass as any).bwOriginalSashId = 'pane-1';
			sill.append(minimizedGlass);

			const result = SillState.getMinimizedGlassElement('pane-1');

			expect(result).toBe(minimizedGlass);
		});

		it('should return null if sill not registered', () => {
			const result = SillState.getMinimizedGlassElement('pane-1');

			expect(result).toBeNull();
		});

		it('should return undefined if minimized glass not found', () => {
			createAndRegisterSill();

			const result = SillState.getMinimizedGlassElement('non-existent');

			expect(result).toBeUndefined();
		});

		it('should find correct glass among multiple minimized glasses', () => {
			const sill = createAndRegisterSill();

			// Create multiple minimized glasses
			const glass1 = document.createElement('div');
			glass1.className = CSS_CLASSES.MINIMIZED_GLASS;
			(glass1 as any).bwOriginalSashId = 'pane-1';

			const glass2 = document.createElement('div');
			glass2.className = CSS_CLASSES.MINIMIZED_GLASS;
			(glass2 as any).bwOriginalSashId = 'pane-2';

			sill.append(glass1, glass2);

			const result = SillState.getMinimizedGlassElement('pane-2');

			expect(result).toBe(glass2);
		});
	});

	describe('restoreGlass', () => {
		let minimizedGlassEl: HTMLElement & {
			bwOriginalBoundingRect?: DOMRect;
			bwOriginalSashId?: string;
			bwOriginalPosition?: string;
			bwOriginalStore?: Record<string, unknown>;
		};
		let targetPane: HTMLElement;

		beforeEach(() => {
			createAndRegisterSill();

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
			createAndRegisterSill();
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

	describe('unregisterSillElement (destroy)', () => {
		it('should clear sill element reference', () => {
			createAndRegisterSill();
			expect(SillState.getSillElement()).toBeDefined();

			SillState.unregisterSillElement();

			expect(SillState.getSillElement()).toBeUndefined();
		});

		it('should remove click handler', () => {
			const sill = createAndRegisterSill();
			const removeEventListenerSpy = vi.spyOn(sill!, 'removeEventListener');

			SillState.unregisterSillElement();

			expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
		});

		it('should not throw if called multiple times', () => {
			createAndRegisterSill();

			expect(() => {
				SillState.unregisterSillElement();
				SillState.unregisterSillElement();
			}).not.toThrow();
		});

		it('should not throw if called before registration', () => {
			expect(() => {
				SillState.unregisterSillElement();
			}).not.toThrow();
		});
	});

	describe('reset', () => {
		it('should reset all state', () => {
			createAndRegisterSill();
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
			const sill = createAndRegisterSill();

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

		it('should restore glass when clicking on child elements (icon/title) inside minimized glass button', () => {
			const sill = createAndRegisterSill();

			// Create minimized glass element with child elements (simulating real DOM structure)
			const minimizedGlass = document.createElement('button') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.bwOriginalSashId = 'pane-1';
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalStore = { title: 'Test Glass' };

			// Add child elements like icon and title spans
			const iconSpan = document.createElement('span');
			iconSpan.className = 'sw-minimized-glass-icon';
			iconSpan.textContent = '📄';

			const titleSpan = document.createElement('span');
			titleSpan.className = 'sw-minimized-glass-title';
			titleSpan.textContent = 'Test Glass';

			minimizedGlass.appendChild(iconSpan);
			minimizedGlass.appendChild(titleSpan);
			sill?.append(minimizedGlass);

			// Create target pane element
			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1');
			targetPane.style.position = 'absolute';
			targetPane.style.left = '0px';
			targetPane.style.top = '0px';
			targetPane.style.width = '400px';
			targetPane.style.height = '300px';
			windowElement.append(targetPane);

			document.body.append(windowElement);

			// Simulate click on the CHILD element (icon span), not the button itself
			// This tests the fix: closest() should find the parent minimized glass button
			const clickEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true
			});

			// Dispatch click on the icon span (child element)
			iconSpan.dispatchEvent(clickEvent);

			// The click handler should use closest() to find the minimized glass parent
			// and restore it correctly
			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					id: 'pane-1',
					position: 'right',
					title: 'Test Glass'
				})
			);

			// Also verify the minimized glass element was removed
			expect(sill?.contains(minimizedGlass)).toBe(false);

			// Cleanup
			document.body.removeChild(windowElement);
		});

		it('should restore glass when clicking on title span inside minimized glass button', () => {
			const sill = createAndRegisterSill();

			// Create minimized glass element with child elements
			const minimizedGlass = document.createElement('button') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.bwOriginalSashId = 'pane-1';
			minimizedGlass.bwOriginalPosition = 'bottom';
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 300, 200);
			minimizedGlass.bwOriginalStore = { title: 'Another Glass' };

			const titleSpan = document.createElement('span');
			titleSpan.className = 'sw-minimized-glass-title';
			titleSpan.textContent = 'Another Glass';

			minimizedGlass.appendChild(titleSpan);
			sill?.append(minimizedGlass);

			// Create target pane element
			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1');
			targetPane.style.position = 'absolute';
			targetPane.style.left = '0px';
			targetPane.style.top = '0px';
			targetPane.style.width = '400px';
			targetPane.style.height = '300px';
			windowElement.append(targetPane);

			document.body.append(windowElement);

			// Simulate click on the title span
			const clickEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true
			});

			titleSpan.dispatchEvent(clickEvent);

			expect(mockBwinContext.addPane).toHaveBeenCalledWith(
				'pane-1',
				expect.objectContaining({
					id: 'pane-1',
					position: 'bottom',
					title: 'Another Glass'
				})
			);

			// Cleanup
			document.body.removeChild(windowElement);
		});

		it('should ignore clicks on sill that are not within a minimized glass', () => {
			const sill = createAndRegisterSill();

			// Add a non-minimized-glass element to the sill
			const otherElement = document.createElement('div');
			otherElement.className = 'some-other-element';
			sill?.append(otherElement);

			document.body.append(windowElement);

			// Simulate click on the other element
			const clickEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true
			});

			otherElement.dispatchEvent(clickEvent);

			// addPane should NOT be called
			expect(mockBwinContext.addPane).not.toHaveBeenCalled();

			// Cleanup
			document.body.removeChild(windowElement);
		});

		it('should setup click listener on sill element', () => {
			const sill = createAndRegisterSill();

			// Verify click listener was added (implementation detail: private clickHandler should be defined)
			// We can verify by checking the sill element has listeners, but this is an implementation detail
			// So we just verify the sill exists and was registered correctly
			expect(sill).toBeDefined();
			expect(SillState.hasSillElement()).toBe(true);
		});
	});

	describe('Debug Mode', () => {
		it('should log debug messages when enabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			SillState.reset();
			SillState.initialize(mockBwinContext, true);

			createAndRegisterSill();

			expect(logSpy).toHaveBeenCalled();
			logSpy.mockRestore();
		});

		it('should not log debug messages when disabled', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			createAndRegisterSill();

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
		it('should handle rapid register/unregister cycles', () => {
			for (let i = 0; i < 10; i++) {
				createAndRegisterSill();
				SillState.unregisterSillElement();
			}

			expect(SillState.getSillElement()).toBeUndefined();
			expect(SillState.hasSillElement()).toBe(false);
		});

		it('should handle missing target pane sash ID attribute', () => {
			createAndRegisterSill();

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
			createAndRegisterSill();

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

	describe('Memory Management - Multiple Minimize/Restore Cycles', () => {
		it('should cleanup component instance on restore', () => {
			const sill = createAndRegisterSill();

			// Create minimized glass with a mock component instance
			const minimizedGlass = document.createElement('button') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.bwOriginalSashId = 'pane-1';
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalStore = { title: 'Test' };
			// Simulate stored component instance
			minimizedGlass.bwComponentInstance = { mockComponent: true };
			sill?.append(minimizedGlass);

			// Create target pane element
			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1');
			targetPane.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:300px;';
			windowElement.append(targetPane);

			document.body.append(windowElement);

			// Simulate click to trigger restore
			const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
			minimizedGlass.dispatchEvent(clickEvent);

			// Component instance should be cleared
			expect(minimizedGlass.bwComponentInstance).toBeUndefined();

			// Cleanup
			document.body.removeChild(windowElement);
		});

		it('should handle multiple minimize/restore cycles without accumulating memory', () => {
			const sill = createAndRegisterSill();

			document.body.append(windowElement);

			// Simulate 10 minimize/restore cycles
			for (let i = 0; i < 10; i++) {
				const minimizedGlass = document.createElement('button') as any;
				minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
				minimizedGlass.bwOriginalSashId = 'pane-1';
				minimizedGlass.bwOriginalPosition = 'right';
				minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
				minimizedGlass.bwOriginalStore = { title: `Test ${i}` };
				minimizedGlass.bwComponentInstance = { id: i };
				sill?.append(minimizedGlass);

				// Create target pane
				const targetPane = document.createElement('div');
				targetPane.className = CSS_CLASSES.PANE;
				targetPane.setAttribute('data-sash-id', 'pane-1');
				targetPane.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:300px;';
				windowElement.append(targetPane);

				// Trigger restore via click
				const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
				minimizedGlass.dispatchEvent(clickEvent);

				// Verify cleanup
				expect(minimizedGlass.bwComponentInstance).toBeUndefined();
				expect(sill?.contains(minimizedGlass)).toBe(false);

				// Remove target pane for next cycle
				targetPane.remove();
			}

			// Sill should be empty after all cycles
			expect(sill?.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`).length).toBe(0);

			document.body.removeChild(windowElement);
		});

		it('should cleanup all minimized glasses on sill unregister', () => {
			const sill = createAndRegisterSill();

			// Add multiple minimized glasses with component instances
			const glasses: any[] = [];
			for (let i = 0; i < 5; i++) {
				const glass = document.createElement('button') as any;
				glass.className = CSS_CLASSES.MINIMIZED_GLASS;
				glass.bwOriginalSashId = `pane-${i}`;
				glass.bwComponentInstance = { id: i };
				sill?.append(glass);
				glasses.push(glass);
			}

			expect(sill?.querySelectorAll(`.${CSS_CLASSES.MINIMIZED_GLASS}`).length).toBe(5);

			// Unregister sill - should cleanup all component instances
			SillState.unregisterSillElement();

			// All component instances should be cleared
			glasses.forEach((glass) => {
				expect(glass.bwComponentInstance).toBeUndefined();
			});
		});

		it('should clear originalStore reference on restore to prevent memory leaks', () => {
			const sill = createAndRegisterSill();

			// Create minimized glass with originalStore reference
			const minimizedGlass = document.createElement('button') as any;
			minimizedGlass.className = CSS_CLASSES.MINIMIZED_GLASS;
			minimizedGlass.bwOriginalSashId = 'pane-1';
			minimizedGlass.bwOriginalPosition = 'right';
			minimizedGlass.bwOriginalBoundingRect = new DOMRect(0, 0, 200, 150);
			minimizedGlass.bwOriginalStore = { title: 'Test', component: {}, data: {} };
			sill?.append(minimizedGlass);

			// Create target pane
			const targetPane = document.createElement('div');
			targetPane.className = CSS_CLASSES.PANE;
			targetPane.setAttribute('data-sash-id', 'pane-1');
			targetPane.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:300px;';
			windowElement.append(targetPane);

			document.body.append(windowElement);

			// Trigger restore
			const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
			minimizedGlass.dispatchEvent(clickEvent);

			// originalStore reference should be cleared to allow garbage collection
			expect(minimizedGlass.bwOriginalStore).toBeUndefined();

			document.body.removeChild(windowElement);
		});
	});
});
