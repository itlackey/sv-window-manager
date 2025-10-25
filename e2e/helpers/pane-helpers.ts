/**
 * E2E Test Helper Functions for sv-window-manager
 *
 * This module provides reusable helper functions for Playwright e2e tests
 * of the BinaryWindow component and test page.
 */

import type { Page } from '@playwright/test';

/**
 * Selects a target pane by title fragment in the Target Pane dropdown
 *
 * @param page - Playwright page object
 * @param titleFragment - Part of the pane title to match (e.g., "Left Pane")
 * @throws Error if pane with matching title is not found
 *
 * @example
 * await selectPaneByTitle(page, 'Right Pane');
 */
export async function selectPaneByTitle(page: Page, titleFragment: string): Promise<void> {
	const targetSelect = page.getByLabel('Target Pane:');

	// Wait for the select to have options
	await targetSelect.waitFor({ state: 'visible' });
	await page.waitForFunction(
		() => {
			const select = document.querySelector('#target-pane') as HTMLSelectElement;
			return select && select.options.length >= 2;
		},
		{ timeout: 5000 }
	);

	// Find and select the option directly in the browser context
	const selected = await page.evaluate((fragment) => {
		const select = document.querySelector('#target-pane') as HTMLSelectElement;
		if (!select) return false;

		const options = Array.from(select.options);
		const matchingOption = options.find((opt) => opt.textContent?.includes(fragment));

		if (matchingOption && matchingOption.value) {
			select.value = matchingOption.value;
			select.dispatchEvent(new Event('change', { bubbles: true }));
			return true;
		}
		return false;
	}, titleFragment);

	if (!selected) {
		throw new Error(`Could not find pane with title containing "${titleFragment}"`);
	}

	// Wait for Svelte reactivity
	await page.waitForTimeout(100);
}

/**
 * Gets the current count of visible panes (Glass components)
 *
 * @param page - Playwright page object
 * @returns Number of visible panes
 *
 * @example
 * const count = await getPaneCount(page);
 * expect(count).toBe(3);
 */
export async function getPaneCount(page: Page): Promise<number> {
	return await page.locator('.glass').count();
}

/**
 * Gets the current count of muntins (dividers)
 *
 * @param page - Playwright page object
 * @returns Number of visible muntins
 *
 * @example
 * const muntinCount = await getMuntinCount(page);
 * expect(muntinCount).toBe(2);
 */
export async function getMuntinCount(page: Page): Promise<number> {
	return await page.locator('.muntin').count();
}

/**
 * Gets the count of options in the Target Pane dropdown
 *
 * @param page - Playwright page object
 * @returns Number of pane options available
 *
 * @example
 * const optionCount = await getTargetPaneOptionCount(page);
 * expect(optionCount).toBeGreaterThan(0);
 */
export async function getTargetPaneOptionCount(page: Page): Promise<number> {
	return await page.locator('#target-pane option').count();
}

/**
 * Waits for a specific number of panes to be present
 *
 * @param page - Playwright page object
 * @param expectedCount - Expected number of panes
 * @param timeout - Optional timeout in milliseconds (default: 5000)
 *
 * @example
 * await waitForPaneCount(page, 3);
 */
export async function waitForPaneCount(
	page: Page,
	expectedCount: number,
	timeout = 5000
): Promise<void> {
	await page.waitForFunction(
		(count) => document.querySelectorAll('.glass').length === count,
		expectedCount,
		{ timeout }
	);
}

/**
 * Adds a new pane with the specified configuration
 *
 * @param page - Playwright page object
 * @param options - Configuration for the new pane
 * @param options.targetTitle - Title fragment of the target pane to split
 * @param options.position - Position relative to target ('top', 'right', 'bottom', 'left')
 * @param options.title - Optional custom title for the new pane
 *
 * @example
 * await addPane(page, {
 *   targetTitle: 'Left Pane',
 *   position: 'right',
 *   title: 'My New Pane'
 * });
 */
export async function addPane(
	page: Page,
	options: {
		targetTitle: string;
		position: 'top' | 'right' | 'bottom' | 'left';
		title?: string;
	}
): Promise<void> {
	await selectPaneByTitle(page, options.targetTitle);
	await page.getByLabel('Position:').selectOption(options.position);

	if (options.title) {
		await page.getByLabel('Title:').fill(options.title);
	}

	await page.getByRole('button', { name: 'Add Pane' }).click();
	await page.waitForTimeout(300); // Wait for animation/render
}

/**
 * Gets the computed position and dimensions of a pane by sash ID
 *
 * @param page - Playwright page object
 * @param sashId - The sash ID of the pane
 * @returns Object with left, top, width, height or null if not found
 *
 * @example
 * const position = await getPanePosition(page, 'sash-1');
 * expect(position?.width).toBeGreaterThan(100);
 */
export async function getPanePosition(
	page: Page,
	sashId: string
): Promise<{ left: number; top: number; width: number; height: number } | null> {
	return await page.evaluate((id) => {
		const pane = document.querySelector(`[data-sash-id="${id}"]`) as HTMLElement;
		if (!pane) return null;

		return {
			left: parseInt(pane.style.left || '0'),
			top: parseInt(pane.style.top || '0'),
			width: parseInt(pane.style.width || '0'),
			height: parseInt(pane.style.height || '0')
		};
	}, sashId);
}

/**
 * Gets the client dimensions (rendered size) of a pane by index
 *
 * @param page - Playwright page object
 * @param index - Zero-based index of the pane (0 = first pane)
 * @returns Object with width and height
 *
 * @example
 * const dimensions = await getPaneClientDimensions(page, 0);
 * expect(dimensions.width).toBeGreaterThan(0);
 */
export async function getPaneClientDimensions(
	page: Page,
	index: number
): Promise<{ width: number; height: number }> {
	const pane = page.locator('.pane').nth(index);

	const width = await pane.evaluate((el) => el.clientWidth);
	const height = await pane.evaluate((el) => el.clientHeight);

	return { width, height };
}

/**
 * Drags a muntin by a specified delta
 *
 * @param page - Playwright page object
 * @param muntinSelector - CSS selector or locator for the muntin
 * @param deltaX - Horizontal pixels to drag (positive = right, negative = left)
 * @param deltaY - Vertical pixels to drag (positive = down, negative = up)
 * @param steps - Number of intermediate steps for smoother drag (default: 10)
 *
 * @example
 * // Drag vertical muntin 100px to the right
 * await dragMuntin(page, '.muntin.vertical', 100, 0);
 *
 * // Drag horizontal muntin 50px down
 * await dragMuntin(page, '.muntin.horizontal', 0, 50);
 */
export async function dragMuntin(
	page: Page,
	muntinSelector: string,
	deltaX: number,
	deltaY: number,
	steps = 10
): Promise<void> {
	const muntin = page.locator(muntinSelector);
	const box = await muntin.boundingBox();

	if (!box) {
		throw new Error(`Muntin not found: ${muntinSelector}`);
	}

	const startX = box.x + box.width / 2;
	const startY = box.y + box.height / 2;

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(startX + deltaX, startY + deltaY, { steps });
	await page.mouse.up();

	await page.waitForTimeout(100); // Wait for render
}

/**
 * Switches the layout to Simple or Complex
 *
 * @param page - Playwright page object
 * @param layout - 'simple' or 'complex'
 *
 * @example
 * await switchLayout(page, 'complex');
 */
export async function switchLayout(
	page: Page,
	layout: 'simple' | 'complex'
): Promise<void> {
	if (layout === 'simple') {
		await page.getByRole('radio', { name: 'Simple Layout (2 panes)' }).click();
	} else {
		await page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' }).click();
	}

	await page.waitForTimeout(500); // Wait for key block re-render
}

/**
 * Toggles debug mode on or off
 *
 * @param page - Playwright page object
 * @param enabled - true to enable, false to disable
 *
 * @example
 * await toggleDebugMode(page, true);
 */
export async function toggleDebugMode(page: Page, enabled: boolean): Promise<void> {
	const checkbox = page.getByRole('checkbox', { name: 'Debug Mode' });
	const isChecked = await checkbox.isChecked();

	if (enabled && !isChecked) {
		await checkbox.check();
	} else if (!enabled && isChecked) {
		await checkbox.uncheck();
	}

	await page.waitForTimeout(500); // Wait for re-render
}

/**
 * Gets all pane titles currently visible
 *
 * @param page - Playwright page object
 * @returns Array of pane title strings
 *
 * @example
 * const titles = await getPaneTitles(page);
 * expect(titles).toContain('Left Pane');
 */
export async function getPaneTitles(page: Page): Promise<string[]> {
	const titles = await page.locator('.glass-title').allTextContents();
	return titles;
}

/**
 * Finds a pane by its title and returns the locator
 *
 * @param page - Playwright page object
 * @param title - Title or title fragment to search for
 * @returns Playwright locator for the pane
 *
 * @example
 * const pane = await findPaneByTitle(page, 'Left Pane');
 * await expect(pane).toBeVisible();
 */
export async function findPaneByTitle(page: Page, title: string) {
	return page
		.locator('.glass-title', { hasText: title })
		.locator('..')
		.locator('..')
		.locator('..');
}

/**
 * Clicks an action button on a specific pane
 *
 * @param page - Playwright page object
 * @param paneTitle - Title of the pane containing the button
 * @param action - Action type ('close', 'minimize', or 'maximize')
 *
 * @example
 * await clickPaneAction(page, 'Left Pane', 'close');
 */
export async function clickPaneAction(
	page: Page,
	paneTitle: string,
	action: 'close' | 'minimize' | 'maximize'
): Promise<void> {
	const pane = await findPaneByTitle(page, paneTitle);
	const actionButton = pane.locator(`.glass-action--${action}`);

	await actionButton.click();
	await page.waitForTimeout(500); // Wait for animation
}

/**
 * Gets the count of minimized panes in the sill
 *
 * @param page - Playwright page object
 * @returns Number of minimized panes
 *
 * @example
 * const minimizedCount = await getMinimizedPaneCount(page);
 * expect(minimizedCount).toBe(1);
 */
export async function getMinimizedPaneCount(page: Page): Promise<number> {
	return await page.locator('.bw-minimized-glass').count();
}

/**
 * Restores a minimized pane by clicking its sill button
 *
 * @param page - Playwright page object
 * @param index - Index of the minimized pane (0 = first)
 *
 * @example
 * await restoreMinimizedPane(page, 0);
 */
export async function restoreMinimizedPane(page: Page, index: number): Promise<void> {
	const sillButton = page.locator('.bw-minimized-glass').nth(index);
	await sillButton.click();
	await page.waitForTimeout(500);
}

/**
 * Checks if a pane is maximized
 *
 * @param page - Playwright page object
 * @param paneTitle - Title of the pane to check
 * @returns true if maximized, false otherwise
 *
 * @example
 * const isMaximized = await isPaneMaximized(page, 'Left Pane');
 * expect(isMaximized).toBe(true);
 */
export async function isPaneMaximized(page: Page, paneTitle: string): Promise<boolean> {
	const pane = await findPaneByTitle(page, paneTitle);
	const paneElement = pane.locator('.pane').first();

	const hasAttribute = await paneElement.evaluate((el) => {
		return el.hasAttribute('data-maximized');
	});

	return hasAttribute;
}

/**
 * Collects console errors during test execution
 *
 * @param page - Playwright page object
 * @returns Array to collect error messages
 *
 * @example
 * const errors = collectConsoleErrors(page);
 * // ... run test
 * expect(errors).toEqual([]);
 */
export function collectConsoleErrors(page: Page): string[] {
	const errors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});

	return errors;
}

/**
 * Waits for the test page to be fully loaded and ready
 *
 * @param page - Playwright page object
 * @param url - URL to navigate to (default: 'http://localhost:5173/test')
 *
 * @example
 * await navigateToTestPage(page);
 */
export async function navigateToTestPage(
	page: Page,
	url = 'http://localhost:5173/test'
): Promise<void> {
	await page.goto(url);
	await page.waitForLoadState('domcontentloaded');
	await page.waitForSelector('.frame-container', { state: 'visible' });
}

/**
 * Gets the error message text if one is displayed
 *
 * @param page - Playwright page object
 * @returns Error message text or null if no error
 *
 * @example
 * const error = await getErrorMessage(page);
 * expect(error).toContain('Please select a target pane');
 */
export async function getErrorMessage(page: Page): Promise<string | null> {
	const errorElement = page.locator('.error-message');
	const isVisible = await errorElement.isVisible();

	if (!isVisible) return null;

	return await errorElement.textContent();
}

/**
 * Clears any displayed error message by triggering a successful action
 *
 * @param page - Playwright page object
 *
 * @example
 * await clearErrorMessage(page);
 */
export async function clearErrorMessage(page: Page): Promise<void> {
	const errorElement = page.locator('.error-message');
	const isVisible = await errorElement.isVisible();

	if (isVisible) {
		// Trigger a successful pane addition to clear the error
		await addPane(page, {
			targetTitle: 'Left',
			position: 'right',
			title: 'Error Clear Pane'
		});
	}
}
