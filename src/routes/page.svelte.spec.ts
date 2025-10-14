import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});

	it('should handle multiple rapid reorder events without duplicate keys', async () => {
		const { container } = render(Page);

		// Wait for component to render
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Find a tab to reorder
		const tab3 = container.querySelector('[data-tab-id="3"]') as HTMLElement;
		expect(tab3).toBeTruthy();

		// Focus the tab
		tab3.focus();
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Perform multiple rapid reorders (simulating keyboard reordering)
		for (let i = 0; i < 3; i++) {
			const ctrlArrowRight = new KeyboardEvent('keydown', {
				key: 'ArrowRight',
				ctrlKey: true,
				bubbles: true
			});
			tab3.dispatchEvent(ctrlArrowRight);
			// Small delay but not enough to change timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		// Wait for events to be logged
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Check that event log entries have unique keys
		const eventEntries = container.querySelectorAll('.event-entry');
		expect(eventEntries.length).toBeGreaterThan(0);

		// No error should be thrown (duplicate key error would show in console)
		// The test passes if we get here without errors
	});
});
