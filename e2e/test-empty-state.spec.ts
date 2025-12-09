// e2e/test-empty-state.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Empty State Slot Feature', () => {
	test('should display custom empty state when no content is present', async ({ page }) => {
		// Navigate to empty state test page
		await page.goto('http://localhost:5173/test-empty-state');

		// Wait for page to fully load
		await page.waitForLoadState('domcontentloaded');

		// Wait for the BinaryWindow container to be visible
		await page.waitForSelector('.bw-container', { state: 'visible' });

		// Verify the custom empty state is visible
		const emptyState = page.locator('.custom-empty-state');
		await expect(emptyState).toBeVisible();

		// Verify the empty state icon is visible
		const emptyIcon = page.locator('.empty-icon');
		await expect(emptyIcon).toBeVisible();
		await expect(emptyIcon).toContainText('📋');

		// Verify the empty state heading
		const heading = emptyState.locator('h2');
		await expect(heading).toBeVisible();
		await expect(heading).toContainText('No Windows Open');

		// Verify the empty state message
		const message = emptyState.locator('p');
		await expect(message).toBeVisible();
		await expect(message).toContainText('Click "Add Content" to add a pane');

		// Verify the frame is hidden (CSS class applied)
		const frameContainer = page.locator('.bw-frame-container');
		await expect(frameContainer).toHaveClass(/bw-hidden/);

		// Take screenshot of empty state
		await page.screenshot({ path: '/tmp/empty-state-empty.png', fullPage: false });
	});

	test('should hide empty state and show content when pane is added', async ({ page }) => {
		// Listen for console messages
		page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
		page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

		// Navigate to empty state test page
		await page.goto('http://localhost:5173/test-empty-state');

		// Wait for page to fully load
		await page.waitForLoadState('domcontentloaded');

		// Wait for the BinaryWindow container to be visible
		await page.waitForSelector('.bw-container', { state: 'visible' });

		// Verify empty state is visible initially
		const emptyState = page.locator('.custom-empty-state');
		await expect(emptyState).toBeVisible();

		// Wait for the button to be ready (component bound)
		await page.waitForSelector('#toggle-content[data-ready="true"]', { state: 'attached', timeout: 5000 });

		// Click the "Add Content" button
		const addButton = page.locator('#toggle-content');
		await expect(addButton).toBeVisible();
		await expect(addButton).toBeEnabled();
		await addButton.click();

		// Wait a bit to see console output
		await page.waitForTimeout(2000);

		// Wait for the pane to appear
		await page.waitForSelector('.example-pane', { state: 'visible', timeout: 5000 });

		// Verify empty state is no longer visible
		await expect(emptyState).not.toBeVisible();

		// Verify the frame container is now visible (not hidden)
		const frameContainer = page.locator('.bw-frame-container');
		await expect(frameContainer).not.toHaveClass(/bw-hidden/);

		// Verify a pane with content is visible
		const examplePane = page.locator('.example-pane');
		await expect(examplePane).toBeVisible();

		// Verify the pane content
		await expect(examplePane.locator('h2')).toContainText('Example Content');
		await expect(examplePane.locator('p').first()).toContainText(
			'This is example content displayed in a pane'
		);

		// Verify the glass title bar
		const glassTitle = page.locator('.glass-title');
		await expect(glassTitle).toBeVisible();
		await expect(glassTitle).toContainText('Example Pane');

		// Take screenshot of state with content
		await page.screenshot({ path: '/tmp/empty-state-with-content.png', fullPage: false });
	});
});
