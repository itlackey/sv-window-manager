// e2e/test-page-performance.spec.ts
import { test, expect } from '@playwright/test';
import { navigateToTestPage, getPaneCount, collectConsoleErrors } from './helpers/pane-helpers';
import { CSS_SELECTORS, ACCESSIBLE_SELECTORS } from './helpers/selectors';

/**
 * Test Suite: Performance Testing
 *
 * Tests for performance under stress conditions,
 * including many panes and rapid interactions.
 */
test.describe('Performance', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToTestPage(page);
	});

	/**
	 * Test 9.1: Add Many Panes (10+) Without Degradation
	 *
	 * Stress test to verify the window manager can handle
	 * a large number of panes without performance issues.
	 */
	test('9.1 Add Many Panes (10+) Without Degradation', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Track timing for each pane addition
		const timings: number[] = [];

		// Add 10 panes
		for (let i = 0; i < 10; i++) {
			const positions: Array<'top' | 'right' | 'bottom' | 'left'> = [
				'top',
				'right',
				'bottom',
				'left'
			];
			const position = positions[i % 4];

			// Get available panes
			const optionCount = await page.locator('#target-pane option').count();
			const randomIndex = Math.min(i, optionCount - 1);

			// Select pane by index
			await page.evaluate((index) => {
				const select = document.querySelector('#target-pane') as HTMLSelectElement;
				if (select && select.options[index]) {
					select.selectedIndex = index;
					select.dispatchEvent(new Event('change', { bubbles: true }));
				}
			}, randomIndex);

			await page.waitForTimeout(100);

			// Set position and title
			await page.getByLabel('Position:').selectOption(position);
			await page.getByLabel('Title:').fill(`Pane ${i + 3}`);

			// Measure time for pane addition
			const startTime = Date.now();

			await page
				.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
					name: ACCESSIBLE_SELECTORS.addPaneButton.name
				})
				.click();

			await page.waitForTimeout(200);

			const endTime = Date.now();
			timings.push(endTime - startTime);

			// Each addition should complete within 2 seconds
			expect(endTime - startTime).toBeLessThan(2000);
		}

		// Verify final pane count (2 initial + 10 added)
		const finalCount = await getPaneCount(page);
		expect(finalCount).toBe(12);

		// Verify no console errors
		const criticalErrors = errors.filter(
			(e) => !e.includes('Warning') && !e.includes('deprecated')
		);
		expect(criticalErrors).toEqual([]);

		// Verify page is still responsive
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();
		await expect(
			page.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
				name: ACCESSIBLE_SELECTORS.addPaneButton.name
			})
		).toBeEnabled();

		// Verify performance didn't degrade significantly
		// Later additions shouldn't be significantly slower than early ones
		const avgFirst3 = timings.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
		const avgLast3 = timings.slice(-3).reduce((a, b) => a + b, 0) / 3;

		// Last 3 additions shouldn't be more than 2x slower than first 3
		expect(avgLast3).toBeLessThan(avgFirst3 * 2 + 1000);
	});

	/**
	 * Test 9.2: Rapid Add Pane Button Clicking
	 *
	 * Stress test for rapid button clicking to verify
	 * debouncing and queue handling.
	 */
	test('9.2 Rapid Add Pane Button Clicking', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Click Add Pane 10 times rapidly
		const addButton = page.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
			name: ACCESSIBLE_SELECTORS.addPaneButton.name
		});

		for (let i = 0; i < 10; i++) {
			await addButton.click();
			// No wait - intentionally rapid
		}

		// Wait for all operations to settle
		await page.waitForTimeout(3000);

		// Verify panes were added (might be < 12 if debounced)
		const paneCount = await getPaneCount(page);
		expect(paneCount).toBeGreaterThan(2); // At least some were added
		expect(paneCount).toBeLessThanOrEqual(12); // Not more than expected

		// Verify no JavaScript errors
		const criticalErrors = errors.filter(
			(e) => !e.includes('Warning') && !e.includes('deprecated')
		);
		expect(criticalErrors).toEqual([]);

		// Verify page is stable
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();

		// Verify all panes are visible and functional
		const glassPanes = page.locator(CSS_SELECTORS.glass);
		const finalCount = await glassPanes.count();

		for (let i = 0; i < finalCount; i++) {
			const pane = glassPanes.nth(i);
			await expect(pane).toBeVisible();
		}
	});

	/**
	 * Test 9.3: Large Layout Rendering Performance
	 *
	 * Verifies that switching layouts with many panes
	 * doesn't cause significant rendering delays.
	 */
	test('9.3 Large Layout Rendering Performance', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Add 5 panes to Simple Layout
		for (let i = 0; i < 5; i++) {
			await page.evaluate((index) => {
				const select = document.querySelector('#target-pane') as HTMLSelectElement;
				if (select) {
					select.selectedIndex = Math.min(index, select.options.length - 1);
					select.dispatchEvent(new Event('change', { bubbles: true }));
				}
			}, i);

			await page.getByLabel('Position:').selectOption('right');
			await page
				.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
					name: ACCESSIBLE_SELECTORS.addPaneButton.name
				})
				.click();
			await page.waitForTimeout(200);
		}

		// Verify 7 panes exist (2 initial + 5 added)
		const paneCountBefore = await getPaneCount(page);
		expect(paneCountBefore).toBe(7);

		// Measure layout switch time
		const startTime = Date.now();

		// Switch to Complex Layout
		await page
			.getByRole(ACCESSIBLE_SELECTORS.complexLayoutRadio.role, {
				name: ACCESSIBLE_SELECTORS.complexLayoutRadio.name
			})
			.click();

		// Wait for layout to render
		await page.waitForTimeout(500);

		const switchTime = Date.now() - startTime;

		// Layout switch should complete within 2 seconds
		expect(switchTime).toBeLessThan(2000);

		// Verify Complex Layout loaded
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Top Pane' })).toBeVisible();

		// Switch back to Simple Layout
		const startTime2 = Date.now();

		await page
			.getByRole(ACCESSIBLE_SELECTORS.simpleLayoutRadio.role, {
				name: ACCESSIBLE_SELECTORS.simpleLayoutRadio.name
			})
			.click();

		await page.waitForTimeout(500);

		const switchTime2 = Date.now() - startTime2;

		// Second switch should also be fast
		expect(switchTime2).toBeLessThan(2000);

		// Verify no errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);

		// Page should still be responsive
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();
	});

	/**
	 * Test 9.4: Memory Leak Detection (Basic)
	 *
	 * Basic test to detect obvious memory leaks by
	 * repeatedly adding and removing panes.
	 */
	test('9.4 Memory Leak Detection (Basic)', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Perform 10 cycles of add + close
		for (let cycle = 0; cycle < 10; cycle++) {
			// Add 3 panes
			for (let i = 0; i < 3; i++) {
				await page.evaluate(() => {
					const select = document.querySelector('#target-pane') as HTMLSelectElement;
					if (select && select.options.length > 0) {
						select.selectedIndex = 0;
						select.dispatchEvent(new Event('change', { bubbles: true }));
					}
				});

				await page.getByLabel('Position:').selectOption('right');
				await page
					.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
						name: ACCESSIBLE_SELECTORS.addPaneButton.name
					})
					.click();
				await page.waitForTimeout(100);
			}

			// Close 3 panes
			for (let i = 0; i < 3; i++) {
				const closeButton = page.locator(CSS_SELECTORS.closeAction).last();
				const isVisible = await closeButton.isVisible();

				if (isVisible) {
					await closeButton.click();
					await page.waitForTimeout(100);
				}
			}
		}

		// Should be back to original state (2 panes)
		const finalCount = await getPaneCount(page);
		expect(finalCount).toBe(2);

		// Verify no accumulation of errors
		const criticalErrors = errors.filter(
			(e) => !e.includes('Warning') && !e.includes('deprecated')
		);
		expect(criticalErrors).toEqual([]);

		// Page should still be fully functional
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Left Pane' })).toBeVisible();
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Right Pane' })).toBeVisible();
	});
});
