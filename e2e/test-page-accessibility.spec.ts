// e2e/test-page-accessibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility Testing', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test');
		await page.waitForLoadState('domcontentloaded');
		// Wait for the window to be initialized
		await page.waitForSelector('.frame-container', { state: 'visible' });
	});

	test('10.1 Keyboard Navigation - Controls', async ({ page }) => {
		// Click on the page to ensure it has focus
		await page.locator('.test-page').click();

		// Tab through controls - first should be Simple Layout radio
		await page.keyboard.press('Tab');

		// Should focus on first radio button
		const simpleRadio = page.getByRole('radio', { name: 'Simple Layout (2 panes)' });
		await expect(simpleRadio).toBeFocused();

		// Tab to next control - should be Complex Layout radio
		await page.keyboard.press('Tab');

		// Should focus on complex layout radio
		const complexRadio = page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' });
		await expect(complexRadio).toBeFocused();

		// Continue tabbing through controls
		await page.keyboard.press('Tab');

		// Should reach debug checkbox
		const debugCheckbox = page.getByRole('checkbox', { name: 'Debug Mode' });
		await expect(debugCheckbox).toBeFocused();

		// Toggle checkbox with Space
		await page.keyboard.press('Space');
		await expect(debugCheckbox).toBeChecked();

		// Continue tabbing to form controls
		// After debug checkbox, we tab through: Target Pane dropdown, Position dropdown, then Title input
		await page.keyboard.press('Tab'); // Target Pane
		await page.keyboard.press('Tab'); // Position
		await page.keyboard.press('Tab'); // Title input

		// Should reach Title input
		const titleInput = page.getByLabel('Title:');
		await expect(titleInput).toBeFocused();

		// Tab to Add Pane button
		await page.keyboard.press('Tab');
		const addButton = page.getByRole('button', { name: 'Add Pane' });
		await expect(addButton).toBeFocused();

		// Activate button with Enter
		await page.keyboard.press('Enter');
		await page.waitForTimeout(500);

		// Verify pane was added - check for the title in the glass-title element
		await expect(page.locator('.glass-title', { hasText: 'New Pane 1' })).toBeVisible();
	});

	test('10.4 ARIA Roles and Attributes', async ({ page }) => {
		// Check form controls have proper labels
		const targetLabel = page.getByLabel('Target Pane:');
		await expect(targetLabel).toBeVisible();

		const positionLabel = page.getByLabel('Position:');
		await expect(positionLabel).toBeVisible();

		const titleLabel = page.getByLabel('Title:');
		await expect(titleLabel).toBeVisible();

		// Radio buttons should be grouped
		const radioGroup = page.locator('input[type="radio"]');
		await expect(radioGroup).toHaveCount(2);

		// Buttons should have accessible names
		const addButton = page.getByRole('button', { name: 'Add Pane' });
		await expect(addButton).toBeVisible();
	});

	test('10.6 Focus Management on Layout Switch', async ({ page }) => {
		// Focus on a control
		const simpleRadio = page.getByRole('radio', { name: 'Simple Layout (2 panes)' });
		await simpleRadio.focus();
		await expect(simpleRadio).toBeFocused();

		// Switch layout
		const complexRadio = page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' });
		await complexRadio.click();
		await page.waitForTimeout(500);

		// Focus should be on complex radio
		await expect(complexRadio).toBeFocused();

		// No focus trap - should be able to tab away
		await page.keyboard.press('Tab');

		// Should move to next focusable element
		const debugCheckbox = page.getByRole('checkbox', { name: 'Debug Mode' });
		await expect(debugCheckbox).toBeFocused();
	});
});
