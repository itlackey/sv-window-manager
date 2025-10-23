// e2e/test-page-initial-load.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Initial Page Load and Rendering', () => {
  test('1.1 Page Loads Successfully', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:5173/test');

    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });

    // Verify page title
    await expect(page).toHaveTitle('Frame Component Test - SV BWIN');

    // Verify header elements
    const header = page.locator('.test-header');
    await expect(header.locator('h1')).toContainText('Frame Component Test');
    await expect(header.locator('p')).toBeVisible();

    // Verify control panel is visible
    await expect(page.locator('.test-controls')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Simple Layout (2 panes)' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Complex Layout (3 panes, nested)' })).toBeVisible();

    // Verify Debug Mode checkbox
    await expect(page.getByRole('checkbox', { name: 'Debug Mode' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Debug Mode' })).not.toBeChecked();

    // Verify Add Pane section
    await expect(page.locator('.add-pane-controls')).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Add Pane Dynamically' })).toBeVisible();

    // Verify form controls
    await expect(page.getByLabel('Target Pane:')).toBeVisible();
    await expect(page.getByLabel('Position:')).toBeVisible();
    await expect(page.getByLabel('Title:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Pane' })).toBeVisible();

    // Verify frame container
    const container = page.locator('.frame-container');
    await expect(container).toBeVisible();

    // Verify information sections
    await expect(page.locator('.test-info')).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Component Features' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Architecture' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'How It Works' })).toBeVisible();
  });

  test('1.2 Simple Layout Renders by Default', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:5173/test');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });

    // Verify Simple Layout is selected
    await expect(page.getByRole('radio', { name: 'Simple Layout (2 panes)' })).toBeChecked();

    // Verify frame container
    const container = page.locator('.frame-container');
    await expect(container).toBeVisible();

    // Verify two panes are visible
    const leftPaneContent = page.locator('text=This is the left pane content');
    const rightPaneContent = page.locator('text=This is the right pane content');

    await expect(leftPaneContent).toBeVisible();
    await expect(rightPaneContent).toBeVisible();

    // Verify pane titles
    await expect(page.locator('text=Left Pane').first()).toBeVisible();
    await expect(page.locator('text=Right Pane').first()).toBeVisible();

    // Verify container has correct background color
    await expect(container).toHaveCSS('background-color', 'rgb(224, 224, 224)');

    // Verify a vertical muntin (divider) exists
    const muntins = page.locator('[class*="muntin"]');
    await expect(muntins).toHaveCount(1);
  });

  test('1.3 Window Chrome Renders Correctly', async ({ page }) => {
    // Navigate to test page
    await page.goto('http://localhost:5173/test');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the window to be initialized
    await page.waitForSelector('.frame-container', { state: 'visible' });

    // Verify each pane has Glass component with title bar
    const leftPane = page.locator('text=Left Pane').first();
    const rightPane = page.locator('text=Right Pane').first();

    await expect(leftPane).toBeVisible();
    await expect(rightPane).toBeVisible();

    // Verify Glass components have proper structure
    const glassComponents = page.locator('[class*="glass"]');
    await expect(glassComponents.first()).toBeVisible();

    // Check for title bars (they should contain the pane titles)
    await expect(page.locator('text=Left Pane')).toBeVisible();
    await expect(page.locator('text=Right Pane')).toBeVisible();

    // Verify content area is distinct from title bar
    await expect(page.locator('text=This is the left pane content')).toBeVisible();
    await expect(page.locator('text=This is the right pane content')).toBeVisible();
  });
});
