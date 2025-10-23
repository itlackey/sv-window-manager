import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TestPage from './+page.svelte';

describe('test/+page.svelte - Glass Action Buttons', () => {
	it('should render panes with glass action buttons', async () => {
		render(TestPage);

		// Check that close buttons are rendered
		const closeButton = page.getByRole('button', { name: 'Close window' });
		await expect.element(closeButton.first()).toBeInTheDocument();
	});

	it('should close a pane when close button is clicked', async () => {
		render(TestPage);

		// Get all panes before close using querySelectorAll
		const panesBefore = document.querySelectorAll('.pane');
		const initialPaneCount = panesBefore.length;

		expect(initialPaneCount).toBeGreaterThan(0);

		// Find and click a close button
		const closeButton = page.getByRole('button', { name: 'Close window' }).first();
		await closeButton.click();

		// Wait for the DOM to update (Svelte reactivity needs a tick)
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Get all panes after close
		const panesAfter = document.querySelectorAll('.pane');
		const finalPaneCount = panesAfter.length;

		// Verify one pane was removed
		expect(finalPaneCount).toBe(initialPaneCount - 1);
	});

	it('should maximize a pane when maximize button is clicked', async () => {
		render(TestPage);

		// Find a pane using querySelector
		const pane = document.querySelector('.pane');
		expect(pane).toBeTruthy();

		// Verify pane is not maximized initially
		const hasMaximizedBefore = pane?.getAttribute('data-maximized');
		expect(hasMaximizedBefore).toBeNull();

		// Find and click maximize button
		const maximizeButton = page.getByRole('button', { name: 'Maximize window' }).first();
		await maximizeButton.click();

		// Get the pane again to check updated state
		const paneAfter = document.querySelector('.pane');

		// Verify pane is now maximized
		const hasMaximizedAfter = paneAfter?.getAttribute('data-maximized');
		expect(hasMaximizedAfter).not.toBeNull();
	});
});
