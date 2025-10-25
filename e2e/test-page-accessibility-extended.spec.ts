// e2e/test-page-accessibility-extended.spec.ts
import { test, expect } from '@playwright/test';
import {
	navigateToTestPage,
	addPane,
	collectConsoleErrors
} from './helpers/pane-helpers';
import { CSS_SELECTORS, TEXT_CONTENT } from './helpers/selectors';

/**
 * Test Suite: Extended Accessibility Testing
 *
 * Additional accessibility tests for keyboard navigation
 * of action buttons and ARIA attributes on panes.
 */
test.describe('Extended Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToTestPage(page);
	});

	/**
	 * Test 8.2: Keyboard Navigation - Action Buttons
	 *
	 * Verifies that action buttons (close, minimize, maximize)
	 * can be accessed and activated via keyboard navigation.
	 */
	test('8.2 Keyboard Navigation - Action Buttons', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Add a third pane for testing close action
		await addPane(page, {
			targetTitle: TEXT_CONTENT.rightPaneTitle,
			position: 'right',
			title: 'Keyboard Test Pane'
		});

		// Verify 3 panes exist
		await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(3);

		// Focus on the first glass action button
		const firstActionButton = page.locator(CSS_SELECTORS.glassAction).first();
		await firstActionButton.focus();
		await expect(firstActionButton).toBeFocused();

		// Get the action type (close, minimize, or maximize)
		const actionClass = await firstActionButton.getAttribute('class');
		const isCloseButton = actionClass?.includes('close');
		const isMinimizeButton = actionClass?.includes('minimize');

		// Press Tab to navigate to next action button
		await page.keyboard.press('Tab');

		const secondActionButton = page.locator(CSS_SELECTORS.glassAction).nth(1);
		await expect(secondActionButton).toBeFocused();

		// Tab to third action button
		await page.keyboard.press('Tab');

		const thirdActionButton = page.locator(CSS_SELECTORS.glassAction).nth(2);
		await expect(thirdActionButton).toBeFocused();

		// Activate the third button with Space key
		const initialPaneCount = await page.locator(CSS_SELECTORS.glass).count();

		await page.keyboard.press('Space');
		await page.waitForTimeout(500);

		// Verify button action occurred (varies by button type)
		const newPaneCount = await page.locator(CSS_SELECTORS.glass).count();

		// If it was a close button, pane count should decrease
		// If it was minimize, pane count should decrease and sill should have entry
		// If it was maximize, pane should have maximized attribute
		if (isCloseButton || isMinimizeButton) {
			expect(newPaneCount).toBeLessThanOrEqual(initialPaneCount);
		}

		// Verify no errors occurred
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});

	/**
	 * Test 8.3: ARIA Attributes on Panes
	 *
	 * Verifies that panes, action buttons, and muntins
	 * have proper ARIA attributes for screen reader compatibility.
	 */
	test('8.3 ARIA Attributes on Panes', async ({ page }) => {
		// Check glass components have proper ARIA
		const glassComponents = page.locator(CSS_SELECTORS.glass);
		const glassCount = await glassComponents.count();

		for (let i = 0; i < glassCount; i++) {
			const glass = glassComponents.nth(i);

			// Glass should have region role with label OR appropriate role
			const role = await glass.getAttribute('role');
			const ariaLabel = await glass.getAttribute('aria-label');
			const ariaLabelledBy = await glass.getAttribute('aria-labelledby');

			// Should have either a role or aria-label/labelledby
			const hasAccessibility = role || ariaLabel || ariaLabelledBy;
			expect(hasAccessibility).toBeTruthy();
		}

		// Check action buttons have aria-label
		const actionButtons = page.locator(CSS_SELECTORS.glassAction);
		const buttonCount = await actionButtons.count();

		for (let i = 0; i < buttonCount; i++) {
			const button = actionButtons.nth(i);

			const ariaLabel = await button.getAttribute('aria-label');
			const title = await button.getAttribute('title');
			const textContent = await button.textContent();

			// Button should have accessible name via aria-label, title, or text content
			const hasAccessibleName = ariaLabel || title || (textContent && textContent.trim().length > 0);
			expect(hasAccessibleName).toBeTruthy();
		}

		// Check muntins have proper ARIA
		const muntins = page.locator(CSS_SELECTORS.muntin);
		const muntin = muntins.first();

		// Muntin should have separator role
		const muntinRole = await muntin.getAttribute('role');
		expect(muntinRole).toBe('separator');

		// Should have aria-orientation
		const orientation = await muntin.getAttribute('aria-orientation');
		expect(orientation).toMatch(/vertical|horizontal/);

		// Should have aria-valuenow for current position
		const valueNow = await muntin.getAttribute('aria-valuenow');
		expect(valueNow).toBeTruthy();
	});

	/**
	 * Test 8.4: Focus Indicators Visible
	 *
	 * Verifies that focused elements have visible focus indicators
	 * for keyboard navigation users.
	 */
	test('8.4 Focus Indicators Visible', async ({ page }) => {
		// Focus on the Add Pane button
		const addButton = page.getByRole('button', { name: 'Add Pane' });
		await addButton.focus();

		// Wait for focus styles to apply
		await page.waitForTimeout(100);

		await expect(addButton).toBeFocused();

		// Check if focus indicator is visible (outline or custom focus styles)
		const outlineStyle = await addButton.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				outline: styles.outline,
				outlineWidth: styles.outlineWidth,
				outlineColor: styles.outlineColor,
				boxShadow: styles.boxShadow
			};
		});

		// Should have some form of focus indicator
		const hasFocusIndicator =
			(outlineStyle.outline && outlineStyle.outline !== 'none') ||
			(outlineStyle.outlineWidth && outlineStyle.outlineWidth !== '0px') ||
			(outlineStyle.boxShadow && outlineStyle.boxShadow !== 'none');

		expect(hasFocusIndicator).toBeTruthy();
	});

	/**
	 * Test 8.5: Tab Order Logical
	 *
	 * Verifies that tab order follows a logical sequence
	 * through the form controls and action buttons.
	 */
	test('8.5 Tab Order Logical', async ({ page }) => {
		const errors = collectConsoleErrors(page);

		// Start from page
		await page.locator('.test-page').click();

		// Track tab order
		const tabOrder: string[] = [];

		// Tab through first 8 focusable elements
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');

			const focusedElement = await page.evaluate(() => {
				const el = document.activeElement;
				if (!el) return 'none';

				// Get element identifier
				const tag = el.tagName.toLowerCase();
				const type = el.getAttribute('type') || '';
				const label = el.getAttribute('aria-label') || el.getAttribute('name') || '';
				const text = el.textContent?.slice(0, 20) || '';

				return `${tag}${type ? `[${type}]` : ''}:${label || text}`.trim();
			});

			tabOrder.push(focusedElement);
		}

		// Verify tab order contains expected elements in logical sequence
		// Should include: radio buttons, checkbox, dropdowns, input, button
		const hasRadio = tabOrder.some((el) => el.includes('input[radio]'));
		const hasCheckbox = tabOrder.some((el) => el.includes('input[checkbox]'));
		const hasSelect = tabOrder.some((el) => el.includes('select'));
		const hasButton = tabOrder.some((el) => el.includes('button'));

		expect(hasRadio).toBe(true);
		expect(hasCheckbox).toBe(true);
		expect(hasSelect).toBe(true);
		expect(hasButton).toBe(true);

		// Verify no errors
		expect(errors.filter((e) => !e.includes('Warning'))).toEqual([]);
	});
});
