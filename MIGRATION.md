# Migration Guide - SV Window Manager

This document provides step-by-step migration guides for deprecated APIs and breaking changes in sv-window-manager.

---

## Table of Contents

1. [GlassManager → GlassState](#glassmanager--glassstate)
2. [SillManager → SillState](#sillmanager--sillstate)
3. [Version Migration Guides](#version-migration-guides)
4. [Breaking Changes Log](#breaking-changes-log)

---

## GlassManager → GlassState

### Status
- **Deprecated in:** v0.3.0 (planned)
- **Removal planned:** v2.0.0
- **Migration deadline:** At least 6 months from v0.3.0
- **Severity:** Medium (functionality identical, API simpler)

### What's Changing

The class-based `GlassManager` is being replaced with the module-level `GlassState` API. This provides:
- ✅ Simpler API (no `new` keyword required)
- ✅ Better tree-shaking
- ✅ Functional programming style
- ✅ Module-level reactive state
- ✅ Same functionality, cleaner interface

### Migration Steps

#### 1. Update Imports

**Before:**
```typescript
import { GlassManager } from 'sv-window-manager';
```

**After:**
```typescript
import { GlassState } from 'sv-window-manager';
```

#### 2. Replace Constructor with Initialize

**Before:**
```typescript
const glassManager = new GlassManager(bwinContext, debug);
```

**After:**
```typescript
GlassState.initialize(bwinContext, debug);
```

#### 3. Update Method Calls

**Before:**
```typescript
// Remove glass
glassManager.removeGlass(sashId);

// Update glass
glassManager.updateGlass(sashId, { title: 'New Title' });

// Get glass
const glass = glassManager.getGlass(sashId);

// Access derived state
const count = glassManager.glassCount;
const hasActive = glassManager.hasActiveGlass;
```

**After:**
```typescript
// Remove glass
GlassState.removeGlass(sashId);

// Update glass
GlassState.updateGlass(sashId, { title: 'New Title' });

// Get glass
const glass = GlassState.getGlass(sashId);

// Access derived state (now functions)
const count = GlassState.glassCount();
const hasActive = GlassState.hasActiveGlass();
```

**⚠️ Note:** Derived state accessors are now functions that return values.

#### 4. Complete Example

**Before:**
```typescript
import { GlassManager } from 'sv-window-manager';
import type { BwinContext } from 'sv-window-manager';

function setupGlassManagement(bwinContext: BwinContext) {
  const glassManager = new GlassManager(bwinContext, true);

  // Add a glass
  glassManager.addGlass({
    sashId: 'pane-1',
    title: 'My Pane',
    component: MyComponent,
    componentProps: { message: 'Hello!' }
  });

  // Check count
  if (glassManager.glassCount > 0) {
    console.log('Glasses:', glassManager.glassCount);
  }

  // Remove a glass
  glassManager.removeGlass('pane-1');
}
```

**After:**
```typescript
import { GlassState } from 'sv-window-manager';
import type { BwinContext } from 'sv-window-manager';

function setupGlassManagement(bwinContext: BwinContext) {
  GlassState.initialize(bwinContext, true);

  // Add a glass
  GlassState.addGlass({
    sashId: 'pane-1',
    title: 'My Pane',
    component: MyComponent,
    componentProps: { message: 'Hello!' }
  });

  // Check count (note: now a function)
  if (GlassState.glassCount() > 0) {
    console.log('Glasses:', GlassState.glassCount());
  }

  // Remove a glass
  GlassState.removeGlass('pane-1');
}
```

### API Mapping

| GlassManager (deprecated) | GlassState (recommended) | Notes |
|---------------------------|--------------------------|-------|
| `new GlassManager(ctx, debug)` | `GlassState.initialize(ctx, debug)` | No constructor needed |
| `manager.removeGlass(id)` | `GlassState.removeGlass(id)` | Same signature |
| `manager.updateGlass(id, props)` | `GlassState.updateGlass(id, props)` | Same signature |
| `manager.getGlass(id)` | `GlassState.getGlass(id)` | Same signature |
| `manager.glassCount` | `GlassState.glassCount()` | Now a function |
| `manager.hasActiveGlass` | `GlassState.hasActiveGlass()` | Now a function |
| `manager.glassesBySashId` | `GlassState.glassesBySashId()` | Now a function |
| `manager.glassIds` | `GlassState.glassIds()` | Now a function |

### Why This Change?

1. **Simpler API**: No need to manage instances or pass them around
2. **Better tree-shaking**: Module-level code is easier for bundlers to optimize
3. **Functional style**: Aligns with modern JavaScript/TypeScript patterns
4. **Same functionality**: All features preserved, just cleaner interface

---

## SillManager → SillState

### Status
- **Deprecated in:** v0.3.0 (planned)
- **Removal planned:** v2.0.0
- **Migration deadline:** At least 6 months from v0.3.0
- **Severity:** Medium (functionality identical, API simpler)

### What's Changing

The class-based `SillManager` is being replaced with the module-level `SillState` API. This provides the same benefits as the GlassState migration.

### Migration Steps

#### 1. Update Imports

**Before:**
```typescript
import { SillManager } from 'sv-window-manager';
```

**After:**
```typescript
import { SillState } from 'sv-window-manager';
```

#### 2. Replace Constructor with Initialize

**Before:**
```typescript
const sillManager = new SillManager(bwinContext, debug);
```

**After:**
```typescript
SillState.initialize(bwinContext, debug);
```

#### 3. Update Method Calls

**Before:**
```typescript
// Mount sill element
const sill = sillManager.mount();

// Get sill element
const sillEl = sillManager.sillElement;

// Check if sill exists
if (sillManager.hasSillElement) {
  // ...
}

// Cleanup
sillManager.destroy();
```

**After:**
```typescript
// Get sill element (auto-created if needed)
const sill = SillState.getSillElement();

// Ensure sill element exists
const sillEl = SillState.ensureSillElement();

// Get element (may be undefined)
const sillEl = SillState.getSillElement();

// Cleanup
SillState.destroy();
```

#### 4. Complete Example

**Before:**
```typescript
import { SillManager } from 'sv-window-manager';
import type { BwinContext } from 'sv-window-manager';

function setupSill(bwinContext: BwinContext) {
  const sillManager = new SillManager(bwinContext, true);

  // Mount the sill
  const sill = sillManager.mount();

  if (sillManager.hasSillElement) {
    console.log('Sill mounted:', sillManager.sillElement);
  }

  // Later: cleanup
  return () => {
    sillManager.destroy();
  };
}
```

**After:**
```typescript
import { SillState } from 'sv-window-manager';
import type { BwinContext } from 'sv-window-manager';

function setupSill(bwinContext: BwinContext) {
  SillState.initialize(bwinContext, true);

  // Get or create the sill element
  const sill = SillState.ensureSillElement();

  if (sill) {
    console.log('Sill element:', sill);
  }

  // Later: cleanup
  return () => {
    SillState.destroy();
  };
}
```

### API Mapping

| SillManager (deprecated) | SillState (recommended) | Notes |
|--------------------------|-------------------------|-------|
| `new SillManager(ctx, debug)` | `SillState.initialize(ctx, debug)` | No constructor needed |
| `manager.mount()` | `SillState.ensureSillElement()` | Creates if needed |
| `manager.sillElement` | `SillState.getSillElement()` | Now a function |
| `manager.hasSillElement` | `SillState.getSillElement() !== undefined` | Check return value |
| `manager.destroy()` | `SillState.destroy()` | Same signature |
| `manager.addMinimizedGlass(...)` | `SillState.addMinimizedGlass(...)` | Same signature |
| `manager.removeMinimizedGlass(...)` | `SillState.removeMinimizedGlass(...)` | Same signature |

---

## Version Migration Guides

### Upgrading to v0.3.0 (Planned)

**Breaking Changes:** None
**Deprecations:**
- `GlassManager` (use `GlassState`)
- `SillManager` (use `SillState`)

**Steps:**
1. Update to v0.3.0: `npm install sv-window-manager@^0.3.0`
2. Run your application in development mode
3. Watch console for deprecation warnings
4. Follow migration guides above to update deprecated APIs
5. Test thoroughly

**Timeline:**
- You can continue using deprecated APIs until v2.0.0
- Recommended to migrate within 3 months for smoother experience

---

### Upgrading to v0.4.0 (Planned)

**Breaking Changes:** None
**New Features:**
- Expanded test coverage
- Accessibility improvements
- Performance optimizations

**Steps:**
1. Update to v0.4.0: `npm install sv-window-manager@^0.4.0`
2. Review CHANGELOG.md for new features
3. (Optional) Adopt new accessibility features
4. (Optional) Integrate performance improvements

---

### Upgrading to v1.0.0 (Planned)

**Breaking Changes:** TBD (to be decided in v0.6.0)
**Possible removals:**
- `GlassManager` (if migration rate is high)
- `SillManager` (if migration rate is high)
- Legacy `Sash` class (non-reactive version)

**Steps:**
1. Ensure you've migrated away from all deprecated APIs
2. Update to v1.0.0: `npm install sv-window-manager@^1.0.0`
3. Review CHANGELOG.md for final breaking changes
4. Run tests and verify functionality
5. Deploy with confidence (stable API from this point)

---

### Upgrading to v2.0.0 (Future)

**Breaking Changes:**
- Removal of all APIs deprecated before v1.0.0
- Possible major architectural changes

**Steps:**
1. Review MIGRATION.md for v2.0.0-specific guides (will be added)
2. Ensure you're on latest v1.x version
3. Migrate away from any remaining deprecated APIs
4. Update to v2.0.0
5. Review breaking changes in CHANGELOG.md

---

## Breaking Changes Log

### v0.2.2 → v0.3.0 (Planned)

**Deprecations:**
- `GlassManager` → Use `GlassState` instead
- `SillManager` → Use `SillState` instead

**Breaking Changes:** None

**Action Required:** Update code to use new APIs (old APIs still work with warnings)

---

### v0.3.0 → v1.0.0 (Planned)

**Breaking Changes:** TBD (decision in v0.6.0)

**Possible removals:**
- `GlassManager`
- `SillManager`
- Legacy `Sash` class

**Action Required:** Wait for v0.6.0 release for final decision

---

## Common Migration Patterns

### Pattern 1: Context-Based Usage

**Before:**
```svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import type { GlassManager } from 'sv-window-manager';

  const glassManager = getContext<GlassManager>('glassManager');

  function handleRemove() {
    glassManager.removeGlass('pane-1');
  }
</script>
```

**After:**
```svelte
<script lang="ts">
  import { GlassState } from 'sv-window-manager';

  function handleRemove() {
    GlassState.removeGlass('pane-1');
  }
</script>
```

**Note:** No need to use context anymore - GlassState is module-level.

---

### Pattern 2: Reactive Derived State

**Before:**
```svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import type { GlassManager } from 'sv-window-manager';

  const glassManager = getContext<GlassManager>('glassManager');

  // Reactive derived value
  $: count = glassManager.glassCount;
</script>

<p>Glass count: {count}</p>
```

**After:**
```svelte
<script lang="ts">
  import { GlassState } from 'sv-window-manager';

  // Reactive derived value (call as function)
  $: count = GlassState.glassCount();
</script>

<p>Glass count: {count}</p>
```

**Note:** Derived state accessors are now functions.

---

### Pattern 3: Cleanup in onDestroy

**Before:**
```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SillManager } from 'sv-window-manager';

  const sillManager = new SillManager(bwinContext, true);

  onDestroy(() => {
    sillManager.destroy();
  });
</script>
```

**After:**
```svelte
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { SillState } from 'sv-window-manager';

  onMount(() => {
    SillState.initialize(bwinContext, true);
  });

  onDestroy(() => {
    SillState.destroy();
  });
</script>
```

---

## Need Help?

If you encounter issues during migration:

1. **Check the Examples:** See `src/routes/+page.svelte` for updated examples
2. **GitHub Discussions:** [Ask questions](https://github.com/itlackey/sv-window-manager/discussions)
3. **GitHub Issues:** [Report bugs](https://github.com/itlackey/sv-window-manager/issues)
4. **Documentation:** See [README.md](./README.md) and [ROADMAP_1.0.md](./ROADMAP_1.0.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Next Review:** After v0.3.0 release
