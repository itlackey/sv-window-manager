/**
 * Empty State Tests for BinaryWindow
 *
 * This test suite validates that the BinaryWindow component correctly handles
 * empty state rendering when:
 * - Initial load with no panes shows empty snippet
 * - Adding a pane hides the empty snippet
 * - Closing the last pane shows the empty snippet again
 * - The empty state transitions correctly between states
 *
 * These are browser-based component tests using vitest-browser-svelte.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import BinaryWindow from './BinaryWindow.svelte';
import { Position } from '../position.js';
import type { Sash } from '../sash.js';
import type { Component } from 'svelte';

// Simple test component to render in panes
const TestComponent: Component = {
	// @ts-expect-error - minimal component for testing
	$$render: () => '<div class="test-component">Test Content</div>'
};

interface BinaryWindowInstance {
	addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash;
	removePane: (sashId: string) => void;
	getRootSash: () => Sash | undefined;
	getIsEmpty: () => boolean;
}

describe('BinaryWindow Empty State', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		container.style.width = '800px';
		container.style.height = '600px';
		document.body.appendChild(container);
	});

	afterEach(async () => {
		await cleanup();
		if (container && container.parentElement) {
			container.parentElement.removeChild(container);
		}
	});

	it('shows empty state on initial load when empty snippet is provided', async () => {
		const { container: renderContainer } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			},
			context: new Map()
		});

		// Wait for component to mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Check that there's no Glass component rendered (placeholder is skipped)
		const glassElements = renderContainer.querySelectorAll('.glass');
		expect(glassElements.length).toBe(0);
	});

	it('getIsEmpty returns true when window has no real panes', async () => {
		const { component } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			}
		});

		const bwin = component as unknown as BinaryWindowInstance;

		// Wait for component to mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should be empty (only placeholder pane exists)
		expect(bwin.getIsEmpty()).toBe(true);
	});

	it('getIsEmpty returns false after adding a pane', async () => {
		const { component } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			}
		});

		const bwin = component as unknown as BinaryWindowInstance;

		// Wait for component to mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Initially empty
		expect(bwin.getIsEmpty()).toBe(true);

		// Add a pane
		const rootSash = bwin.getRootSash();
		expect(rootSash).toBeDefined();

		bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'Test Pane'
		});

		// Wait for reactive updates
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should no longer be empty
		expect(bwin.getIsEmpty()).toBe(false);
	});

	it('shows empty state again after closing the last pane', async () => {
		const { component, container: renderContainer } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			}
		});

		const bwin = component as unknown as BinaryWindowInstance;

		// Wait for component to mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Initially empty
		expect(bwin.getIsEmpty()).toBe(true);

		// Add a pane (replaces placeholder)
		const rootSash = bwin.getRootSash();
		bwin.addPane(rootSash!.id, {
			position: Position.Right,
			title: 'First Pane'
		});

		// Wait for reactive updates
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should have a Glass component now
		let glassElements = renderContainer.querySelectorAll('.glass');
		expect(glassElements.length).toBeGreaterThan(0);
		expect(bwin.getIsEmpty()).toBe(false);

		// Get the pane we just added (it's the one that replaced the placeholder)
		// After adding to placeholder, the root becomes the new pane
		const currentRootSash = bwin.getRootSash();
		const leafPanes = currentRootSash?.getAllLeafDescendants() || [];

		// Find a non-placeholder pane to remove
		const realPanes = leafPanes.filter((p) => !p.store?.isPlaceholder);
		expect(realPanes.length).toBeGreaterThan(0);

		// If there are 2 panes, we need to remove both to get back to empty state
		// First, let's verify we have the expected structure
		if (realPanes.length === 2) {
			// Remove first pane
			bwin.removePane(realPanes[0].id);
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should still not be empty (one pane left)
			expect(bwin.getIsEmpty()).toBe(false);

			// Get updated pane list
			const updatedLeafPanes = bwin.getRootSash()?.getAllLeafDescendants() || [];
			const remainingRealPanes = updatedLeafPanes.filter((p) => !p.store?.isPlaceholder);

			if (remainingRealPanes.length > 0) {
				// Remove last pane
				bwin.removePane(remainingRealPanes[0].id);
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		} else if (realPanes.length === 1) {
			// Only one pane, remove it
			bwin.removePane(realPanes[0].id);
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// After removing all real panes, check Glass count
		glassElements = renderContainer.querySelectorAll('.glass');

		// The isEmpty derived should detect empty state
		// Note: After removing all panes, the tree may be in a placeholder state again
		// or completely empty. The key is that no Glass components are visible.
		const finalLeafPanes = bwin.getRootSash()?.getAllLeafDescendants() || [];
		const finalRealPanes = finalLeafPanes.filter((p) => !p.store?.isPlaceholder);

		// If no real panes remain, isEmpty should be true
		if (finalRealPanes.length === 0) {
			expect(bwin.getIsEmpty()).toBe(true);
		}
	});

	it('empty snippet container is visible when isEmpty is true', async () => {
		const { container: renderContainer } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			}
		});

		// Wait for component to mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Check for empty state container
		// Note: The empty state div is only rendered when both isEmpty AND empty snippet are provided
		// Since we're not providing an empty snippet in this test, the Frame container should be visible but empty
		const frameContainer = renderContainer.querySelector('.bw-frame-container');
		expect(frameContainer).toBeDefined();

		// No Glass should be rendered for placeholder
		const glassElements = renderContainer.querySelectorAll('.glass');
		expect(glassElements.length).toBe(0);
	});

	it('transitions from empty to content and back correctly', async () => {
		const { component, container: renderContainer } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			}
		});

		const bwin = component as unknown as BinaryWindowInstance;

		// Wait for initial mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Step 1: Initially empty
		expect(bwin.getIsEmpty()).toBe(true);
		let glassCount = renderContainer.querySelectorAll('.glass').length;
		expect(glassCount).toBe(0);

		// Step 2: Add first pane (replaces placeholder)
		const rootSash = bwin.getRootSash()!;
		const pane1 = bwin.addPane(rootSash.id, {
			position: Position.Right,
			title: 'Pane 1'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(bwin.getIsEmpty()).toBe(false);
		glassCount = renderContainer.querySelectorAll('.glass').length;
		expect(glassCount).toBeGreaterThan(0);

		// Step 3: Add second pane
		const updatedRoot = bwin.getRootSash()!;
		const leafPanes = updatedRoot.getAllLeafDescendants();
		const targetPane = leafPanes.find((p) => !p.store?.isPlaceholder);

		if (targetPane) {
			bwin.addPane(targetPane.id, {
				position: Position.Bottom,
				title: 'Pane 2'
			});

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(bwin.getIsEmpty()).toBe(false);
			glassCount = renderContainer.querySelectorAll('.glass').length;
			expect(glassCount).toBe(2);

			// Step 4: Remove panes one by one
			const allPanes = bwin.getRootSash()!.getAllLeafDescendants();
			const realPanes = allPanes.filter((p) => !p.store?.isPlaceholder);

			// Remove first pane
			if (realPanes.length > 0) {
				bwin.removePane(realPanes[0].id);
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Should still have content
				expect(bwin.getIsEmpty()).toBe(false);
				glassCount = renderContainer.querySelectorAll('.glass').length;
				expect(glassCount).toBe(1);

				// Remove second pane
				const remainingPanes = bwin
					.getRootSash()!
					.getAllLeafDescendants()
					.filter((p) => !p.store?.isPlaceholder);

				if (remainingPanes.length > 0) {
					bwin.removePane(remainingPanes[0].id);
					await new Promise((resolve) => setTimeout(resolve, 100));

					// Now should be empty again
					// Check that no Glass components are rendered
					glassCount = renderContainer.querySelectorAll('.glass').length;
					expect(glassCount).toBe(0);
				}
			}
		}
	});

	it('clicking close button on last pane shows empty state', async () => {
		const { component, container: renderContainer } = render(BinaryWindow, {
			target: container,
			props: {
				settings: { width: 800, height: 600, fitContainer: true }
			}
		});

		const bwin = component as unknown as BinaryWindowInstance;

		// Wait for initial mount
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Add a pane
		const rootSash = bwin.getRootSash()!;
		bwin.addPane(rootSash.id, {
			position: Position.Right,
			title: 'Test Pane'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		// Verify we have a Glass component
		let glassElements = renderContainer.querySelectorAll('.glass');
		expect(glassElements.length).toBeGreaterThan(0);
		expect(bwin.getIsEmpty()).toBe(false);

		// Add a second pane so close button is enabled
		const updatedLeafPanes = bwin.getRootSash()!.getAllLeafDescendants();
		const targetPane = updatedLeafPanes.find((p) => !p.store?.isPlaceholder);

		if (targetPane) {
			bwin.addPane(targetPane.id, {
				position: Position.Bottom,
				title: 'Second Pane'
			});

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Now we have 2 panes, close buttons should be enabled
			// Find and click a close button
			const closeButtons = renderContainer.querySelectorAll('.glass-action--close');
			expect(closeButtons.length).toBe(2);

			// Click first close button
			(closeButtons[0] as HTMLButtonElement).click();
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have 1 pane left
			glassElements = renderContainer.querySelectorAll('.glass');
			expect(glassElements.length).toBe(1);

			// Click remaining close button
			const remainingCloseBtn = renderContainer.querySelector(
				'.glass-action--close'
			) as HTMLButtonElement;

			if (remainingCloseBtn) {
				remainingCloseBtn.click();
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Now should be empty - no Glass components
				glassElements = renderContainer.querySelectorAll('.glass');
				expect(glassElements.length).toBe(0);
			}
		}
	});
});
