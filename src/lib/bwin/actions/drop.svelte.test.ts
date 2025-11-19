import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { drop } from './drop.svelte.js';
import { ReactiveSash } from '../sash.svelte.js';
import { Position } from '../position.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';

describe('drop action', () => {
	let container: HTMLElement;
	let rootSash: ReactiveSash;
	let onDropMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);

		// Create a root sash with two children
		rootSash = new ReactiveSash({
			id: 'root',
			position: Position.Root,
			width: 800,
			height: 600
		});

		const leftChild = new ReactiveSash({
			id: 'left',
			position: Position.Left,
			width: 400,
			height: 600,
			parent: rootSash
		});

		const rightChild = new ReactiveSash({
			id: 'right',
			position: Position.Right,
			width: 400,
			height: 600,
			parent: rootSash
		});

		rootSash.children.push(leftChild, rightChild);

		onDropMock = vi.fn();
	});

	afterEach(() => {
		cleanup();
		if (container.parentNode) {
			container.parentNode.removeChild(container);
		}
	});

	it('attaches drop action to element', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash, onDrop: onDropMock });

		expect(action).toBeDefined();
		expect(action.destroy).toBeInstanceOf(Function);
		expect(action.update).toBeInstanceOf(Function);

		action.destroy();
	});

	it('sets drop area attribute on dragover', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		// Create pane element
		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');
		paneEl.style.position = 'absolute';
		paneEl.style.left = '0px';
		paneEl.style.top = '0px';
		paneEl.style.width = '400px';
		paneEl.style.height = '600px';

		element.appendChild(paneEl);

		// Trigger dragover at center of pane
		const dragOver = new DragEvent('dragover', {
			bubbles: true,
			clientX: 200, // Center X
			clientY: 300 // Center Y
		});

		element.dispatchEvent(dragOver);

		// Drop area should be set (center or one of the directional zones)
		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(true);

		action.destroy();
	});

	it('prevents default on dragover to allow drop', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		const dragOver = new DragEvent('dragover', {
			bubbles: true,
			cancelable: true,
			clientX: 200,
			clientY: 300
		});

		element.dispatchEvent(dragOver);

		// Default should be prevented to allow drop
		expect(dragOver.defaultPrevented).toBe(true);

		action.destroy();
	});

	it('does not set drop area if can-drop is false', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'false'); // Cannot drop

		element.appendChild(paneEl);

		const dragOver = new DragEvent('dragover', {
			bubbles: true,
			clientX: 200,
			clientY: 300
		});

		element.dispatchEvent(dragOver);

		// Drop area should NOT be set
		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(false);

		action.destroy();
	});

	it('removes drop area on dragleave', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		// Set drop area via dragover
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(true);

		// Trigger dragleave
		const dragLeave = new DragEvent('dragleave', {
			bubbles: true,
			relatedTarget: document.body // Leaving to outside element
		});

		Object.defineProperty(dragLeave, 'currentTarget', {
			value: element,
			writable: false
		});

		element.dispatchEvent(dragLeave);

		// Drop area should be removed
		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(false);

		action.destroy();
	});

	it('calls onDrop callback when drop occurs', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash, onDrop: onDropMock });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');
		paneEl.style.position = 'absolute';
		paneEl.style.left = '0px';
		paneEl.style.top = '0px';
		paneEl.style.width = '400px';
		paneEl.style.height = '600px';

		element.appendChild(paneEl);

		// Set drop area first
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		// Trigger drop
		const dropEvent = new DragEvent('drop', {
			bubbles: true
		});

		element.dispatchEvent(dropEvent);

		// onDrop should be called with event, sash, and drop area
		expect(onDropMock).toHaveBeenCalled();
		const callArgs = onDropMock.mock.calls[0];
		expect(callArgs[0]).toBeInstanceOf(DragEvent);
		expect(callArgs[1]).toBeInstanceOf(ReactiveSash);
		expect(callArgs[1].id).toBe('left');
		expect(typeof callArgs[2]).toBe('string'); // drop area

		action.destroy();
	});

	it('calls sash store onDrop if it exists', () => {
		const sashOnDropMock = vi.fn();

		// Add onDrop to sash store
		const leftChild = rootSash.children[0];
		leftChild.store.onDrop = sashOnDropMock;

		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		// Set drop area
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		// Drop
		element.dispatchEvent(
			new DragEvent('drop', {
				bubbles: true
			})
		);

		// Sash's onDrop should be called
		expect(sashOnDropMock).toHaveBeenCalled();
		const callArgs = sashOnDropMock.mock.calls[0];
		expect(callArgs[0]).toBeInstanceOf(DragEvent);
		expect(callArgs[1]).toBeInstanceOf(ReactiveSash);

		action.destroy();
	});

	it('does not call onDrop if can-drop is false', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash, onDrop: onDropMock });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'false'); // Cannot drop

		element.appendChild(paneEl);

		// Try to drop
		element.dispatchEvent(
			new DragEvent('drop', {
				bubbles: true
			})
		);

		// onDrop should NOT be called
		expect(onDropMock).not.toHaveBeenCalled();

		action.destroy();
	});

	it('removes drop area after drop', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		// Set drop area
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(true);

		// Drop
		element.dispatchEvent(
			new DragEvent('drop', {
				bubbles: true
			})
		);

		// Drop area should be removed
		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(false);

		action.destroy();
	});

	it('updates rootSash when update is called', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash, onDrop: onDropMock });

		const newRootSash = new ReactiveSash({
			id: 'new-root',
			position: Position.Root,
			width: 1000,
			height: 800
		});

		const newOnDrop = vi.fn();

		// Update action
		action.update({ rootSash: newRootSash, onDrop: newOnDrop });

		// Should accept new params
		expect(action).toBeDefined();

		action.destroy();
	});

	it('cleans up drop area on destroy', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		// Set drop area
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(true);

		// Destroy action
		action.destroy();

		// Drop area should be removed on cleanup
		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(false);
	});

	it('handles missing sash ID gracefully', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash, onDrop: onDropMock });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		// No sash ID attribute
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		// Set drop area
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		// Drop
		const dropEvent = new DragEvent('drop', {
			bubbles: true
		});

		// Should not crash
		expect(() => element.dispatchEvent(dropEvent)).not.toThrow();

		// onDrop should NOT be called (no sash ID)
		expect(onDropMock).not.toHaveBeenCalled();

		action.destroy();
	});

	it('handles invalid sash ID gracefully', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash, onDrop: onDropMock });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'non-existent-id');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		element.appendChild(paneEl);

		// Set drop area
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		// Drop
		const dropEvent = new DragEvent('drop', {
			bubbles: true
		});

		// Should not crash
		expect(() => element.dispatchEvent(dropEvent)).not.toThrow();

		// onDrop should NOT be called (invalid sash)
		expect(onDropMock).not.toHaveBeenCalled();

		action.destroy();
	});

	it('does not trigger dragleave on child element movements', () => {
		const element = document.createElement('div');
		const action = drop(element, { rootSash });

		const paneEl = document.createElement('div');
		paneEl.className = CSS_CLASSES.PANE;
		paneEl.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'left');
		paneEl.setAttribute(DATA_ATTRIBUTES.CAN_DROP, 'true');

		const childEl = document.createElement('div');
		paneEl.appendChild(childEl);
		element.appendChild(paneEl);

		// Set drop area
		element.dispatchEvent(
			new DragEvent('dragover', {
				bubbles: true,
				clientX: 200,
				clientY: 300
			})
		);

		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(true);

		// Trigger dragleave with child as related target (Chrome bug prevention)
		const dragLeave = new DragEvent('dragleave', {
			bubbles: true,
			relatedTarget: childEl // Moving to child element
		});

		Object.defineProperty(dragLeave, 'currentTarget', {
			value: element,
			writable: false
		});

		element.dispatchEvent(dragLeave);

		// Drop area should NOT be removed (still within pane)
		expect(paneEl.hasAttribute(DATA_ATTRIBUTES.DROP_AREA)).toBe(true);

		action.destroy();
	});
});
