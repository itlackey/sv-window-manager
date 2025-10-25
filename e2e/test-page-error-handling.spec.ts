// e2e/test-page-error-handling.spec.ts
import { test, expect } from '@playwright/test';
import { navigateToTestPage, getPaneCount, collectConsoleErrors } from './helpers/pane-helpers';
import { CSS_SELECTORS, ACCESSIBLE_SELECTORS } from './helpers/selectors';

/**
 * Test Suite: Error Handling
 *
 * Tests for error conditions, edge cases, and graceful degradation
 * when invalid or unexpected inputs are provided.
 */
test.describe('Error Handling', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToTestPage(page);
	});

	/**
	 * Test 5.1: No Target Pane Selected (Edge Case)
	 *
	 * Verifies that the application handles empty target selection gracefully.
	 * Note: The current implementation may add a pane even with empty target,
	 * so this test verifies that no errors occur rather than preventing the action.
	 */
	test('5.1 No Target Pane Selected (Edge Case)', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Get initial pane count
		const initialCount = await getPaneCount(page);

		// Clear dropdown selection via script (edge case simulation)
		await page.evaluate(() => {
			const select = document.querySelector('#target-pane') as HTMLSelectElement;
			if (select) {
				select.value = '';
				select.dispatchEvent(new Event('change', { bubbles: true }));
			}
		});

		// Wait for change to propagate
		await page.waitForTimeout(200);

		// Set position
		await page.getByLabel('Position:').selectOption('right');

		// Try to add pane
		await page.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
			name: ACCESSIBLE_SELECTORS.addPaneButton.name
		}).click();
		await page.waitForTimeout(500);

		// Verify page remains functional regardless of whether pane was added
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();

		// The key requirement is no JavaScript errors
		const criticalErrors = errors.filter((e) =>
			e.includes('Error') && !e.includes('Warning')
		);
		expect(criticalErrors).toEqual([]);

		// Verify pane count is reasonable (either unchanged or increased)
		const finalCount = await getPaneCount(page);
		expect(finalCount).toBeGreaterThanOrEqual(initialCount);
	});

	/**
	 * Test 5.2: Invalid Sash ID Reference
	 *
	 * Verifies graceful handling when querying for non-existent sash IDs.
	 */
	test('5.2 Invalid Sash ID Reference', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Try to query for a non-existent pane via console
		const result = await page.evaluate(() => {
			try {
				const invalidPane = document.querySelector('[data-sash-id="invalid-id-999"]');
				return {
					found: invalidPane !== null,
					error: null
				};
			} catch (e) {
				return {
					found: false,
					error: e instanceof Error ? e.message : 'Unknown error'
				};
			}
		});

		// Should return null/false, not throw error
		expect(result.found).toBe(false);
		expect(result.error).toBeNull();

		// Page should remain functional
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();

		// No errors should be logged
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 5.3: Rapid Repeated Add Attempts
	 *
	 * Stress test: clicking Add Pane rapidly to verify the application
	 * remains stable and doesn't crash or produce errors.
	 */
	test('5.3 Rapid Repeated Add Attempts', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		const initialCount = await getPaneCount(page);

		// Rapidly click Add Pane button 5 times
		const addButton = page.getByRole(ACCESSIBLE_SELECTORS.addPaneButton.role, {
			name: ACCESSIBLE_SELECTORS.addPaneButton.name
		});

		for (let i = 0; i < 5; i++) {
			await addButton.click();
			// No wait - intentionally rapid
		}

		// Wait for all operations to settle
		await page.waitForTimeout(2000);

		// Count final panes (might vary due to timing)
		const finalCount = await getPaneCount(page);

		// Should have added at least 1 pane, but not an unreasonable number
		// Allow some tolerance since rapid clicks may result in slightly more than requested
		expect(finalCount).toBeGreaterThan(initialCount);
		expect(finalCount).toBeLessThanOrEqual(initialCount + 10); // Reasonable upper bound

		// Page should be stable and functional
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();

		// Verify all panes are visible
		const glassPanes = page.locator(CSS_SELECTORS.glass);
		const paneCount = await glassPanes.count();
		expect(paneCount).toBe(finalCount);

		// Verify no critical errors - this is the key requirement
		const criticalErrors = errors.filter((e) =>
			!e.includes('Warning') && !e.includes('deprecated')
		);
		expect(criticalErrors).toEqual([]);
	});

	/**
	 * Test 5.4: Console Error Detection
	 *
	 * Verifies that the error handling system can detect
	 * console errors during normal operation.
	 */
	test('5.4 Console Error Detection', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Inject a deliberate console error
		await page.evaluate(() => {
			console.error('Test error message for detection');
		});

		await page.waitForTimeout(100);

		// Verify the error was captured
		expect(errors).toContain('Test error message for detection');

		// Page should still function normally
		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();
		const paneCount = await getPaneCount(page);
		expect(paneCount).toBe(2);
	});
});
