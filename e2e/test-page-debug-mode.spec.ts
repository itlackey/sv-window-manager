// e2e/test-page-debug-mode.spec.ts
import { test, expect } from '@playwright/test';
import { navigateToTestPage, collectConsoleErrors } from './helpers/pane-helpers';
import { ACCESSIBLE_SELECTORS, CSS_SELECTORS } from './helpers/selectors';

/**
 * Test Suite: Debug Mode
 *
 * Tests for enabling/disabling debug mode and verifying
 * the visual changes and state updates.
 */
test.describe('Debug Mode', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToTestPage(page);
	});

	/**
	 * Test 3.1: Enable Debug Mode
	 *
	 * Verifies that enabling debug mode shows debug information
	 * without breaking the layout or causing errors.
	 */
	test('3.1 Enable Debug Mode', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Debug mode should be off initially
		const debugCheckbox = page.getByRole(ACCESSIBLE_SELECTORS.debugModeCheckbox.role, {
			name: ACCESSIBLE_SELECTORS.debugModeCheckbox.name
		});
		await expect(debugCheckbox).not.toBeChecked();

		// Enable debug mode
		await debugCheckbox.check();
		await expect(debugCheckbox).toBeChecked();

		// Wait for re-render (key block changes)
		await page.waitForTimeout(500);

		// Verify panes still exist and are visible
		const panes = page.locator(CSS_SELECTORS.pane);
		const paneCount = await panes.count();
		expect(paneCount).toBe(2);

		// Verify first pane has sash ID attribute
		const firstPane = panes.first();
		const sashId = await firstPane.getAttribute('data-sash-id');
		expect(sashId).toBeTruthy();
		expect(sashId).toMatch(/^[a-zA-Z0-9-]+$/); // Valid sash ID format

		// Verify glass components still render correctly
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Left Pane' })).toBeVisible();
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Right Pane' })).toBeVisible();

		// Verify muntins still exist
		const muntins = page.locator(CSS_SELECTORS.muntin);
		await expect(muntins).toHaveCount(1);

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 3.2: Disable Debug Mode
	 *
	 * Verifies that disabling debug mode removes debug information
	 * and restores the normal layout without errors.
	 */
	test('3.2 Disable Debug Mode', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Enable debug mode first
		const debugCheckbox = page.getByRole(ACCESSIBLE_SELECTORS.debugModeCheckbox.role, {
			name: ACCESSIBLE_SELECTORS.debugModeCheckbox.name
		});
		await debugCheckbox.check();
		await page.waitForTimeout(500);

		// Verify enabled
		await expect(debugCheckbox).toBeChecked();

		// Disable debug mode
		await debugCheckbox.uncheck();
		await expect(debugCheckbox).not.toBeChecked();
		await page.waitForTimeout(500);

		// Verify layout remains unchanged
		const paneCount = await page.locator(CSS_SELECTORS.glass).count();
		expect(paneCount).toBe(2);

		// Verify panes are still visible with correct titles
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Left Pane' })).toBeVisible();
		await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Right Pane' })).toBeVisible();

		// Verify pane content is intact
		await expect(page.locator('text=This is the left pane content')).toBeVisible();
		await expect(page.locator('text=This is the right pane content')).toBeVisible();

		// Verify muntins still function
		const muntins = page.locator(CSS_SELECTORS.muntin);
		await expect(muntins).toHaveCount(1);
		await expect(muntins.first()).toBeVisible();

		// Verify container is properly sized
		const container = page.locator(CSS_SELECTORS.frameContainer);
		await expect(container).toBeVisible();
		const containerHeight = await container.evaluate((el) => el.clientHeight);
		expect(containerHeight).toBeGreaterThan(0);

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 3.3: Toggle Debug Mode Multiple Times
	 *
	 * Stress test to verify debug mode can be toggled rapidly
	 * without causing errors or breaking the layout.
	 */
	test('3.3 Toggle Debug Mode Multiple Times', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		const debugCheckbox = page.getByRole(ACCESSIBLE_SELECTORS.debugModeCheckbox.role, {
			name: ACCESSIBLE_SELECTORS.debugModeCheckbox.name
		});

		// Toggle debug mode 5 times
		for (let i = 0; i < 5; i++) {
			await debugCheckbox.check();
			await page.waitForTimeout(200);
			await debugCheckbox.uncheck();
			await page.waitForTimeout(200);
		}

		// Final state should be unchecked
		await expect(debugCheckbox).not.toBeChecked();

		// Verify layout is still functional
		const paneCount = await page.locator(CSS_SELECTORS.glass).count();
		expect(paneCount).toBe(2);

		await expect(page.locator(CSS_SELECTORS.frameContainer)).toBeVisible();

		// Verify no errors accumulated
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 3.4: Debug Mode Persists During Layout Switch
	 *
	 * Verifies that debug mode state is maintained when
	 * switching between Simple and Complex layouts.
	 */
	test('3.4 Debug Mode Persists During Layout Switch', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Enable debug mode
		const debugCheckbox = page.getByRole(ACCESSIBLE_SELECTORS.debugModeCheckbox.role, {
			name: ACCESSIBLE_SELECTORS.debugModeCheckbox.name
		});
		await debugCheckbox.check();
		await page.waitForTimeout(500);

		// Switch to Complex Layout
		await page
			.getByRole(ACCESSIBLE_SELECTORS.complexLayoutRadio.role, {
				name: ACCESSIBLE_SELECTORS.complexLayoutRadio.name
			})
			.click();
		await page.waitForTimeout(500);

		// Verify debug mode is still enabled
		await expect(debugCheckbox).toBeChecked();

		// Verify complex layout loaded
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(3);

		// Switch back to Simple Layout
		await page
			.getByRole(ACCESSIBLE_SELECTORS.simpleLayoutRadio.role, {
				name: ACCESSIBLE_SELECTORS.simpleLayoutRadio.name
			})
			.click();
		await page.waitForTimeout(500);

		// Verify debug mode is STILL enabled
		await expect(debugCheckbox).toBeChecked();

		// Verify simple layout restored
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(2);

		// Verify no errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});
});
