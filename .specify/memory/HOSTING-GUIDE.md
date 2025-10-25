# BinaryWindow Component Hosting Guide

## Overview

This guide explains how to properly set up a page or component to host the `BinaryWindow` component. Following these guidelines will ensure that features like `fitContainer`, proper layout, and window management work correctly.

## Table of Contents

- [Quick Start](#quick-start)
- [Required Setup](#required-setup)
- [Understanding fitContainer](#understanding-fitcontainer)
- [Common Issues](#common-issues)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Quick Start

### Minimal Working Example

```svelte
<script lang="ts">
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';

  // Import ALL required CSS files
  import '$lib/bwin/css/vars.css';
  import '$lib/bwin/css/frame.css';
  import '$lib/bwin/css/glass.css';
  import '$lib/bwin/css/sill.css';
  import '$lib/bwin/css/body.css';

  let bwin = $state<BinaryWindow | undefined>();
</script>

<!-- Container with explicit dimensions -->
<div class="window-container">
  <BinaryWindow
    bind:this={bwin}
    settings={{ width: 900, height: 500, fitContainer: true }}
  />
</div>

<style>
  .window-container {
    width: 100%;
    height: 500px;  /* REQUIRED: Explicit height */
  }
</style>
```

---

## Required Setup

### 1. CSS Imports (CRITICAL)

You **MUST** import all required CSS files in your component. Missing any of these will cause layout issues.

```javascript
import '$lib/bwin/css/vars.css';     // CSS custom properties for theming
import '$lib/bwin/css/frame.css';    // Layout styles (CRITICAL for fitContainer)
import '$lib/bwin/css/glass.css';    // Window chrome (headers, tabs, actions)
import '$lib/bwin/css/sill.css';     // Minimized pane container
import '$lib/bwin/css/body.css';     // Content area styles
```

**Why this matters:**

Without these imports, the window manager will have incorrect styles:
- `position: static` instead of `position: relative` (breaks absolute positioning)
- `box-sizing: content-box` instead of `box-sizing: border-box` (breaks height calculation)
- No height constraint (window grows unbounded instead of fitting container)

### 2. Container Element with Explicit Height

The BinaryWindow component needs a parent container with an **explicit height**:

```html
<!-- ❌ BAD: No height specified -->
<div class="container">
  <BinaryWindow ... />
</div>

<!-- ✅ GOOD: Explicit height -->
<div class="container" style="height: 500px;">
  <BinaryWindow ... />
</div>

<!-- ✅ GOOD: Height via CSS -->
<div class="window-container">
  <BinaryWindow ... />
</div>

<style>
  .window-container {
    height: 500px;
    /* OR */
    height: 100vh;
    /* OR */
    height: 100%;  /* if parent has explicit height */
  }
</style>
```

**Why this matters:**

The `fitContainer` feature works by:
1. The `.window` element uses `height: 100%` to fill its container
2. The container must have an explicit height for `100%` to work
3. Without explicit height, the container collapses or grows unbounded

### 3. BinaryWindow Settings

Provide initial dimensions and enable fitContainer:

```svelte
<BinaryWindow
  bind:this={bwin}
  settings={{
    width: 900,           // Initial width (px)
    height: 500,          // Initial height (px)
    fitContainer: true    // Enable responsive resizing
  }}
/>
```

**Settings Explanation:**

- `width` and `height`: Initial dimensions used for SSR and first render
- `fitContainer: true`: Enables ResizeObserver to track container size changes
- When container resizes, BinaryWindow automatically adjusts to fit

---

## Understanding fitContainer

### How It Works

The `fitContainer` feature is a **chain of dependencies**:

```
1. CSS: .demo-container { height: 500px }
   ↓
2. CSS: .bw-container { height: 100% }     (from frame.css)
   ↓
3. CSS: .window { height: 100% }            (from frame.css)
   ↓
4. JS: ResizeObserver monitors .bw-container
   ↓
5. JS: When container resizes → frameComponent.fit()
   ↓
6. JS: Panes reflow to new dimensions
```

**If any link breaks, fitContainer fails:**

- Missing CSS imports → Link 2 & 3 break
- No explicit container height → Link 1 breaks
- `fitContainer: false` → Link 4 breaks

### Visual Example

```svelte
<script>
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';


  let bwin = $state<BinaryWindow | undefined>();
  let containerHeight = $state(500);
</script>

<!-- ✅ Parent with explicit height -->
<div class="demo-container" style="height: {containerHeight}px;">
  <!-- ✅ BinaryWindow with fitContainer enabled -->
  <BinaryWindow
    bind:this={bwin}
    settings={{ width: 900, height: containerHeight, fitContainer: true }}
  />
</div>

<!-- Control to test responsive resizing -->
<input type="range" bind:value={containerHeight} min="300" max="800" />
<p>Container Height: {containerHeight}px</p>
```

When you drag the slider, the BinaryWindow automatically resizes to match the new container height.

---

## Common Issues

### Issue 1: Window Height Grows Unbounded

**Symptoms:**
- Window manager is very tall (3000+ px)
- Panes extend far below expected container
- Scrolling required to see all content

**Cause:** Missing CSS imports (specifically `frame.css`)

**Fix:**
```javascript
// Add at top of your component
import '$lib/bwin/css/frame.css';
```

**Verification:**
```javascript
// In browser DevTools console:
document.querySelector('.window').style.position
// Should return: "relative" (not "static")

document.querySelector('.window').style.height
// Should return: "500px" or "100%" (not "3476px")
```

### Issue 2: fitContainer Does Nothing

**Symptoms:**
- Changing container size doesn't resize window
- Window stays at initial dimensions
- ResizeObserver not firing

**Possible Causes:**

1. **Missing `fitContainer: true`**
   ```svelte
   <!-- ❌ BAD -->
   <BinaryWindow settings={{ width: 900, height: 500 }} />

   <!-- ✅ GOOD -->
   <BinaryWindow settings={{ width: 900, height: 500, fitContainer: true }} />
   ```

2. **Container has no explicit height**
   ```svelte
   <!-- ❌ BAD: No height -->
   <div>
     <BinaryWindow ... />
   </div>

   <!-- ✅ GOOD: Explicit height -->
   <div style="height: 500px;">
     <BinaryWindow ... />
   </div>
   ```

3. **CSS not imported**
   ```javascript
   // ✅ Add these imports
   import '$lib/bwin/css/vars.css';
   import '$lib/bwin/css/frame.css';
   import '$lib/bwin/css/glass.css';
   import '$lib/bwin/css/sill.css';
   import '$lib/bwin/css/body.css';
   ```

### Issue 3: Panes Overlap or Have Wrong Positions

**Symptoms:**
- Panes render on top of each other
- Dividers (muntins) appear in wrong positions
- Clicking panes selects wrong window

**Cause:** Missing `frame.css` which defines positioning rules

**Fix:**
```javascript
import '$lib/bwin/css/frame.css';
```

This file contains critical CSS for:
- `.window { position: relative }` - Establishes positioning context
- `.pane { position: absolute }` - Panes positioned absolutely within window
- `.muntin` positioning rules - Dividers between panes

---

## Troubleshooting

### Step 1: Verify CSS Imports

Check that your component has all required imports:

```javascript
import '$lib/bwin/css/vars.css';
import '$lib/bwin/css/frame.css';
import '$lib/bwin/css/glass.css';
import '$lib/bwin/css/sill.css';
import '$lib/bwin/css/body.css';
```

### Step 2: Inspect Container Element

In browser DevTools:

```javascript
// Select the container
const container = document.querySelector('.demo-container');

// Check computed height
window.getComputedStyle(container).height
// Should be: "500px" (or your explicit value)
// NOT: "0px" or "auto"

// Check if height is explicit
container.style.height || container.offsetHeight
// Should return: non-zero value
```

### Step 3: Inspect Window Element

```javascript
// Select the window
const windowEl = document.querySelector('.window');

// Check positioning
window.getComputedStyle(windowEl).position
// Should be: "relative"
// NOT: "static"

// Check height
window.getComputedStyle(windowEl).height
// Should be: "500px" (matching container)
// NOT: "3476px" or very large value

// Check box-sizing
window.getComputedStyle(windowEl).boxSizing
// Should be: "border-box"
// NOT: "content-box"
```

### Step 4: Check Settings

Verify BinaryWindow settings include fitContainer:

```svelte
<BinaryWindow
  bind:this={bwin}
  settings={{ width: 900, height: 500, fitContainer: true }}
/>
```

### Step 5: Monitor ResizeObserver

```javascript
// After component mounts, check if ResizeObserver is active
// (You should see window resize when you change container size)

// Manually trigger resize
const container = document.querySelector('.demo-container');
container.style.height = '700px';

// Window should resize automatically
// If it doesn't, fitContainer is not working
```

---

## Best Practices

### 1. Always Import All CSS Files

Don't selectively import CSS files. Import all of them to ensure consistent behavior:

```javascript
// ✅ GOOD: Import all
import '$lib/bwin/css/vars.css';
import '$lib/bwin/css/frame.css';
import '$lib/bwin/css/glass.css';
import '$lib/bwin/css/sill.css';
import '$lib/bwin/css/body.css';

// ❌ BAD: Selective imports
import '$lib/bwin/css/vars.css';
import '$lib/bwin/css/glass.css';
// Missing frame.css, sill.css, body.css
```

### 2. Use a Dedicated Container Element

Wrap BinaryWindow in a dedicated container with explicit dimensions:

```svelte
<div class="binary-window-container">
  <BinaryWindow ... />
</div>

<style>
  .binary-window-container {
    width: 100%;
    height: 500px;
    /* Add any additional styling */
    border: 1px solid #ccc;
    border-radius: 8px;
  }
</style>
```

### 3. Provide Initial Dimensions

Always specify `width` and `height` in settings, even with `fitContainer: true`:

```svelte
<!-- ✅ GOOD: Initial dimensions + fitContainer -->
<BinaryWindow
  settings={{ width: 900, height: 500, fitContainer: true }}
/>

<!-- ⚠️ OK but less ideal: No initial dimensions -->
<BinaryWindow
  settings={{ fitContainer: true }}
/>
```

Initial dimensions:
- Prevent layout shift during SSR
- Provide fallback if ResizeObserver fails
- Give clearer API signal about expected size

### 4. Responsive Layouts

For responsive designs, combine CSS with `fitContainer`:

```svelte
<script>
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import '$lib/bwin/css/vars.css';
  import '$lib/bwin/css/frame.css';
  import '$lib/bwin/css/glass.css';
  import '$lib/bwin/css/sill.css';
  import '$lib/bwin/css/body.css';

  let bwin = $state<BinaryWindow | undefined>();
</script>

<div class="responsive-container">
  <BinaryWindow
    bind:this={bwin}
    settings={{ width: 1200, height: 600, fitContainer: true }}
  />
</div>

<style>
  .responsive-container {
    width: 100%;
    height: 600px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .responsive-container {
      height: 400px;
    }
  }
</style>
```

### 5. Full-Page Layouts

For full-page window managers:

```svelte
<script>
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';
  import '$lib/bwin/css/vars.css';
  import '$lib/bwin/css/frame.css';
  import '$lib/bwin/css/glass.css';
  import '$lib/bwin/css/sill.css';
  import '$lib/bwin/css/body.css';

  let bwin = $state<BinaryWindow | undefined>();
</script>

<div class="fullpage-container">
  <BinaryWindow
    bind:this={bwin}
    settings={{ width: 1920, height: 1080, fitContainer: true }}
  />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .fullpage-container {
    width: 100vw;
    height: 100vh;
  }
</style>
```

---

## Advanced: Custom Theming

The `vars.css` file exposes CSS custom properties for theming:

```svelte
<div class="themed-container">
  <BinaryWindow ... />
</div>

<style>
  .themed-container {
    height: 500px;

    /* Override CSS custom properties */
    --bw-glass-bg-color: #1e1e1e;
    --bw-glass-border-color: #3a3a3a;
    --bw-glass-header-bg-color: #252526;
    --bw-muntin-bg-color: #2d2d30;
    --bw-pane-bg-color: #1e1e1e;
  }
</style>
```

Available custom properties:
- `--bw-glass-bg-color`: Window background color
- `--bw-glass-border-color`: Window border color
- `--bw-glass-header-bg-color`: Header background color
- `--bw-muntin-bg-color`: Divider background color
- `--bw-pane-bg-color`: Pane background color
- `--bw-container-height`: Default container height
- And many more (see `vars.css`)

---

## Summary Checklist

Before deploying a page with BinaryWindow, verify:

- [ ] All CSS files imported (`vars`, `frame`, `glass`, `sill`, `body`)
- [ ] Container has explicit height (px, vh, or % with parent height)
- [ ] BinaryWindow settings include `fitContainer: true`
- [ ] BinaryWindow settings include initial `width` and `height`
- [ ] Tested in browser DevTools:
  - [ ] `.window` has `position: relative`
  - [ ] `.window` height matches container (not unbounded)
  - [ ] Resizing container resizes window
  - [ ] No console errors
- [ ] Tested functionality:
  - [ ] Panes render correctly
  - [ ] Panes can be added/removed
  - [ ] Dividers (muntins) are draggable
  - [ ] Window controls (minimize, maximize, close) work

If all checkboxes are checked, your BinaryWindow hosting setup is correct! ✅

---

## Additional Resources

- [bwin.js Documentation](https://bhjsdev.github.io/bwin-docs/)
- [Project CLAUDE.md](./CLAUDE.md) - Development guide
- [BinaryWindow Component Source](./src/lib/bwin/binary-window/BinaryWindow.svelte)
- [Example: Working Demo Page](./src/routes/+page.svelte)
- [Example: Test Page](./src/routes/test/+page.svelte)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check browser console for errors
2. Inspect DOM with DevTools (see Troubleshooting section)
3. Compare your setup to working examples (`src/routes/+page.svelte`, `src/routes/test/+page.svelte`)
4. Open an issue on GitHub with:
   - Description of the problem
   - Code snippet showing your setup
   - Browser console errors (if any)
   - Screenshots of unexpected behavior

---

**Document Version:** 1.0
**Last Updated:** 2025-01-24
**Maintained By:** SV BWIN Contributors
