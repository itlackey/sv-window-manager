# Accessibility Guide - SV Window Manager

This document provides comprehensive accessibility guidelines and features for sv-window-manager, ensuring WCAG 2.1 AA compliance and excellent screen reader support.

---

## Table of Contents

1. [Overview](#overview)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Focus Management](#focus-management)
5. [WCAG 2.1 Compliance](#wcag-21-compliance)
6. [Usage Examples](#usage-examples)
7. [Testing Accessibility](#testing-accessibility)
8. [Best Practices](#best-practices)

---

## Overview

SV Window Manager provides comprehensive accessibility features out of the box:

- ✅ **Keyboard Shortcuts** - Full keyboard navigation with customizable shortcuts
- ✅ **ARIA Live Regions** - Screen reader announcements for state changes
- ✅ **Focus Management** - Intelligent focus handling during pane operations
- ✅ **Semantic HTML** - Proper ARIA roles and labels
- ✅ **WCAG 2.1 AA Compliant** - Meets accessibility guidelines

---

## Keyboard Navigation

### Default Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + W` | Close Pane | Close the currently focused pane |
| `Ctrl/Cmd + Tab` | Next Pane | Focus the next pane in sequence |
| `Ctrl/Cmd + Shift + Tab` | Previous Pane | Focus the previous pane |
| `Escape` | Cancel | Cancel current drag/drop operation |

### Enabling Keyboard Shortcuts

```typescript
import { BinaryWindow, createKeyboardShortcuts } from 'sv-window-manager';

let bwin: BinaryWindow;

// Create keyboard shortcuts after BinaryWindow is mounted
$effect(() => {
  if (bwin) {
    const shortcuts = createKeyboardShortcuts(bwin, {
      enabled: true,
      debug: false
    });

    shortcuts.attach();

    // Cleanup on component unmount
    return () => shortcuts.destroy();
  }
});
```

### Custom Keyboard Shortcuts

Add your own keyboard shortcuts for application-specific actions:

```typescript
import { createKeyboardShortcuts } from 'sv-window-manager';

const shortcuts = createKeyboardShortcuts(bwin, {
  shortcuts: [
    {
      key: 'ctrl+shift+n',
      description: 'New pane',
      handler: (event) => {
        bwin.addPane('root', {
          position: 'right',
          title: 'New Pane',
          component: MyComponent
        });
        return true; // Handled
      },
      preventDefault: true
    },
    {
      key: 'ctrl+shift+f',
      description: 'Find in panes',
      handler: () => {
        // Custom find logic
        showFindDialog();
        return true;
      },
      preventDefault: true
    }
  ]
});
```

### Programmatic Shortcut Management

```typescript
// Add shortcut after initialization
shortcuts.addShortcut({
  key: 'ctrl+k',
  description: 'Command palette',
  handler: () => {
    openCommandPalette();
    return true;
  }
});

// Remove shortcut
shortcuts.removeShortcut('ctrl+k');

// Temporarily disable all shortcuts
shortcuts.disable();

// Re-enable
shortcuts.enable();

// Get all registered shortcuts
const allShortcuts = shortcuts.getAllShortcuts();
console.log('Available shortcuts:', allShortcuts);
```

---

## Screen Reader Support

### ARIA Live Region Announcements

SV Window Manager automatically announces important state changes to screen readers:

- ✅ Pane additions/removals
- ✅ Pane focus changes
- ✅ Minimize/maximize/restore operations
- ✅ Resize operations
- ✅ Title changes

### Enabling ARIA Announcements

```typescript
import { createAriaAnnouncer } from 'sv-window-manager';

const announcer = createAriaAnnouncer({
  enabled: true,
  mode: 'polite', // or 'assertive' for urgent announcements
  debounceDelay: 100 // Debounce rapid announcements
});

// Cleanup on unmount
return () => announcer.destroy();
```

### Integrating with Pane Events

Connect the ARIA announcer to pane lifecycle events:

```typescript
import {
  createAriaAnnouncer,
  onpaneadded,
  onpaneremoved,
  onpanefocused,
  onpaneminimized,
  onpanemaximized,
  onpanerestored,
  onpaneresized,
  onpanetitlechanged
} from 'sv-window-manager';

const announcer = createAriaAnnouncer();

// Announce pane additions
onpaneadded((event) => {
  announcer.announcePaneAdded(event.pane.title);
});

// Announce pane removals
onpaneremoved((event) => {
  announcer.announcePaneRemoved(event.pane.title);
});

// Announce focus changes
onpanefocused((event) => {
  announcer.announcePaneFocused(event.pane.title);
});

// Announce minimize/maximize/restore
onpaneminimized((event) => {
  announcer.announcePaneMinimized(event.pane.title);
});

onpanemaximized((event) => {
  announcer.announcePaneMaximized(event.pane.title);
});

onpanerestored((event) => {
  announcer.announcePaneRestored(event.pane.title);
});

// Announce resize (with dimensions)
onpaneresized((event) => {
  const { width, height } = event.pane.bounds;
  announcer.announcePaneResized(event.pane.title, { width, height });
});

// Announce title changes
onpanetitlechanged((event) => {
  announcer.announcePaneTitleChanged(
    event.context?.previousTitle,
    event.pane.title
  );
});
```

### Custom Announcements

Make custom announcements for application-specific events:

```typescript
// Generic announcement
announcer.announce('Custom operation completed');

// Keyboard shortcut help
announcer.announceShortcut('Ctrl+Shift+N', 'Create new pane');
```

### Changing Announcement Mode

```typescript
// Use 'assertive' for urgent announcements
announcer.setMode('assertive');

// Use 'polite' for non-urgent announcements (default)
announcer.setMode('polite');

// Turn off announcements
announcer.setMode('off');
```

---

## Focus Management

### Auto-Focus on Pane Addition

When adding a new pane, focus is automatically managed:

```typescript
bwin.addPane('target-pane-id', {
  position: 'right',
  title: 'New Pane',
  component: MyComponent
});

// The new pane's first focusable element receives focus automatically
```

### Focus Restoration on Pane Removal

When a pane is removed, focus moves to:
1. The next sibling pane (if available)
2. The previous sibling pane (if no next sibling)
3. The parent window container (if no siblings)

### Manual Focus Control

```typescript
// Focus a specific pane programmatically
const paneElement = document.querySelector('[data-sash-id="pane-id"]');
const focusable = paneElement?.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
focusable?.focus();
```

### Tab Index Management

Panes and their contents follow proper tab order:
- Pane headers: `tabindex="0"` (keyboard accessible)
- Close/minimize/maximize buttons: `tabindex="0"`
- Pane content: Natural tab order based on DOM order

---

## WCAG 2.1 Compliance

### Perceivable

**1.3.1 Info and Relationships (Level A)**
- ✅ Semantic HTML with proper ARIA roles
- ✅ Panes have `role="region"` and `aria-label`

**1.4.3 Contrast (Level AA)**
- ✅ CSS custom properties allow contrast customization
- ✅ Default theme meets 4.5:1 contrast ratio

### Operable

**2.1.1 Keyboard (Level A)**
- ✅ All functionality available via keyboard
- ✅ No keyboard traps

**2.1.2 No Keyboard Trap (Level A)**
- ✅ Focus can move away from all interactive elements
- ✅ Escape key cancels modal operations

**2.4.3 Focus Order (Level A)**
- ✅ Logical focus order follows pane layout

**2.4.7 Focus Visible (Level AA)**
- ✅ Focus indicators visible on all interactive elements

### Understandable

**3.2.1 On Focus (Level A)**
- ✅ Focus changes don't trigger unexpected context changes

**3.2.2 On Input (Level A)**
- ✅ Input operations don't cause unexpected changes

### Robust

**4.1.2 Name, Role, Value (Level A)**
- ✅ All interactive elements have accessible names
- ✅ Proper ARIA roles and states

**4.1.3 Status Messages (Level AA)**
- ✅ ARIA live regions announce state changes
- ✅ Status messages don't require focus

---

## Usage Examples

### Complete Accessibility Setup

```svelte
<script lang="ts">
  import {
    BinaryWindow,
    createKeyboardShortcuts,
    createAriaAnnouncer,
    onpaneadded,
    onpaneremoved,
    onpanefocused
  } from 'sv-window-manager';

  let bwin: BinaryWindow;
  let shortcuts: ReturnType<typeof createKeyboardShortcuts>;
  let announcer: ReturnType<typeof createAriaAnnouncer>;

  // Setup accessibility features
  $effect(() => {
    if (bwin) {
      // Keyboard shortcuts
      shortcuts = createKeyboardShortcuts(bwin, {
        enabled: true,
        shortcuts: [
          {
            key: 'ctrl+shift+n',
            description: 'New pane',
            handler: () => {
              bwin.addPane('root', {
                position: 'right',
                title: 'New Pane',
                component: MyComponent
              });
              return true;
            },
            preventDefault: true
          }
        ]
      });
      shortcuts.attach();

      // ARIA announcements
      announcer = createAriaAnnouncer({ enabled: true });

      // Connect events
      const unsubscribers = [
        onpaneadded((event) => {
          announcer.announcePaneAdded(event.pane.title);
        }),
        onpaneremoved((event) => {
          announcer.announcePaneRemoved(event.pane.title);
        }),
        onpanefocused((event) => {
          announcer.announcePaneFocused(event.pane.title);
        })
      ];

      // Cleanup
      return () => {
        shortcuts.destroy();
        announcer.destroy();
        unsubscribers.forEach(unsub => unsub());
      };
    }
  });
</script>

<BinaryWindow bind:this={bwin} {settings} />
```

---

## Testing Accessibility

### Manual Testing

**Keyboard Navigation:**
1. Tab through all interactive elements
2. Verify all functionality works with keyboard only
3. Check focus indicators are visible
4. Test all keyboard shortcuts

**Screen Reader Testing:**
1. Test with NVDA (Windows)
2. Test with JAWS (Windows)
3. Test with VoiceOver (macOS)
4. Verify announcements are clear and timely

### Automated Testing

```typescript
// In your test file
import { expect, test } from '@playwright/test';

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/');

  // Tab to first pane
  await page.keyboard.press('Tab');

  // Close with Ctrl+W
  await page.keyboard.press('Control+W');

  // Verify pane closed
  await expect(page.locator('.pane')).toHaveCount(0);
});

test('ARIA live region exists', async ({ page }) => {
  await page.goto('/');

  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(liveRegion).toBeAttached();
});
```

### Accessibility Audit Tools

- **axe DevTools** - Browser extension for automated testing
- **Lighthouse** - Built into Chrome DevTools
- **WAVE** - Web accessibility evaluation tool
- **pa11y** - Command-line accessibility testing

---

## Best Practices

### For Library Users

1. **Enable Accessibility Features**
   ```typescript
   // Always enable keyboard shortcuts and ARIA announcements
   const shortcuts = createKeyboardShortcuts(bwin, { enabled: true });
   const announcer = createAriaAnnouncer({ enabled: true });
   ```

2. **Provide Meaningful Pane Titles**
   ```typescript
   bwin.addPane('root', {
     title: 'Chat - Project Discussion', // Descriptive title
     // NOT: 'Chat' (too generic)
   });
   ```

3. **Test with Real Assistive Technology**
   - Don't rely solely on automated tools
   - Test with actual screen readers
   - Get feedback from users with disabilities

4. **Customize for Your Application**
   ```typescript
   // Add application-specific shortcuts
   shortcuts.addShortcut({
     key: 'ctrl+/',
     description: 'Show keyboard shortcuts help',
     handler: () => {
       showKeyboardHelp();
       return true;
     }
   });
   ```

5. **Document Keyboard Shortcuts**
   - Provide a help dialog listing all shortcuts
   - Include shortcuts in application documentation
   - Use `announcer.announceShortcut()` for discoverability

### For Component Authors

1. **Use Semantic HTML**
   ```svelte
   <button type="button" aria-label="Close pane">×</button>
   <!-- NOT: <div onclick="close()">×</div> -->
   ```

2. **Provide ARIA Labels**
   ```svelte
   <div role="region" aria-label={paneTitle}>
     <!-- Pane content -->
   </div>
   ```

3. **Manage Focus Properly**
   ```typescript
   // When opening a dialog in a pane
   onMount(() => {
     dialogElement?.focus();
   });
   ```

4. **Test Keyboard Navigation**
   ```typescript
   // Ensure all interactive elements are keyboard accessible
   <button tabindex="0" on:click={handleClick} on:keydown={handleKeyDown}>
   ```

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 Overview](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)

### SV Window Manager
- [API Documentation](./README.md)
- [Event System](./README.md#pane-lifecycle-events)
- [Keyboard Shortcuts API](./src/lib/bwin/keyboard-shortcuts.ts)
- [ARIA Announcer API](./src/lib/bwin/aria-announcer.ts)

---

## Accessibility Statement

SV Window Manager is committed to providing an accessible experience for all users. We follow WCAG 2.1 Level AA guidelines and continuously work to improve accessibility.

**If you encounter accessibility issues**, please:
1. [Report an issue](https://github.com/itlackey/sv-window-manager/issues) on GitHub
2. Include details about your assistive technology
3. Describe the expected vs. actual behavior

We appreciate your feedback and will address accessibility concerns promptly.

---

**Last Updated:** 2025-11-19
**Version:** 0.3.0 (planned)
**WCAG Level:** AA Compliant
