# Testing Quick Start Guide

Get running with the sv-window-manager test suite in 5 minutes.

**For Complete Details**: See [TEST_PLAN.md](./TEST_PLAN.md) for comprehensive test scenarios and implementation guide.

---

## Setup (First Time)

```bash
# Install dependencies
npm install

# Install Playwright browsers (if needed)
npx playwright install
```

---

## Running Tests

### Basic Workflow

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

### Common Commands

```bash
# Run all tests
npm run test:e2e

# Run specific file
npx playwright test e2e/test-page-glass-actions.spec.ts

# Watch mode with UI
npx playwright test --ui

# See browser in action
npx playwright test --headed

# Debug specific test
npx playwright test --debug -g "Close Button"

# View test report
npx playwright show-report
```

---

## Writing Your First Test

```typescript
// e2e/test-page-my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { navigateToTestPage, addPane, getPaneCount } from './helpers/pane-helpers';
import { CSS_SELECTORS } from './helpers/selectors';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page);
  });

  test('adds pane successfully', async ({ page }) => {
    // Arrange
    const initialCount = await getPaneCount(page);

    // Act
    await addPane(page, {
      targetTitle: 'Left Pane',
      position: 'right',
      title: 'Test Pane'
    });

    // Assert
    expect(await getPaneCount(page)).toBe(initialCount + 1);
    await expect(
      page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Test Pane' })
    ).toBeVisible();
  });
});
```

---

## Helper Functions

**Import from**: `./helpers/pane-helpers`

```typescript
import {
  navigateToTestPage,    // Load test page
  addPane,               // Add pane with config
  getPaneCount,          // Count visible panes
  clickPaneAction,       // Close/minimize/maximize
  switchLayout,          // Change layout
  dragMuntin,           // Resize panes
  collectConsoleErrors  // Track errors
} from './helpers/pane-helpers';
```

### Common Usage

```typescript
// Navigate and wait
await navigateToTestPage(page);

// Add a pane
await addPane(page, {
  targetTitle: 'Left Pane',
  position: 'right',
  title: 'My Pane'
});

// Close a pane
await clickPaneAction(page, 'My Pane', 'close');

// Count panes
const count = await getPaneCount(page);

// Track errors
const errors = collectConsoleErrors(page);
expect(errors).toEqual([]);
```

---

## Selectors

**Import from**: `./helpers/selectors`

```typescript
import { CSS_SELECTORS, TEXT_CONTENT, ACCESSIBLE_SELECTORS } from './helpers/selectors';

// Use CSS selectors
page.locator(CSS_SELECTORS.glass)
page.locator(CSS_SELECTORS.muntin)

// Use accessible selectors (preferred)
page.getByRole('button', { name: 'Add Pane' })
page.getByLabel('Target Pane:')

// Use text constants
TEXT_CONTENT.leftPaneTitle   // "Left Pane"
TEXT_CONTENT.rightPaneTitle  // "Right Pane"
```

---

## Common Patterns

### Pattern 1: Add and Verify Pane

```typescript
test('adds pane', async ({ page }) => {
  await navigateToTestPage(page);

  await addPane(page, {
    targetTitle: 'Right Pane',
    position: 'right',
    title: 'Test'
  });

  await expect(
    page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Test' })
  ).toBeVisible();
});
```

### Pattern 2: Track Console Errors

```typescript
test('no errors', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await navigateToTestPage(page);
  // ... perform actions

  expect(errors.filter(e => !e.includes('Warning'))).toEqual([]);
});
```

### Pattern 3: Test Glass Actions

```typescript
test('closes pane', async ({ page }) => {
  await navigateToTestPage(page);
  await addPane(page, {
    targetTitle: 'Left Pane',
    position: 'right',
    title: 'Closeable'
  });

  await clickPaneAction(page, 'Closeable', 'close');

  await expect(
    page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Closeable' })
  ).not.toBeVisible();
});
```

---

## Debugging

### Method 1: Playwright Inspector (Best)

```bash
npx playwright test --debug
```

- Set breakpoints
- Step through test
- Inspect elements
- View screenshots

### Method 2: Headed Mode

```bash
npx playwright test --headed --slowmo=1000
```

- See browser window
- Watch test execute
- Slow down actions

### Method 3: Screenshots

```typescript
test('my test', async ({ page }) => {
  await page.screenshot({ path: 'debug.png' });
});
```

---

## Test Files Structure

```
e2e/
├── helpers/
│   ├── pane-helpers.ts          # Helper functions
│   └── selectors.ts             # Selectors
│
├── test-page-initial-load.spec.ts       # 3 tests
├── test-page-layout-switching.spec.ts   # 2 tests
├── test-page-debug-mode.spec.ts         # 4 tests
├── test-page-pane-addition.spec.ts      # 5 tests
├── test-page-muntin-resizing.spec.ts    # 2 tests
├── test-page-glass-actions.spec.ts      # 7 tests
├── test-page-accessibility.spec.ts      # 3 tests
├── test-page-accessibility-extended.spec.ts # 5 tests
├── test-page-error-handling.spec.ts     # 4 tests
└── test-page-performance.spec.ts        # 4 tests
```

**Total**: 39 tests, ~5 minute execution time

---

## Common Issues

### Element not found

```typescript
// Wait for element
await page.waitForSelector(CSS_SELECTORS.glass, { state: 'visible' });
```

### Flaky tests

```typescript
// Use condition waits, not timeouts
await page.waitForFunction(() =>
  document.querySelectorAll('.glass').length === 3
);
```

### Dev server not running

```bash
# Always start server first
npm run dev  # Terminal 1
npm run test:e2e  # Terminal 2
```

---

## Quick Reference

```typescript
// Navigation
await navigateToTestPage(page);

// Pane Operations
await addPane(page, { targetTitle: 'Left', position: 'right', title: 'New' });
await clickPaneAction(page, 'Pane Title', 'close');  // or 'minimize', 'maximize'
const count = await getPaneCount(page);

// Layout
await switchLayout(page, 'complex');  // or 'simple'

// Muntin
await dragMuntin(page, '.muntin.vertical', 100, 0);

// Assertions
await expect(page.locator(CSS_SELECTORS.glass)).toHaveCount(3);
await expect(page.locator(CSS_SELECTORS.glassTitle, { hasText: 'Test' })).toBeVisible();
expect(await getPaneCount(page)).toBe(2);
```

---

## Next Steps

1. ✅ Run existing tests: `npm run test:e2e`
2. ✅ Read a complete example: `e2e/test-page-glass-actions.spec.ts`
3. ✅ Write your first test using the template above
4. 📖 Check [TEST_PLAN.md](./TEST_PLAN.md) for comprehensive scenarios
5. 🚀 Contribute new tests based on the roadmap

---

## Documentation

- **[TEST_PLAN.md](./TEST_PLAN.md)** - Complete test plan with all scenarios
- **[e2e/helpers/pane-helpers.ts](./e2e/helpers/pane-helpers.ts)** - Helper function source
- **[e2e/helpers/selectors.ts](./e2e/helpers/selectors.ts)** - Selector constants
- **[Playwright Docs](https://playwright.dev/docs/intro)** - Official Playwright documentation


