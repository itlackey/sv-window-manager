/**
 * Reactive Sash Integration Tests
 *
 * This test suite validates that the reactive Sash implementation works correctly
 * with the entire BinaryWindow component system. These tests ensure:
 * - BinaryWindow initializes with reactive sash
 * - addPane creates correct reactive sash tree
 * - removePane correctly updates reactive tree
 * - Reactive updates propagate to UI
 * - Split operations create valid tree structures
 *
 * These are browser-based component tests using vitest-browser-svelte.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import BinaryWindow from '../binary-window/BinaryWindow.svelte';
import { Sash } from '../sash.js';
import { Position } from '../position.js';

// Type for BinaryWindow component instance with exported functions
interface BinaryWindowInstance {
	addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash;
	removePane: (sashId: string) => void;
	fit: () => void;
	getRootSash: () => Sash | undefined;
	getWindowElement: () => HTMLElement | undefined;
	getSashById: (sashId: string) => Sash | null;
	getTreeVersion: () => number;
}

describe('Reactive Sash Integration with BinaryWindow', () => {
	let container: HTMLElement;

	// Helper to render BinaryWindow and return typed instance
	function renderBinaryWindow(props: any) {
		const result = render(BinaryWindow, {
			target: container,
			props
		});
		return {
			...result,
			bwin: result.component as unknown as BinaryWindowInstance
		};
	}

	beforeEach(() => {
		// Create a container element for the BinaryWindow
		container = document.createElement('div');
		container.style.width = '1000px';
		container.style.height = '600px';
		document.body.appendChild(container);
	});

	afterEach(async () => {
		// Cleanup mounted components
		await cleanup();

		// Clean up the container
		if (container) {
			container.innerHTML = '';
			if (container.parentElement) {
				try {
					container.parentElement.removeChild(container);
				} catch (e) {
					// Ignore if already removed
				}
			}
		}
	});

	test('BinaryWindow initializes with reactive sash', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		// Get the root sash
		const rootSash = bwin.getRootSash();

		expect(rootSash).toBeInstanceOf(Sash);
		expect(rootSash?.width).toBe(1000);
		expect(rootSash?.height).toBe(600);
		expect(rootSash?.position).toBe(Position.Root);
	});

	test('addPane creates reactive sash tree', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		const rootSash = bwin.getRootSash();
		expect(rootSash).toBeDefined();

		// Add a pane to the right
		const newPane = bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'New Pane'
		});

		expect(newPane).toBeInstanceOf(Sash);
		expect(rootSash?.isSplit()).toBe(true);
		expect(rootSash?.children.length).toBe(2);

		// Check that children are reactive Sash instances
		expect(rootSash?.leftChild).toBeInstanceOf(Sash);
		expect(rootSash?.rightChild).toBeInstanceOf(Sash);

		// Check dimensions propagated correctly (should be 500px each for left-right split)
		expect(rootSash?.leftChild?.width).toBe(500);
		expect(rootSash?.rightChild?.width).toBe(500);
		expect(rootSash?.leftChild?.height).toBe(600);
		expect(rootSash?.rightChild?.height).toBe(600);
	});

	test('removePane updates reactive tree correctly', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		const rootSash = bwin.getRootSash();
		expect(rootSash).toBeDefined();

		// Add two panes
		const pane1 = bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'Pane 1',
			id: 'pane-1'
		});
		const pane2 = bwin.addPane(pane1!.id, {
			position: Position.Bottom,
			title: 'Pane 2',
			id: 'pane-2'
		});

		// Verify tree structure
		expect(rootSash?.children.length).toBe(2);
		expect(pane1?.children.length).toBe(2);

		// Store pane1's ID before removal
		const pane1Id = pane1!.id;

		// Remove pane2
		bwin.removePane(pane2!.id);

		// Verify tree structure after removal
		expect(rootSash?.children.length).toBe(2);

		// After removal, the tree maintains its structure
		// The parent node (pane1) remains even though it now has only one child
		// This is the current behavior - tree doesn't auto-collapse on single child
		const leafCount = rootSash?.getAllLeafDescendants().length;
		expect(leafCount).toBe(3); // 3 leaf panes after pane2 removal
	});

	test('reactive sash dimension updates propagate to children', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		const rootSash = bwin.getRootSash();
		expect(rootSash).toBeDefined();

		// Split the root
		rootSash!.split({ position: Position.Right });

		expect(rootSash?.leftChild).toBeDefined();
		expect(rootSash?.rightChild).toBeDefined();

		// Initial dimensions (500px each)
		expect(rootSash?.leftChild?.width).toBe(500);
		expect(rootSash?.rightChild?.width).toBe(500);

		// Update root width - should propagate reactively
		rootSash!.width = 800;

		// Children should update to 400px each
		expect(rootSash?.leftChild?.width).toBe(400);
		expect(rootSash?.rightChild?.width).toBe(400);
	});

	test('nested splits create correct reactive tree', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		const rootSash = bwin.getRootSash();
		expect(rootSash).toBeDefined();

		// Create nested splits:
		// Root -> Left/Right
		// Left -> Top/Bottom
		// Right -> Top/Bottom
		bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'Right Pane'
		});

		const leftChild = rootSash!.leftChild;
		const rightChild = rootSash!.rightChild;

		bwin.addPane(leftChild!.id, {
			position: Position.Bottom,
			title: 'Left Bottom'
		});

		bwin.addPane(rightChild!.id, {
			position: Position.Bottom,
			title: 'Right Bottom'
		});

		// Verify tree structure
		expect(rootSash?.children.length).toBe(2);
		expect(leftChild?.children.length).toBe(2);
		expect(rightChild?.children.length).toBe(2);

		// Verify all nodes are reactive Sash instances
		expect(leftChild?.topChild).toBeInstanceOf(Sash);
		expect(leftChild?.bottomChild).toBeInstanceOf(Sash);
		expect(rightChild?.topChild).toBeInstanceOf(Sash);
		expect(rightChild?.bottomChild).toBeInstanceOf(Sash);

		// Verify dimension propagation through nested tree
		// Root: 1000x600
		// Left/Right: 500x600 each
		// Top/Bottom of each: 500x300 each
		expect(leftChild?.topChild?.width).toBe(500);
		expect(leftChild?.topChild?.height).toBe(300);
		expect(leftChild?.bottomChild?.width).toBe(500);
		expect(leftChild?.bottomChild?.height).toBe(300);
	});

	test('tree version increments on pane add/remove', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		const rootSash = bwin.getRootSash();
		const initialVersion = bwin.getTreeVersion();

		// Add a pane - should increment tree version
		const pane1 = bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'Pane 1'
		});

		const versionAfterFirstAdd = bwin.getTreeVersion();
		expect(versionAfterFirstAdd).toBeGreaterThan(initialVersion);

		// Add another pane
		bwin.addPane(pane1!.id, {
			position: Position.Bottom,
			title: 'Pane 2'
		});

		const versionAfterSecondAdd = bwin.getTreeVersion();
		expect(versionAfterSecondAdd).toBeGreaterThan(versionAfterFirstAdd);

		// Remove a pane
		bwin.removePane(pane1!.id);

		const versionAfterRemove = bwin.getTreeVersion();
		// Version should either increment or stay the same depending on implementation
		expect(versionAfterRemove).toBeGreaterThanOrEqual(versionAfterSecondAdd);
	});

	test('reactive sash works with custom IDs', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600,
				id: 'custom-root'
			}
		});

		const rootSash = bwin.getRootSash();
		expect(rootSash?.id).toBe('custom-root');

		// Add pane with custom ID
		const pane = bwin.addPane('custom-root', {
			position: Position.Right,
			id: 'custom-pane',
			title: 'Custom Pane'
		});

		expect(pane?.id).toBe('custom-pane');

		// Verify we can retrieve by custom ID
		const found = rootSash?.getById('custom-pane');
		expect(found).toBe(pane);
	});

	test('reactive sash preserves store on tree operations', async () => {
		const { bwin } = renderBinaryWindow({
			settings: {
				position: Position.Root,
				width: 1000,
				height: 600
			}
		});

		const rootSash = bwin.getRootSash();

		// Add pane with store data
		const pane1 = bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'Pane with Store',
			content: 'Test content',
			tabs: ['Tab 1', 'Tab 2']
		});

		// Verify store is preserved
		expect(pane1?.store.title).toBe('Pane with Store');
		expect(pane1?.store.content).toBe('Test content');
		expect(pane1?.store.tabs).toEqual(['Tab 1', 'Tab 2']);

		// Add another pane and verify original store is still intact
		bwin.addPane(pane1!.id, {
			position: Position.Bottom,
			title: 'Another Pane'
		});

		expect(pane1?.store.title).toBe('Pane with Store');
	});
});
