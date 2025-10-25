# SVELTE 5 QUALITY REFACTORING OPPORTUNITIES

## Executive Summary

This document identifies opportunities to simplify code in `/src/lib` by leveraging Svelte 5's modern features. The analysis focuses on replacing imperative DOM manipulation with declarative patterns, utilizing built-in reactivity features, and improving code maintainability.

**Overall Assessment**: The codebase already demonstrates strong Svelte 5 patterns in many areas. Most components use `$state`, `$derived`, and `$effect` appropriately. The primary opportunities lie in:
1. Leveraging `svelte/reactivity/window` for window event handling
2. Using `svelte/events` for better event listener management
3. Potential snippet usage for reducing imperative DOM creation
4. Minor action improvements

---

## 1. Declarative vs Imperative Patterns

### 1.1 Imperative DOM Creation in Actions (Minimize/Maximize/Close)

**File**: `/src/lib/bwin/binary-window/actions.minimize.js`
**Lines**: 67-72

**Current Implementation**:
```javascript
const minimizedGlassNode = createDomNode(
    `<button class="${CSS_CLASSES.MINIMIZED_GLASS}" type="button" aria-label="Restore ${paneTitle}" title="Restore ${paneTitle}" />`
);
if (!(minimizedGlassNode instanceof HTMLElement)) {
    throw BwinErrors.minimizedGlassCreationFailed();
}
```

**Recommended Svelte Approach**:
Create a dedicated `MinimizedGlass.svelte` component and mount it using Svelte's `mount()` API:

```svelte
<!-- MinimizedGlass.svelte -->
<script>
    let { title = 'Untitled', onclick } = $props();
</script>

<button
    class="bw-minimized-glass"
    type="button"
    aria-label="Restore {title}"
    title="Restore {title}"
    {onclick}
/>
```

Then in actions.minimize.js:
```javascript
import { mount } from 'svelte';
import MinimizedGlass from './MinimizedGlass.svelte';

// In the minimize action
const container = document.createElement('div');
const instance = mount(MinimizedGlass, {
    target: container,
    props: {
        title: paneTitle,
        onclick: () => {
            // restore logic
        }
    }
});

sillEl.append(container.firstElementChild);
```

**Rationale**:
- Declarative component syntax is more maintainable than template strings
- Type-safe props instead of string concatenation
- Easier to test and reuse
- Consistent with how Glass components are already mounted

**Priority**: Medium - Improves consistency and maintainability

---

### 1.2 Direct Style Manipulation in Resize Action

**File**: `/src/lib/bwin/actions/resize.svelte.ts`
**Lines**: 181, 197, 213, 216

**Current Implementation**:
```typescript
// Batch all style updates in single cssText assignment
paneEl.style.cssText = `top: ${sash.top}px; left: ${sash.left}px; width: ${sash.width}px; height: ${sash.height}px;`;

muntinEl.style.cssText = `width: ${MUNTIN_SIZE}px; height: ${sash.height - TRIM_SIZE}px; top: ${sash.top + TRIM_SIZE / 2}px; left: ${sash.left + sash.leftChild.width - MUNTIN_SIZE / 2}px;`;
```

**Recommended Svelte Approach**:
This is actually **already optimal**. The current approach of batching style updates via `cssText` during drag operations is the correct pattern for performance-critical DOM manipulation that happens outside Svelte's normal reactivity cycle.

**Alternative consideration**: Could potentially use Svelte's `style:` directive if the resize logic was moved into the component, but the current imperative approach is justified for:
- RAF-throttled updates
- Performance-critical drag operations
- Direct DOM manipulation needed for smooth 60fps

**Rationale**: Keep as-is. This is a legitimate use case for imperative DOM manipulation.

**Priority**: N/A - Current implementation is appropriate

---

### 1.3 Manual Event Listener Management

**File**: `/src/lib/bwin/actions/drag.svelte.ts`
**Lines**: 78-88

**Current Implementation**:
```typescript
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
node.addEventListener('dragstart', handleDragStart);
node.addEventListener('dragend', handleDragEnd);

return {
    destroy() {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        node.removeEventListener('dragstart', handleDragStart);
        node.removeEventListener('dragend', handleDragEnd);
    }
};
```

**Recommended Svelte Approach**:
Use `svelte/events` module's `on` function for better event listener management:

```typescript
import { on } from 'svelte/events';

// In action
const off1 = on(document, 'mousedown', handleMouseDown);
const off2 = on(document, 'mouseup', handleMouseUp);
const off3 = on(node, 'dragstart', handleDragStart);
const off4 = on(node, 'dragend', handleDragEnd);

return {
    destroy() {
        off1();
        off2();
        off3();
        off4();
    }
};
```

**Rationale**:
- `on()` preserves correct order relative to declarative handlers (like `onclick`)
- Uses event delegation internally for performance
- Cleaner API that returns cleanup function
- Consistent with Svelte 5 best practices

**Priority**: Medium - Improves consistency with Svelte 5 patterns

**Applies to**:
- `/src/lib/bwin/actions/drag.svelte.ts` (lines 78-88)
- `/src/lib/bwin/actions/drop.svelte.ts` (lines 78-95)
- `/src/lib/bwin/actions/resize.svelte.ts` (lines 243-265)

---

## 2. Snippets Instead of Imperative DOM Management

### 2.1 Glass Component Creation via GlassManager

**File**: `/src/lib/bwin/managers/glass-manager.svelte.ts`
**Lines**: 130-159

**Current Implementation**:
```typescript
// Create container for Glass component
const container = document.createElement('div');

// Mount Glass component
const glassInstance = svelteMount(Glass, {
    target: container,
    props: { ...glassProps, sash, binaryWindow: this.bwinContext }
});

// Append Glass element to pane
paneEl.innerHTML = '';
const glassElement = container.firstElementChild;
if (glassElement) {
    paneEl.append(glassElement);
}
```

**Recommended Svelte Approach**:
This is actually **already optimal** for this use case. The imperative mounting is necessary because:
- Glass components need to be created dynamically in response to pane additions
- They're managed outside the normal component tree
- The lifecycle needs manual control (create/destroy based on sash tree changes)

**Alternative consideration**: Could potentially use snippets if the entire Frame/Pane/Glass structure was declarative, but this would require a major architectural change and lose the flexibility of imperative pane management.

**Rationale**: Current implementation is appropriate for a dynamic window manager.

**Priority**: N/A - Current implementation is appropriate

---

### 2.2 Potential Snippet Usage in Glass Component

**File**: `/src/lib/bwin/binary-window/Glass.svelte`
**Lines**: 152-183

**Current Implementation**:
The Glass component already uses Svelte's declarative template syntax with `{#if}` blocks and `{#each}` for tabs and actions. The structure is clean and declarative.

**Consideration**:
Could potentially extract the tab rendering into a snippet for reuse, but the current implementation is already quite clean:

```svelte
{#if Array.isArray(tabs) && tabs.length > 0}
    <div class="glass-tabs" role="tablist">
        {#each tabs as tab, index (index)}
            <button class="glass-tab" role="tab" ...>
                {typeof tab === 'string' ? tab : tab.label}
            </button>
        {/each}
    </div>
{:else if title}
    <div class="glass-title">{title}</div>
{/if}
```

**Rationale**: No significant benefit from snippets here. The code is already declarative and readable.

**Priority**: N/A - Current implementation is appropriate

---

## 3. Svelte Actions

### 3.1 Existing Actions Are Well-Implemented

**Files**:
- `/src/lib/bwin/actions/drag.svelte.ts`
- `/src/lib/bwin/actions/drop.svelte.ts`
- `/src/lib/bwin/actions/resize.svelte.ts`

**Assessment**:
All three actions follow proper Svelte 5 patterns:
- Use TypeScript with proper `Action` types
- Have cleanup via `destroy()` method
- Support `update()` method for reactive parameters
- Encapsulate complex DOM interactions appropriately

**Improvements**:
See section 1.3 for using `svelte/events` instead of manual `addEventListener`.

**Priority**: Low - Actions are well-structured, only minor improvements possible

---

### 3.2 Potential New Action: Keyboard Shortcuts

**File**: `/src/lib/bwin/binary-window/Glass.svelte`
**Lines**: 121-147

**Current Implementation**:
```typescript
function handleTabKeyDown(event: KeyboardEvent, index: number) {
    if (!tabs || tabs.length === 0) return;
    if (!(event.currentTarget instanceof HTMLElement)) return;

    const key = event.key;
    const tabCount = tabs.length;

    if (key === 'ArrowLeft') {
        event.preventDefault();
        const prevIndex = index === 0 ? tabCount - 1 : index - 1;
        const prevTab = event.currentTarget.parentElement?.children[prevIndex] as HTMLElement;
        prevTab?.focus();
    }
    // ... more key handling
}
```

**Recommended Svelte Approach**:
Extract keyboard navigation into a reusable action:

```typescript
// actions/keyboard-nav.svelte.ts
import type { Action } from 'svelte/action';

interface KeyboardNavOptions {
    onLeft?: () => void;
    onRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
}

export const keyboardNav: Action<HTMLElement, KeyboardNavOptions> = (node, options) => {
    function handleKeyDown(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                options.onLeft?.();
                break;
            case 'ArrowRight':
                event.preventDefault();
                options.onRight?.();
                break;
            // ... etc
        }
    }

    node.addEventListener('keydown', handleKeyDown);

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeyDown);
        }
    };
};
```

Usage in Glass.svelte:
```svelte
<button
    class="glass-tab"
    use:keyboardNav={{
        onLeft: () => focusTab(index - 1),
        onRight: () => focusTab(index + 1)
    }}
>
```

**Rationale**:
- Reusable keyboard navigation logic
- Cleaner component code
- Easier to test in isolation
- Could be shared across components

**Priority**: Low - Current implementation works, but action would improve reusability

---

## 4. Svelte Reactivity Features

### 4.1 Window Event Handling

**File**: `/src/lib/bwin/binary-window/BinaryWindow.svelte`
**Lines**: 450-537

**Current Implementation**:
```typescript
function setupFitContainer() {
    if (!shouldFitContainer || !rootElement || !frameComponent?.rootSash) return () => {};

    const containerElement = rootElement.parentElement;
    if (!containerElement) return () => {};

    // ... ResizeObserver setup
    const handleResize = (entries: ResizeObserverEntry[]) => {
        if (resizeTimeoutId) {
            clearTimeout(resizeTimeoutId);
        }

        resizeTimeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
                for (const entry of entries) {
                    if (entry.target === containerElement && shouldFitContainer && frameComponent?.rootSash) {
                        const { width, height } = getMetricsFromElement(containerElement);
                        if (width && height) {
                            frameComponent.rootSash.width = width;
                            frameComponent.rootSash.height = height;
                            frameComponent.fit();
                        }
                    }
                }
            });
        }, 16);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerElement);

    return () => {
        resizeObserver.disconnect();
        if (resizeTimeoutId) {
            clearTimeout(resizeTimeoutId);
            resizeTimeoutId = null;
        }
    };
}
```

**Recommended Svelte Approach**:
While ResizeObserver is appropriate here (watching a specific element, not window), if you needed window dimensions you could use `svelte/reactivity/window`:

```typescript
import { innerWidth, innerHeight } from 'svelte/reactivity/window';

// In component
$effect(() => {
    if (shouldFitContainer && frameComponent?.rootSash) {
        frameComponent.rootSash.width = innerWidth.current;
        frameComponent.rootSash.height = innerHeight.current;
        frameComponent.fit();
    }
});
```

**However**, the current ResizeObserver approach is correct because:
- You're watching the parent container's size, not window size
- Container might be smaller than window
- ResizeObserver handles container size changes from any source

**Rationale**: Current implementation is appropriate. Use `svelte/reactivity/window` only if you actually need window dimensions.

**Priority**: N/A - Current implementation is appropriate

**Note**: If you later need window scroll position tracking, window dimensions, or online/offline status, consider using the reactive exports from `svelte/reactivity/window`.

---

### 4.2 Reactive State Management

**Files**: Throughout the codebase

**Assessment**:
The codebase already uses Svelte 5's reactivity features excellently:

**Strong patterns observed**:
- `$state()` for reactive variables (e.g., BinaryWindow.svelte line 60-71)
- `$derived()` for computed values (e.g., BinaryWindow.svelte line 55-57)
- `$effect()` for side effects with proper cleanup (e.g., BinaryWindow.svelte line 404-424)
- `$state.raw()` in managers to prevent proxy wrapping of component instances (glass-manager.svelte.ts line 34, 39)
- Proper use of `untrack()` where needed (BinaryWindow.svelte line 433)

**Examples of excellent patterns**:
```typescript
// GlassManager using $state.raw to avoid proxy issues
glasses = $state.raw<GlassInstance[]>([]);
userComponents = $state.raw(new Map<string, UserComponentInstance>());

// Derived state
glassCount = $derived(this.glasses.length);
glassesBySashId = $derived.by(() => {
    const map = new Map<string, GlassInstance>();
    this.glasses.forEach((glass) => map.set(glass.sashId, glass));
    return map;
});
```

**Rationale**: The reactivity patterns are already modern and well-implemented.

**Priority**: N/A - Already following best practices

---

### 4.3 Reactive Maps and Sets

**Assessment**:
The codebase uses regular Maps in some places (e.g., `glass-manager.svelte.ts` line 39). However, these are wrapped in `$state.raw()` which is intentional to avoid proxy overhead for component instance tracking.

**Current Implementation**:
```typescript
userComponents = $state.raw(new Map<string, UserComponentInstance>());
```

**Consideration for SvelteMap/SvelteSet**:
From `svelte/reactivity`, you could use `SvelteMap` for reactive map operations:

```typescript
import { SvelteMap } from 'svelte/reactivity';

userComponents = new SvelteMap<string, UserComponentInstance>();
```

**However**, the current `$state.raw(new Map())` approach is correct because:
- You're manually triggering updates via reassignment (`this.glasses = [...]`)
- The Map itself doesn't need granular reactivity
- Using `$state.raw` avoids unnecessary proxy overhead
- Component instances shouldn't be proxified

**Rationale**: Current implementation is optimal for this use case.

**Priority**: N/A - Current implementation is appropriate

---

## 5. Other Svelte 5 Features

### 5.1 Props Usage

**Files**: Throughout components

**Assessment**:
All components correctly use `$props()` with TypeScript interfaces:

```typescript
let {
    settings,
    debug = DEBUG,
    fitContainer = true
}: BinaryWindowProps = $props();
```

**Best practices followed**:
- Proper TypeScript interfaces for props
- Default values in destructuring
- Consistent naming

**Priority**: N/A - Already following best practices

---

### 5.2 Component Events vs Callbacks

**Files**: Frame.svelte, Pane.svelte, Muntin.svelte

**Current Implementation**:
Components use callback props for events:

```typescript
interface FrameProps {
    settings: SashConfig | ConfigRoot | Record<string, unknown>;
    debug?: boolean;
    onPaneRender?: (paneEl: HTMLElement, sash: Sash) => void;
    onMuntinRender?: (muntinEl: HTMLElement, sash: Sash) => void;
    onPaneDrop?: (event: DragEvent, sash: Sash, dropArea: string) => void;
}
```

**Assessment**:
This is the **correct Svelte 5 pattern**. Event callbacks as props are preferred over the legacy `createEventDispatcher` pattern.

**Rationale**: Already following Svelte 5 best practices.

**Priority**: N/A - Already optimal

---

### 5.3 Context API Usage

**Files**:
- `/src/lib/bwin/context.ts`
- `/src/lib/bwin/binary-window/BinaryWindow.svelte`
- `/src/lib/bwin/frame/Frame.svelte`

**Current Implementation**:
```typescript
// Setting context
const bwinContext: BwinContext = {
    get windowElement() {
        return frameComponent?.windowElement;
    },
    get sillElement() {
        return sillManager?.sillElement;
    },
    // ...
};

setContext(BWIN_CONTEXT, bwinContext);
```

**Assessment**:
Excellent use of context with reactive getters. This ensures consumers always get the current values.

**Rationale**: Already following best practices.

**Priority**: N/A - Already optimal

---

### 5.4 Lifecycle Hooks

**Files**: Pane.svelte, Muntin.svelte

**Current Implementation**:
```typescript
// Pane.svelte
onMount(() => {
    if (paneElement && onPaneRender) {
        onPaneRender(paneElement, sash);
    }
});
```

**Assessment**:
Correct use of `onMount` for one-time initialization when element is available.

**Note in code** (line 21-23):
```typescript
// REFACTORED: Use onMount lifecycle hook instead of $effect
// This runs ONCE when the pane mounts, preventing infinite loops
// The callback is responsible for managing state, not the effect
```

This comment indicates the team already considered and correctly chose `onMount` over `$effect`.

**Rationale**: Already optimal.

**Priority**: N/A - Already following best practices

---

## 6. Additional Opportunities

### 6.1 Centralized Event Listener Management

**Consideration**:
Multiple actions manage document-level event listeners. Could potentially create a centralized event delegation system, but the current approach is fine for this use case.

**Priority**: Low - Not worth the complexity

---

### 6.2 CSS Custom Properties for Dynamic Theming

**Current**: CSS variables are already used (see CLAUDE.md reference)

**Assessment**: Already implemented.

---

### 6.3 TypeScript Type Safety

**Assessment**:
The codebase has good TypeScript coverage with proper interfaces and type annotations. Some areas could be improved:

**File**: `/src/lib/bwin/binary-window/actions.minimize.js`
**Lines**: Throughout (it's a .js file)

**Recommendation**: Consider converting to `.ts` for better type safety, especially given the complex type extensions:

```typescript
interface BwinMinimizedElement extends HTMLElement {
    bwGlassElement?: Element | null;
    bwOriginalPosition?: string | null;
    bwOriginalBoundingRect?: BoundingRect;
    bwOriginalSashId?: string | null;
    bwOriginalStore?: Record<string, any>;
}
```

**Priority**: Low - Current JSDoc typing works but TypeScript would be more robust

---

## Summary of Recommendations

### High Priority
None - The codebase already follows Svelte 5 best practices well.

### Medium Priority

1. **Use `svelte/events` for event listeners** (Section 1.3)
   - Files: drag.svelte.ts, drop.svelte.ts, resize.svelte.ts
   - Benefit: Better event ordering, consistent with Svelte 5 patterns
   - Effort: Low (simple find-replace pattern)

2. **Convert imperative DOM creation to components** (Section 1.1)
   - File: actions.minimize.js
   - Benefit: More maintainable, type-safe, testable
   - Effort: Medium (requires component creation and integration)

### Low Priority

3. **Extract keyboard navigation into reusable action** (Section 3.2)
   - File: Glass.svelte
   - Benefit: Reusability, cleaner component code
   - Effort: Low

4. **Convert .js action files to .ts** (Section 6.3)
   - Files: actions.*.js
   - Benefit: Better type safety
   - Effort: Low

### Not Recommended

- Changing ResizeObserver to window reactivity (Section 4.1) - current approach is correct
- Converting imperative mounting to snippets (Section 2.1) - would require major architectural changes
- Using SvelteMap/SvelteSet in managers (Section 4.3) - current $state.raw approach is optimal

---

## Conclusion

The codebase demonstrates strong understanding and application of Svelte 5 patterns. The main opportunities are:

1. **Consistency improvements**: Adopting `svelte/events` across all actions
2. **Component-based patterns**: Converting some imperative DOM creation to mounted components
3. **Type safety**: Converting remaining .js files to TypeScript

The reactive state management, effects, derived values, and context usage are already exemplary. The imperative DOM manipulation in performance-critical paths (resize, drag-drop) is appropriate and should not be changed to declarative patterns.

**Overall Grade**: A- for Svelte 5 adoption. The team clearly understands modern Svelte patterns and has made thoughtful architectural decisions.
