import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('demo page loads and shows Start Demo button', async ({ page }) => {
	await page.goto('/');

	// Verify the hero section is visible
	await expect(page.locator('h1')).toContainText('SV BWIN');

	// Verify Start Demo button is visible
	const startDemoButton = page.getByRole('button', { name: 'Start Demo' });
	await expect(startDemoButton).toBeVisible();

	// Click Start Demo
	await startDemoButton.click();

	// Wait for demo to start
	await page.waitForTimeout(1000);

	// Verify BwinHost container is visible
	const demoContainer = page.locator('.demo-container');
	await expect(demoContainer).toBeVisible();

	// Verify Reset Demo button appears
	await expect(page.getByRole('button', { name: 'Reset Demo' })).toBeVisible();
});
