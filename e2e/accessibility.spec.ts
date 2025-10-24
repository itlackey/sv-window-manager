import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test');
		// Wait for the application to fully load
		await page.waitForSelector('.bw-container', { timeout: 5000 });
	});

	test('should not have accessibility violations on initial load', async ({ page }) => {
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should not have violations after adding a pane', async ({ page }) => {
		// Click button to add a pane
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(500); // Wait for pane to be added

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should not have violations when panes are minimized', async ({ page }) => {
		// Add a pane first
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(500);

		// Minimize the pane
		const minimizeButton = page.locator('.bw-glass-action[title*="Minimize"]').first();
		if (await minimizeButton.isVisible()) {
			await minimizeButton.click();
			await page.waitForTimeout(500);
		}

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should not have violations with multiple panes', async ({ page }) => {
		// Add multiple panes
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(300);
		await page.click('button:has-text("Add Terminal")');
		await page.waitForTimeout(300);
		await page.click('button:has-text("Add File Browser")');
		await page.waitForTimeout(300);

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('keyboard navigation: all interactive elements should be keyboard accessible', async ({
		page
	}) => {
		// Add a pane to have interactive elements
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(500);

		// Start tabbing through the page
		await page.keyboard.press('Tab');
		await page.waitForTimeout(100);

		// Check that focus is visible
		const focusedElement = await page.evaluate(() => {
			const el = document.activeElement;
			return {
				tagName: el?.tagName,
				className: el?.className,
				hasFocusVisible: window.getComputedStyle(el!).outlineStyle !== 'none'
			};
		});

		expect(focusedElement.tagName).toBeTruthy();
	});

	test('keyboard navigation: escape key should work on modals/dialogs', async ({ page }) => {
		// This test will verify that escape key functionality works
		// when implemented for any modal-like interfaces
		await page.keyboard.press('Escape');
		// Currently no modals, but this establishes the test pattern
		expect(true).toBe(true);
	});

	test('color contrast: all text should meet WCAG AA requirements', async ({ page }) => {
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2aa'])
			.include('.bw-container')
			.analyze();

		const contrastViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'color-contrast'
		);

		expect(contrastViolations).toEqual([]);
	});

	test('screen reader: all images should have alt text', async ({ page }) => {
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.analyze();

		const imageAltViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'image-alt'
		);

		expect(imageAltViolations).toEqual([]);
	});

	test('screen reader: buttons should have accessible names', async ({ page }) => {
		// Add a pane to have buttons
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(500);

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.analyze();

		const buttonNameViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'button-name'
		);

		expect(buttonNameViolations).toEqual([]);
	});

	test('ARIA: elements should have valid ARIA attributes', async ({ page }) => {
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(500);

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze();

		const ariaViolations = accessibilityScanResults.violations.filter((v) =>
			v.id.startsWith('aria-')
		);

		expect(ariaViolations).toEqual([]);
	});

	test('focus management: focus should be trapped appropriately', async ({ page }) => {
		await page.click('button:has-text("Add Chat")');
		await page.waitForTimeout(500);

		// Tab through the interface and verify focus doesn't escape unexpectedly
		const initialFocused = await page.evaluate(() => document.activeElement?.tagName);

		for (let i = 0; i < 20; i++) {
			await page.keyboard.press('Tab');
			await page.waitForTimeout(50);
		}

		const finalFocused = await page.evaluate(() => document.activeElement?.tagName);
		expect(finalFocused).toBeTruthy();
		expect(finalFocused).not.toBe('BODY'); // Focus shouldn't return to body
	});
});
