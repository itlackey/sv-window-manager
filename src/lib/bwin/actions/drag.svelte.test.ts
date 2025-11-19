import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { drag } from './drag.svelte.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';

describe('drag action', () => {
	let container: HTMLElement;
	let onDragStartMock: ReturnType<typeof vi.fn>;
	let onDragEndMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);

		onDragStartMock = vi.fn();
		onDragEndMock = vi.fn();
	});

	afterEach(() => {
		cleanup();
		if (container.parentNode) {
			container.parentNode.removeChild(container);
		}
	});

	it('attaches drag action to element', () => {
		const element = document.createElement('div');
		const action = drag(element, { onDragStart: onDragStartMock, onDragEnd: onDragEndMock });

		expect(action).toBeDefined();
		expect(action.destroy).toBeInstanceOf(Function);

		action.destroy();
	});

	it('makes glass draggable on header mousedown', () => {
		const element = document.createElement('div');
		const action = drag(element);

		// Create glass structure
		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Trigger mousedown on header
		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			button: 0 // Left button
		});

		headerEl.dispatchEvent(mouseDown);

		// Glass should be draggable
		expect(glassEl.getAttribute('draggable')).toBe('true');

		action.destroy();
	});

	it('does not make glass draggable on right-click', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Trigger right-click (button: 2)
		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			button: 2 // Right button
		});

		headerEl.dispatchEvent(mouseDown);

		// Glass should NOT be draggable
		expect(glassEl.getAttribute('draggable')).not.toBe('true');

		action.destroy();
	});

	it('does not initiate drag when clicking action buttons', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;

		const actionButton = document.createElement('button');
		actionButton.className = CSS_CLASSES.GLASS_ACTION;

		headerEl.appendChild(actionButton);
		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Click on action button
		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			button: 0
		});

		actionButton.dispatchEvent(mouseDown);

		// Glass should NOT be draggable (action buttons have priority)
		expect(glassEl.getAttribute('draggable')).not.toBe('true');

		action.destroy();
	});

	it('does not initiate drag when clicking tabs', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;

		const tab = document.createElement('div');
		tab.className = CSS_CLASSES.GLASS_TAB;

		headerEl.appendChild(tab);
		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Click on tab
		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			button: 0
		});

		tab.dispatchEvent(mouseDown);

		// Glass should NOT be draggable (tabs have priority)
		expect(glassEl.getAttribute('draggable')).not.toBe('true');

		action.destroy();
	});

	it('respects can-drag=false attribute', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'false'); // Cannot drag

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			button: 0
		});

		headerEl.dispatchEvent(mouseDown);

		// Glass should NOT be draggable
		expect(glassEl.getAttribute('draggable')).not.toBe('true');

		action.destroy();
	});

	it('removes draggable attribute on mouseup', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Start drag
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		expect(glassEl.getAttribute('draggable')).toBe('true');

		// End drag
		document.dispatchEvent(
			new MouseEvent('mouseup', {
				bubbles: true
			})
		);

		// Draggable should be removed
		expect(glassEl.hasAttribute('draggable')).toBe(false);

		action.destroy();
	});

	it('calls onDragStart callback when drag starts', () => {
		const element = document.createElement('div');
		const action = drag(element, { onDragStart: onDragStartMock });

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;
		glassEl.setAttribute('draggable', 'true');

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Make glass draggable first
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		// Trigger dragstart
		const dragStart = new DragEvent('dragstart', {
			bubbles: true,
			dataTransfer: new DataTransfer()
		});

		glassEl.dispatchEvent(dragStart);

		// Callback should be called with glass element
		expect(onDragStartMock).toHaveBeenCalledWith(glassEl);

		action.destroy();
	});

	it('calls onDragEnd callback when drag ends', () => {
		const element = document.createElement('div');
		const action = drag(element, { onDragEnd: onDragEndMock });

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Start drag
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		glassEl.dispatchEvent(
			new DragEvent('dragstart', {
				bubbles: true
			})
		);

		// End drag
		const dragEnd = new DragEvent('dragend', {
			bubbles: true
		});

		glassEl.dispatchEvent(dragEnd);

		// Callback should be called with glass element
		expect(onDragEndMock).toHaveBeenCalledWith(glassEl);

		action.destroy();
	});

	it('sets can-drop=false on pane during drag', () => {
		const element = document.createElement('div');
		const action = drag(element);

		// Create pane > glass > header structure
		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		paneEl.appendChild(glassEl);
		element.appendChild(paneEl);

		// Start drag
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		// Trigger dragstart
		glassEl.dispatchEvent(
			new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			})
		);

		// Pane should have can-drop=false during drag
		expect(paneEl.getAttribute(DATA_ATTRIBUTES.CAN_DROP)).toBe('false');

		action.destroy();
	});

	it('restores can-drop attribute on drag end', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		paneEl.appendChild(glassEl);
		element.appendChild(paneEl);

		// Start drag
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		glassEl.dispatchEvent(
			new DragEvent('dragstart', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			})
		);

		expect(paneEl.getAttribute(DATA_ATTRIBUTES.CAN_DROP)).toBe('false');

		// End drag
		glassEl.dispatchEvent(
			new DragEvent('dragend', {
				bubbles: true
			})
		);

		// Should restore original value
		expect(paneEl.getAttribute(DATA_ATTRIBUTES.CAN_DROP)).toBe('true');

		action.destroy();
	});

	it('sets effectAllowed on dataTransfer', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Start drag
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		const dataTransfer = new DataTransfer();
		const dragStart = new DragEvent('dragstart', {
			bubbles: true,
			dataTransfer
		});

		glassEl.dispatchEvent(dragStart);

		// effectAllowed should be set to 'move'
		expect(dataTransfer.effectAllowed).toBe('move');

		action.destroy();
	});

	it('cleans up event listeners on destroy', () => {
		const element = document.createElement('div');
		const action = drag(element, {
			onDragStart: onDragStartMock,
			onDragEnd: onDragEndMock
		});

		const glassEl = document.createElement('div');
		glassEl.className = CSS_CLASSES.GLASS;

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');

		glassEl.appendChild(headerEl);
		element.appendChild(glassEl);

		// Start drag
		headerEl.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				button: 0
			})
		);

		// Destroy action
		action.destroy();

		// Reset mocks
		onDragStartMock.mockClear();
		onDragEndMock.mockClear();

		// Try to trigger drag events (should not call callbacks)
		glassEl.dispatchEvent(
			new DragEvent('dragstart', {
				bubbles: true
			})
		);

		glassEl.dispatchEvent(
			new DragEvent('dragend', {
				bubbles: true
			})
		);

		// Callbacks should NOT be called after destroy
		expect(onDragStartMock).not.toHaveBeenCalled();
		expect(onDragEndMock).not.toHaveBeenCalled();
	});

	it('handles missing glass element gracefully', () => {
		const element = document.createElement('div');
		const action = drag(element);

		const headerEl = document.createElement('div');
		headerEl.className = CSS_CLASSES.GLASS_HEADER;
		headerEl.setAttribute(DATA_ATTRIBUTES.CAN_DRAG, 'true');
		// Header not inside glass element

		element.appendChild(headerEl);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			button: 0
		});

		// Should not crash
		expect(() => headerEl.dispatchEvent(mouseDown)).not.toThrow();

		action.destroy();
	});
});
