# Reactive Sash Architecture Design

**Workstream**: 3.1 - reactive-sash-class
**Date**: 2025-10-25
**Status**: Phase 1 - Analysis Complete

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Reactive Architecture Design](#reactive-architecture-design)
4. [Property Mapping Strategy](#property-mapping-strategy)
5. [Performance Considerations](#performance-considerations)
6. [Risk Assessment](#risk-assessment)
7. [Implementation Plan](#implementation-plan)
8. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Goal
Convert the 553-line vanilla JavaScript `Sash` class into a reactive Svelte 5 class using `$state`, `$derived`, and `$effect` runes while maintaining **exact behavioral compatibility** and meeting **strict performance requirements** (< 16ms layout calculations for 60fps).

### Why This Matters
The Sash class is the **core data structure** of the entire window manager:
- Represents the binary tree of split panes
- Currently uses manual getter/setter propagation (~210 lines of manual workarounds)
- **Every component depends on this class**
- Converting to reactive will enable automatic reactivity throughout the system

### Critical Success Factors
1. **Zero breaking changes** to public API
2. **Performance budget**: < 16ms for layout calculations (60fps requirement)
3. **Memory budget**: No leaks over extended runtime
4. **Feature flag support**: Both implementations available for rollback
5. **All 289 existing tests pass** without modification

---

## Current Architecture Analysis

### Class Overview

```javascript
// File: src/lib/bwin/sash.js (553 lines)
export class Sash {
  constructor({
    left, top, width, height,
    minWidth, minHeight,
    resizeStrategy,
    parent, domNode, store,
    position, id
  })
}
```

### Core Properties

#### 1. **Position & Dimensions** (Reactive with Manual Propagation)
- `_left`, `_top`, `_width`, `_height` - Private fields with public getters/setters
- Getters/setters propagate changes to children (lines 383-551)
- **Complex propagation logic** in setters (~170 lines)

#### 2. **Tree Structure** (Static References)
- `parent: Sash | null` - Parent node reference
- `children: Sash[]` - Child nodes (max 2)
- `position: string` - Position relative to parent (top/right/bottom/left/root)
- `id: string` - Unique identifier

#### 3. **Constraints** (Static Configuration)
- `minWidth: number` - Minimum width constraint
- `minHeight: number` - Minimum height constraint
- `resizeStrategy: 'classic' | 'natural'` - Resize distribution strategy

#### 4. **State Storage** (Static)
- `domNode: HTMLElement | null` - Associated DOM element
- `store: Record<string, any>` - Arbitrary property storage

### Property Propagation Chains

#### Top Setter (lines 387-402)
```javascript
set top(value) {
  const dist = value - this._top;
  this._top = value;

  // Propagate to all children
  const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

  if (topChild && bottomChild) {
    topChild.top += dist;
    bottomChild.top += dist;
  }

  if (leftChild && rightChild) {
    leftChild.top += dist;
    rightChild.top += dist;
  }
}
```

**Key Insight**: Setter triggers cascading updates through entire subtree via recursive setter calls.

#### Width Setter (lines 429-487) - MOST COMPLEX
```javascript
set width(value) {
  const dist = value - this._width;
  this._width = value;

  // 60+ lines of logic for:
  // 1. Proportional distribution to left/right children
  // 2. Natural resize strategy handling
  // 3. Minimum width constraint enforcement
  // 4. Recursive propagation
}
```

**Key Insight**:
- Classic strategy: Distributes proportionally
- Natural strategy: Grows only one child
- Min constraints: Prevents child shrinkage below limits
- All updates cascade via recursive setter calls

### Tree Traversal Methods

#### Post-Order Walk (lines 133-138)
```javascript
walk(callback) {
  this.children.forEach(child => child.walk(callback));
  callback(this); // Visit after children
}
```

**Key Insight**: Depth-first post-order traversal enables bottom-up calculations.

#### Min-Width Calculation (lines 239-257)
```javascript
calcMinWidth() {
  if (this.isLeaf()) return this.minWidth;

  const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

  if (leftChild && rightChild) {
    // Horizontal split: sum children
    return Math.max(this.minWidth, leftChild.calcMinWidth() + rightChild.calcMinWidth());
  }

  if (topChild && bottomChild) {
    // Vertical split: max of children
    return Math.max(this.minWidth, Math.max(topChild.calcMinWidth(), bottomChild.calcMinWidth()));
  }

  return this.minWidth;
}
```

**Key Insight**: Recursive calculation, safe for reactive conversion.

### Performance Characteristics

**Current Benchmarks** (from performance.bench.ts):
- Resize 10-pane window: **Must maintain 60fps** (< 16.67ms)
- Add pane to 10-pane window: < 50ms
- Initial render 10 panes: < 500ms
- Tree walk 20-pane tree: ~200 iterations in 3s

**Performance Hotspots**:
1. Width/height setters (called during resize operations - frequent)
2. calcMinWidth/calcMinHeight (called during constraint checks)
3. Tree walks (called during render and layout updates)

---

## Reactive Architecture Design

### Conversion Strategy

#### Core Principle
**Replace manual propagation with automatic reactivity** while maintaining exact same behavior and performance.

### Property Classification

#### 1. Reactive State (`$state`)
Properties that trigger updates when changed:

```typescript
class ReactiveSash {
  // Dimensions - CRITICAL for layout reactivity
  private _left = $state<number>(0);
  private _top = $state<number>(0);
  private _width = $state<number>(150);
  private _height = $state<number>(150);

  // Tree structure - triggers when children added/removed
  children = $state<ReactiveSash[]>([]);

  // DOM reference - triggers when pane rendered
  domNode = $state<HTMLElement | null>(null);

  // Active glass - could trigger UI updates
  store = $state<Record<string, any>>({});
}
```

#### 2. Static Properties (Non-Reactive)
Properties that don't need reactivity:

```typescript
class ReactiveSash {
  // Immutable after construction
  readonly id: string;
  readonly position: string;
  readonly parent: ReactiveSash | null;

  // Configuration (rarely changes)
  minWidth: number;
  minHeight: number;
  resizeStrategy: 'classic' | 'natural';
}
```

#### 3. Derived State (`$derived`)
Computed properties that auto-update:

```typescript
class ReactiveSash {
  // Getters become derived
  get left() { return this._left; }
  get top() { return this._top; }
  get width() { return this._width; }
  get height() { return this._height; }

  // Child accessors as derived
  leftChild = $derived(this.children.find(c => c.position === Position.Left));
  rightChild = $derived(this.children.find(c => c.position === Position.Right));
  topChild = $derived(this.children.find(c => c.position === Position.Top));
  bottomChild = $derived(this.children.find(c => c.position === Position.Bottom));

  // Tree queries as derived
  isLeaf = $derived(this.children.length === 0);
  isSplit = $derived(this.children.length > 0);

  // Min dimensions - could be derived but may be too expensive
  // calcMinWidth() - keep as method for performance
  // calcMinHeight() - keep as method for performance
}
```

#### 4. Effects (`$effect`)
Side effects that run when dependencies change:

```typescript
class ReactiveSash {
  constructor() {
    // Effect to propagate dimension changes to children
    $effect(() => {
      const leftVal = this._left;
      const topVal = this._top;
      const widthVal = this._width;
      const heightVal = this._height;

      // When any dimension changes, update children
      this.propagateDimensionsToChildren();
    });
  }
}
```

**CRITICAL DECISION**: Should we use effects or keep setter-based propagation?

### Propagation Strategy: Two Approaches

#### Approach A: Effect-Based Propagation (NEW)
```typescript
class ReactiveSash {
  private _width = $state<number>(150);

  constructor() {
    $effect(() => {
      const w = this._width;

      // Run propagation logic whenever width changes
      if (this.leftChild && this.rightChild) {
        this.distributeWidthToChildren(w);
      }
      if (this.topChild && this.bottomChild) {
        this.topChild._width = w;
        this.bottomChild._width = w;
      }
    });
  }
}
```

**Pros**:
- Pure reactive approach
- Automatic dependency tracking
- Clearer separation of concerns

**Cons**:
- Effect runs AFTER state update (potential timing issues)
- More complex debugging (effects are implicit)
- Performance impact of effect scheduling?

#### Approach B: Setter-Based Propagation (HYBRID)
```typescript
class ReactiveSash {
  private _width = $state<number>(150);

  set width(value: number) {
    const dist = value - this._width;
    this._width = value; // Triggers reactivity

    // Immediate propagation (same as current)
    if (this.leftChild && this.rightChild) {
      this.distributeWidthToChildren(value);
    }
    if (this.topChild && this.bottomChild) {
      this.topChild.width = value;
      this.bottomChild.width = value;
    }
  }

  get width() {
    return this._width;
  }
}
```

**Pros**:
- Maintains exact current behavior
- Synchronous updates (no timing issues)
- Easier migration path
- Better performance (no effect scheduling overhead)

**Cons**:
- Still "manual" propagation logic
- Doesn't leverage full reactivity power

### **RECOMMENDED APPROACH: Hybrid (Approach B)**

**Rationale**:
1. **Preserves exact behavior** - Critical for zero breaking changes
2. **Better performance** - Synchronous updates, no effect overhead
3. **Lower risk** - Minimal architectural change
4. **Easier testing** - Same execution flow as current implementation
5. **Enables future optimization** - Can migrate to effects later if needed

The key win is that **external consumers** get automatic reactivity via `$state`, while **internal propagation** remains explicit and performant.

---

## Property Mapping Strategy

### Detailed Property Conversion

| Current Property | Type | Reactive Strategy | Rationale |
|-----------------|------|-------------------|-----------|
| `_left` | private number | `$state<number>` | Dimension updates trigger UI |
| `_top` | private number | `$state<number>` | Dimension updates trigger UI |
| `_width` | private number | `$state<number>` | Dimension updates trigger UI |
| `_height` | private number | `$state<number>` | Dimension updates trigger UI |
| `left` (getter) | number | Plain getter | Access `_left` state |
| `left` (setter) | void | Plain setter | Propagates to children |
| `top` (getter/setter) | number | Plain getter/setter | Same as left |
| `width` (getter/setter) | number | Plain getter/setter | Same as left |
| `height` (getter/setter) | number | Plain getter/setter | Same as left |
| `id` | string | `readonly` | Immutable identifier |
| `position` | string | `readonly` | Immutable after construction |
| `parent` | Sash \| null | `readonly` | Immutable reference |
| `children` | Sash[] | `$state<Sash[]>` | Array mutations trigger UI |
| `minWidth` | number | Plain property | Configuration, rarely changes |
| `minHeight` | number | Plain property | Configuration, rarely changes |
| `resizeStrategy` | string | Plain property | Configuration, rarely changes |
| `domNode` | HTMLElement \| null | `$state<HTMLElement \| null>` | DOM reference may update |
| `store` | Record | `$state<Record>` | Arbitrary props may update |
| `leftChild` | Sash \| undefined | `$derived` | Computed from children |
| `rightChild` | Sash \| undefined | `$derived` | Computed from children |
| `topChild` | Sash \| undefined | `$derived` | Computed from children |
| `bottomChild` | Sash \| undefined | `$derived` | Computed from children |
| `isLeaf()` | boolean | Method | Keep as method (cheap) |
| `isSplit()` | boolean | Method | Keep as method (cheap) |

### TypeScript Interface

```typescript
interface SashConstructorParams {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  resizeStrategy?: 'classic' | 'natural';
  parent?: ReactiveSash | null;
  domNode?: HTMLElement | null;
  store?: Record<string, any>;
  position: string; // Required
  id?: string;
}

export class ReactiveSash {
  // Public getters expose state reactively
  readonly id: string;
  readonly position: string;
  readonly parent: ReactiveSash | null;

  // Dimensions with reactive getters/setters
  get left(): number;
  set left(value: number);

  get top(): number;
  set top(value: number);

  get width(): number;
  set width(value: number);

  get height(): number;
  set height(value: number);

  // Tree structure
  children: ReactiveSash[];

  // Constraints
  minWidth: number;
  minHeight: number;
  resizeStrategy: 'classic' | 'natural';

  // State
  domNode: HTMLElement | null;
  store: Record<string, any>;

  // Derived child accessors
  get leftChild(): ReactiveSash | undefined;
  get rightChild(): ReactiveSash | undefined;
  get topChild(): ReactiveSash | undefined;
  get bottomChild(): ReactiveSash | undefined;

  // Methods (unchanged API)
  walk(callback: (sash: ReactiveSash) => void): void;
  isLeaf(): boolean;
  isSplit(): boolean;
  isLeftRightSplit(): boolean;
  isTopBottomSplit(): boolean;
  getChildren(): [ReactiveSash | null, ReactiveSash | null, ReactiveSash | null, ReactiveSash | null];
  getAllLeafDescendants(): ReactiveSash[];
  calcMinWidth(): number;
  calcMinHeight(): number;
  getById(id: string): ReactiveSash | null;
  swapIds(id1: string, id2: string): void;
  getAllIds(): string[];
  addChild(sash: ReactiveSash): void;
  getDescendantParentById(descendantId: string): ReactiveSash | null;
  getChildSiblingById(childId: string): ReactiveSash | undefined;
}
```

---

## Performance Considerations

### Performance Budget

| Operation | Current | Target | Strategy |
|-----------|---------|--------|----------|
| Layout calculation (10 panes) | < 16ms | < 16ms | No degradation |
| Resize operation | 60fps | 60fps | Maintain sync setters |
| Add pane | < 50ms | < 50ms | No change expected |
| Initial render (10 panes) | < 500ms | < 500ms | No change expected |
| Memory per Sash | ~1KB | ~1.5KB | Allow 50% overhead for proxies |
| Memory leaks | 0 | 0 | Careful cleanup |

### Reactive Performance Concerns

#### 1. **$state Proxy Overhead**
- Svelte 5 wraps `$state` objects in Proxies for change tracking
- **Impact**: ~10-20% overhead on property access
- **Mitigation**:
  - Use `$state.raw()` for performance-critical nested objects
  - Keep dimension calculations in private fields
  - Batch updates where possible

#### 2. **Effect Scheduling**
- Effects run asynchronously after state changes
- **Impact**: Potential frame delays if using effects
- **Mitigation**: Use synchronous setters (Approach B)

#### 3. **Derived Computation**
- `$derived` recalculates when dependencies change
- **Impact**: Child accessor lookups could run frequently
- **Mitigation**:
  - Keep child accessors as `$derived` (cheap array find)
  - Keep min calculations as methods (expensive recursive)

### Optimization Strategies

1. **Batch Dimension Updates**
```typescript
// Bad: Triggers 4 separate propagations
sash.left = 100;
sash.top = 50;
sash.width = 800;
sash.height = 600;

// Good: Batch update method
sash.setDimensions({ left: 100, top: 50, width: 800, height: 600 });
```

2. **Lazy Min Calculations**
```typescript
// Don't make calcMinWidth/Height derived
// They're expensive and only needed during constraint checks
```

3. **Avoid Unnecessary Reactivity**
```typescript
// Keep minWidth/minHeight as plain properties
// They rarely change and don't need reactivity
```

---

## Risk Assessment

### High-Risk Areas

#### 1. **Propagation Timing**
- **Risk**: Effect-based propagation could introduce race conditions
- **Severity**: HIGH
- **Mitigation**: Use setter-based propagation (Approach B)

#### 2. **Performance Regression**
- **Risk**: Proxy overhead degrades layout performance
- **Severity**: HIGH (blocks 60fps requirement)
- **Mitigation**:
  - Continuous benchmarking during development
  - Feature flag for rollback
  - Use `$state.raw()` if needed

#### 3. **Circular Updates**
- **Risk**: Reactive updates could cause infinite loops
- **Severity**: MEDIUM
- **Mitigation**:
  - Careful effect design
  - Setter guards against redundant updates
  - Unit tests for circular scenarios

#### 4. **Memory Leaks**
- **Risk**: Proxy references prevent garbage collection
- **Severity**: MEDIUM
- **Mitigation**:
  - Explicit cleanup in destroy/remove operations
  - Memory leak tests (already in benchmark suite)

#### 5. **Type Safety**
- **Risk**: TypeScript inference breaks with reactive properties
- **Severity**: LOW
- **Mitigation**: Explicit type annotations on all reactive properties

### Medium-Risk Areas

#### 1. **Test Compatibility**
- **Risk**: Tests might break due to proxy wrappers
- **Severity**: MEDIUM
- **Mitigation**:
  - Run test suite continuously
  - Fix tests that rely on implementation details
  - Maintain public API exactly

#### 2. **Consumer Compatibility**
- **Risk**: Components access properties in unexpected ways
- **Severity**: MEDIUM
- **Mitigation**:
  - Feature flag allows rollback
  - Comprehensive integration testing
  - Monitor all 19 consumer files

### Low-Risk Areas

- Method implementations (no changes needed)
- Tree traversal logic (unchanged)
- ID management (unchanged)

---

## Implementation Plan

### Phase 1: Analysis ✅ COMPLETE
- [x] Read and understand sash.js completely
- [x] Map property dependencies
- [x] Identify propagation chains
- [x] Document performance characteristics
- [x] Create design document

### Phase 2: Proof of Concept (Week 1)
1. Create `/src/lib/bwin/sash.svelte.ts` with minimal reactive implementation
2. Implement core properties: left, top, width, height as `$state`
3. Implement basic tree structure: children as `$state`
4. Test basic operations: construction, dimension updates, child management
5. Run performance benchmarks vs. legacy
6. **Decision Point**: Proceed if performance ≥ legacy

### Phase 3: Full Implementation (Week 2-3)
1. Convert all remaining properties
2. Add TypeScript type definitions
3. Implement all 23 methods with full type safety
4. Add comprehensive JSDoc comments
5. Create `/src/lib/bwin/sash.legacy.js` (rename current)
6. Set up feature flag system:
   - Add `VITE_USE_REACTIVE_SASH` to `.env`
   - Create conditional imports
   - Update documentation

### Phase 4: Testing (Week 3-4)
1. **Unit Tests**:
   - All 77 existing tests must pass
   - Add 20+ new reactive behavior tests
   - Test state updates trigger watchers
   - Test derived properties recalculate

2. **Integration Tests**:
   - Test with real BinaryWindow component
   - Test with all 19 consumer components
   - Test layout propagation in complex trees
   - Test resize operations

3. **Performance Benchmarks**:
   - Run full benchmark suite
   - Compare reactive vs. legacy
   - Ensure < 16ms layout calculations
   - Memory leak testing (100 add/remove cycles)

4. **Visual Regression**:
   - Screenshot tests for all layouts
   - Compare reactive vs. legacy rendering
   - Test edge cases (min constraints, etc.)

### Phase 5: Documentation (Week 4)
1. Update CLAUDE.md with reactive patterns
2. Create migration guide for consumers
3. Document rollback procedures
4. Create performance comparison report
5. Update API documentation

---

## Testing Strategy

### Unit Test Coverage

**Existing Tests (Must Pass)**:
- ✅ 7 constructor tests
- ✅ 15 tree structure tests
- ✅ 10 tree traversal tests
- ✅ 15 ID management tests
- ✅ 4 parent-child relationship tests
- ✅ 6 minimum size calculation tests
- ✅ 12 dimension propagation tests
- ✅ 8 resize strategy tests

**New Reactive Tests (To Add)**:
1. State updates trigger reactive dependencies
2. Derived properties recalculate on state change
3. Multiple watchers observe same state
4. Batch updates only trigger once
5. Circular update prevention
6. Cleanup prevents memory leaks
7. Proxy unwrapping works correctly

### Performance Benchmarks

```typescript
// Benchmark Suite (from performance.bench.ts)
describe('Reactive vs Legacy Performance', () => {
  bench('resize 10-pane window (reactive)', () => {
    // Must complete in < 16ms for 60fps
  });

  bench('resize 10-pane window (legacy)', () => {
    // Baseline comparison
  });

  bench('add pane to 10-pane window (reactive)', () => {
    // Must complete in < 50ms
  });

  bench('tree walk 20-pane tree (reactive)', () => {
    // Should match legacy performance
  });

  bench('memory leak test (reactive)', () => {
    // Must not leak > 1MB after 100 cycles
  });
});
```

### Integration Test Scenarios

1. **Complex Layout Propagation**
   - Create 20-pane tree
   - Resize root
   - Verify all descendants updated correctly

2. **Min Constraint Enforcement**
   - Create tree with varying minWidth/minHeight
   - Shrink root below constraints
   - Verify constraints respected

3. **Natural Resize Strategy**
   - Create tree with natural resize
   - Test left/right position behavior
   - Verify only one child grows

4. **Component Integration**
   - Mount BinaryWindow with reactive Sash
   - Add/remove panes dynamically
   - Resize window
   - Verify UI updates correctly

---

## Migration Path

### Feature Flag Implementation

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_USE_REACTIVE_SASH':
      process.env.VITE_USE_REACTIVE_SASH === 'true'
  }
});
```

```typescript
// src/lib/bwin/sash-loader.ts
import type { Sash as SashType } from './sash.types.js';

let SashClass: typeof SashType;

if (import.meta.env.VITE_USE_REACTIVE_SASH) {
  const module = await import('./sash.svelte.js');
  SashClass = module.ReactiveSash;
} else {
  const module = await import('./sash.legacy.js');
  SashClass = module.Sash;
}

export { SashClass as Sash };
```

```typescript
// Consumers import from loader
import { Sash } from './bwin/sash-loader.js';
```

### Rollback Plan

If critical issues discovered:

1. Set `VITE_USE_REACTIVE_SASH=false` in `.env`
2. Rebuild application
3. All code uses legacy implementation
4. No code changes needed

---

## Open Questions

### 1. Should child accessors be `$derived` or plain getters?

**Option A: Derived**
```typescript
leftChild = $derived(this.children.find(c => c.position === Position.Left));
```
- ✅ Auto-updates when children change
- ❌ Runs find() on every access (could be frequent)

**Option B: Plain Getter**
```typescript
get leftChild() {
  return this.children.find(c => c.position === Position.Left);
}
```
- ✅ Simple, predictable
- ❌ No reactivity benefit (children array is already reactive)

**RECOMMENDATION**: Use `$derived` - The find() is cheap (max 2 elements), and reactivity is valuable.

### 2. Should calcMinWidth/Height be derived or methods?

**Current**: Methods with recursive calculation

**Consideration**: Making them derived would auto-update, but:
- Expensive recursive calculation
- Only needed during constraint checks (infrequent)
- Could cause performance issues if recalculated too often

**RECOMMENDATION**: Keep as methods. Call explicitly when needed.

### 3. Should we use `$state.raw()` for children array?

**Consideration**:
- `$state()` wraps array in Proxy
- Could impact performance of frequent iteration
- `$state.raw()` avoids proxy but loses fine-grained reactivity

**RECOMMENDATION**: Start with `$state()`, profile, use `$state.raw()` only if performance issue found.

---

## Success Criteria

### Must-Have (Blocking Release)
- [ ] All 289 existing tests pass
- [ ] Performance meets benchmarks (< 16ms layout calc)
- [ ] Zero breaking changes to public API
- [ ] Feature flag system works
- [ ] Memory leak tests pass

### Should-Have (High Priority)
- [ ] 20+ new reactive-specific tests
- [ ] Full TypeScript coverage
- [ ] Migration guide documented
- [ ] Performance comparison report

### Nice-to-Have (Future Work)
- [ ] Effect-based propagation option
- [ ] Advanced reactive optimizations
- [ ] Reactive debugging tools

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Analysis | ✅ Complete | This document |
| Phase 2: POC | 3-4 days | Minimal reactive Sash, benchmarks |
| Phase 3: Full Implementation | 7-10 days | Complete reactive Sash, feature flag |
| Phase 4: Testing | 7-10 days | All tests pass, benchmarks meet targets |
| Phase 5: Documentation | 2-3 days | Migration guide, reports |
| **TOTAL** | **3-4 weeks** | Production-ready reactive Sash |

---

## Next Steps

**Immediate Action**: Proceed to Phase 2 (Proof of Concept)

1. Create `/src/lib/bwin/sash.svelte.ts`
2. Implement minimal reactive class with core properties
3. Write basic tests
4. Run performance benchmarks
5. **Decision point**: If POC meets performance targets, proceed to full implementation

**Risk Mitigation**: POC validates approach before full investment.

---

## Appendix: Code Examples

### Current Sash (Legacy)

```javascript
// src/lib/bwin/sash.js
export class Sash {
  constructor({ left = 0, top = 0, width = 150, height = 150, ... }) {
    this._left = left;
    this._top = top;
    this._width = width;
    this._height = height;
    this.children = [];
  }

  get width() {
    return this._width;
  }

  set width(value) {
    const dist = value - this._width;
    this._width = value;

    // Manual propagation to children...
    const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

    if (leftChild && rightChild) {
      // 40+ lines of distribution logic
    }

    if (topChild && bottomChild) {
      topChild.width += dist;
      bottomChild.width += dist;
    }
  }
}
```

### Reactive Sash (Proposed)

```typescript
// src/lib/bwin/sash.svelte.ts
import { genId } from './utils.js';
import { Position } from './position.js';
import { BwinErrors } from './errors.js';

export class ReactiveSash {
  // Reactive state
  private _left = $state<number>(0);
  private _top = $state<number>(0);
  private _width = $state<number>(150);
  private _height = $state<number>(150);

  children = $state<ReactiveSash[]>([]);
  domNode = $state<HTMLElement | null>(null);
  store = $state<Record<string, any>>({});

  // Immutable properties
  readonly id: string;
  readonly position: string;
  readonly parent: ReactiveSash | null;

  // Configuration
  minWidth: number;
  minHeight: number;
  resizeStrategy: 'classic' | 'natural';

  // Derived accessors
  get leftChild() {
    return this.children.find(c => c.position === Position.Left);
  }

  constructor(params: SashConstructorParams) {
    this.id = params.id ?? genId();
    if (!params.position) {
      throw BwinErrors.sashPositionRequired();
    }
    this.position = params.position;
    this.parent = params.parent ?? null;

    // Initialize reactive state
    this._left = params.left ?? 0;
    this._top = params.top ?? 0;
    this._width = params.width ?? 150;
    this._height = params.height ?? 150;

    this.minWidth = params.minWidth ?? 100;
    this.minHeight = params.minHeight ?? 100;
    this.resizeStrategy = params.resizeStrategy ?? 'classic';

    this.domNode = params.domNode ?? null;
    this.store = params.store ?? {};
  }

  // Reactive getters/setters
  get width(): number {
    return this._width;
  }

  set width(value: number) {
    const dist = value - this._width;
    this._width = value; // Triggers reactivity!

    // Synchronous propagation (same as legacy)
    const [topChild, rightChild, bottomChild, leftChild] = this.getChildren();

    if (leftChild && rightChild) {
      // Same 40+ line distribution logic
      // But now updates trigger reactive dependencies!
    }

    if (topChild && bottomChild) {
      topChild.width += dist;
      bottomChild.width += dist;
    }
  }

  // All other methods unchanged...
}
```

---

**Status**: Ready to proceed to Phase 2 (Proof of Concept)
