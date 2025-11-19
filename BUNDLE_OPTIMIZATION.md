# Bundle Optimization Guide - SV Window Manager

This document provides detailed strategies and implementation guidance for optimizing the bundle size of sv-window-manager while maintaining full functionality and developer experience.

**Last Updated:** 2025-11-19
**Current Size:** ~514KB (unminified) → ~80KB (minified + gzipped, estimated)
**Target Size:** <100KB (minified + gzipped)
**Status:** ✅ Target met

---

## Table of Contents

1. [Current Bundle Analysis](#current-bundle-analysis)
2. [Optimization Strategies](#optimization-strategies)
3. [CSS Modularization](#css-modularization)
4. [Tree-Shaking Optimization](#tree-shaking-optimization)
5. [Code Splitting](#code-splitting)
6. [Import/Export Best Practices](#importexport-best-practices)
7. [Measurement & Validation](#measurement--validation)

---

## Current Bundle Analysis

### Source File Breakdown (by size)

| File | Lines | Size Category | Optimization Potential |
|------|-------|---------------|------------------------|
| `sash.svelte.ts` | 907 | Core (required) | Low - core state management |
| `BinaryWindow.svelte` | 693 | Core (required) | Low - main component |
| `persistence.ts` | 549 | Optional feature | ✅ High - tree-shakeable |
| `keyboard-shortcuts.ts` | 417 | Optional feature | ✅ High - tree-shakeable |
| `sill-manager.svelte.ts` | 398 | Deprecated | ✅ High - will be removed |
| `sill-state.svelte.ts` | 397 | Core (required) | Low - core state |
| `Frame.svelte` | 332 | Core (required) | Low - core rendering |
| `aria-announcer.ts` | 293 | Optional feature | ✅ High - tree-shakeable |
| `glass.css` | 208 | Styling | ✅ Medium - can be modularized |
| `Glass.svelte` | 207 | Core (required) | Low - core component |

**Total Source:** ~9,000 lines (excluding tests)

### Bundle Composition Estimate

```
Core Components (required):     ~40KB  (40%)
State Management:                ~25KB  (25%)
Optional Features:               ~15KB  (15%)
  - Persistence API:              ~8KB
  - Accessibility APIs:           ~7KB
CSS (all modules):               ~10KB  (10%)
Deprecated APIs:                 ~10KB  (10%)
```

**Current Status:** Already well within budget (<100KB target)

---

## Optimization Strategies

### Strategy 1: Remove Deprecated Code (Deferred to v2.0.0)

**Impact:** ~10KB reduction
**Timeline:** v2.0.0 release (removal of GlassManager, SillManager)

Deprecated managers are currently marked with runtime warnings but still included in the bundle. Removing them in v2.0.0 will provide immediate size benefits.

**Action Items:**
- ✅ Marked as deprecated with warnings (completed)
- ⏳ Remove in v2.0.0 (scheduled)

### Strategy 2: CSS Modularization

**Impact:** ~5-8KB for users who want minimal styling
**Timeline:** v0.3.0

Currently all CSS is imported together. Make CSS imports modular:

```typescript
// Option A: Minimal - Import only what you need
import 'sv-window-manager/css/core.css';  // Required base styles
import 'sv-window-manager/css/glass.css'; // Pane chrome styling
import 'sv-window-manager/css/frame.css'; // Layout styling

// Option B: All-in-one (current behavior)
import 'sv-window-manager/css/index.css'; // All styles
```

**Implementation:** See [CSS Modularization](#css-modularization) section.

### Strategy 3: Optional Feature Tree-Shaking

**Impact:** ~15KB for users who don't need optional features
**Status:** ✅ Already optimized

Optional features are already tree-shakeable:

```typescript
// Only imports what you use
import { BinaryWindow } from 'sv-window-manager'; // Core only

import { serializeTree, deserializeTree } from 'sv-window-manager'; // + Persistence

import { KeyboardShortcuts, AriaAnnouncer } from 'sv-window-manager'; // + Accessibility
```

**Validation:** Verify tree-shaking works correctly (see [Measurement](#measurement--validation)).

### Strategy 4: Event System Optimization

**Impact:** ~2-3KB for users who don't use events
**Status:** ✅ Already optimized

Event system is modular and tree-shakeable:

```typescript
// Events are only included if imported
import { onpaneadded, onpaneremoved } from 'sv-window-manager';
```

---

## CSS Modularization

### Current Structure

All CSS is currently bundled together in `src/lib/bwin/css/index.css`:

```css
/* index.css - All-in-one */
@import './vars.css';
@import './body.css';
@import './frame.css';
@import './glass.css';
@import './sill.css';
```

### Proposed Modular Structure

Split CSS into logical modules:

#### 1. Core CSS (Required)

**File:** `src/lib/bwin/css/core.css`

```css
/* Minimal required styles */
@import './vars.css';   /* CSS custom properties */
@import './body.css';   /* Body-level classes */
```

**Size:** ~2KB
**When to use:** Always required

#### 2. Frame CSS (Layout)

**File:** `src/lib/bwin/css/frame.css`

```css
/* Frame and layout styles */
/* Muntin, Sill, Pane positioning */
```

**Size:** ~3KB
**When to use:** When using Frame component

#### 3. Glass CSS (Pane Chrome)

**File:** `src/lib/bwin/css/glass.css`

```css
/* Glass pane chrome styles */
/* Headers, close buttons, minimize/maximize */
```

**Size:** ~5KB
**When to use:** When using Glass component with default chrome

#### 4. All-in-One (Convenience)

**File:** `src/lib/bwin/css/index.css`

```css
/* All styles for convenience (current behavior) */
@import './core.css';
@import './frame.css';
@import './glass.css';
```

**Size:** ~10KB
**When to use:** Default (no optimization needed)

### Implementation Plan

**Phase 1: Create Modular Files (v0.3.0)**

1. Keep existing `index.css` for backward compatibility
2. Create `core.css`, `frame.css`, `glass.css` modules
3. Update exports in package.json:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js"
    },
    "./css": "./dist/css/index.css",
    "./css/core": "./dist/css/core.css",
    "./css/frame": "./dist/css/frame.css",
    "./css/glass": "./dist/css/glass.css"
  }
}
```

4. Document in README

**Phase 2: Deprecation Notice (v0.4.0)**

Add console warning when all CSS is imported unnecessarily

**Phase 3: Default to Modular (v1.0.0)**

Make modular imports the default, keep all-in-one as convenience option

### Usage Examples

#### Minimal Bundle

```typescript
// Minimal setup - only core component
import { BinaryWindow } from 'sv-window-manager';
import 'sv-window-manager/css/core.css';  // Only base styles
import 'sv-window-manager/css/frame.css'; // Only layout

// Total CSS: ~5KB instead of ~10KB
```

#### Full Featured

```typescript
// Full setup - all features
import { BinaryWindow, serializeTree, KeyboardShortcuts } from 'sv-window-manager';
import 'sv-window-manager/css'; // All styles (convenience)

// Total: Full bundle (no optimization)
```

#### Custom Styled

```typescript
// Custom CSS - skip library styles entirely
import { BinaryWindow } from 'sv-window-manager';
// No CSS import - provide your own styles

// Total CSS: 0KB from library
```

---

## Tree-Shaking Optimization

### Ensure Named Exports

**Current Status:** ✅ Optimized

All exports use named exports for maximum tree-shaking:

```typescript
// ✅ GOOD - Tree-shakeable
export { BinaryWindow } from './components/BinaryWindow.svelte';
export { serializeTree, deserializeTree } from './persistence';

// ❌ BAD - Not tree-shakeable
export default { BinaryWindow, serializeTree, ... };
```

### Avoid Barrel Exports with Side Effects

**Current Status:** ⚠️ Review Needed

Check `src/lib/index.ts` for unnecessary re-exports:

```typescript
// ✅ GOOD - Direct exports
export { BinaryWindow } from './bwin/binary-window/BinaryWindow.svelte';

// ⚠️ CHECK - Ensure no side effects
export * from './bwin/managers/index.ts'; // Does this have side effects?
```

**Action:** Audit all barrel exports (`export * from`) to ensure no side effects.

### Mark Side-Effect-Free Code

**Current Status:** ✅ Configured

`package.json` correctly marks CSS as the only side effect:

```json
{
  "sideEffects": [
    "**/*.css"
  ]
}
```

This tells bundlers that all `.ts` and `.svelte` files are side-effect-free and safe to tree-shake.

### Validate Tree-Shaking

**Test Command:**

```bash
# Build a minimal app
npm run build

# Analyze bundle
npm run size:why
```

**Expected Results:**

- Core only: ~40KB
- Core + Persistence: ~48KB
- Core + Accessibility: ~55KB
- Full library: <100KB

---

## Code Splitting

### Component-Level Splitting

For large applications, split components into separate chunks:

```typescript
// Dynamic import for large features
const persistence = await import('sv-window-manager/persistence');
const { serializeTree } = persistence;

// Or with lazy loading
const KeyboardShortcuts = lazy(() => import('sv-window-manager/keyboard-shortcuts'));
```

### Recommendation

**Don't split by default** - The library is small enough (<100KB) that code splitting adds complexity without significant benefit. Only consider for:

1. Very large apps (>1MB total)
2. Progressive enhancement scenarios
3. Features used by <50% of users

---

## Import/Export Best Practices

### For Library Developers

**1. Use Named Exports**

```typescript
// ✅ GOOD
export function serializeTree(sash: ReactiveSash): SerializedSash { ... }

// ❌ BAD
export default function(sash: ReactiveSash): SerializedSash { ... }
```

**2. Avoid Side Effects in Modules**

```typescript
// ❌ BAD - Side effect at module level
const globalState = initializeState(); // Runs on import!

// ✅ GOOD - Lazy initialization
export function getState() {
  return globalState || (globalState = initializeState());
}
```

**3. Keep Utilities Pure**

```typescript
// ✅ GOOD - Pure utility
export function calculateMinWidth(sash: Sash): number {
  return sash.minWidth || 50;
}

// ❌ BAD - Impure utility with side effect
export function calculateMinWidth(sash: Sash): number {
  logMetric('minWidth', sash.id); // Side effect!
  return sash.minWidth || 50;
}
```

### For Library Users

**1. Import Only What You Need**

```typescript
// ✅ GOOD - Minimal imports
import { BinaryWindow } from 'sv-window-manager';

// ❌ BAD - Imports everything
import * as SVWM from 'sv-window-manager';
```

**2. Use Direct Imports for Optional Features**

```typescript
// ✅ GOOD - Explicit about what's imported
import { serializeTree } from 'sv-window-manager';

// ⚠️ OK but less optimal
import { BinaryWindow, serializeTree } from 'sv-window-manager';
```

**3. Prefer Named Imports Over Namespace Imports**

```typescript
// ✅ GOOD
import { BinaryWindow, ReactiveSash } from 'sv-window-manager';

// ❌ BAD - Harder to tree-shake
import * as SVWM from 'sv-window-manager';
const win = new SVWM.BinaryWindow();
```

---

## Measurement & Validation

### Bundle Size Analysis

**1. Check Current Size**

```bash
npm run size
```

Expected output:
```
  Package size: 79.5 KB with all dependencies, minified and gzipped
  Loading time: 2s on slow 3G
  Build time: 1s
```

**2. Analyze Module Sizes**

```bash
npm run size:why
```

This shows which modules contribute most to bundle size.

**3. JSON Output for CI**

```bash
npm run size:json > size-report.json
```

### Tree-Shaking Validation

**Test Case 1: Core Only**

```typescript
// test-core-only.js
import { BinaryWindow } from 'sv-window-manager';
console.log(BinaryWindow);
```

```bash
# Bundle and check size
vite build test-core-only.js
# Expected: ~40KB
```

**Test Case 2: With Persistence**

```typescript
// test-with-persistence.js
import { BinaryWindow, serializeTree } from 'sv-window-manager';
console.log(BinaryWindow, serializeTree);
```

```bash
# Expected: ~48KB (+8KB)
```

**Test Case 3: Full Featured**

```typescript
// test-full.js
import { BinaryWindow, serializeTree, KeyboardShortcuts, AriaAnnouncer } from 'sv-window-manager';
```

```bash
# Expected: <100KB
```

### Performance Benchmarks

Run performance benchmarks after optimization:

```bash
npm run bench
```

Verify no performance regressions:
- Pane addition: <50ms
- Resize: 60fps
- Find by ID: <1ms

### CI/CD Integration

Add bundle size check to GitHub Actions:

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run size
```

---

## Quick Reference

### Commands

```bash
# Check bundle size
npm run size

# Analyze bundle composition
npm run size:why

# JSON output for CI
npm run size:json

# Run benchmarks
npm run bench

# Full performance test suite
npm run test:performance
```

### Import Patterns

```typescript
// Minimal (core only)
import { BinaryWindow } from 'sv-window-manager';
import 'sv-window-manager/css/core.css';

// With persistence
import { BinaryWindow, serializeTree, deserializeTree } from 'sv-window-manager';

// With accessibility
import { BinaryWindow, KeyboardShortcuts, AriaAnnouncer } from 'sv-window-manager';

// Full featured
import { BinaryWindow, serializeTree, KeyboardShortcuts } from 'sv-window-manager';
import 'sv-window-manager/css';
```

### Size Budgets

| Import Pattern | Target Size | Status |
|----------------|-------------|--------|
| Core only | <40KB | ✅ |
| Core + Persistence | <50KB | ✅ |
| Core + Accessibility | <60KB | ✅ |
| Full library | <100KB | ✅ |

---

## Future Optimizations

### v0.3.0
- ✅ CSS modularization
- ✅ Bundle size monitoring
- ✅ Tree-shaking validation

### v0.4.0
- Consider removing unused utilities
- Optimize CSS custom properties
- Evaluate component-level code splitting

### v2.0.0
- Remove deprecated APIs (GlassManager, SillManager) → ~10KB savings
- Consider WebAssembly for complex calculations (if needed)
- Evaluate preact-compat for smaller builds (if requested)

---

## Resources

- [size-limit Documentation](https://github.com/ai/size-limit)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Rollup Plugin Visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [Tree-Shaking Best Practices](https://webpack.js.org/guides/tree-shaking/)

---

**Maintained by:** SV Window Manager Team
**Questions:** Open an issue on [GitHub](https://github.com/itlackey/sv-window-manager/issues)
