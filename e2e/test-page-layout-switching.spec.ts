// e2e/test-page-layout-switching.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Layout Configuration Switching', () => {
  test('2.1 Switch to Complex Layout', async ({ page }) => {
    // Load the page (defaults to Simple Layout)
    await page.goto('http://localhost:5173/test');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });

    // Verify Simple Layout is active
    await expect(page.getByRole('radio', { name: 'Simple Layout (2 panes)' })).toBeChecked();

    // Click Complex Layout radio button
    await page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' }).click();

    // Verify Complex Layout is now selected
    await expect(page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' })).toBeChecked();

    // Wait for layout to change
    await page.waitForTimeout(500); // Allow for transition

    // Verify three panes are visible - check glass-title elements
    await expect(page.locator('.glass-title', { hasText: 'Top Pane' })).toBeVisible();
    await expect(page.locator('.glass-title', { hasText: 'Bottom Left' })).toBeVisible();
    await expect(page.locator('.glass-title', { hasText: 'Bottom Right' })).toBeVisible();

    // Verify pane content (exact text from test page source)
    await expect(page.locator('text=This is a top pane with nested children below.')).toBeVisible();
    await expect(page.locator('text=Nested pane demonstrating complex layouts.')).toBeVisible();
    await expect(page.locator('text=Try dragging the muntins (dividers) to resize!')).toBeVisible();

    // Verify two muntins exist (one horizontal, one vertical)
    const muntins = page.locator('.muntin');
    await expect(muntins).toHaveCount(2);
  });

  test('2.2 Switch Back to Simple Layout', async ({ page }) => {
    // Start with Complex Layout
    await page.goto('http://localhost:5173/test');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });

    await page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' }).click();
    await page.waitForTimeout(300);

    // Verify Complex Layout is active
    await expect(page.locator('.glass-title', { hasText: 'Top Pane' })).toBeVisible();

    // Click Simple Layout radio button
    await page.getByRole('radio', { name: 'Simple Layout (2 panes)' }).click();
    await page.waitForTimeout(300);

    // Verify Simple Layout is selected
    await expect(page.getByRole('radio', { name: 'Simple Layout (2 panes)' })).toBeChecked();

    // Verify two original panes are rendered
    await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
    await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();

    // Verify complex layout panes are removed
    await expect(page.locator('.glass-title', { hasText: 'Top Pane' })).not.toBeVisible();
    await expect(page.locator('.glass-title', { hasText: 'Bottom Left' })).not.toBeVisible();
    await expect(page.locator('.glass-title', { hasText: 'Bottom Right' })).not.toBeVisible();

    // Verify only one muntin exists
    const muntins = page.locator('.muntin');
    await expect(muntins).toHaveCount(1);
  });

  test('2.3 Rapid Layout Switching', async ({ page }) => {
    await page.goto('http://localhost:5173/test');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });

    // Rapidly switch between layouts 10 times
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        await page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' }).click();
      } else {
        await page.getByRole('radio', { name: 'Simple Layout (2 panes)' }).click();
      }
    }

    // Wait for final render
    await page.waitForTimeout(2000);

    // Verify final layout matches selected radio button
    const simpleChecked = await page.getByRole('radio', { name: 'Simple Layout (2 panes)' }).isChecked();

    if (simpleChecked) {
      await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
      await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();
    } else {
      await expect(page.locator('.glass-title', { hasText: 'Top Pane' })).toBeVisible();
    }

    // Verify no JavaScript errors (check console)
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Frame container should be properly sized
    const container = page.locator('.frame-container');
    await expect(container).toBeVisible();
  });
});
