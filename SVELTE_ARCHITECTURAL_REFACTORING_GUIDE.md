# Svelte 5 Architectural Refactoring Guide

## Executive Summary

This document provides a comprehensive architectural review of the sv-window-manager library (`/src/lib`) and identifies opportunities to simplify and modernize the codebase using Svelte 5's advanced features. The library is already well-architected and makes good use of Svelte 5 runes, but there are several opportunities to reduce complexity, improve maintainability, and leverage more declarative patterns.

**Current Architecture State**: The codebase demonstrates strong understanding of Svelte 5 patterns:
- ✅ Proper use of `$state`, `$derived`, `$effect` runes
- ✅ Good separation of concerns with managers
- ✅ Effective use of Svelte actions for DOM interactions
- ✅ Context API for component communication
- ⚠️ Some imperative patterns that could be declarative
- ⚠️ Limited use of snippets for composition
- ⚠️ Manual component mounting that could be simplified

**Key Metrics**:
- **Total Components**: 5 Svelte components
- **Total Actions**: 3 Svelte actions
- **Total Managers**: 2 reactive manager classes
- **Imperative API Surface**: High (mount/unmount patterns)
- **Refactoring Potential**: Moderate to High

---

## Table of Contents

1. [Architecture Patterns](#1-architecture-patterns)
2. [Svelte-First Design](#2-svelte-first-design)
3. [Advanced Svelte Features](#3-advanced-svelte-features)
4. [Performance and Maintainability](#4-performance-and-maintainability)
5. [Migration Patterns](#5-migration-patterns)
6. [Prioritized Roadmap](#6-prioritized-roadmap)

---

## 1. Architecture Patterns

### Finding 1.1: Imperative Component Mounting Pattern

**Affected Files**:
- `/src/lib/bwin/managers/glass-manager.svelte.ts` (lines 134-159)
- `/src/lib/bwin/managers/sill-manager.svelte.ts` (various)

**Current Pattern**:
The library uses Svelte's imperative `mount()` and `unmount()` APIs to dynamically create Glass and user components:

```typescript
// Current approach in GlassManager
const glassInstance = svelteMount(Glass, {
  target: container,
  props: { ...glassProps, sash, binaryWindow: this.bwinContext }
});

const instance: GlassInstance = {
  container,
  instance: glassInstance,
  sashId: sash.id,
  props: glassProps
};

this.glasses = [...this.glasses, instance];
```

**Issues**:
1. Manual lifecycle management (mount/unmount) increases complexity
2. Component instances stored in arrays require manual tracking
3. Props updates require recreating components
4. Error-prone cleanup logic (must call `unmount()` correctly)
5. State synchronization between manager and components is manual

**Proposed Svelte-Based Solution**:

Use a declarative component pattern with `{#each}` blocks and Svelte's built-in lifecycle:

```svelte
<!-- BinaryWindow.svelte - Declarative Glass Rendering -->
<script>
  import Glass from './Glass.svelte';

  let panes = $derived.by(() => {
    updateCounter; // dependency
    if (!rootSash) return [];
    const result = [];
    rootSash.walk((sash) => {
      if (sash.children.length === 0) result.push(sash);
    });
    return result;
  });
</script>

<!-- Declarative rendering - Svelte handles lifecycle -->
{#each panes as pane (pane.id)}
  <Pane {pane}>
    <Glass
      {...pane.store}
      sash={pane}
      binaryWindow={bwinContext}
    />
  </Pane>
{/each}
```

**Benefits**:
- ✅ Automatic lifecycle management (no manual mount/unmount)
- ✅ Reactive updates (props flow naturally)
- ✅ Reduced code (~100 lines removed from GlassManager)
- ✅ Better performance (Svelte optimizes keyed each)
- ✅ Type-safe (no `as any` casts needed)

**Complexity**: Moderate
**Impact**: High - Removes ~150 lines of imperative code
**Migration Risk**: Low - Well-tested pattern in Svelte 5

---

### Finding 1.2: Manager Classes as State Containers

**Affected Files**:
- `/src/lib/bwin/managers/glass-manager.svelte.ts`
- `/src/lib/bwin/managers/sill-manager.svelte.ts`

**Current Pattern**:
Managers are classes that use `$state` and `$derived` to track component instances:

```typescript
export class GlassManager {
  glasses = $state.raw<GlassInstance[]>([]);
  userComponents = $state.raw(new Map<string, UserComponentInstance>());
  activeGlass = $state<GlassInstance | undefined>();

  glassCount = $derived(this.glasses.length);
  glassesBySashId = $derived.by(() => {
    const map = new Map<string, GlassInstance>();
    this.glasses.forEach((glass) => map.set(glass.sashId, glass));
    return map;
  });
}
```

**Issues**:
1. Managers duplicate Svelte's reactive system
2. Using `$state.raw` to avoid proxy wrapping is a workaround
3. Manual array reassignment to trigger reactivity (`this.glasses = [...this.glasses, instance]`)
4. Derived maps are computed on every access (no memoization benefit)
5. Class-based API is less idiomatic in Svelte 5

**Proposed Svelte-Based Solution**:

Replace managers with reactive state modules using `$state` in `.svelte.ts` files:

```typescript
// glass-state.svelte.ts - Pure reactive state
import { SvelteMap } from 'svelte/reactivity';

// Simple reactive state - no class needed
export const activeGlassId = $state<string | undefined>();
export const glassProps = new SvelteMap<string, CreateGlassProps>();

// Derived values
export const glassCount = $derived(glassProps.size);
export const hasActiveGlass = $derived(activeGlassId !== undefined);

// Pure functions instead of methods
export function setGlassProps(sashId: string, props: CreateGlassProps) {
  glassProps.set(sashId, props);
}

export function removeGlass(sashId: string) {
  glassProps.delete(sashId);
  if (activeGlassId === sashId) {
    activeGlassId = undefined;
  }
}
```

**Benefits**:
- ✅ Simpler mental model (just reactive state)
- ✅ `SvelteMap` provides automatic reactivity without workarounds
- ✅ No need for `$state.raw` hacks
- ✅ Easier to test (pure functions)
- ✅ Better tree-shaking (no class overhead)

**Complexity**: Easy
**Impact**: High - Removes ~200 lines of class boilerplate
**Migration Risk**: Low - Straightforward refactor

---

### Finding 1.3: Manual DOM Manipulation in Actions

**Affected Files**:
- `/src/lib/bwin/actions/resize.svelte.ts` (lines 52-60, 176-218)
- `/src/lib/bwin/actions/drag.svelte.ts`
- `/src/lib/bwin/actions/drop.svelte.ts`

**Current Pattern**:
Actions manually query DOM and cache elements:

```typescript
// resize.svelte.ts - Manual DOM caching
const domCache = new Map<string, HTMLElement>();

function getCachedElement(sashId: string, selector: 'pane' | 'muntin'): HTMLElement | null {
  const key = `${sashId}:${selector}`;
  if (!domCache.has(key)) {
    const className = selector === 'pane' ? CSS_CLASSES.PANE : CSS_CLASSES.MUNTIN;
    const el = document.querySelector(`[${DATA_ATTRIBUTES.SASH_ID}="${sashId}"].${className}`);
    if (el) domCache.set(key, el as HTMLElement);
  }
  return domCache.get(key) || null;
}

// Later: Manual style updates
function updatePaneAndMuntinStyles(sash: Sash) {
  const paneEl = getCachedElement(sash.id, 'pane');
  if (paneEl) {
    paneEl.style.cssText = `top: ${sash.top}px; left: ${sash.left}px; ...`;
  }
}
```

**Issues**:
1. Manual DOM querying defeats Svelte's reactivity
2. Cache invalidation is error-prone (cleared on mouseup)
3. Direct style manipulation bypasses Svelte's diff algorithm
4. Hard to test (requires real DOM)
5. Breaks when DOM structure changes

**Proposed Svelte-Based Solution**:

Use Svelte's reactive `style:` directives and let the framework handle updates:

```svelte
<!-- Pane.svelte - Reactive styles -->
<script>
  let { sash } = $props();
</script>

<div
  class="pane"
  data-sash-id={sash.id}
  style:top="{sash.top}px"
  style:left="{sash.left}px"
  style:width="{sash.width}px"
  style:height="{sash.height}px"
>
  <!-- Svelte automatically updates styles when sash properties change -->
</div>
```

For resize action, update sash state directly and let Svelte propagate:

```typescript
// resize.svelte.ts - Simplified
function performResize() {
  // Just update the data model
  leftChild.width = newLeftChildWidth;
  rightChild.width = newRightChildWidth;
  rightChild.left = leftChild.left + newLeftChildWidth;

  // Svelte's reactivity handles DOM updates
  // No manual style manipulation needed!
}
```

**Benefits**:
- ✅ No DOM caching complexity
- ✅ Svelte optimizes style updates
- ✅ Easier to test (just test state changes)
- ✅ More resilient to DOM changes
- ✅ ~100 lines of code removed

**Complexity**: Easy
**Impact**: Moderate - Improves maintainability
**Migration Risk**: Low - Current code already sets sash properties

---

## 2. Svelte-First Design

### Finding 2.1: Vanilla JS Sash Class

**Affected Files**:
- `/src/lib/bwin/sash.js` (553 lines)

**Current Pattern**:
The `Sash` class is written in vanilla JavaScript with getters/setters that manually propagate changes:

```javascript
export class Sash {
  constructor({ left = 0, top = 0, width = 150, height = 150, ... } = {}) {
    this._top = top;
    this._left = left;
    this._width = width;
    this._height = height;
    this.children = [];
  }

  set width(value) {
    const dist = value - this._width;
    this._width = value;

    // Manual propagation to children
    const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();
    if (leftChild && rightChild) {
      // Complex calculation logic...
      leftChild.width = newLeftChildWidth;
      rightChild.width = newRightChildWidth;
      // ... more manual updates
    }
  }
}
```

**Issues**:
1. Manual propagation logic is complex and error-prone
2. No automatic reactivity - components must poll or re-render
3. Getters/setters hide complexity
4. Hard to track what changes when
5. No built-in debugging (can't use `$inspect`)

**Proposed Svelte-Based Solution**:

Convert to a reactive class using Svelte 5 class fields with `$state`:

```typescript
// sash.svelte.ts
export class Sash {
  // Reactive properties
  id: string;
  position: string;

  // Reactive primitives
  top = $state(0);
  left = $state(0);
  width = $state(0);
  height = $state(0);

  // Reactive array
  children = $state<Sash[]>([]);

  // Reactive object store
  store = $state<Record<string, unknown>>({});

  // Derived values
  leftChild = $derived(
    this.children.find((c) => c.position === Position.Left)
  );
  rightChild = $derived(
    this.children.find((c) => c.position === Position.Right)
  );

  // Effects for propagation
  #propagateWidth = $effect(() => {
    // Automatically re-runs when width or children change
    if (this.leftChild && this.rightChild) {
      const totalWidth = this.leftChild.width + this.rightChild.width;
      const dist = this.width - totalWidth;

      if (dist !== 0) {
        // Proportional distribution
        const leftDist = dist * (this.leftChild.width / totalWidth);
        this.leftChild.width += leftDist;
        this.rightChild.width += (dist - leftDist);
      }
    }
  });
}
```

**Benefits**:
- ✅ Automatic reactivity (no manual propagation)
- ✅ Components update automatically when sash changes
- ✅ Can use `$inspect` for debugging
- ✅ Simpler mental model (declarative effects)
- ✅ Less code (~200 lines saved from manual propagation)

**Complexity**: Moderate
**Impact**: Very High - Core architecture change
**Migration Risk**: Moderate - Requires careful testing of layout logic

---

### Finding 2.2: Callback-Based Component Communication

**Affected Files**:
- `/src/lib/bwin/frame/Frame.svelte` (lines 32, 109-116)
- `/src/lib/bwin/frame/Pane.svelte` (lines 10, 25-27)

**Current Pattern**:
Components communicate via callback props:

```svelte
<!-- Frame.svelte -->
<script>
  let { onPaneRender, onMuntinRender, onPaneDrop } = $props();
</script>

{#each panes as sash (sash.id)}
  <Pane {sash} {onPaneRender} />
{/each}

<!-- Pane.svelte -->
<script>
  let { sash, onPaneRender } = $props();

  onMount(() => {
    if (paneElement && onPaneRender) {
      onPaneRender(paneElement, sash);
    }
  });
</script>
```

**Issues**:
1. Callback drilling through multiple components
2. Timing issues (onMount vs parent ready)
3. No type safety on callback signatures
4. Hard to compose multiple behaviors

**Proposed Svelte-Based Solution**:

Use Svelte's event system with typed custom events:

```svelte
<!-- Pane.svelte - Dispatch events -->
<script>
  import { createEventDispatcher } from 'svelte';

  let { sash } = $props();
  const dispatch = createEventDispatcher<{
    panerender: { element: HTMLElement; sash: Sash };
  }>();

  let paneElement = $state<HTMLElement>();

  onMount(() => {
    if (paneElement) {
      dispatch('panerender', { element: paneElement, sash });
    }
  });
</script>

<!-- Frame.svelte - Handle events -->
{#each panes as sash (sash.id)}
  <Pane
    {sash}
    onpanerender={(e) => handlePaneRender(e.detail.element, e.detail.sash)}
  />
{/each}
```

Or even better, use element bindings with context:

```svelte
<!-- Pane.svelte - Export element binding -->
<script>
  let { sash } = $props();
  export let element = $state<HTMLElement>();
</script>

<div bind:this={element} class="pane" ...>

<!-- Frame.svelte - Bind and auto-render -->
<script>
  let paneElements = $state<Map<string, HTMLElement>>(new Map());

  $effect(() => {
    // Automatically creates Glass when paneElements changes
    paneElements.forEach((el, sashId) => {
      if (!glassRendered.has(sashId)) {
        renderGlass(el, sashId);
      }
    });
  });
</script>

{#each panes as sash (sash.id)}
  <Pane
    {sash}
    bind:element={paneElements.get(sash.id)}
  />
{/each}
```

**Benefits**:
- ✅ Type-safe events
- ✅ No callback drilling
- ✅ Better composability
- ✅ Clearer data flow

**Complexity**: Easy
**Impact**: Moderate - Improves clarity
**Migration Risk**: Low - Incremental refactor

---

## 3. Advanced Svelte Features

### Finding 3.1: Limited Use of Snippets

**Affected Files**:
- `/src/lib/bwin/frame/Pane.svelte`
- `/src/lib/bwin/binary-window/Glass.svelte`

**Current Pattern**:
Content rendering uses imperative DOM manipulation:

```svelte
<!-- Glass.svelte -->
<script>
  $effect(() => {
    if (!contentElement) return;
    contentElement.innerHTML = '';

    if (content instanceof HTMLElement) {
      contentElement.appendChild(content);
    } else if (typeof content === 'string') {
      contentElement.innerHTML = DOMPurify.sanitize(content);
    }
  });
</script>

<div class="glass-content" bind:this={contentElement}></div>
```

**Issues**:
1. Imperative DOM manipulation in reactive context
2. Security concerns with `innerHTML` (even with DOMPurify)
3. Hard to compose different content types
4. No access to Svelte reactivity inside content

**Proposed Svelte-Based Solution**:

Use snippets for flexible, type-safe content composition:

```svelte
<!-- Glass.svelte -->
<script>
  import type { Snippet } from 'svelte';

  interface GlassProps {
    title?: string | Snippet;
    content?: Snippet<[{ sash: Sash }]>; // Snippet with props
    tabs?: (string | { label: string })[];
    // ... other props
  }

  let { title, content, tabs, sash } = $props();
</script>

<div class="glass">
  <header class="glass-header">
    {#if typeof title === 'string'}
      <div class="glass-title">{title}</div>
    {:else if title}
      {@render title()}
    {/if}
  </header>

  <div class="glass-content">
    {#if content}
      {@render content({ sash })}
    {/if}
  </div>
</div>

<!-- Usage in BinaryWindow.svelte -->
<Glass {sash} title="My Editor">
  {#snippet content({ sash })}
    <Editor bind:value={sash.store.code} />
  {/snippet}
</Glass>
```

**Benefits**:
- ✅ Type-safe content composition
- ✅ Full Svelte reactivity in content
- ✅ No security concerns (no `innerHTML`)
- ✅ Better component reusability
- ✅ Cleaner API (no imperative mounting)

**Complexity**: Easy
**Impact**: High - Major API improvement
**Migration Risk**: Moderate - Breaking change to public API

---

### Finding 3.2: Context API Usage

**Affected Files**:
- `/src/lib/bwin/context.ts`
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (lines 79-97)

**Current Pattern**:
Context is defined with symbols and uses getters:

```typescript
// context.ts
export const BWIN_CONTEXT = Symbol('bwin-context');

// BinaryWindow.svelte
const bwinContext: BwinContext = {
  get windowElement() {
    return frameComponent?.windowElement;
  },
  get rootSash() {
    return frameComponent?.rootSash;
  },
  removePane,
  addPane,
  // ... more getters
};

setContext(BWIN_CONTEXT, bwinContext);
```

**Issues**:
1. Getters are evaluated on every access (no memoization)
2. Symbol keys are less discoverable than typed functions
3. Context object is large and monolithic
4. Hard to selectively consume context pieces

**Proposed Svelte-Based Solution**:

Use Svelte 5's `createContext` utility with focused contexts:

```typescript
// window-context.svelte.ts
import { createContext } from 'svelte';

// Split into focused contexts
export const [getWindowElement, setWindowElement] =
  createContext<HTMLElement | undefined>('window-element');

export const [getRootSash, setRootSash] =
  createContext<Sash | undefined>('root-sash');

export const [getLayoutActions, setLayoutActions] =
  createContext<{
    addPane: (id: string, opts: Record<string, unknown>) => Sash | null;
    removePane: (id: string) => void;
  }>('layout-actions');

// BinaryWindow.svelte
<script>
  setWindowElement(frameComponent?.windowElement);
  setRootSash(frameComponent?.rootSash);
  setLayoutActions({ addPane, removePane });
</script>

// Child components
<script>
  const windowElement = getWindowElement();
  const actions = getLayoutActions();

  // Type-safe, selective access
  actions.addPane('pane-1', { position: 'right' });
</script>
```

**Benefits**:
- ✅ Type-safe without manual type annotations
- ✅ Automatic default value handling
- ✅ Better tree-shaking (unused contexts not included)
- ✅ More discoverable API
- ✅ Focused contexts easier to test

**Complexity**: Easy
**Impact**: Moderate - Better developer experience
**Migration Risk**: Low - Can coexist with old API

---

### Finding 3.3: Actions vs Attachments

**Affected Files**:
- All action files in `/src/lib/bwin/actions/`

**Current Pattern**:
The library uses Svelte actions for DOM behaviors:

```typescript
export const drag: Action<HTMLElement, DragActionParams> = (node, params) => {
  function handleMouseDown(event: MouseEvent) { /* ... */ }
  function handleDragStart(event: DragEvent) { /* ... */ }

  document.addEventListener('mousedown', handleMouseDown);
  node.addEventListener('dragstart', handleDragStart);

  return {
    destroy() {
      document.removeEventListener('mousedown', handleMouseDown);
      node.removeEventListener('dragstart', handleDragStart);
    }
  };
};
```

**Issues**:
1. Actions are node-scoped but use document-level listeners
2. No built-in support for composing multiple actions
3. Hard to share state between actions
4. Parameter updates via `update` method are manual

**Proposed Svelte-Based Solution**:

Use Svelte 5.29+ `@attach` directive (or wait for stable release):

```svelte
<script>
  function dragBehavior(node: HTMLElement) {
    let isDragging = $state(false);

    $effect(() => {
      function handleMouseDown(event: MouseEvent) {
        // Access reactive state
        if (isDragging) return;
        // ... drag logic
      }

      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    });

    // Return cleanup function
    return () => {
      // Cleanup if needed
    };
  }
</script>

<div {@attach={dragBehavior}}>
  <!-- Automatic cleanup on unmount -->
</div>
```

**Note**: `@attach` is available in Svelte 5.29+. For now, actions are still the recommended approach.

**Benefits** (when migrating to `@attach`):
- ✅ Better integration with Svelte reactivity
- ✅ Cleaner composition
- ✅ Automatic parameter reactivity
- ✅ More flexible than actions

**Complexity**: Easy (when `@attach` is stable)
**Impact**: Low - Minor API improvement
**Migration Risk**: Low - Can keep actions for now

---

### Finding 3.4: Reactive Stores vs Runes

**Affected Files**:
None currently, but could benefit from `svelte/reactivity` utilities

**Current Pattern**:
The library uses `$state` directly and manages reactive state manually.

**Opportunity**:
Leverage `svelte/reactivity` for built-in reactive utilities:

```typescript
// Current: Manual reactive map
let glassProps = $state.raw(new Map<string, GlassInstance>());

// Proposed: Use SvelteMap
import { SvelteMap } from 'svelte/reactivity';

let glassProps = new SvelteMap<string, GlassInstance>();

// Automatically reactive - no need for $state.raw!
glassProps.set('pane-1', instance); // Triggers reactivity
glassProps.delete('pane-1'); // Triggers reactivity

// Derived values work automatically
let count = $derived(glassProps.size);
```

Also consider `SvelteSet` for tracking sets of IDs:

```typescript
import { SvelteSet } from 'svelte/reactivity';

let minimizedPanes = new SvelteSet<string>();

function minimizePane(id: string) {
  minimizedPanes.add(id); // Reactive!
}

let hasMinimized = $derived(minimizedPanes.size > 0);
```

**Benefits**:
- ✅ No `$state.raw` workarounds
- ✅ Built-in reactivity for collections
- ✅ Better performance (optimized by Svelte team)
- ✅ Cleaner code

**Complexity**: Easy
**Impact**: Moderate - Code clarity
**Migration Risk**: Very Low - Drop-in replacement

---

## 4. Performance and Maintainability

### Finding 4.1: Manual Update Counter Pattern

**Affected Files**:
- `/src/lib/bwin/frame/Frame.svelte` (lines 49-52)

**Current Pattern**:
Manual counter to trigger reactivity:

```svelte
<script>
  let updateCounter = $state(0);

  function triggerUpdate() {
    updateCounter++;
  }

  const panes = $derived.by(() => {
    updateCounter; // Force dependency
    if (!rootSash) return [];
    const result: Sash[] = [];
    rootSash.walk((sash) => {
      if (sash.children.length === 0) result.push(sash);
    });
    return result;
  });
</script>

{#key updateCounter}
  <div class="window">
    {#each panes as sash (sash.id)}
      <Pane {sash} />
    {/each}
  </div>
{/key}
```

**Issues**:
1. Manual tracking defeats purpose of reactivity
2. `{#key}` block causes full DOM recreation (expensive)
3. Hard to know when to call `triggerUpdate()`
4. Comments needed to explain workaround

**Proposed Svelte-Based Solution**:

If `Sash` is converted to reactive class (Finding 2.1), no counter needed:

```svelte
<script>
  // Sash is now reactive, so children array updates trigger reactivity
  const panes = $derived.by(() => {
    if (!rootSash) return [];
    const result: Sash[] = [];
    rootSash.walk((sash) => {
      if (sash.children.length === 0) result.push(sash);
    });
    return result;
  });
</script>

<!-- No {#key} needed - Svelte tracks by sash.id -->
<div class="window">
  {#each panes as sash (sash.id)}
    <Pane {sash} />
  {/each}
</div>
```

Alternatively, use a reactive `SvelteSet` to track pane IDs:

```typescript
import { SvelteSet } from 'svelte/reactivity';

let paneIds = new SvelteSet<string>();

function refreshPanes() {
  paneIds.clear();
  rootSash?.walk((sash) => {
    if (sash.children.length === 0) {
      paneIds.add(sash.id);
    }
  });
}

const panes = $derived.by(() => {
  const result: Sash[] = [];
  paneIds.forEach((id) => {
    const sash = rootSash?.getById(id);
    if (sash) result.push(sash);
  });
  return result;
});
```

**Benefits**:
- ✅ No manual counter management
- ✅ No full DOM recreation
- ✅ Automatic reactivity
- ✅ Fewer bugs

**Complexity**: Depends on Finding 2.1 (Easy if Sash is reactive)
**Impact**: High - Better performance
**Migration Risk**: Moderate - Requires reactive Sash

---

### Finding 4.2: Complex Effect Logic

**Affected Files**:
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (lines 404-424, 431-435, 534-537)

**Current Pattern**:
Multiple `$effect` blocks with complex logic:

```svelte
<script>
  // Effect 1: Mutation observer
  $effect(() => {
    if (!frameComponent?.windowElement) return;

    updateDisabledStateOfActionButtons();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          updateDisabledStateOfActionButtons();
        }
      });
    });

    observer.observe(frameComponent.windowElement, { childList: true });
    return () => observer.disconnect();
  });

  // Effect 2: Sill mounting
  $effect(() => {
    if (frameComponent?.windowElement) {
      untrack(() => sillManager.mount());
    }
  });

  // Effect 3: Fit container
  $effect(() => {
    return setupFitContainer();
  });
</script>
```

**Issues**:
1. Multiple effects hard to reason about
2. Unclear dependency tracking
3. `untrack()` usage suggests fighting reactivity
4. Complex cleanup logic

**Proposed Svelte-Based Solution**:

Split into focused, single-purpose effects with clear dependencies:

```svelte
<script>
  // Effect 1: Action button state (derived from pane count)
  const paneCount = $derived(
    frameComponent?.windowElement?.querySelectorAll('.pane').length ?? 0
  );

  $effect(() => {
    const isSinglePane = paneCount === 1;
    updateActionButtons(isSinglePane);
  });

  // Effect 2: Sill lifecycle (tied to window element)
  $effect(() => {
    const winEl = frameComponent?.windowElement;
    if (!winEl) return;

    const cleanup = sillManager.mount(winEl);
    return cleanup;
  });

  // Effect 3: Container fitting (clear dependencies)
  $effect(() => {
    if (!shouldFitContainer || !rootElement || !frameComponent?.rootSash) return;

    const container = rootElement.parentElement;
    if (!container) return;

    return setupFitObserver(container, frameComponent.rootSash);
  });
</script>
```

**Benefits**:
- ✅ Clearer dependencies
- ✅ Easier to test (smaller units)
- ✅ No `untrack()` needed
- ✅ Self-documenting

**Complexity**: Easy
**Impact**: Moderate - Better maintainability
**Migration Risk**: Low - Incremental refactor

---

### Finding 4.3: Duplicate Logic in Manager Classes

**Affected Files**:
- `/src/lib/bwin/managers/glass-manager.svelte.ts` (lines 346-357)
- `/src/lib/bwin/managers/sill-manager.svelte.ts` (lines 343-355)

**Current Pattern**:
Both managers implement debug utilities:

```typescript
// In GlassManager
private debugLog(...args: unknown[]): void {
  if (this.debug) {
    console.log('[GlassManager]', ...args);
  }
}

private debugWarn(...args: unknown[]): void {
  if (this.debug) {
    console.warn('[GlassManager]', ...args);
  }
}

// In SillManager (identical!)
private debugLog(...args: unknown[]): void {
  if (this.debug) {
    console.log('[SillManager]', ...args);
  }
}

private debugWarn(...args: unknown[]): void {
  if (this.debug) {
    console.warn('[SillManager]', ...args);
  }
}
```

**Issues**:
1. Code duplication
2. Inconsistent prefixes if someone forgets to update
3. No central debug control

**Proposed Svelte-Based Solution**:

Create a shared debug utility:

```typescript
// debug.svelte.ts
export function createDebugger(namespace: string, enabled = false) {
  const isDebug = $state(enabled);

  return {
    get enabled() {
      return isDebug;
    },
    set enabled(value: boolean) {
      isDebug = value;
    },
    log(...args: unknown[]) {
      if (isDebug) console.log(`[${namespace}]`, ...args);
    },
    warn(...args: unknown[]) {
      if (isDebug) console.warn(`[${namespace}]`, ...args);
    },
    error(...args: unknown[]) {
      if (isDebug) console.error(`[${namespace}]`, ...args);
    }
  };
}

// Usage in managers
import { createDebugger } from './debug.svelte.js';

export class GlassManager {
  #debug = createDebugger('GlassManager', this.debug);

  createGlass(...) {
    this.#debug.log('Creating glass for sash', sashId);
    // ...
  }
}
```

**Benefits**:
- ✅ DRY (Don't Repeat Yourself)
- ✅ Centralized debug control
- ✅ Consistent formatting
- ✅ Can add features (timestamps, filtering) in one place

**Complexity**: Easy
**Impact**: Low - Code quality improvement
**Migration Risk**: Very Low

---

## 5. Migration Patterns

### Pattern 5.1: Imperative to Declarative Component Mounting

**Step-by-Step Migration**:

**Step 1**: Add declarative rendering alongside imperative (co-existence)

```svelte
<!-- BinaryWindow.svelte -->
<script>
  let useDeclarativeRendering = false; // Feature flag

  const panes = $derived.by(() => {
    updateCounter;
    // ... collect panes
  });
</script>

{#if useDeclarativeRendering}
  <!-- New declarative approach -->
  {#each panes as pane (pane.id)}
    <Pane {pane}>
      <Glass {...pane.store} {pane} binaryWindow={bwinContext} />
    </Pane>
  {/each}
{:else}
  <!-- Old imperative approach -->
  {#each panes as pane (pane.id)}
    <Pane {pane} {onPaneRender} />
  {/each}
{/if}
```

**Step 2**: Test declarative rendering in isolation

```typescript
// In test file
import { mount } from 'svelte';
import BinaryWindow from './BinaryWindow.svelte';

test('declarative rendering works', () => {
  const component = mount(BinaryWindow, {
    target: document.body,
    props: {
      settings: testConfig,
      useDeclarativeRendering: true
    }
  });

  // Verify panes are rendered
  expect(document.querySelectorAll('.pane')).toHaveLength(3);
});
```

**Step 3**: Remove imperative code once tests pass

```svelte
<!-- BinaryWindow.svelte - Final version -->
<script>
  const panes = $derived.by(() => {
    // ... collect panes
  });
</script>

{#each panes as pane (pane.id)}
  <Pane {pane}>
    <Glass {...pane.store} {pane} binaryWindow={bwinContext} />
  </Pane>
{/each}
```

**Step 4**: Remove GlassManager (no longer needed)

```diff
- import { GlassManager } from './managers/glass-manager.svelte.js';
- let glassManager: GlassManager;
- glassManager = new GlassManager(bwinContext, debug);
```

**Testing Strategy**:
- Visual regression tests (screenshot comparison)
- Unit tests for pane rendering
- Integration tests for add/remove pane
- Performance benchmarks (before/after)

---

### Pattern 5.2: Vanilla JS Class to Reactive Class

**Step-by-Step Migration**:

**Step 1**: Rename existing file and create new reactive version

```bash
mv sash.js sash.legacy.js
touch sash.svelte.ts
```

**Step 2**: Copy class structure and add `$state` to primitives

```typescript
// sash.svelte.ts
export class Sash {
  id: string;
  position: string;

  // Add $state to reactive properties
  top = $state(0);
  left = $state(0);
  width = $state(0);
  height = $state(0);

  // Arrays become reactive automatically
  children = $state<Sash[]>([]);

  constructor({ top = 0, left = 0, ... } = {}) {
    this.id = id ?? genId();
    this.position = position;
    this.top = top;
    this.left = left;
    // ...
  }
}
```

**Step 3**: Convert getter/setter propagation logic to `$effect`

```typescript
export class Sash {
  // ... state properties

  // Replace width setter with effect
  #syncChildrenWidth = $effect(() => {
    if (!this.leftChild || !this.rightChild) return;

    const totalWidth = this.leftChild.width + this.rightChild.width;
    const expectedWidth = this.width;

    if (Math.abs(totalWidth - expectedWidth) < 0.01) return;

    // Proportional distribution
    const ratio = this.leftChild.width / totalWidth;
    this.leftChild.width = expectedWidth * ratio;
    this.rightChild.width = expectedWidth * (1 - ratio);
  });
}
```

**Step 4**: Add feature flag to switch between implementations

```typescript
// config-root.js
import { Sash as LegacySash } from './sash.legacy.js';
import { Sash as ReactiveSash } from './sash.svelte.js';

const USE_REACTIVE_SASH = import.meta.env.VITE_USE_REACTIVE_SASH === 'true';
export const Sash = USE_REACTIVE_SASH ? ReactiveSash : LegacySash;
```

**Step 5**: Test extensively with both implementations

```typescript
describe.each([
  ['legacy', LegacySash],
  ['reactive', ReactiveSash]
])('%s Sash implementation', (name, SashClass) => {
  test('propagates width changes to children', () => {
    const root = new SashClass({ width: 100, height: 100 });
    // ... test logic
  });
});
```

**Step 6**: Remove legacy implementation once stable

**Rollback Plan**:
- Keep legacy implementation for 2-3 releases
- Monitor for bug reports
- Provide clear migration guide
- Document breaking changes

---

### Pattern 5.3: Callback Props to Events/Bindings

**Step-by-Step Migration**:

**Step 1**: Add events alongside callbacks (support both)

```svelte
<!-- Pane.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  let { sash, onPaneRender } = $props(); // Keep old callback
  const dispatch = createEventDispatcher(); // Add new event

  onMount(() => {
    if (paneElement) {
      // Support both patterns
      if (onPaneRender) {
        onPaneRender(paneElement, sash);
      }
      dispatch('panerender', { element: paneElement, sash });
    }
  });
</script>
```

**Step 2**: Update consumers to use events

```svelte
<!-- Frame.svelte -->
<script>
  let { onPaneRender } = $props(); // Optional now

  function handlePaneRender(event) {
    const { element, sash } = event.detail;
    // New event-based handler
  }
</script>

{#each panes as sash (sash.id)}
  <Pane
    {sash}
    {onPaneRender}
    onpanerender={handlePaneRender}
  />
{/each}
```

**Step 3**: Deprecate callback props

```typescript
/**
 * @deprecated Use onpanerender event instead
 */
let { onPaneRender } = $props();

if (onPaneRender) {
  console.warn('onPaneRender callback is deprecated, use onpanerender event');
}
```

**Step 4**: Remove callback props in next major version

**Migration Guide**:
```markdown
## Breaking Changes in v2.0

### Callback props replaced with events

**Before:**
```svelte
<Pane {sash} onPaneRender={handleRender} />
```

**After:**
```svelte
<Pane {sash} onpanerender={handleRender} />
```

Note: Event handlers receive `{ detail: { element, sash } }`
```

---

## 6. Prioritized Roadmap

### Phase 1: Low-Hanging Fruit (1-2 weeks)

**Priority: High Impact, Low Risk**

1. **Use `svelte/reactivity` utilities** (Finding 3.4)
   - Replace `$state.raw` maps with `SvelteMap`
   - Replace manual sets with `SvelteSet`
   - Estimated effort: 2-4 hours
   - Lines of code removed: ~50
   - Risk: Very Low

2. **Create shared debug utility** (Finding 4.3)
   - Extract debug methods to shared module
   - Update managers to use shared debugger
   - Estimated effort: 1-2 hours
   - Lines of code removed: ~30
   - Risk: Very Low

3. **Simplify effect logic** (Finding 4.2)
   - Split complex effects into focused units
   - Remove unnecessary `untrack()` calls
   - Estimated effort: 3-5 hours
   - Lines of code changed: ~80
   - Risk: Low

4. **Use `createContext` for type safety** (Finding 3.2)
   - Replace symbol-based context with `createContext`
   - Split monolithic context into focused pieces
   - Estimated effort: 4-6 hours
   - Lines of code changed: ~100
   - Risk: Low (can coexist with old API)

**Total Phase 1 Effort**: 1-2 weeks
**Total Lines Improved**: ~260
**Risk Level**: Low

---

### Phase 2: API Improvements (2-4 weeks)

**Priority: High Impact, Moderate Risk**

1. **Replace callback props with events** (Finding 2.2)
   - Add event dispatchers to Pane/Muntin
   - Update Frame to use events
   - Add deprecation warnings for callbacks
   - Estimated effort: 1 week
   - Lines of code changed: ~150
   - Risk: Moderate (breaking change, needs migration guide)

2. **Introduce snippet-based content API** (Finding 3.1)
   - Add snippet support to Glass component
   - Create examples and documentation
   - Deprecate imperative content mounting
   - Estimated effort: 1-2 weeks
   - Lines of code changed: ~200
   - Risk: Moderate (major API change)

3. **Remove GlassManager with declarative rendering** (Finding 1.1)
   - Implement declarative Glass rendering in BinaryWindow
   - Add feature flag for gradual rollout
   - Remove GlassManager once stable
   - Estimated effort: 1-2 weeks
   - Lines of code removed: ~150
   - Risk: Moderate (core architecture change)

**Total Phase 2 Effort**: 2-4 weeks
**Total Lines Improved**: ~500
**Risk Level**: Moderate

---

### Phase 3: Core Architecture (4-8 weeks)

**Priority: Very High Impact, Moderate-High Risk**

1. **Convert Sash to reactive class** (Finding 2.1)
   - Create reactive Sash implementation
   - Extensive testing with feature flag
   - Remove manual propagation logic
   - Estimated effort: 3-4 weeks
   - Lines of code changed: ~400
   - Risk: High (core data structure change)

2. **Remove manual update counter pattern** (Finding 4.1)
   - Depends on reactive Sash
   - Remove `{#key}` block workaround
   - Rely on automatic reactivity
   - Estimated effort: 1 week
   - Lines of code removed: ~50
   - Risk: Low (after reactive Sash is stable)

3. **Simplify action DOM manipulation** (Finding 1.3)
   - Remove DOM caching logic
   - Rely on Svelte's reactive style bindings
   - Simplify resize/drag/drop actions
   - Estimated effort: 1-2 weeks
   - Lines of code removed: ~100
   - Risk: Moderate

**Total Phase 3 Effort**: 4-8 weeks
**Total Lines Improved**: ~550
**Risk Level**: Moderate-High

---

### Phase 4: Future Enhancements (Ongoing)

**Priority: Medium Impact, Low-Moderate Risk**

1. **Migrate to `@attach` directive** (Finding 3.3)
   - Wait for Svelte 5.29+ stable release
   - Convert actions to attachments
   - Estimated effort: 1-2 weeks
   - Lines of code changed: ~150
   - Risk: Low (when feature is stable)

2. **Investigate reactive primitives from `svelte/reactivity/window`**
   - Use `MediaQuery` for responsive behavior
   - Consider other reactive primitives
   - Estimated effort: Exploratory
   - Risk: Low

**Total Phase 4 Effort**: Ongoing
**Risk Level**: Low

---

## Summary Statistics

### Total Refactoring Potential

| Metric | Current | After Refactoring | Improvement |
|--------|---------|-------------------|-------------|
| **Total Lines of Code** | ~3,500 | ~2,100 | **40% reduction** |
| **Imperative API Calls** | ~50 (mount/unmount) | ~5 | **90% reduction** |
| **Manual Reactivity** | ~200 lines | ~20 lines | **90% reduction** |
| **Component Complexity** | Medium-High | Low-Medium | **Significant** |
| **Test Coverage Needed** | High | Medium | **Easier to test** |

### Risk Assessment by Phase

| Phase | Impact | Risk | Recommended |
|-------|--------|------|-------------|
| Phase 1 | High | Low | ✅ Start immediately |
| Phase 2 | High | Moderate | ✅ After Phase 1 |
| Phase 3 | Very High | Moderate-High | ⚠️ Thorough testing required |
| Phase 4 | Medium | Low | ℹ️ Wait for ecosystem |

---

## Testing Recommendations

### Before Each Refactor

1. **Baseline Tests**
   - Create comprehensive test suite for current behavior
   - Visual regression tests (screenshot comparison)
   - Performance benchmarks
   - Accessibility audits

2. **Feature Flags**
   - Add environment variables to toggle new features
   - Enable gradual rollout
   - Easy rollback if issues arise

3. **Monitoring**
   - Add debug logging for critical paths
   - Track performance metrics
   - Monitor error rates

### During Refactor

1. **Dual Implementation**
   - Keep old code alongside new
   - Test both implementations
   - Compare outputs

2. **Incremental Changes**
   - Small, focused PRs
   - One finding at a time
   - Thorough code review

3. **Documentation**
   - Update CLAUDE.md
   - Add migration guides
   - Document breaking changes

### After Refactor

1. **Verification**
   - All tests pass
   - Performance meets or exceeds baseline
   - No accessibility regressions

2. **Release**
   - Use semantic versioning
   - Detailed changelog
   - Migration guide for users

3. **Monitoring**
   - Watch for bug reports
   - Monitor performance in production
   - Gather user feedback

---

## Conclusion

The sv-window-manager library is well-architected and demonstrates strong understanding of Svelte 5 patterns. However, there are significant opportunities to simplify the codebase by:

1. **Replacing imperative patterns with declarative Svelte components** (Finding 1.1)
2. **Converting the vanilla JS Sash class to a reactive Svelte class** (Finding 2.1)
3. **Leveraging `svelte/reactivity` utilities** (Finding 3.4)
4. **Using snippets for flexible component composition** (Finding 3.1)

By following the phased roadmap, the library can reduce complexity by **40%** while improving maintainability, testability, and developer experience. The migration can be done incrementally with low risk using feature flags and gradual rollouts.

### Recommended Next Steps

1. **Week 1-2**: Implement Phase 1 (low-hanging fruit)
2. **Week 3-4**: Begin Phase 2 (API improvements) with feature flags
3. **Week 5-12**: Tackle Phase 3 (core architecture) with extensive testing
4. **Ongoing**: Monitor ecosystem for Phase 4 opportunities

---

## References

### Svelte 5 Documentation
- [$state](https://svelte.dev/docs/svelte/$state) - Reactive state management
- [$derived](https://svelte.dev/docs/svelte/$derived) - Computed values
- [$effect](https://svelte.dev/docs/svelte/$effect) - Side effects and lifecycle
- [$props](https://svelte.dev/docs/svelte/$props) - Component props
- [Context](https://svelte.dev/docs/svelte/context) - Context API and `createContext`
- [Snippets](https://svelte.dev/docs/svelte/snippet) - Reusable markup patterns
- [Actions](https://svelte.dev/docs/svelte/use) - DOM element behaviors
- [svelte/reactivity](https://svelte.dev/docs/svelte/svelte-reactivity) - Reactive utilities (SvelteMap, SvelteSet, etc.)
- [Imperative Component API](https://svelte.dev/docs/svelte/imperative-component-api) - mount/unmount patterns

### Additional Resources
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Svelte 5 Runes RFC](https://github.com/sveltejs/rfcs/blob/master/text/0000-runes.md)
- [Wave Terminal](https://waveterm.dev/) - Inspiration for this library

---

**Document Version**: 1.0
**Last Updated**: 2025-10-25
**Prepared By**: Claude Code (Anthropic)
**For**: sv-window-manager v0.x → v2.0 refactor
