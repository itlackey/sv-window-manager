// e2e/test-page-pane-addition.spec.ts
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

test.describe('Dynamic Pane Addition', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		// Wait for the window to be initialized
		await page.waitForSelector('.frame-container', { state: 'visible' });
	});

	test('4.2 Add Pane to the Right', async ({ page }) => {
		// Select Right Pane as target
		await selectPaneByTitle(page, 'Right Pane');

		// Select Right position
		await page.getByLabel('Position:').selectOption('right');

		// Enter title
		await page.getByLabel('Title:').fill('Test Right Pane');

		// Click Add Pane button
		await page.getByRole('button', { name: 'Add Pane' }).click();

		// Wait for pane to be added
		await page.waitForTimeout(500);

		// Verify form reset - counter incremented
		const titleInput = page.getByLabel('Title:');
		await expect(titleInput).toHaveValue('New Pane 2');

		// Verify dropdown now has 3 options
		const dropdown = page.getByLabel('Target Pane:');
		const options = await dropdown.locator('option').count();
		expect(options).toBe(3);
	});

	test('4.3 Add Pane to the Top', async ({ page }) => {
		// Select Left Pane as target
		await selectPaneByTitle(page, 'Left Pane');

		// Select Top position
		await page.getByLabel('Position:').selectOption('top');

		// Enter title
		await page.getByLabel('Title:').fill('Top Header');

		// Click Add Pane
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(500);

		// Verify new pane appears in glass-title
		await expect(page.locator('.glass-title', { hasText: 'Top Header' })).toBeVisible();
		// The position value from Position.Top is 'top' (lowercase) - verify in content
		await expect(page.locator('text=position top')).toBeVisible();

		// Verify Left Pane still exists below
		await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();

		// Verify Right Pane remains unchanged
		await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();
	});

	test('4.4 Add Pane to the Bottom', async ({ page }) => {
		// Select Right Pane as target
		await selectPaneByTitle(page, 'Right Pane');

		// Select Bottom position
		await page.getByLabel('Position:').selectOption('bottom');

		// Enter title
		await page.getByLabel('Title:').fill('Footer Pane');

		// Click Add Pane
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(500);

		// Verify new pane appears
		await expect(page.locator('.glass-title', { hasText: 'Footer Pane' })).toBeVisible();

		// Verify Left Pane remains full height on left
		await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
	});

	test('4.5 Add Pane to the Left', async ({ page }) => {
		// Select Left Pane as target
		await selectPaneByTitle(page, 'Left Pane');

		// Select Left position
		await page.getByLabel('Position:').selectOption('left');

		// Enter title
		await page.getByLabel('Title:').fill('Sidebar');

		// Click Add Pane
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(500);

		// Verify new pane appears
		await expect(page.locator('.glass-title', { hasText: 'Sidebar' })).toBeVisible();

		// Verify three panes exist
		await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
		await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();
	});

	test('4.6 Add Multiple Panes Sequentially', async ({ page }) => {
		// Add pane 1: Right of Right Pane
		await selectPaneByTitle(page, 'Right Pane');
		await page.getByLabel('Position:').selectOption('right');
		await page.getByLabel('Title:').fill('Pane 3');
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(300);

		// Add pane 2: Bottom of Pane 3
		await selectPaneByTitle(page, 'Pane 3');
		await page.getByLabel('Position:').selectOption('bottom');
		await page.getByLabel('Title:').fill('Pane 4');
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(300);

		// Add pane 3: Top of Left Pane
		await selectPaneByTitle(page, 'Left Pane');
		await page.getByLabel('Position:').selectOption('top');
		await page.getByLabel('Title:').fill('Pane 5');
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(300);

		// Add pane 4: Left of Left Pane
		await selectPaneByTitle(page, 'Left Pane');
		await page.getByLabel('Position:').selectOption('left');
		await page.getByLabel('Title:').fill('Pane 6');
		await page.getByRole('button', { name: 'Add Pane' }).click();
		await page.waitForTimeout(300);

		// Verify all 6 panes are visible
		await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
		await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();
		await expect(page.locator('.glass-title', { hasText: 'Pane 3' })).toBeVisible();
		await expect(page.locator('.glass-title', { hasText: 'Pane 4' })).toBeVisible();
		await expect(page.locator('.glass-title', { hasText: 'Pane 5' })).toBeVisible();
		await expect(page.locator('.glass-title', { hasText: 'Pane 6' })).toBeVisible();

		// Verify dropdown shows 6 options
		const dropdown = page.getByLabel('Target Pane:');
		const options = await dropdown.locator('option').count();
		expect(options).toBe(6);

		// Verify counter shows "New Pane 7"
		await expect(page.getByLabel('Title:')).toHaveValue('New Pane 7');
	});
});
