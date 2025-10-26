# Context API Usage Guide

This guide demonstrates how to use the type-safe context utilities in sv-window-manager.

## Overview

The library provides two context utilities:
- **Window Context**: Access BinaryWindow methods and state from child components
- **Layout Context**: Access Frame configuration (like debug mode) from child components

## Migration Guide

### Old Approach (Deprecated)

```typescript
import { getContext } from 'svelte';
import { BWIN_CONTEXT, FRAME_CONTEXT } from 'sv-window-manager';
import type { BwinContext, FrameContext } from 'sv-window-manager';

// In a child component
const bwin = getContext<BwinContext>(BWIN_CONTEXT);
const layout = getContext<FrameContext>(FRAME_CONTEXT);

// No type checking - will be undefined if used outside BinaryWindow
if (bwin) {
  bwin.removePane(sash.id);
}
```

### New Approach (Recommended)

```typescript
import { getWindowContext, getLayoutContext } from 'sv-window-manager';

// In a child component
const bwin = getWindowContext(); // Throws error if outside BinaryWindow
const layout = getLayoutContext(); // Throws error if outside Frame

// Type-safe and guaranteed to be defined
bwin.removePane(sash.id);
```

## Window Context

### Available Methods and Properties

```typescript
interface BwinContext {
  readonly windowElement: HTMLElement | undefined;
  readonly sillElement: HTMLElement | undefined;
  readonly rootSash: Sash | undefined;
  removePane: (sashId: string) => void;
  addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash | null;
  getMinimizedGlassElementBySashId: (sashId: string) => Element | null | undefined;
  getSillElement: () => HTMLElement | undefined;
  ensureSillElement: () => HTMLElement | undefined;
}
```

### Usage Examples

#### Example 1: Custom Close Button

```svelte
<script lang="ts">
  import { getWindowContext } from 'sv-window-manager';
  import type { Sash } from 'sv-window-manager';

  let { sash }: { sash: Sash } = $props();

  const bwin = getWindowContext();

  function handleClose() {
    bwin.removePane(sash.id);
  }
</script>

<button onclick={handleClose}>
  Close Pane
</button>
```

#### Example 2: Add New Pane

```svelte
<script lang="ts">
  import { getWindowContext } from 'sv-window-manager';
  import type { Sash } from 'sv-window-manager';
  import MyComponent from './MyComponent.svelte';

  let { sash }: { sash: Sash } = $props();

  const bwin = getWindowContext();

  function handleSplit() {
    bwin.addPane(sash.id, {
      position: 'right',
      size: '50%',
      title: 'New Pane',
      component: MyComponent,
      componentProps: { message: 'Split content' }
    });
  }
</script>

<button onclick={handleSplit}>
  Split Right
</button>
```

#### Example 3: Minimize to Sill

```svelte
<script lang="ts">
  import { getWindowContext } from 'sv-window-manager';
  import type { Sash } from 'sv-window-manager';

  let { sash, glassElement }: { sash: Sash; glassElement: HTMLElement } = $props();

  const bwin = getWindowContext();

  function handleMinimize() {
    // Get the sill element
    const sillElement = bwin.ensureSillElement();
    if (!sillElement) return;

    // Move glass to sill
    sillElement.appendChild(glassElement);
  }
</script>

<button onclick={handleMinimize}>
  Minimize
</button>
```

#### Example 4: Safe Context Access (Optional Context)

```svelte
<script lang="ts">
  import { tryGetWindowContext } from 'sv-window-manager';

  // This component can work both inside and outside BinaryWindow
  const bwin = tryGetWindowContext();

  function handleAction() {
    if (bwin) {
      // We're inside a BinaryWindow - use window features
      console.log('Root sash:', bwin.rootSash);
    } else {
      // We're standalone - use fallback behavior
      console.log('Not inside a BinaryWindow');
    }
  }
</script>

<button onclick={handleAction}>
  Do Action
</button>
```

## Layout Context

### Available Properties

```typescript
interface FrameContext {
  readonly debug: boolean;
}
```

### Usage Examples

#### Example 1: Conditional Debug Output

```svelte
<script lang="ts">
  import { getLayoutContext } from 'sv-window-manager';

  const layout = getLayoutContext();

  function logDebugInfo(message: string) {
    if (layout.debug) {
      console.log('[MyComponent]', message);
    }
  }

  $effect(() => {
    logDebugInfo('Component mounted');
  });
</script>

<div>
  {#if layout.debug}
    <div class="debug-info">
      Debug Mode Active
    </div>
  {/if}
</div>
```

#### Example 2: Safe Layout Context Access

```svelte
<script lang="ts">
  import { tryGetLayoutContext } from 'sv-window-manager';

  const layout = tryGetLayoutContext();
  const isDebug = layout?.debug ?? false;
</script>

<div class:debug-mode={isDebug}>
  Content
</div>
```

## Error Handling

### Thrown Errors

Both `getWindowContext()` and `getLayoutContext()` throw descriptive errors if called outside their respective component trees:

```typescript
// Error: getWindowContext() must be called within a BinaryWindow component tree.
// Ensure the component is a descendant of <BinaryWindow>.

// Error: getLayoutContext() must be called within a Frame component tree.
// Ensure the component is a descendant of <Frame>.
```

### Safe Alternatives

Use the `try*` variants if you want to handle missing context gracefully:

```typescript
const bwin = tryGetWindowContext();       // Returns BwinContext | undefined
const layout = tryGetLayoutContext();     // Returns FrameContext | undefined
```

## Best Practices

1. **Use the throwing variants by default**: `getWindowContext()` and `getLayoutContext()` ensure your component is used correctly.

2. **Use try* variants for optional features**: When window manager features are optional, use `tryGetWindowContext()`.

3. **Don't call in module scope**: Context must be accessed during component initialization:

   ```typescript
   // ❌ Wrong - module scope
   const bwin = getWindowContext();

   // ✅ Correct - component scope
   let { } = $props();
   const bwin = getWindowContext();
   ```

4. **Prefer reactive getters**: The context object uses getters for reactive properties:

   ```typescript
   const bwin = getWindowContext();

   // These are reactive - always fresh values
   $effect(() => {
     console.log('Window element:', bwin.windowElement);
     console.log('Root sash:', bwin.rootSash);
   });
   ```

## TypeScript Support

All context utilities are fully typed. TypeScript will provide autocomplete and type checking for all methods and properties.

```typescript
import { getWindowContext } from 'sv-window-manager';
import type { BwinContext } from 'sv-window-manager';

const bwin: BwinContext = getWindowContext();
//    ^
//    TypeScript infers this automatically

// Full autocomplete available
bwin.removePane(
//   ^
//   TypeScript shows: (method) removePane(sashId: string): void
```

## Backward Compatibility

The old symbol-based context keys (`BWIN_CONTEXT`, `FRAME_CONTEXT`) are still available but deprecated. They will be removed in v1.0.0.

Both old and new APIs work simultaneously during the migration period:

```svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import { BWIN_CONTEXT, getWindowContext } from 'sv-window-manager';
  import type { BwinContext } from 'sv-window-manager';

  // Both work - choose one approach
  const bwinOld = getContext<BwinContext>(BWIN_CONTEXT); // Deprecated
  const bwinNew = getWindowContext();                    // Recommended
</script>
```

Migrate to the new API at your convenience. The old API will be removed in a future major version with proper deprecation notices.
