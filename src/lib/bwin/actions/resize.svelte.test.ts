import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import { resize } from './resize.svelte.js';
import { ReactiveSash } from '../sash.svelte.js';
import { Position } from '../position.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';

describe('resize action', () => {
	let container: HTMLElement;
	let rootSash: ReactiveSash;
	let onUpdateMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Create container
		container = document.createElement('div');
		document.body.appendChild(container);

		// Create a root sash with two children (left-right split)
		rootSash = new ReactiveSash({
			id: 'root',
			position: Position.Root,
			left: 0,
			top: 0,
			width: 800,
			height: 600
		});

		const leftChild = new ReactiveSash({
			id: 'left',
			position: Position.Left,
			left: 0,
			top: 0,
			width: 400,
			height: 600,
			minWidth: 100,
			parent: rootSash
		});

		const rightChild = new ReactiveSash({
			id: 'right',
			position: Position.Right,
			left: 400,
			top: 0,
			width: 400,
			height: 600,
			minWidth: 100,
			parent: rootSash
		});

		rootSash.children.push(leftChild, rightChild);

		onUpdateMock = vi.fn();
	});

	afterEach(() => {
		cleanup();
		if (container.parentNode) {
			container.parentNode.removeChild(container);
		}
		// Clean up body classes
		document.body.classList.remove('body--bw-resize-x', 'body--bw-resize-y');
	});

	it('attaches resize action to element', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash, onUpdate: onUpdateMock });

		expect(action).toBeDefined();
		expect(action.destroy).toBeInstanceOf(Function);

		action.destroy();
	});

	it('does not start resize if target is not a muntin', () => {
		const element = document.createElement('div');
		resize(element, { rootSash });

		const notMuntin = document.createElement('div');
		element.appendChild(notMuntin);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 400,
			clientY: 300
		});

		notMuntin.dispatchEvent(mouseDown);

		// Body classes should not be added
		expect(document.body.classList.contains('body--bw-resize-x')).toBe(false);
		expect(document.body.classList.contains('body--bw-resize-y')).toBe(false);
	});

	it('starts resize when clicking on vertical muntin', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash });

		// Create a muntin element
		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, rootSash.id);
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 400,
			clientY: 300
		});

		muntin.dispatchEvent(mouseDown);

		// Vertical muntin should add x-resize class
		expect(document.body.classList.contains('body--bw-resize-x')).toBe(true);

		action.destroy();
	});

	it('starts resize when clicking on horizontal muntin', () => {
		// Create top-bottom split
		const topBottom = new ReactiveSash({
			id: 'root-tb',
			position: Position.Root,
			width: 800,
			height: 600
		});

		const topChild = new ReactiveSash({
			id: 'top',
			position: Position.Top,
			width: 800,
			height: 300,
			parent: topBottom
		});

		const bottomChild = new ReactiveSash({
			id: 'bottom',
			position: Position.Bottom,
			width: 800,
			height: 300,
			parent: topBottom
		});

		topBottom.children.push(topChild, bottomChild);

		const element = document.createElement('div');
		const action = resize(element, { rootSash: topBottom });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} horizontal`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, topBottom.id);
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 400,
			clientY: 300
		});

		muntin.dispatchEvent(mouseDown);

		// Horizontal muntin should add y-resize class
		expect(document.body.classList.contains('body--bw-resize-y')).toBe(true);

		action.destroy();
	});

	it('does not start resize if muntin is marked non-resizable', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, rootSash.id);
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'false'); // Non-resizable
		element.appendChild(muntin);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 400,
			clientY: 300
		});

		muntin.dispatchEvent(mouseDown);

		// Should not add body class
		expect(document.body.classList.contains('body--bw-resize-x')).toBe(false);

		action.destroy();
	});

	it('updates action params when update is called', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash, onUpdate: onUpdateMock });

		const newRootSash = new ReactiveSash({
			position: Position.Root,
			width: 1000,
			height: 800
		});

		const newOnUpdate = vi.fn();

		// Update params
		if (action.update) {
			action.update({ rootSash: newRootSash, onUpdate: newOnUpdate });
		}

		// Should accept new params (verified by no errors)
		expect(action).toBeDefined();

		action.destroy();
	});

	it('cleans up event listeners on destroy', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, rootSash.id);
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		// Start resize
		muntin.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 400,
				clientY: 300
			})
		);

		expect(document.body.classList.contains('body--bw-resize-x')).toBe(true);

		// Destroy action
		action.destroy();

		// Try to trigger mouse move (should not crash)
		document.dispatchEvent(
			new MouseEvent('mousemove', {
				bubbles: true,
				clientX: 450,
				clientY: 300
			})
		);

		// Should not cause errors
		expect(true).toBe(true);
	});

	it('removes body classes on mouse up', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, rootSash.id);
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		// Start resize
		muntin.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 400,
				clientY: 300
			})
		);

		expect(document.body.classList.contains('body--bw-resize-x')).toBe(true);

		// End resize
		document.dispatchEvent(
			new MouseEvent('mouseup', {
				bubbles: true
			})
		);

		// Body classes should be removed
		expect(document.body.classList.contains('body--bw-resize-x')).toBe(false);

		action.destroy();
	});

	it('calls onUpdate callback during resize', async () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash, onUpdate: onUpdateMock });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, rootSash.id);
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		// Start resize
		muntin.dispatchEvent(
			new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 400,
				clientY: 300,
				pageX: 400,
				pageY: 300
			})
		);

		// Move mouse
		document.dispatchEvent(
			new MouseEvent('mousemove', {
				bubbles: true,
				clientX: 450,
				clientY: 300,
				pageX: 450,
				pageY: 300
			})
		);

		// Wait for RAF
		await new Promise((resolve) => requestAnimationFrame(resolve));

		// onUpdate should have been called
		expect(onUpdateMock).toHaveBeenCalled();

		action.destroy();
	});

	it('handles missing sash ID gracefully', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		// No sash ID attribute
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 400,
			clientY: 300
		});

		// Should not crash
		expect(() => muntin.dispatchEvent(mouseDown)).not.toThrow();

		// Should not start resize
		expect(document.body.classList.contains('body--bw-resize-x')).toBe(false);

		action.destroy();
	});

	it('handles invalid sash ID gracefully', () => {
		const element = document.createElement('div');
		const action = resize(element, { rootSash });

		const muntin = document.createElement('div');
		muntin.className = `${CSS_CLASSES.MUNTIN} vertical`;
		muntin.setAttribute(DATA_ATTRIBUTES.SASH_ID, 'non-existent-id');
		muntin.setAttribute(DATA_ATTRIBUTES.RESIZABLE, 'true');
		element.appendChild(muntin);

		const mouseDown = new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 400,
			clientY: 300
		});

		// Should not crash
		expect(() => muntin.dispatchEvent(mouseDown)).not.toThrow();

		// Should not start resize
		expect(document.body.classList.contains('body--bw-resize-x')).toBe(false);

		action.destroy();
	});
});
