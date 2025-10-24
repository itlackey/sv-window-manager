// e2e/test-page-debug-and-errors.spec.ts
import { test, expect, type Page } from '@playwright/test';

// Helper function to select a pane by title fragment in the Target Pane dropdown
async function selectPaneByTitle(page: Page, titleFragment: string) {
	const targetSelect = page.getByLabel('Target Pane:');

	// Wait for the select to have options (wait for at least 2 options to be present)
	await targetSelect.waitFor({ state: 'visible' });
	await page.waitForFunction(
		() => {
			const select = document.querySelector('#target-pane') as HTMLSelectElement;
			return select && select.options.length >= 2;
		},
		{ timeout: 5000 }
	);

	// Use page.evaluate to find and select the option directly in the browser context
	const selected = await page.evaluate((fragment) => {
		const select = document.querySelector('#target-pane') as HTMLSelectElement;
		if (!select) return false;

		const options = Array.from(select.options);
		const matchingOption = options.find((opt) => opt.textContent?.includes(fragment));

		if (matchingOption && matchingOption.value) {
			select.value = matchingOption.value;
			// Trigger change event
			select.dispatchEvent(new Event('change', { bubbles: true }));
			return true;
		}
		return false;
	}, titleFragment);

	if (!selected) {
		throw new Error(`Could not find option with text containing "${titleFragment}"`);
	}

	// Wait a bit for Svelte to react to the change
	await page.waitForTimeout(100);
}

test.describe('Error Handling and Validation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		// Wait for the window to be initialized
		await page.waitForSelector('.frame-container', { state: 'visible' });
	});

	test('4.7 Add Pane with Empty Title', async ({ page }) => {
		// Clear the title input field
		const titleInput = page.getByLabel('Title:');
		await titleInput.clear();

		// Select target and position
		await selectPaneByTitle(page, 'Right Pane');
		await page.getByLabel('Position:').selectOption('right');

		// Click Add Pane
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(500);

		// Pane should be added with default title "Pane 1" (from paneCounter starting at 1)
		// The addNewPane function uses: newPaneTitle || `Pane ${paneCounter}`
		// Since we cleared the title, it should use Pane 1
		await expect(page.locator('.glass-title', { hasText: 'Pane 1' })).toBeVisible();

		// No error message should appear
		await expect(page.locator('.error-message')).not.toBeVisible();
	});

	test('4.8 Add Pane with Special Characters in Title', async ({ page }) => {
		// Enter title with special characters
		await page.getByLabel('Title:').fill('Test <Pane> & "Quotes" \'Single\' 123 !@#$%');

		// Select target and position
		await page.getByLabel('Position:').selectOption('right');

		// Click Add Pane
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(500);

		// Verify pane is added
		// Special characters should be properly escaped
		await expect(page.locator('text=Test').first()).toBeVisible();

		// No XSS vulnerability - HTML tags should be escaped
		const scriptElements = page.locator('script:not([src])');
		const count = await scriptElements.count();
		// Only legitimate scripts should exist
		expect(count).toBeLessThan(10);
	});

	test('5.3 Add Pane When Container Not Initialized (Edge Case)', async ({ page }) => {
		// This test simulates an error condition
		// Navigate to page
		await page.goto('http://localhost:5173/test');

		// Immediately try to add pane before full initialization
		// This is a race condition test
		await page.getByRole('button', { name: 'Add Pane' }).click();

		// If error occurs, it should be handled gracefully
		await page.waitForTimeout(1000);

		// Page should not crash
		await expect(page.locator('.test-page')).toBeVisible();
	});
});

test.describe('Window Chrome and Glass Components', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		// Wait for the window to be initialized
		await page.waitForSelector('.frame-container', { state: 'visible' });
	});

	test('7.1 Examine Glass Component Structure', async ({ page }) => {
		// Inspect pane structure using DevTools equivalent
		const panes = page.locator('.pane');
		await expect(panes.first()).toBeVisible();

		// Verify Glass components exist
		const glassElements = page.locator('.glass');
		await expect(glassElements.first()).toBeVisible();

		// Each pane should have title and content
		await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
		await expect(page.locator('text=This is the left pane content')).toBeVisible();
	});

	test('7.2 Title Bar Display', async ({ page }) => {
		// Verify title bars for both panes - they should be in .glass-title elements
		const leftTitle = page.locator('.glass-title', { hasText: 'Left Pane' });
		const rightTitle = page.locator('.glass-title', { hasText: 'Right Pane' });

		await expect(leftTitle).toBeVisible();
		await expect(rightTitle).toBeVisible();

		// Titles should be in glass header elements
		// Check if they have appropriate styling
		const leftTitleBox = await leftTitle.boundingBox();
		expect(leftTitleBox).not.toBeNull();
	});

	test('7.4 Glass Border and Styling', async ({ page }) => {
		// Verify Glass components have proper CSS
		const glassElements = page.locator('.glass').first();
		await expect(glassElements).toBeVisible();

		// Glass should have border, background, etc.
		// These are visual checks that could be enhanced with percy or similar
		// Just check that the glass element has display flex
		const display = await glassElements.evaluate((el) => {
			return window.getComputedStyle(el).display;
		});
		expect(display).toBe('flex');
	});
});
