# Svelte 5 Lessons Learned - sv-window-manager

**Date:** 2025-01-25
**Project:** sv-window-manager (Svelte 5 window management library)
**Context:** Phase 4 architectural refactoring + effect anti-pattern elimination

---

## Critical Lessons

### 1. When to Use `$effect` (and when NOT to)

**✅ CORRECT Uses of `$effect`:**
- **DOM Observers:** ResizeObserver, MutationObserver, IntersectionObserver
- **Third-party library integration:** Initializing libraries that need DOM access
- **Canvas drawing:** Direct canvas manipulation
- **Analytics tracking:** Sending events to external services
- **Direct DOM manipulation:** When you must imperatively modify the DOM

**❌ INCORRECT Uses of `$effect` (Anti-patterns):**
- **Initialization logic** → Use `onMount` instead
- **Cleanup-only logic** → Use `onDestroy` instead
- **State synchronization** → Use `$derived` instead
- **Computing derived values** → Use `$derived` or `$derived.by()` instead
- **Reading and writing the same state** → Creates infinite loops!

**The Golden Rule:**
> If your `$effect` updates `$state`, you're probably doing it wrong.

---

## 2. Lifecycle Hooks vs Effects

### Use `onMount` for:
```svelte
<script>
import { onMount } from 'svelte';

onMount(() => {
    // Initialization that runs once when component mounts
    initializeThirdPartyLibrary();
    callParentCallback();

    // Can return cleanup function
    return () => {
        cleanup();
    };
});
</script>
```

**Benefits:**
- Runs exactly once on mount
- Clear intent (initialization)
- Works in SSR (runs only on client)
- No dependency tracking = no loops

### Use `onDestroy` for:
```svelte
<script>
import { onDestroy } from 'svelte';

onDestroy(() => {
    // Cleanup that runs once when component unmounts
    removeEventListeners();
    destroyManagers();
});
</script>
```

**Benefits:**
- Runs exactly once on unmount
- Clear intent (cleanup)
- More semantic than effect with only teardown

### Use `$effect` for:
```svelte
<script>
$effect(() => {
    // Setup that needs to react to dependencies
    const observer = new ResizeObserver(() => {
        // Handle resize based on reactive width/height
        updateLayout(width, height);
    });

    observer.observe(element);

    return () => {
        observer.disconnect();
    };
});
</script>
```

**When:** True side effects that need to re-run when dependencies change

---

## 3. The Infinite Loop Anti-Pattern

### ❌ WRONG - Creates Infinite Loop:
```svelte
<script>
let count = $state(0);

// This creates an infinite loop!
$effect(() => {
    count = count + 1; // Reads count → writes count → triggers effect again
});
</script>
```

### ✅ CORRECT - Use Derived State:
```svelte
<script>
let count = $state(0);

// Declarative, no side effects
let incremented = $derived(count + 1);
</script>
```

### Real-World Example from This Project:

**❌ WRONG (Caused infinite loop):**
```svelte
<!-- Pane.svelte - BAD -->
<script>
$effect(() => {
    if (paneElement && onPaneRender) {
        onPaneRender(paneElement, sash);
        // This calls glassManager.createGlass()
        // Which updates $state
        // Which re-renders Pane
        // Which triggers this effect again
        // INFINITE LOOP!
    }
});
</script>
```

**✅ CORRECT (Fixed with onMount):**
```svelte
<!-- Pane.svelte - GOOD -->
<script>
import { onMount } from 'svelte';

onMount(() => {
    if (paneElement && onPaneRender) {
        onPaneRender(paneElement, sash);
        // Runs exactly once when mounted
        // No loop!
    }
});
</script>
```

---

## 4. Manager Pattern with Reactive State

### Use `$state()` for Reactive Manager Properties:
```typescript
class GlassManager {
    // Reactive array - deep reactivity with proxy
    glasses = $state<GlassInstance[]>([]);

    // Reactive single value
    activeGlass = $state<GlassInstance | undefined>();

    // Methods that mutate state trigger reactivity automatically
    addGlass(glass: GlassInstance) {
        this.glasses.push(glass); // Automatic reactivity!
    }
}
```

### Use `$state.raw()` for Component Instances:
```typescript
class GlassManager {
    // Component instances should NOT be proxied
    glasses = $state.raw<GlassInstance[]>([]);

    // Manually trigger reactivity when mutating
    addGlass(glass: GlassInstance) {
        this.glasses = [...this.glasses, glass]; // Reassignment triggers update
    }

    removeGlass(id: string) {
        this.glasses = this.glasses.filter(g => g.id !== id);
    }
}
```

**Why:** Component instances have `mount()` and `unmount()` methods that fail when wrapped in proxies, causing `state_proxy_unmount` errors.

### Use `$derived()` for Computed Manager State:
```typescript
class GlassManager {
    glasses = $state<GlassInstance[]>([]);

    // Automatically recomputes when glasses changes
    glassCount = $derived(this.glasses.length);

    // Complex derivation
    glassesBySashId = $derived.by(() => {
        const map = new Map<string, GlassInstance[]>();
        for (const glass of this.glasses) {
            const existing = map.get(glass.sashId) ?? [];
            map.set(glass.sashId, [...existing, glass]);
        }
        return map;
    });
}
```

---

## 5. Context API for Sharing Managers

### Setup in Parent Component:
```svelte
<script>
import { setContext } from 'svelte';

let glassManager = new GlassManager();
let sillManager = new SillManager();

// Share via context (not global state!)
setContext('glassManager', glassManager);
setContext('sillManager', sillManager);
</script>
```

### Access in Child Components:
```svelte
<script>
import { getContext } from 'svelte';

let glassManager = getContext<GlassManager>('glassManager');

// Use manager reactively
let glassCount = $derived(glassManager.glassCount);
</script>
```

**Benefits:**
- Avoids global state issues in SSR
- Type-safe with TypeScript generics
- Scoped to component tree
- No prop drilling

---

## 6. Avoiding Prop Mutations

### ❌ WRONG - Mutating Props:
```svelte
<script>
let { settings } = $props();

$effect(() => {
    if (!settings.width) {
        settings.width = 100; // MUTATES PROP! Bad!
    }
});
</script>
```

**Problem:** Mutating props can trigger parent re-renders, leading to effect loops.

### ✅ CORRECT - Don't Mutate Props:
```svelte
<script>
let { settings } = $props();

// Use derived state instead
let effectiveWidth = $derived(settings.width ?? 100);

// Or set internally without mutating prop
let internalWidth = $state(settings.width ?? 100);
</script>
```

---

## 7. Using `untrack()` to Break Cycles

When you need to read reactive state without tracking it as a dependency:

```svelte
<script>
import { untrack } from 'svelte';

$effect(() => {
    const trigger = someDependency; // This IS tracked

    untrack(() => {
        // Reading otherState here does NOT make it a dependency
        const value = otherState;
        performSideEffect(value);
    });
});
</script>
```

**Use Case:** When an effect needs to trigger on one dependency but read others without tracking them.

---

## 8. Testing Strategy

### Unit Test Manager Classes:
```typescript
test('GlassManager adds glass correctly', () => {
    const manager = new GlassManager();
    const instance = { id: '1', sashId: 'sash1', /* ... */ };

    manager.addGlass(instance);

    expect(manager.glasses.length).toBe(1);
    expect(manager.glassCount).toBe(1); // Test derived state too
});
```

### Validate with Chrome DevTools MCP:
```javascript
// Navigate and check console
mcp__chrome-devtools__navigate_page({ url: "http://localhost:5173/" });
const errors = mcp__chrome-devtools__list_console_messages({ types: ["error"] });
expect(errors).toHaveLength(0);
```

### Validate with Svelte MCP:
```javascript
// Fetch official documentation
mcp__svelte__get-documentation({
    section: ["$effect", "$state", "$derived"]
});
// Compare your patterns against official recommendations
```

---

## 9. Code Review Checklist

Before committing Svelte 5 code:

- [ ] No `$effect` blocks that update `$state`
- [ ] No prop mutations
- [ ] No reading and writing same state in effects
- [ ] `onMount` used for initialization
- [ ] `onDestroy` used for cleanup-only
- [ ] `$derived` used for computed values
- [ ] `$state.raw()` used for component instances
- [ ] Context API used for manager sharing
- [ ] `untrack()` used appropriately to break cycles
- [ ] All tests passing
- [ ] Zero console errors in Chrome DevTools

---

## 10. Architectural Decisions

### Manager Pattern Benefits:
1. **Separation of Concerns** - Business logic separate from UI
2. **Testability** - Managers can be unit tested in isolation
3. **Reusability** - Managers can be shared across components
4. **Type Safety** - Full TypeScript with proper interfaces
5. **Reactivity** - `$state` and `$derived` make managers reactive

### File Structure:
```
src/lib/bwin/
├── managers/
│   ├── glass-manager.svelte.ts       (336 lines)
│   ├── glass-manager.svelte.test.ts  (330 lines, 36 tests)
│   ├── sill-manager.svelte.ts        (333 lines)
│   ├── sill-manager.svelte.test.ts   (537 lines, 34 tests)
│   ├── types.ts                      (65 lines)
│   └── index.ts                      (exports)
├── binary-window/
│   └── BinaryWindow.svelte           (700 lines, down from 985)
```

**Result:** 29% reduction in BinaryWindow complexity

---

## 11. Performance Considerations

### Avoid Deep Reactivity When Not Needed:
```typescript
// Use $state.raw() for large data structures that don't need deep reactivity
largeArray = $state.raw(/* ... */);

// Manually trigger updates
largeArray = [...largeArray, newItem];
```

### Use `untrack()` to Prevent Unnecessary Re-runs:
```typescript
$effect(() => {
    const trigger = importantDependency;

    // Don't track these reads
    untrack(() => {
        const data = expensiveComputation();
        sideEffect(data);
    });
});
```

---

## 12. Common Error Messages and Fixes

### `effect_update_depth_exceeded`
**Cause:** Effect reads and writes the same state, or circular effect dependencies
**Fix:** Replace with `$derived`, `onMount`, or `untrack()`

### `state_proxy_unmount`
**Cause:** Component instance wrapped in `$state` proxy
**Fix:** Use `$state.raw()` for component instances

### `hydration_mismatch`
**Cause:** Server-rendered HTML doesn't match client render
**Fix:** Use `onMount` for client-only code, avoid effects that run on server

---

## Summary

The key to Svelte 5 success is **thinking declaratively**:
- State is `$state()`
- Computed values are `$derived()`
- Initialization is `onMount()`
- Cleanup is `onDestroy()`
- Side effects are `$effect()` (use sparingly!)

**Mantra:** If you're reaching for `$effect`, ask yourself:
1. Is this really a side effect?
2. Or am I trying to synchronize state? (use `$derived`)
3. Or am I trying to initialize? (use `onMount`)
4. Or am I trying to cleanup? (use `onDestroy`)

Follow these patterns and you'll avoid 95% of common Svelte 5 pitfalls.
