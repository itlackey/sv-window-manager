# Error Handling Guide - SV Window Manager

This document provides comprehensive guidance on error handling in sv-window-manager, including error types, recovery strategies, and best practices.

**Last Updated:** 2025-11-19
**Version:** 0.2.2

---

## Table of Contents

1. [Error Types](#error-types)
2. [Error Format](#error-format)
3. [Common Errors & Solutions](#common-errors--solutions)
4. [Error Codes Reference](#error-codes-reference)
5. [Best Practices](#best-practices)
6. [Debugging Tips](#debugging-tips)

---

## Error Types

All sv-window-manager errors are instances of `BwinError`, which extends the standard `Error` class with enhanced context and recovery information.

### BwinError Structure

```typescript
class BwinError extends Error {
  code?: string;           // Error code (e.g., 'PANE_NOT_FOUND')
  context?: Record<string, unknown>; // Additional context
  hint?: string;           // Recovery hint
  suggestion?: string;     // "Did you mean?" suggestion
  docsUrl?: string;        // Documentation URL
}
```

### Example Error Output

```
[bwin] Invalid position: diagnol
  💡 Did you mean "diagonal"?
  ℹ️  Hint: Valid positions are: top, right, bottom, left, root
  📖 Docs: https://github.com/itlackey/sv-window-manager#positioning
```

---

## Error Format

### Basic Error

```typescript
throw new BwinError('Frame not initialized', 'FRAME_NOT_INIT');
```

### Error with Recovery Hint

```typescript
throw new BwinError(
  'Component not ready',
  'COMPONENT_NOT_READY',
  { component: 'BinaryWindow' },
  {
    hint: 'Wait for component to mount before accessing methods'
  }
);
```

### Error with "Did You Mean?" Suggestion

```typescript
throw new BwinError(
  'Invalid position: diagnol',
  'INVALID_POSITION',
  { position: 'diagnol' },
  {
    suggestion: 'Did you mean "diagonal"?',
    hint: 'Valid positions are: top, right, bottom, left, root'
  }
);
```

---

## Common Errors & Solutions

### 1. Frame Not Initialized

**Error:**
```
[bwin] Frame not initialized
  ℹ️  Hint: Ensure the BinaryWindow component is mounted before calling methods. Use $effect() to wait for initialization.
  📖 Docs: https://github.com/itlackey/sv-window-manager#initialization
```

**Cause:** Attempting to use BinaryWindow methods before the component has mounted.

**Solution:**
```svelte
<script lang="ts">
  import { BinaryWindow } from 'sv-window-manager';

  let bwin: BinaryWindow;

  // ❌ BAD - Component may not be ready
  function addPane() {
    bwin.addPane('root', { ... });
  }

  // ✅ GOOD - Wait for initialization
  $effect(() => {
    if (bwin) {
      // Component is ready, safe to use methods
      console.log('BinaryWindow initialized');
    }
  });
</script>

<BinaryWindow bind:this={bwin} {settings} />
```

### 2. Pane Not Found

**Error:**
```
[bwin] Pane not found: pane-12
  💡 Did you mean "pane-123"?
  ℹ️  Hint: Check that the pane ID exists in your layout. Use getAllLeafDescendants() to see all available pane IDs.
  📖 Docs: https://github.com/itlackey/sv-window-manager#pane-management
```

**Cause:** Referencing a pane ID that doesn't exist in the current layout.

**Solution:**
```typescript
// ❌ BAD - Hardcoded ID may not exist
bwin.removePane('pane-123');

// ✅ GOOD - Verify pane exists first
const pane = root.getById('pane-123');
if (pane) {
  bwin.removePane('pane-123');
} else {
  console.warn('Pane not found');
}

// ✅ BETTER - Get all available panes
const allPanes = root.getAllLeafDescendants();
console.log('Available panes:', allPanes.map(p => p.id));
```

### 3. Invalid Position

**Error:**
```
[bwin] Invalid position: diagnol
  💡 Did you mean "diagonal"?
  ℹ️  Hint: Valid positions are: top, right, bottom, left, root
  📖 Docs: https://github.com/itlackey/sv-window-manager#positioning
```

**Cause:** Using an invalid position value when adding or configuring panes.

**Solution:**
```typescript
// ❌ BAD - Typo in position
bwin.addPane('root', {
  position: 'diagnol', // Invalid!
  component: MyComponent
});

// ✅ GOOD - Use correct position
bwin.addPane('root', {
  position: 'right', // Valid: top, right, bottom, left
  component: MyComponent
});

// ✅ BETTER - Import Position enum
import { Position } from 'sv-window-manager';

bwin.addPane('root', {
  position: Position.Right,
  component: MyComponent
});
```

### 4. Invalid Dimensions

**Error:**
```
[bwin] Invalid dimensions: -100x600
  ℹ️  Hint: Dimension issues: width must be > 0
  📖 Docs: https://github.com/itlackey/sv-window-manager#configuration
```

**Cause:** Providing invalid width/height values (negative, zero, or NaN).

**Solution:**
```typescript
// ❌ BAD - Negative dimensions
const root = new ReactiveSash({
  width: -100,  // Invalid!
  height: 600
});

// ✅ GOOD - Positive dimensions
const root = new ReactiveSash({
  width: 800,
  height: 600
});

// ✅ BETTER - Validate dimensions
function createSash(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    throw new Error('Dimensions must be positive');
  }
  return new ReactiveSash({ width, height });
}
```

### 5. Component Not Ready

**Error:**
```
[bwin] BinaryWindow component not ready
  ℹ️  Hint: Wait for BinaryWindow to mount before accessing its methods. Use $effect(() => { if (binarywindow) { ... } })
  📖 Docs: https://github.com/itlackey/sv-window-manager#lifecycle
```

**Cause:** Accessing component methods before the component has finished mounting.

**Solution:**
```svelte
<script lang="ts">
  import { BinaryWindow } from 'sv-window-manager';

  let bwin: BinaryWindow;

  // ❌ BAD - Immediate access
  function handleClick() {
    bwin.addPane('root', { ... }); // May fail if not mounted
  }

  // ✅ GOOD - Check if ready
  function handleClick() {
    if (bwin) {
      bwin.addPane('root', { ... });
    } else {
      console.warn('BinaryWindow not ready');
    }
  }

  // ✅ BETTER - Use $effect for initialization
  $effect(() => {
    if (bwin) {
      // Perform initialization here
      setupKeyboardShortcuts(bwin);
    }
  });
</script>
```

### 6. Missing Sash ID

**Error:**
```
[bwin] Sash ID not found on element
  ℹ️  Hint: Ensure the element has a data-sash-id attribute. This is typically set automatically by the Frame component.
  📖 Docs: https://github.com/itlackey/sv-window-manager#data-attributes
```

**Cause:** Attempting to access sash data from a DOM element that doesn't have the required data attribute.

**Solution:**
```typescript
// ❌ BAD - Assuming element has data-sash-id
const sashId = element.getAttribute('data-sash-id');

// ✅ GOOD - Check if attribute exists
const sashId = element.getAttribute('data-sash-id');
if (!sashId) {
  console.warn('Element missing data-sash-id');
  return;
}

// ✅ BETTER - Use helper function
function getSashId(element: HTMLElement): string | null {
  const id = element.getAttribute('data-sash-id');
  if (!id) {
    console.warn('Element missing data-sash-id:', element.className);
  }
  return id;
}
```

---

## Error Codes Reference

### Initialization Errors

| Code | Description | Common Cause | Solution |
|------|-------------|--------------|----------|
| `FRAME_NOT_INIT` | Frame not initialized | Called methods before mount | Use $effect to wait for initialization |
| `COMPONENT_NOT_READY` | Component not ready | Accessed component too early | Check component exists before use |

### Validation Errors

| Code | Description | Common Cause | Solution |
|------|-------------|--------------|----------|
| `INVALID_POSITION` | Invalid position value | Typo or wrong enum value | Use Position enum or check spelling |
| `INVALID_DIMENSIONS` | Invalid width/height | Negative or zero dimensions | Validate dimensions are positive |
| `INVALID_SIZE` | Invalid size value | Incorrect size format | Check size is a valid number or string |
| `INVALID_CONFIG` | Invalid configuration | Malformed config object | Validate config structure |

### Lookup Errors

| Code | Description | Common Cause | Solution |
|------|-------------|--------------|----------|
| `PANE_NOT_FOUND` | Pane/sash not found | Invalid or stale ID | Verify ID exists with getById() |
| `PANE_ELEMENT_NOT_FOUND` | DOM element not found | Element removed from DOM | Check element exists in DOM |
| `MISSING_SASH_ID` | Missing data-sash-id | Element not rendered by Frame | Ensure using Frame component |

### Operation Errors

| Code | Description | Common Cause | Solution |
|------|-------------|--------------|----------|
| `MAX_CHILDREN_EXCEEDED` | Too many children | Trying to add 3+ children to sash | Binary tree allows max 2 children |
| `SIBLINGS_NOT_OPPOSITE` | Siblings not opposite positions | Invalid sibling configuration | Use opposite positions (left/right, top/bottom) |
| `SASH_SWAP_FAILED` | ID swap operation failed | Invalid sash during swap | Verify sashes exist before swapping |

### Parameter Errors

| Code | Description | Common Cause | Solution |
|------|-------------|--------------|----------|
| `PARAM_NOT_POSITIVE_INT` | Parameter must be positive integer | Negative or decimal value | Use positive integers only |
| `PARAMS_NOT_NON_NEGATIVE` | Parameters must be non-negative | Negative values | Use non-negative numbers |

---

## Best Practices

### 1. Always Catch Errors

```typescript
try {
  bwin.addPane('root', { position: 'right', component: MyComponent });
} catch (error) {
  if (error instanceof BwinError) {
    console.error('Code:', error.code);
    console.error('Hint:', error.hint);
    console.error('Suggestion:', error.suggestion);
  }
  throw error; // Re-throw if you can't handle it
}
```

### 2. Use Error Context

```typescript
catch (error) {
  if (error instanceof BwinError) {
    // Access structured context
    const { sashId } = error.context || {};
    console.error(`Failed to find pane: ${sashId}`);

    // Show recovery hint to user
    if (error.hint) {
      showNotification(error.hint);
    }
  }
}
```

### 3. Provide Helpful Errors

When creating custom errors, include recovery hints:

```typescript
import { BwinError } from 'sv-window-manager';

function validatePaneConfig(config: PaneConfig) {
  if (!config.component) {
    throw new BwinError(
      'Pane configuration missing component',
      'INVALID_CONFIG',
      { config },
      {
        hint: 'Every pane must have a component. Add a "component" property to your configuration.',
        docsUrl: 'https://github.com/itlackey/sv-window-manager#configuration'
      }
    );
  }
}
```

### 4. Validate Early

Validate user input before passing to library:

```typescript
function addCustomPane(position: string, component: any) {
  // Validate position
  const validPositions = ['top', 'right', 'bottom', 'left'];
  if (!validPositions.includes(position)) {
    console.error(`Invalid position "${position}". Valid: ${validPositions.join(', ')}`);
    return;
  }

  // Validate component
  if (!component) {
    console.error('Component is required');
    return;
  }

  // Safe to call library method
  bwin.addPane('root', { position, component });
}
```

### 5. Use TypeScript

TypeScript catches many errors at compile time:

```typescript
import { Position } from 'sv-window-manager';

// ✅ TypeScript ensures position is valid
bwin.addPane('root', {
  position: Position.Right, // Type-safe enum
  component: MyComponent
});

// ❌ TypeScript error - invalid position
bwin.addPane('root', {
  position: 'diagnol', // Error: Type '"diagnol"' is not assignable...
  component: MyComponent
});
```

---

## Debugging Tips

### 1. Enable Debug Mode

```typescript
const settings = {
  debug: true  // Enables verbose logging
};
```

### 2. Inspect Sash Tree

```typescript
// Get all panes
const allPanes = root.getAllLeafDescendants();
console.log('All panes:', allPanes.map(p => ({ id: p.id, position: p.position })));

// Walk tree
root.walk((sash) => {
  console.log('Sash:', sash.id, sash.position, sash.isLeaf());
});
```

### 3. Check Component State

```svelte
<script lang="ts">
  let bwin: BinaryWindow;

  $effect(() => {
    console.log('BinaryWindow state:', {
      mounted: !!bwin,
      rootSash: bwin?.rootSash?.id,
      paneCount: bwin?.rootSash?.getAllLeafDescendants().length
    });
  });
</script>
```

### 4. Monitor Events

```typescript
import { onpaneadded, onpaneremoved } from 'sv-window-manager';

onpaneadded((event) => {
  console.log('Pane added:', event.pane.id);
});

onpaneremoved((event) => {
  console.log('Pane removed:', event.pane.id);
});
```

### 5. Use Browser DevTools

- **Console:** All BwinErrors include `[bwin]` prefix for easy filtering
- **Breakpoints:** Set breakpoints in error handlers to inspect state
- **Network Tab:** Check for component loading issues
- **React DevTools:** Inspect component hierarchy (if using React)

---

## Error Recovery Strategies

### Graceful Degradation

```typescript
function safeAddPane(id: string, config: PaneConfig) {
  try {
    bwin.addPane(id, config);
    return true;
  } catch (error) {
    if (error instanceof BwinError) {
      // Log error but don't crash
      console.error('Failed to add pane:', error.message);

      // Show user-friendly message
      if (error.hint) {
        showNotification(error.hint, 'warning');
      }

      return false;
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### Fallback Values

```typescript
function getPaneTitle(sashId: string): string {
  try {
    const sash = root.getById(sashId);
    return sash?.store?.title || 'Untitled';
  } catch (error) {
    console.warn(`Could not get title for ${sashId}:`, error);
    return 'Untitled'; // Fallback value
  }
}
```

### User-Facing Error Messages

```typescript
function handleError(error: Error): string {
  if (error instanceof BwinError) {
    // Use hint if available, fall back to message
    return error.hint || error.message.replace('[bwin] ', '');
  }
  return 'An unexpected error occurred';
}

try {
  bwin.addPane('invalid-id', { ... });
} catch (error) {
  const userMessage = handleError(error);
  alert(userMessage); // or use your notification system
}
```

---

## Resources

- [BwinError Source Code](./src/lib/bwin/errors.ts)
- [Error Tests](./src/lib/bwin/errors.test.ts)
- [API Documentation](./README.md)
- [GitHub Issues](https://github.com/itlackey/sv-window-manager/issues)

---

**Need Help?**

If you encounter an error not covered in this guide, please:
1. Check the [GitHub Issues](https://github.com/itlackey/sv-window-manager/issues)
2. Search for your error code
3. Open a new issue with the error message and stack trace

---

**Last Updated:** 2025-11-19
**Maintained by:** SV Window Manager Team
