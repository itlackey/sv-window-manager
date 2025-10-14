import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('reveal then toggle side panel (button and keyboard)', async ({ page }) => {
	await page.goto('/');

	// Wait for shell to mount
	const root = page.locator('.wm-root');
	await expect(root).toBeVisible();

	// Attach a listener for the DOM 'ready' event mirrored by the shell and wait for it
	await page.evaluate(() => {
		(window as any).__svwm_ready = false;
		const el = document.querySelector('.wm-root');
		el?.addEventListener(
			'ready',
			() => {
				(window as any).__svwm_ready = true;
			},
			{ once: true }
		);
	});
	await page.waitForFunction(() => (window as any).__svwm_ready === true);

	const panel = page.locator('aside.wm-panel');
	await expect(panel).toHaveCount(0); // initially hidden

	// Toggle via UI button
	await page.getByRole('button', { name: 'Toggle Panel' }).click();
	await expect(panel).toBeVisible();

	// Toggle via keyboard: dispatch a keydown with Ctrl+` (matches default binding)
	await page.evaluate(() => {
		const evt = new KeyboardEvent('keydown', { key: '`', ctrlKey: true, bubbles: true });
		window.dispatchEvent(evt);
	});
	await expect(panel).toHaveCount(0);
});
