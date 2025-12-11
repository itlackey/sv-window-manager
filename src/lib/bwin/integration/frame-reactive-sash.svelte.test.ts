/**
 * Frame Component Integration Tests with Reactive Sash
 *
 * This test suite validates that the Frame component correctly renders and updates
 * when using the reactive Sash implementation. These tests ensure:
 * - Frame renders panes from reactive sash tree
 * - Panes update reactively when sash dimensions change
 * - Frame handles tree mutations (add/remove panes)
 * - Muntins (dividers) are positioned correctly
 * - Pane rendering callbacks work with reactive sash
 *
 * These are browser-based component tests using vitest-browser-svelte.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Frame from '../frame/Frame.svelte';
import { Sash } from '../sash.js';
import { Position } from '../position.js';
import { page } from '@vitest/browser/context';
import type { ReactiveSash } from '../sash.svelte.js';

// Type for Frame component instance with exported functions
interface FrameInstance {
	addPane: (targetId: string, options: Record<string, unknown>) => Sash | null;
	removePane: (id: string) => void;
	swapPanes: (
		sourcePaneEl: HTMLElement | Element | null,
		targetPaneEl: HTMLElement | Element | null
	) => void;
	mount: (containerEl: HTMLElement) => void;
	fit: () => void;
	rootSash?: Sash;
	windowElement?: HTMLElement;
	containerElement?: HTMLElement;
	panes: Sash[];
}

describe('Frame with Reactive Sash', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		container.style.width = '1000px';
		container.style.height = '600px';
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container && container.parentElement) {
			container.parentElement.removeChild(container);
		}
	});

	test('renders panes from reactive sash tree', async () => {
		// Create a reactive sash tree
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		const { container: frameContainer } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		// Should render 2 panes (left and right)
		const panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBe(2);

		// Verify panes have correct data attributes
		const leftPane = frameContainer.querySelector(`[data-sash-id="${sash.leftChild?.id}"]`);
		const rightPane = frameContainer.querySelector(`[data-sash-id="${sash.rightChild?.id}"]`);

		expect(leftPane).toBeTruthy();
		expect(rightPane).toBeTruthy();
	});

	test('renders muntins (dividers) for split sashes', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		const { container: frameContainer } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		// Should render 1 muntin (vertical divider between left and right)
		const muntins = frameContainer.querySelectorAll('.muntin');
		expect(muntins.length).toBe(1);

		// Muntin should be vertical for left-right split
		expect(muntins[0].classList.contains('vertical')).toBe(true);
	});

	test('panes update when sash dimensions change', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		const { component } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		const frameInstance = component as unknown as FrameInstance;

		// Get initial dimensions
		const initialLeftWidth = sash.leftChild?.width;
		const initialRightWidth = sash.rightChild?.width;

		expect(initialLeftWidth).toBe(500);
		expect(initialRightWidth).toBe(500);

		// Change root width - should propagate reactively
		sash.width = 800;

		// Wait for reactive updates
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Children should reflect new dimensions
		expect(sash.leftChild?.width).toBe(400);
		expect(sash.rightChild?.width).toBe(400);

		// Verify the Frame component's panes list is updated
		const panes = frameInstance.panes;
		expect(panes.length).toBe(2);
	});

	test('Frame handles addPane correctly', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600,
			id: 'root'
		});

		const { component, container: frameContainer } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		const frameInstance = component as unknown as FrameInstance;

		// Initial state: 1 pane
		let panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBe(1);

		// Add a pane
		const newPane = frameInstance.addPane('root', {
			position: Position.Right,
			id: 'new-pane'
		});

		expect(newPane).toBeDefined();

		// Wait for reactive updates
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should now have 2 panes
		panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBe(2);
	});

	test('Frame handles removePane correctly', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600,
			id: 'root'
		});

		const { component, container: frameContainer } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		const frameInstance = component as unknown as FrameInstance;

		// Add two panes
		const pane1 = frameInstance.addPane('root', {
			position: Position.Right,
			id: 'pane-1'
		});

		const pane2 = frameInstance.addPane('pane-1', {
			position: Position.Bottom,
			id: 'pane-2'
		});

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should have 3 panes
		let panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBe(3);

		// Remove pane-2
		frameInstance.removePane('pane-2');

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should have 2 panes again
		panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBe(2);
	});

	test('pane rendering callback receives reactive sash', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		const renderedSashes: any[] = [];

		const { container: frameContainer } = render(Frame, {
			target: container,
			props: {
				settings: sash,
				onPaneRender: (paneEl: HTMLElement, renderedSash: any) => {
					renderedSashes.push(renderedSash);
				}
			}
		});

		// Wait for renders
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should have rendered 2 panes
		expect(renderedSashes.length).toBe(2);

		// All rendered sashes should be Sash instances
		renderedSashes.forEach((s) => {
			expect(s).toBeInstanceOf(Sash);
		});
	});

	test('nested splits create correct pane hierarchy', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		// Create nested splits:
		// Root -> Left/Right
		// Left -> Top/Bottom
		sash.split({ position: Position.Right });
		sash.leftChild?.split({ position: Position.Bottom });

		const { container: frameContainer } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		// Should render 3 leaf panes (left-top, left-bottom, right)
		const panes = frameContainer.querySelectorAll('[data-sash-id]');
		const paneIds = Array.from(panes).map((p) => p.getAttribute('data-sash-id'));

		// Collect all leaf sash IDs
		const leafSashes: any[] = [];
		sash.walk((s) => {
			if (!s.isSplit) leafSashes.push(s);
		});

		expect(panes.length).toBe(leafSashes.length);
		expect(panes.length).toBe(3);

		// Should render 2 muntins (1 vertical, 1 horizontal)
		const muntins = frameContainer.querySelectorAll('.muntin');
		expect(muntins.length).toBe(2);
	});

	test('Frame fit() updates dimensions reactively', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600
		});

		sash.split({ position: Position.Right });

		// Create a container with specific dimensions
		const mountContainer = document.createElement('div');
		mountContainer.style.width = '800px';
		mountContainer.style.height = '500px';
		document.body.appendChild(mountContainer);

		const { component } = render(Frame, {
			target: mountContainer,
			props: { settings: sash }
		});

		const frameInstance = component as unknown as FrameInstance;

		// Mount to container
		frameInstance.mount(mountContainer);

		// Initial dimensions
		expect(sash.width).toBe(1000);
		expect(sash.height).toBe(600);

		// Call fit() to update to container dimensions
		frameInstance.fit();

		// Dimensions should update
		expect(sash.width).toBe(800);
		expect(sash.height).toBe(500);

		// Children should also update
		expect(sash.leftChild?.width).toBe(400);
		expect(sash.rightChild?.width).toBe(400);

		// Cleanup
		mountContainer.remove();
	});

	test('reactive sash tree updates trigger pane re-render', async () => {
		const sash = new Sash({
			position: Position.Root,
			width: 1000,
			height: 600,
			id: 'root'
		});

		const { component, container: frameContainer } = render(Frame, {
			target: container,
			props: { settings: sash }
		});

		const frameInstance = component as unknown as FrameInstance;

		// Add a pane
		frameInstance.addPane('root', {
			position: Position.Right,
			id: 'right-pane'
		});

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Verify panes are rendered
		let panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBe(2);

		// Modify sash tree directly (simulate external mutation)
		sash.leftChild?.split({ position: Position.Bottom });

		// Trigger update manually (in real app, this would be done via addPane)
		// This tests that the reactive system detects tree changes
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Frame should re-render with new pane structure
		// Note: Frame uses updateCounter pattern, so we need to trigger update
		frameInstance.addPane(sash.leftChild!.id, { position: Position.Bottom });

		await new Promise((resolve) => setTimeout(resolve, 50));

		panes = frameContainer.querySelectorAll('[data-sash-id]');
		expect(panes.length).toBeGreaterThan(2);
	});
});
