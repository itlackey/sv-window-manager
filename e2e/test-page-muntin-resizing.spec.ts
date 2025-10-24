// e2e/test-page-muntin-resizing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Muntin (Divider) Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/test');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });
  });

  test('6.1 Identify Muntins', async ({ page }) => {
    // Load Simple Layout (has one vertical muntin)
    await expect(page.getByRole('radio', { name: 'Simple Layout (2 panes)' })).toBeChecked();

    // Verify vertical muntin exists
    const muntins = page.locator('.muntin');
    await expect(muntins).toHaveCount(1);

    // Verify muntin is visible
    await expect(muntins.first()).toBeVisible();
  });

  test('6.2 Hover Over Muntin', async ({ page }) => {
    // Locate the muntin
    const muntin = page.locator('.muntin').first();
    await expect(muntin).toBeVisible();

    // Get muntin bounding box
    const boundingBox = await muntin.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      // Move mouse over muntin
      await page.mouse.move(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
      );

      // Wait for cursor change (visual feedback)
      await page.waitForTimeout(300);

      // Verify cursor changes to resize cursor
      const cursor = await muntin.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });

      // Cursor should be col-resize or ew-resize for vertical muntin
      expect(cursor).toMatch(/col-resize|ew-resize/);
    }
  });

  test('6.3 Drag Vertical Muntin to Resize Panes', async ({ page }) => {
    // Locate the muntin
    const muntin = page.locator('.muntin').first();
    await expect(muntin).toBeVisible();

    // Get initial muntin position
    const initialBox = await muntin.boundingBox();
    expect(initialBox).not.toBeNull();

    if (initialBox) {
      const initialX = initialBox.x;

      // Drag muntin 100px to the right
      await muntin.hover();
      await page.mouse.down();
      await page.mouse.move(initialX + 100, initialBox.y + initialBox.height / 2);
      await page.mouse.up();

      // Wait for panes to adjust
      await page.waitForTimeout(500);

      // Get new muntin position
      const newBox = await muntin.boundingBox();
      expect(newBox).not.toBeNull();

      if (newBox) {
        // Verify muntin moved approximately 100px to the right
        expect(newBox.x).toBeGreaterThan(initialX);
        expect(newBox.x - initialX).toBeGreaterThan(50); // Allow some tolerance
      }

      // Verify panes are still visible and content reflows
      await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();
      await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();
    }
  });

  test('6.4 Drag Horizontal Muntin in Complex Layout', async ({ page }) => {
    // Switch to Complex Layout
    await page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' }).click();
    await page.waitForTimeout(500);

    // Verify Complex Layout is active
    await expect(page.locator('.glass-title', { hasText: 'Top Pane' })).toBeVisible();

    // Find muntins (should have 2: one horizontal, one vertical)
    const muntins = page.locator('.muntin');
    await expect(muntins).toHaveCount(2);

    // Identify the horizontal muntin (between top and bottom sections)
    // This is a heuristic - horizontal muntins are typically wider than tall
    const firstMuntin = muntins.first();
    const firstBox = await firstMuntin.boundingBox();

    if (firstBox) {
      const isHorizontal = firstBox.width > firstBox.height;
      const horizontalMuntin = isHorizontal ? firstMuntin : muntins.nth(1);

      // Get initial position
      const initialBox = await horizontalMuntin.boundingBox();
      expect(initialBox).not.toBeNull();

      if (initialBox) {
        const initialY = initialBox.y;

        // Drag muntin down by 50px
        await horizontalMuntin.hover();
        await page.mouse.down();
        await page.mouse.move(initialBox.x + initialBox.width / 2, initialY + 50);
        await page.mouse.up();

        // Wait for adjustment
        await page.waitForTimeout(500);

        // Verify all three panes are still visible
        await expect(page.locator('.glass-title', { hasText: 'Top Pane' })).toBeVisible();
        await expect(page.locator('.glass-title', { hasText: 'Bottom Left' })).toBeVisible();
        await expect(page.locator('.glass-title', { hasText: 'Bottom Right' })).toBeVisible();
      }
    }
  });

  test('6.5 Drag Muntin to Minimum Width', async ({ page }) => {
    // Locate the vertical muntin
    const muntin = page.locator('.muntin').first();
    const initialBox = await muntin.boundingBox();

    if (initialBox) {
      // Try to drag muntin all the way to the left
      await muntin.hover();
      await page.mouse.down();
      await page.mouse.move(10, initialBox.y + initialBox.height / 2); // Near left edge
      await page.mouse.up();

      await page.waitForTimeout(500);

      // Verify Left Pane still visible (not collapsed)
      await expect(page.locator('.glass-title', { hasText: 'Left Pane' })).toBeVisible();

      // Verify muntin did not reach position 10 (minimum enforced)
      const newBox = await muntin.boundingBox();
      if (newBox) {
        expect(newBox.x).toBeGreaterThan(50); // Minimum width constraint
      }
    }
  });

  test('6.6 Drag Muntin to Maximum Width', async ({ page }) => {
    // Locate the vertical muntin
    const muntin = page.locator('.muntin').first();
    const container = page.locator('.frame-container');
    const containerBox = await container.boundingBox();
    const initialBox = await muntin.boundingBox();

    if (initialBox && containerBox) {
      // Try to drag muntin all the way to the right
      await muntin.hover();
      await page.mouse.down();
      await page.mouse.move(containerBox.width - 10, initialBox.y + initialBox.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(500);

      // Verify Right Pane still visible (maintains minimum width)
      await expect(page.locator('.glass-title', { hasText: 'Right Pane' })).toBeVisible();

      // Verify muntin stopped before right edge
      const newBox = await muntin.boundingBox();
      if (newBox) {
        expect(newBox.x).toBeLessThan(containerBox.width - 50); // Minimum width constraint
      }
    }
  });
});
