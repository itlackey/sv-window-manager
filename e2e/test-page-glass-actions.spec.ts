// e2e/test-page-glass-actions.spec.ts
import { test, expect } from '@playwright/test';
import {
	navigateToTestPage,
	addPane,
	getPaneCount,
	clickPaneAction,
	getMinimizedPaneCount,
	restoreMinimizedPane,
	isPaneMaximized,
	findPaneByTitle,
	collectConsoleErrors
} from './helpers/pane-helpers';
import { CSS_SELECTORS, TEXT_CONTENT } from './helpers/selectors';

/**
 * Test Suite: Glass Action Buttons
 *
 * Tests for the close, minimize, and maximize action buttons
 * on Glass components (pane window chrome).
 */
test.describe('Glass Action Buttons', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToTestPage(page);
	});

	/**
	 * Test 7.1: Close Button Functionality
	 *
	 * Verifies that clicking the close button removes the pane
	 * from the layout and updates the window manager state.
	 */
	test('7.1 Close Button Closes Pane', async ({ page }) => {
		// Track console errors
		const errors = collectConsoleErrors(page);

		// Add a third pane so we can close one
		await addPane(page, {
			targetTitle: TEXT_CONTENT.rightPaneTitle,
			position: 'right',
			title: 'Closeable Pane'
		});

		// Verify 3 panes exist
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(3);

		// Click close button on the new pane
		await clickPaneAction(page, 'Closeable Pane', 'close');

		// Verify pane was removed
		const paneCount = await getPaneCount(page);
		expect(paneCount).toBe(2);

		// Verify the pane is no longer visible
		await expect(
			page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Closeable Pane' })
		).not.toBeVisible();

		// Verify original panes remain
		await expect(
			page.locator(CSS_SELECTORS.glassTitle, { hasText: TEXT_CONTENT.leftPaneTitle })
		).toBeVisible();
		await expect(
			page.locator(CSS_SELECTORS.glassTitle, { hasText: TEXT_CONTENT.rightPaneTitle })
		).toBeVisible();

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 7.2: Minimize Button Creates Sill Entry
	 *
	 * Verifies that minimizing a pane removes it from the main area
	 * and creates a button in the sill (minimized panes bar).
	 */
	test('7.2 Minimize Button Creates Sill Entry', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Add a third pane to minimize
		await addPane(page, {
			targetTitle: TEXT_CONTENT.rightPaneTitle,
			position: 'right',
			title: 'Minimizable Pane'
		});

		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(3);

		// Click minimize button
		await clickPaneAction(page, 'Minimizable Pane', 'minimize');

		// Verify pane was removed from main area
		const visiblePaneCount = await getPaneCount(page);
		expect(visiblePaneCount).toBe(2);

		await expect(
			page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Minimizable Pane' })
		).not.toBeVisible();

		// Verify sill was created
		const sill = page.locator(CSS_SELECTORS.sill);
		await expect(sill).toBeVisible();

		// Verify minimized glass button exists
		const minimizedCount = await getMinimizedPaneCount(page);
		expect(minimizedCount).toBe(1);

		const minimizedButton = page.locator(CSS_SELECTORS.minimizedGlass);
		await expect(minimizedButton).toHaveCount(1);

		// Verify button has correct aria-label/title
		const title = await minimizedButton.getAttribute('title');
		expect(title).toMatch(/Restore.*Minimizable Pane/);

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 7.3: Restore Minimized Pane from Sill
	 *
	 * Verifies that clicking a minimized pane's sill button
	 * restores the pane to its original position in the layout.
	 */
	test('7.3 Restore Minimized Pane from Sill', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Add and minimize a pane
		await addPane(page, {
			targetTitle: TEXT_CONTENT.rightPaneTitle,
			position: 'right',
			title: 'Restorable Pane'
		});

		await clickPaneAction(page, 'Restorable Pane', 'minimize');

		// Verify minimized
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(2);
		const initialMinimizedCount = await getMinimizedPaneCount(page);
		expect(initialMinimizedCount).toBe(1);

		// Click sill button to restore
		await restoreMinimizedPane(page, 0);

		// Verify pane was restored
		const restoredPaneCount = await getPaneCount(page);
		expect(restoredPaneCount).toBe(3);

		await expect(
			page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Restorable Pane' })
		).toBeVisible();

		// Verify sill button was removed
		const finalMinimizedCount = await getMinimizedPaneCount(page);
		expect(finalMinimizedCount).toBe(0);

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 7.4: Maximize Button Expands Pane
	 *
	 * Verifies that clicking maximize expands a pane to fill
	 * the entire container while preserving other panes underneath.
	 */
	test('7.4 Maximize Button Expands Pane', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Get left pane and its initial dimensions
		const leftPane = page.locator(CSS_SELECTORS.pane).first();
		const initialWidth = await leftPane.evaluate((el) => el.clientWidth);
		const initialHeight = await leftPane.evaluate((el) => el.clientHeight);

		// Click maximize button
		await clickPaneAction(page, TEXT_CONTENT.leftPaneTitle, 'maximize');

		// Verify pane is marked as maximized
		const isMaximized = await isPaneMaximized(page, TEXT_CONTENT.leftPaneTitle);
		expect(isMaximized).toBe(true);

		// Verify pane dimensions increased
		const newWidth = await leftPane.evaluate((el) => el.clientWidth);
		const newHeight = await leftPane.evaluate((el) => el.clientHeight);

		expect(newWidth).toBeGreaterThan(initialWidth);
		expect(newHeight).toBeGreaterThanOrEqual(initialHeight);

		// Verify pane approximately covers container
		const containerWidth = await page
			.locator(CSS_SELECTORS.frameContainer)
			.evaluate((el) => el.clientWidth);
		const containerHeight = await page
			.locator(CSS_SELECTORS.frameContainer)
			.evaluate((el) => el.clientHeight);

		// Allow 10px tolerance for borders/padding
		expect(newWidth).toBeGreaterThan(containerWidth - 10);
		expect(newHeight).toBeGreaterThan(containerHeight - 10);

		// Verify pane has data-maximized attribute
		const pane = await findPaneByTitle(page, TEXT_CONTENT.leftPaneTitle);
		const paneElement = pane.locator(CSS_SELECTORS.pane).first();
		await expect(paneElement).toHaveAttribute('data-maximized', '');

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 7.5: Restore Maximized Pane
	 *
	 * Verifies that clicking maximize again on a maximized pane
	 * restores it to its original size and position.
	 */
	test('7.5 Restore Maximized Pane', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		const leftPane = page.locator(CSS_SELECTORS.pane).first();

		// Get original dimensions
		const originalWidth = await leftPane.evaluate((el) => el.clientWidth);
		const originalHeight = await leftPane.evaluate((el) => el.clientHeight);
		const originalLeft = await leftPane.evaluate((el) => parseInt(el.style.left || '0'));
		const originalTop = await leftPane.evaluate((el) => parseInt(el.style.top || '0'));

		// Maximize
		await clickPaneAction(page, TEXT_CONTENT.leftPaneTitle, 'maximize');
		await page.waitForTimeout(500);

		// Verify maximized
		let isMaximized = await isPaneMaximized(page, TEXT_CONTENT.leftPaneTitle);
		expect(isMaximized).toBe(true);

		// Restore (click maximize button again)
		await clickPaneAction(page, TEXT_CONTENT.leftPaneTitle, 'maximize');

		// Verify maximized state removed
		isMaximized = await isPaneMaximized(page, TEXT_CONTENT.leftPaneTitle);
		expect(isMaximized).toBe(false);

		// Verify dimensions restored (allow 1px tolerance for rounding)
		const restoredWidth = await leftPane.evaluate((el) => el.clientWidth);
		const restoredHeight = await leftPane.evaluate((el) => el.clientHeight);

		expect(Math.abs(restoredWidth - originalWidth)).toBeLessThanOrEqual(1);
		expect(Math.abs(restoredHeight - originalHeight)).toBeLessThanOrEqual(1);

		// Verify position restored
		const restoredLeft = await leftPane.evaluate((el) => parseInt(el.style.left || '0'));
		const restoredTop = await leftPane.evaluate((el) => parseInt(el.style.top || '0'));

		expect(restoredLeft).toBe(originalLeft);
		expect(restoredTop).toBe(originalTop);

		// Verify data-maximized attribute removed
		const pane = await findPaneByTitle(page, TEXT_CONTENT.leftPaneTitle);
		const paneElement = pane.locator(CSS_SELECTORS.pane).first();
		await expect(paneElement).not.toHaveAttribute('data-maximized');

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 7.6: Multiple Minimize Operations
	 *
	 * Verifies that multiple panes can be minimized and the sill
	 * displays all minimized pane buttons correctly.
	 */
	test('7.6 Multiple Minimize Operations', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Add two more panes
		await addPane(page, {
			targetTitle: TEXT_CONTENT.rightPaneTitle,
			position: 'right',
			title: 'Pane 3'
		});

		await addPane(page, {
			targetTitle: 'Pane 3',
			position: 'right',
			title: 'Pane 4'
		});

		// Verify 4 panes exist
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(4);

		// Minimize Pane 3
		await clickPaneAction(page, 'Pane 3', 'minimize');

		// Verify one minimized pane
		expect(await getMinimizedPaneCount(page)).toBe(1);
		expect(await getPaneCount(page)).toBe(3);

		// Minimize Pane 4
		await clickPaneAction(page, 'Pane 4', 'minimize');

		// Verify two minimized panes
		expect(await getMinimizedPaneCount(page)).toBe(2);
		expect(await getPaneCount(page)).toBe(2);

		// Verify sill has both buttons
		const sillButtons = page.locator(CSS_SELECTORS.minimizedGlass);
		await expect(sillButtons).toHaveCount(2);

		// Restore first minimized pane
		await restoreMinimizedPane(page, 0);

		// Verify one pane restored
		expect(await getMinimizedPaneCount(page)).toBe(1);
		expect(await getPaneCount(page)).toBe(3);

		// Restore second minimized pane
		await restoreMinimizedPane(page, 0);

		// Verify all panes restored
		expect(await getMinimizedPaneCount(page)).toBe(0);
		expect(await getPaneCount(page)).toBe(4);

		// Verify no console errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 7.7: Action Button Disabled State (Single Pane)
	 *
	 * Verifies that when only one pane remains, the close/minimize
	 * buttons are disabled to prevent removing the last pane.
	 */
	test('7.7 Action Buttons Disabled with Single Pane', async ({ page }) => {
		// Close the right pane to leave only one
		await clickPaneAction(page, TEXT_CONTENT.rightPaneTitle, 'close');

		// Verify only one pane remains
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(1);

		// Wait for MutationObserver to update disabled state
		await page.waitForTimeout(300);

		// Find action buttons on the remaining pane
		const closeButton = page.locator(CSS_SELECTORS.closeAction).first();
		const minimizeButton = page.locator(CSS_SELECTORS.minimizeAction).first();

		// Verify buttons are disabled
		await expect(closeButton).toBeDisabled();
		await expect(minimizeButton).toBeDisabled();

		// Maximize should still work
		const maximizeButton = page.locator(CSS_SELECTORS.maximizeAction).first();
		await expect(maximizeButton).not.toBeDisabled();
	});
});
