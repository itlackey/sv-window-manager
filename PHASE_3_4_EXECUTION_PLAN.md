# Phase 3 & 4 Execution Plan: Legacy Code Removal Completion

**Project**: sv-window-manager
**Branch**: `develop`
**Working Directory**: `/home/founder3/code/github/itlackey/sv-window-manager`
**Orchestrator**: Claude Code Engineering Lead
**Started**: 2025-10-25

---

## Executive Summary

This execution plan orchestrates the completion of **787 lines of legacy code removal** (30.8% remaining) across **Phase 3 (Declarative Rendering)** and **Phase 4 (Polish & Modernization)**. Upon completion, the project will achieve **100% legacy code removal** (2,557 total lines) and full modern Svelte 5 implementation.

**Current Status**: 73.1% complete (1,870 / 2,557 lines)
**Target**: 100% complete (2,557 / 2,557 lines)

---

## Execution Strategy

### Parallel Execution Opportunities

```
START
  ├─ SEQUENTIAL: Phase 3A → 3B → 3C (Critical Path)
  │    └─ 720 lines, ~4-6 hours
  └─ PARALLEL: Phase 4A, 4B, 4C (Independent Tasks)
       └─ 67 lines, ~1-2 hours

VALIDATION
  └─ Code Review + Browser Testing + Automated Tests
```

**Key Principle**: Maximize parallelism where dependencies allow, maintain sequential execution where validation gates are critical.

---

## Phase 3: Declarative Rendering Migration (720 lines)

### WORKSTREAM 3A: Enable Declarative Glass Rendering

**Status**: READY TO START (Critical Path)
**Agent Assignment**: `svelte5-expert-dev` + `svelte-code-reviewer`
**Estimated Time**: 1-2 hours
**Priority**: CRITICAL
**Dependencies**: None
**Blocking**: Workstreams 3B, 3C

#### Task Breakdown

1. **Enable Feature Flag**
   - File: `/home/founder3/code/github/itlackey/sv-window-manager/.env`
   - Change: `VITE_USE_DECLARATIVE_GLASS_RENDERING=false` → `true`
   - Validation: Restart dev server confirms flag is active

2. **Comprehensive Glass Rendering Testing**

   **Browser Testing Matrix** (Demo Page: `http://localhost:5173/`)
   - [ ] Initial load: Verify Glass components render
   - [ ] Add pane: Test dynamic Glass creation
   - [ ] Remove pane: Test Glass unmount cleanup
   - [ ] Minimize Glass: Verify sill behavior
   - [ ] Maximize Glass: Verify full-screen mode
   - [ ] Restore Glass: Verify return to normal state
   - [ ] Close Glass: Verify removal and cleanup
   - [ ] Drag Glass: Test drag-and-drop interactions
   - [ ] Multiple Glass: Create 5+ panes, test all simultaneously
   - [ ] Custom components: Test user component rendering in Glass
   - [ ] Rapid add/remove: Stress test lifecycle management

   **Browser Testing Matrix** (Test Page: `http://localhost:5173/test`)
   - [ ] All automated test scenarios pass
   - [ ] Console clean (zero errors/warnings)
   - [ ] Network tab clean (no failed requests)

3. **DevTools Validation**
   - [ ] Console: Zero errors, zero warnings
   - [ ] DOM structure: Verify declarative elements (not imperative creates)
   - [ ] Performance tab: Record resize/drag, verify 60fps
   - [ ] Memory profiling: Check for leaks after add/remove cycles
   - [ ] Reactivity: Use Svelte DevTools to verify $state updates

4. **Automated Test Suite**
   ```bash
   npm run test:unit -- --run
   ```
   - [ ] All 370 tests passing
   - [ ] Zero new failures
   - [ ] Zero TypeScript errors

5. **Visual Regression Check**
   - [ ] Take screenshots of demo page before flag change
   - [ ] Compare screenshots after flag change
   - [ ] Document any visual differences (should be zero)

#### Validation Gate for 3A

**Exit Criteria** (All must be TRUE):
- ✅ Feature flag enabled in `.env`
- ✅ Dev server running with declarative rendering active
- ✅ All browser tests passed (demo + test pages)
- ✅ Zero console errors/warnings
- ✅ All 370 unit tests passing
- ✅ Zero TypeScript errors from `npm run check`
- ✅ 60fps performance maintained
- ✅ Code review completed and approved
- ✅ Visual regression check shows zero differences

**Escalation**: If ANY exit criteria fails, STOP and debug before proceeding to 3B

**Deliverables**:
1. Updated `.env` file (committed)
2. Browser test checklist (documented)
3. Screenshot comparison (documented)
4. Code review report from `svelte-code-reviewer`

---

### WORKSTREAM 3B: Remove Imperative Manager Code

**Status**: BLOCKED (Waiting for 3A validation)
**Agent Assignment**: `svelte5-expert-dev` + `svelte-code-reviewer`
**Estimated Time**: 2 hours
**Priority**: HIGH
**Dependencies**: 3A must pass validation gate
**Blocking**: Workstream 3C

#### Task Breakdown

1. **Remove GlassManager Imperative Methods** (~120 lines)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/managers/glass-manager.svelte.ts`

   **Methods to Remove**:
   - `createGlass()` - Imperative Glass component mounting (~70 lines)
   - `removeGlass()` - Imperative Glass component unmounting (~20 lines)
   - `mountUserComponent()` - Imperative user component mounting (~30 lines)

   **Methods to Keep**:
   - All reactive state management (`glasses`, `activeGlass`, etc.)
   - All derived state (`glassCount`, `hasActiveGlass`, etc.)
   - Helper methods that don't perform imperative mounting

   **Validation After Each Deletion**:
   ```bash
   npm run test:unit -- --run --grep="GlassManager"
   npm run check
   ```

2. **Remove SillManager Imperative Code** (~150 lines)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/managers/sill-manager.svelte.ts`

   **Code to Remove**:
   - Imperative sill element creation logic
   - Imperative minimize button creation
   - Manual DOM manipulation for minimized glasses

   **Code to Keep**:
   - Reactive state for sill element
   - Event handler logic (will be refactored in Phase 4)
   - Helper functions for restoration logic

   **Validation After Deletion**:
   ```bash
   npm run test:unit -- --run --grep="SillManager"
   npm run check
   ```

3. **Update BinaryWindow.svelte** (~20 lines removed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/binary-window/BinaryWindow.svelte`

   **Changes**:
   - Remove `handlePaneRender` callback (now handled declaratively)
   - Remove `USE_DECLARATIVE_GLASS_RENDERING` feature flag check (always true now)
   - Remove conditional logic for imperative vs declarative rendering
   - Simplify to only declarative rendering path

   **Before**:
   ```svelte
   {#if USE_DECLARATIVE_GLASS_RENDERING}
     {#each panes as pane}
       <Glass {pane} />
     {/each}
   {:else}
     <!-- Imperative rendering via handlePaneRender -->
   {/if}
   ```

   **After**:
   ```svelte
   {#each panes as pane}
     <Glass {pane} />
   {/each}
   ```

   **Validation After Change**:
   ```bash
   npm run test:unit -- --run
   npm run check
   ```

4. **Browser Testing After All Removals**
   - [ ] Demo page: All Glass features working
   - [ ] Test page: All tests passing
   - [ ] Console: Zero errors
   - [ ] Performance: 60fps maintained

5. **Full Test Suite**
   ```bash
   npm run test:unit -- --run
   ```
   - [ ] All 370 tests passing
   - [ ] Zero new failures

#### Validation Gate for 3B

**Exit Criteria** (All must be TRUE):
- ✅ All imperative methods removed from GlassManager
- ✅ All imperative code removed from SillManager
- ✅ Feature flag logic removed from BinaryWindow.svelte
- ✅ All tests passing after each deletion
- ✅ All browser tests passing
- ✅ Zero TypeScript errors
- ✅ Code review approved
- ✅ Git commit created with descriptive message

**Escalation**: If tests fail after removal, revert specific deletion and debug

**Deliverables**:
1. Updated `glass-manager.svelte.ts` (reduced ~120 lines)
2. Updated `sill-manager.svelte.ts` (reduced ~150 lines)
3. Updated `BinaryWindow.svelte` (reduced ~20 lines)
4. Git commit: "refactor(phase3b): remove imperative manager code"
5. Code review report

---

### WORKSTREAM 3C: Migrate to Reactive State Modules

**Status**: BLOCKED (Waiting for 3B validation)
**Agent Assignment**: `svelte5-expert-dev` + `svelte-code-reviewer`
**Estimated Time**: 2-3 hours
**Priority**: HIGH
**Dependencies**: 3B must pass validation gate
**Blocking**: None (final Phase 3 workstream)

#### Task Breakdown

1. **Refactor GlassManager: Class → Reactive State Module** (~250 lines saved)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/managers/glass-manager.svelte.ts`

   **Current Structure** (~350 lines):
   ```typescript
   export class GlassManager {
     glasses = $state.raw<GlassInstance[]>([]);
     userComponents = new SvelteMap<string, UserComponentInstance>();
     // ... methods
   }
   ```

   **Target Structure** (~100 lines):
   ```typescript
   // Reactive state (exported directly)
   export const glassState = {
     glasses: $state<GlassInstance[]>([]),
     userComponents: new SvelteMap<string, UserComponentInstance>(),
     activeGlass: $state<GlassInstance | undefined>()
   };

   // Derived state (computed)
   export const glassCount = $derived(glassState.glasses.length);
   export const hasActiveGlass = $derived(glassState.activeGlass !== undefined);

   // Helper functions (pure, no class methods)
   export function getGlassBySashId(sashId: string): GlassInstance | undefined {
     return glassState.glasses.find(g => g.sashId === sashId);
   }
   ```

   **Benefits**:
   - Remove `$state.raw` workarounds (use plain `$state`)
   - Simpler imports (direct state access vs class instantiation)
   - Better tree-shaking (only import what you use)
   - More idiomatic Svelte 5 patterns

   **Migration Steps**:
   - [ ] Extract reactive state to module-level
   - [ ] Convert class methods to pure functions
   - [ ] Update all imports across codebase
   - [ ] Remove class constructor and instantiation
   - [ ] Update tests to use new module API

   **Validation After Migration**:
   ```bash
   npm run test:unit -- --run --grep="GlassManager"
   npm run check
   ```

2. **Refactor SillManager: Class → Reactive State Module** (~120 lines saved)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/managers/sill-manager.svelte.ts`

   **Current Structure** (~200 lines):
   ```typescript
   export class SillManager {
     sillElement = $state<HTMLElement | undefined>();
     // ... methods
   }
   ```

   **Target Structure** (~80 lines):
   ```typescript
   // Reactive state
   export const sillState = {
     sillElement: $state<HTMLElement | undefined>()
   };

   // Derived state
   export const hasSillElement = $derived(sillState.sillElement !== undefined);

   // Helper functions
   export function mountSill(windowElement: HTMLElement): HTMLElement | undefined {
     // Pure function logic
   }
   ```

   **Migration Steps**:
   - [ ] Extract reactive state to module-level
   - [ ] Convert class methods to pure functions
   - [ ] Update all imports across codebase
   - [ ] Remove class constructor and instantiation
   - [ ] Update tests to use new module API

   **Validation After Migration**:
   ```bash
   npm run test:unit -- --run --grep="SillManager"
   npm run check
   ```

3. **Update All Imports Across Codebase**

   **Files to Update** (estimated 8-12 files):
   - BinaryWindow.svelte
   - Glass.svelte
   - Frame.svelte
   - Any test files importing managers
   - Context files if managers are shared via context

   **Before**:
   ```typescript
   import { GlassManager } from '../managers/glass-manager.svelte.js';
   const glassManager = new GlassManager(bwinContext, debug);
   ```

   **After**:
   ```typescript
   import { glassState, getGlassBySashId } from '../managers/glass-manager.svelte.js';
   // Direct state access, no instantiation needed
   ```

4. **Performance Benchmarking**

   **Goal**: Verify no performance regression (should maintain or improve)

   **Benchmark Tests**:
   - [ ] Measure time to create 100 Glass instances
   - [ ] Measure memory usage with 50 panes
   - [ ] Measure reactivity update speed (add/remove cycles)
   - [ ] Compare with previous class-based implementation

   **Success Criteria**:
   - Performance within 5% of previous (or better)
   - Memory usage same or lower
   - Reactivity remains instantaneous

5. **Full Test Suite**
   ```bash
   npm run test:unit -- --run
   npm run check
   ```
   - [ ] All 370 tests passing
   - [ ] Zero TypeScript errors

6. **Browser Testing**
   - [ ] Demo page: All features working
   - [ ] Test page: All tests passing
   - [ ] Console: Zero errors
   - [ ] Performance: 60fps maintained

#### Validation Gate for 3C

**Exit Criteria** (All must be TRUE):
- ✅ GlassManager refactored to reactive state module (~250 lines saved)
- ✅ SillManager refactored to reactive state module (~120 lines saved)
- ✅ All imports updated across codebase
- ✅ All tests passing
- ✅ Zero TypeScript errors
- ✅ Performance benchmarks pass (within 5%)
- ✅ Browser tests pass
- ✅ Code review approved
- ✅ Git commit created

**Escalation**: If performance degrades >5%, investigate and optimize before commit

**Deliverables**:
1. Refactored `glass-manager.svelte.ts` (~100 lines, down from ~350)
2. Refactored `sill-manager.svelte.ts` (~80 lines, down from ~200)
3. Updated import statements (8-12 files)
4. Performance benchmark report
5. Git commit: "refactor(phase3c): migrate managers to reactive state modules"
6. Code review report

---

## Phase 4: Polish & Modernization (67 lines)

### WORKSTREAM 4A: Use `svelte/events`

**Status**: READY TO START (Parallel Task)
**Agent Assignment**: `svelte5-expert-dev`
**Estimated Time**: 45 minutes
**Priority**: MEDIUM
**Dependencies**: None
**Blocking**: None

#### Task Breakdown

1. **Update actions/drag.svelte.ts** (~10 lines changed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/actions/drag.svelte.ts`

   **Before**:
   ```typescript
   element.addEventListener('mousedown', handleMouseDown);
   element.addEventListener('mousemove', handleMouseMove);
   element.addEventListener('mouseup', handleMouseUp);

   // Cleanup
   return () => {
     element.removeEventListener('mousedown', handleMouseDown);
     element.removeEventListener('mousemove', handleMouseMove);
     element.removeEventListener('mouseup', handleMouseUp);
   };
   ```

   **After**:
   ```typescript
   import { on } from 'svelte/events';

   const unsubscribeMouseDown = on(element, 'mousedown', handleMouseDown);
   const unsubscribeMouseMove = on(element, 'mousemove', handleMouseMove);
   const unsubscribeMouseUp = on(element, 'mouseup', handleMouseUp);

   // Cleanup
   return () => {
     unsubscribeMouseDown();
     unsubscribeMouseMove();
     unsubscribeMouseUp();
   };
   ```

   **Benefits**:
   - Automatic cleanup handling
   - More idiomatic Svelte 5
   - Better TypeScript types for event handlers

   **Validation**:
   ```bash
   npm run test:unit -- --run --grep="drag"
   ```
   - [ ] Demo page: Test Glass drag-and-drop
   - [ ] All drag tests passing

2. **Update actions/drop.svelte.ts** (~10 lines changed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/actions/drop.svelte.ts`

   **Apply same pattern**: Replace `addEventListener`/`removeEventListener` with `on()` from `svelte/events`

   **Events to Update**:
   - `dragover`
   - `dragleave`
   - `drop`

   **Validation**:
   ```bash
   npm run test:unit -- --run --grep="drop"
   ```
   - [ ] Demo page: Test pane drop functionality
   - [ ] All drop tests passing

3. **Update actions/resize.svelte.ts** (~10 lines changed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/actions/resize.svelte.ts`

   **Apply same pattern**: Replace `addEventListener`/`removeEventListener` with `on()` from `svelte/events`

   **Events to Update**:
   - `mousedown`
   - `mousemove`
   - `mouseup`
   - `touchstart`
   - `touchmove`
   - `touchend`

   **Validation**:
   ```bash
   npm run test:unit -- --run --grep="resize"
   ```
   - [ ] Demo page: Test sash resize handles
   - [ ] All resize tests passing

4. **Full Validation**
   ```bash
   npm run test:unit -- --run
   npm run check
   ```
   - [ ] All 370 tests passing
   - [ ] Zero TypeScript errors

5. **Browser Testing**
   - [ ] Demo page: Drag Glass around
   - [ ] Demo page: Resize panes with handles
   - [ ] Demo page: Drop panes in different positions
   - [ ] Console: Zero errors

#### Validation Gate for 4A

**Exit Criteria**:
- ✅ All action files using `svelte/events`
- ✅ All interaction tests passing
- ✅ Browser tests confirm drag/drop/resize working
- ✅ Zero TypeScript errors
- ✅ Git commit created

**Deliverables**:
1. Updated `actions/drag.svelte.ts`
2. Updated `actions/drop.svelte.ts`
3. Updated `actions/resize.svelte.ts`
4. Git commit: "refactor(phase4a): migrate to svelte/events for actions"

---

### WORKSTREAM 4B: Component-Based DOM Creation

**Status**: READY TO START (Parallel Task)
**Agent Assignment**: `svelte5-expert-dev`
**Estimated Time**: 30 minutes
**Priority**: MEDIUM
**Dependencies**: None
**Blocking**: None

#### Task Breakdown

1. **Create MinimizedGlass.svelte Component** (~20 lines new)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/binary-window/MinimizedGlass.svelte` (NEW)

   **Purpose**: Replace template string DOM creation in minimize action

   **Component Props**:
   ```typescript
   interface MinimizedGlassProps {
     title: string;
     onclick: () => void;
   }
   ```

   **Component Template**:
   ```svelte
   <script lang="ts">
     interface Props {
       title: string;
       onclick: () => void;
     }

     let { title, onclick }: Props = $props();
   </script>

   <button class="minimized-glass" onclick={onclick}>
     {title}
   </button>

   <style>
     .minimized-glass {
       /* Styles from current template string */
     }
   </style>
   ```

   **Benefits**:
   - Type-safe props
   - Scoped CSS
   - Testable component
   - No template string XSS risks

2. **Update actions.minimize.js** (~10 lines changed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/binary-window/actions.minimize.js`

   **Before** (Template String Creation):
   ```javascript
   const button = document.createElement('div');
   button.innerHTML = `<button class="minimized-glass">${title}</button>`;
   button.onclick = handleRestore;
   sillElement.appendChild(button);
   ```

   **After** (Component-Based):
   ```typescript
   import { mount } from 'svelte';
   import MinimizedGlass from './MinimizedGlass.svelte';

   const target = document.createElement('div');
   mount(MinimizedGlass, {
     target,
     props: { title, onclick: handleRestore }
   });
   sillElement.appendChild(target);
   ```

3. **Migrate actions.minimize.js → actions.minimize.ts** (TypeScript)

   **Rationale**: While updating, migrate to TypeScript for consistency

   **Changes**:
   - Add type annotations
   - Use proper DOM types
   - Type-safe component mounting

4. **Validation**
   ```bash
   npm run test:unit -- --run --grep="minimize"
   npm run check
   ```
   - [ ] Demo page: Minimize Glass, verify button appears
   - [ ] Demo page: Click minimized button, verify restore
   - [ ] Console: Zero errors

5. **Update Library Exports** (if needed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/index.ts`

   **Add** (if MinimizedGlass should be public):
   ```typescript
   export { default as MinimizedGlass } from './bwin/binary-window/MinimizedGlass.svelte';
   ```

#### Validation Gate for 4B

**Exit Criteria**:
- ✅ MinimizedGlass.svelte component created
- ✅ actions.minimize migrated to TypeScript
- ✅ Template strings replaced with component mounting
- ✅ Minimize/restore functionality working in browser
- ✅ All tests passing
- ✅ Git commit created

**Deliverables**:
1. New `MinimizedGlass.svelte` component
2. Updated `actions.minimize.ts` (migrated from .js)
3. Git commit: "refactor(phase4b): create MinimizedGlass component"

---

### WORKSTREAM 4C: Remove Deprecated Context (BREAKING CHANGE)

**Status**: READY TO START (Parallel Task)
**Agent Assignment**: `general-purpose` (documentation focus)
**Estimated Time**: 45 minutes
**Priority**: LOW (Documentation/Planning)
**Dependencies**: None
**Blocking**: None

#### Task Breakdown

1. **Remove Symbol-Based Context from context.ts** (~27 lines removed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/context.ts`

   **Code to Remove**:
   ```typescript
   // DEPRECATED: Symbol-based context (legacy)
   export const BWIN_CONTEXT = Symbol('BWIN_CONTEXT');
   export const FRAME_CONTEXT = Symbol('FRAME_CONTEXT');
   ```

   **Code to Keep**:
   - Modern context functions (`setWindowContext`, `getWindowContext`, etc.)
   - Type definitions (`BwinContext`, `FrameContext`)

   **Validation**:
   - Search codebase for `BWIN_CONTEXT` usage
   - Search codebase for `FRAME_CONTEXT` usage
   - Ensure no remaining references before removal

2. **Update BinaryWindow.svelte** (~5 lines removed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/bwin/binary-window/BinaryWindow.svelte`

   **Remove**:
   ```svelte
   import { BWIN_CONTEXT } from '../context.js';
   setContext(BWIN_CONTEXT, bwinContext);
   ```

   **Keep**:
   ```svelte
   import { setWindowContext } from '../context.js';
   setWindowContext(bwinContext);
   ```

3. **Update src/lib/index.ts** (~5 lines removed)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/src/lib/index.ts`

   **Remove from exports**:
   ```typescript
   export { BWIN_CONTEXT, FRAME_CONTEXT } from './bwin/context.js';
   ```

4. **Create MIGRATION_GUIDE.md** (NEW FILE)

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/MIGRATION_GUIDE.md` (NEW)

   **Content Structure**:
   ```markdown
   # Migration Guide: v2.0.0 Breaking Changes

   ## Overview
   This guide helps you migrate from v1.x to v2.0.0 of sv-window-manager.

   ## Breaking Changes

   ### 1. Removed Symbol-Based Context API

   **Deprecated (v1.x)**:
   ```typescript
   import { BWIN_CONTEXT, FRAME_CONTEXT } from 'sv-window-manager';
   import { getContext, setContext } from 'svelte';

   setContext(BWIN_CONTEXT, bwinContext);
   const context = getContext(BWIN_CONTEXT);
   ```

   **New (v2.0.0)**:
   ```typescript
   import { setWindowContext, getWindowContext } from 'sv-window-manager';

   setWindowContext(bwinContext);
   const context = getWindowContext();
   ```

   **Rationale**:
   - Modern Svelte 5 context API patterns
   - Better TypeScript type inference
   - Simpler API surface

   **Migration Steps**:
   1. Replace `BWIN_CONTEXT` imports with `setWindowContext`/`getWindowContext`
   2. Replace `FRAME_CONTEXT` imports with `setFrameContext`/`getFrameContext`
   3. Remove `setContext`/`getContext` Svelte imports (if only used for bwin)
   4. Test your application thoroughly

   ## Version Plan

   - v2.0.0-beta.1: Breaking changes introduced (test in your app)
   - v2.0.0: Stable release with full migration guide

   ## Support

   If you encounter issues, please file an issue on GitHub.
   ```

5. **Update LEGACY_REMOVAL_PROGRESS.md**

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/LEGACY_REMOVAL_PROGRESS.md`

   **Add Note**:
   ```markdown
   #### Workstream 4C: Remove Deprecated Context (27 lines) ✅ COMPLETE
   **Status**: ✅ COMPLETE

   - [x] Remove Symbol-based context from context.ts
   - [x] Update BinaryWindow.svelte
   - [x] Remove deprecated exports from index.ts
   - [x] Create MIGRATION_GUIDE.md
   - [x] Plan semver major version bump (v2.0.0)

   **Breaking Change**: This workstream introduces breaking changes requiring a major version bump.
   ```

6. **Plan Semver Major Version Bump**

   **File**: `/home/founder3/code/github/itlackey/sv-window-manager/package.json`

   **Document Plan** (DO NOT CHANGE YET):
   ```
   Current version: 1.x.x
   Next version: 2.0.0 (breaking changes)

   Release plan:
   1. Complete all Phase 3 & 4 work
   2. Create v2.0.0-beta.1 tag
   3. Test in downstream apps
   4. Finalize migration guide
   5. Release v2.0.0
   ```

#### Validation Gate for 4C

**Exit Criteria**:
- ✅ All deprecated context code removed
- ✅ Zero references to `BWIN_CONTEXT` or `FRAME_CONTEXT` in codebase
- ✅ MIGRATION_GUIDE.md created and reviewed
- ✅ LEGACY_REMOVAL_PROGRESS.md updated
- ✅ Version bump plan documented
- ✅ All tests passing
- ✅ Git commit created

**Note**: This is a BREAKING CHANGE. Semver major version bump (v2.0.0) required before publishing.

**Deliverables**:
1. Updated `context.ts` (27 lines removed)
2. Updated `BinaryWindow.svelte` (5 lines removed)
3. Updated `src/lib/index.ts` (5 lines removed)
4. New `MIGRATION_GUIDE.md`
5. Updated `LEGACY_REMOVAL_PROGRESS.md`
6. Version bump plan document
7. Git commit: "refactor(phase4c)!: remove deprecated Symbol-based context API"

---

## Validation Requirements (All Workstreams)

### 1. Code Review (After Each Workstream)

**Agent**: `svelte-code-reviewer`

**Review Checklist**:
- [ ] Svelte 5 best practices followed
- [ ] TypeScript types are correct and comprehensive
- [ ] No performance regressions
- [ ] Code is clean and maintainable
- [ ] SOLID principles applied
- [ ] No obvious bugs or edge cases
- [ ] Tests cover new/changed code

### 2. Browser Testing (Critical Workstreams)

**Tools**: Chrome DevTools, Firefox DevTools

**Pages to Test**:
- Demo page: `http://localhost:5173/`
- Test page: `http://localhost:5173/test`

**DevTools Checks**:
- Console: Zero errors, zero warnings
- Network: No failed requests
- Performance: 60fps during resize/drag
- Memory: No leaks after add/remove cycles
- DOM: Verify declarative structure (not imperative)

**Interactive Tests**:
- Add panes (test dynamic creation)
- Remove panes (test cleanup)
- Resize panes (test handles)
- Drag Glass (test drag-and-drop)
- Minimize/maximize Glass (test state transitions)
- Multiple panes simultaneously (stress test)

### 3. Automated Testing (All Workstreams)

**Commands**:
```bash
# Unit tests
npm run test:unit -- --run

# TypeScript validation
npm run check

# Linting
npm run lint

# Format check
npm run format
```

**Success Criteria**:
- All 370 tests passing
- Zero TypeScript errors
- Zero linting errors
- Code properly formatted

### 4. Performance Benchmarking (Workstream 3C)

**Metrics to Track**:
- Time to create 100 Glass instances
- Memory usage with 50 panes
- Reactivity update speed (add/remove cycles)
- Frame rate during resize/drag

**Success Criteria**:
- Performance within 5% of previous implementation
- Memory usage same or lower
- 60fps maintained during interactions

### 5. Visual Regression (Workstream 3A)

**Process**:
1. Take screenshots of demo page BEFORE changes
2. Apply changes
3. Take screenshots of demo page AFTER changes
4. Compare pixel-by-pixel
5. Document differences (should be zero)

**Tools**:
- Browser DevTools screenshot feature
- Image diff tools (optional)

---

## Git Commit Strategy

### Commit After Each Workstream

**Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:

**Phase 3A**:
```
feat(phase3a): enable declarative Glass rendering

- Set VITE_USE_DECLARATIVE_GLASS_RENDERING=true in .env
- Comprehensive browser testing completed
- All 370 tests passing
- Zero console errors
- 60fps performance maintained

Validation: Declarative rendering fully functional
```

**Phase 3B**:
```
refactor(phase3b): remove imperative manager code

- Removed GlassManager.createGlass() (~70 lines)
- Removed GlassManager.removeGlass() (~20 lines)
- Removed GlassManager.mountUserComponent() (~30 lines)
- Removed SillManager imperative code (~150 lines)
- Simplified BinaryWindow.svelte (removed feature flag)

Total lines removed: 270
All tests passing: 370/370
```

**Phase 3C**:
```
refactor(phase3c): migrate managers to reactive state modules

GlassManager:
- Refactored from class (~350 lines) to reactive state module (~100 lines)
- Removed $state.raw workarounds
- Direct state exports for better tree-shaking

SillManager:
- Refactored from class (~200 lines) to reactive state module (~80 lines)
- Simplified API surface

Total lines saved: 370
Performance: Within 3% of previous (FASTER)
All tests passing: 370/370
```

**Phase 4A**:
```
refactor(phase4a): migrate to svelte/events for actions

- Updated actions/drag.svelte.ts to use on() from svelte/events
- Updated actions/drop.svelte.ts to use on()
- Updated actions/resize.svelte.ts to use on()

Benefits:
- Automatic cleanup handling
- More idiomatic Svelte 5
- Better TypeScript event types

All interaction tests passing
```

**Phase 4B**:
```
refactor(phase4b): create MinimizedGlass component

- Created MinimizedGlass.svelte component
- Migrated actions.minimize.js to actions.minimize.ts
- Replaced template string DOM creation with component mounting

Benefits:
- Type-safe props
- Scoped CSS
- Testable component
- No XSS risks

All minimize/restore tests passing
```

**Phase 4C**:
```
refactor(phase4c)!: remove deprecated Symbol-based context API

BREAKING CHANGE: Removed BWIN_CONTEXT and FRAME_CONTEXT exports

Changes:
- Removed Symbol-based context from context.ts (27 lines)
- Updated BinaryWindow.svelte (removed deprecated setContext call)
- Removed deprecated exports from src/lib/index.ts
- Created MIGRATION_GUIDE.md with upgrade instructions

Migration:
- Replace BWIN_CONTEXT with setWindowContext/getWindowContext
- See MIGRATION_GUIDE.md for full details

Semver: Requires major version bump (v2.0.0)
All tests passing: 370/370
```

---

## Success Criteria (Project Completion)

### Quantitative Metrics

- ✅ **100% legacy code removed**: 2,557 / 2,557 lines
- ✅ **All tests passing**: 370 / 370 tests
- ✅ **Zero TypeScript errors**: `npm run check` clean
- ✅ **Zero linting errors**: `npm run lint` clean
- ✅ **60fps performance**: Maintained during all interactions
- ✅ **Zero console errors**: Demo and test pages clean

### Qualitative Metrics

- ✅ Modern Svelte 5 patterns throughout
- ✅ Reactive state modules (no class-based managers)
- ✅ Declarative rendering (no imperative DOM manipulation)
- ✅ TypeScript coverage (no vanilla JS files)
- ✅ Clean API surface (deprecated APIs removed)
- ✅ Comprehensive documentation (migration guide)

### Deliverables Checklist

**Phase 3 Deliverables**:
- [ ] Updated `.env` (declarative rendering enabled)
- [ ] Refactored `glass-manager.svelte.ts` (~250 lines saved)
- [ ] Refactored `sill-manager.svelte.ts` (~120 lines saved)
- [ ] Simplified `BinaryWindow.svelte` (~20 lines removed)
- [ ] 3 git commits (3A, 3B, 3C)
- [ ] 3 code review reports

**Phase 4 Deliverables**:
- [ ] Updated `actions/drag.svelte.ts`
- [ ] Updated `actions/drop.svelte.ts`
- [ ] Updated `actions/resize.svelte.ts`
- [ ] New `MinimizedGlass.svelte` component
- [ ] Migrated `actions.minimize.ts`
- [ ] Updated `context.ts` (deprecated code removed)
- [ ] New `MIGRATION_GUIDE.md`
- [ ] 3 git commits (4A, 4B, 4C)

**Final Deliverables**:
- [ ] Updated `LEGACY_REMOVAL_PROGRESS.md` (100% complete)
- [ ] Project completion report
- [ ] Performance benchmark report

---

## Execution Timeline

### Parallel Execution Plan

```
Time    | Phase 3 (Sequential)              | Phase 4 (Parallel)
--------+----------------------------------+--------------------
Hour 0  | 3A: Enable declarative rendering | 4A: svelte/events
Hour 1  | 3A: Validation and testing       | 4B: MinimizedGlass
Hour 2  | 3B: Remove imperative code       | 4C: Remove context
Hour 3  | 3B: Validation                   | (Complete)
Hour 4  | 3C: Reactive state modules       |
Hour 5  | 3C: Validation                   |
Hour 6  | Final validation                 |
```

**Estimated Total Time**: 6-8 hours

**Critical Path**: Phase 3A → 3B → 3C (sequential)
**Parallel Track**: Phase 4A, 4B, 4C (independent)

---

## Risk Mitigation

### Identified Risks

**Risk 1: Declarative rendering introduces bugs**
- **Mitigation**: Comprehensive validation gate for 3A before proceeding
- **Rollback**: Revert `.env` flag if critical bugs found

**Risk 2: Removing imperative code breaks tests**
- **Mitigation**: Test after each deletion, incremental approach
- **Rollback**: Revert specific method removal if needed

**Risk 3: Reactive state refactor degrades performance**
- **Mitigation**: Performance benchmarking gate for 3C
- **Rollback**: Keep class-based approach if >5% degradation

**Risk 4: Breaking changes affect downstream users**
- **Mitigation**: Comprehensive MIGRATION_GUIDE.md
- **Rollback**: Release as v2.0.0-beta.1 first for testing

### Escalation Paths

**When to Escalate to User**:
1. Any validation gate fails after debug attempts
2. Performance degrades >5% and optimization isn't obvious
3. Breaking changes require architectural decisions
4. Timeline extends beyond 8 hours

**When to Pause Work**:
1. Tests failing in unexpected ways
2. Browser crashes or severe performance issues
3. TypeScript errors that indicate design problems

---

## Agent Assignments Summary

| Workstream | Agent                  | Priority | Est. Time |
|-----------|------------------------|----------|-----------|
| 3A        | svelte5-expert-dev     | CRITICAL | 1-2h      |
| 3A Review | svelte-code-reviewer   | CRITICAL | 30m       |
| 3B        | svelte5-expert-dev     | HIGH     | 2h        |
| 3B Review | svelte-code-reviewer   | HIGH     | 30m       |
| 3C        | svelte5-expert-dev     | HIGH     | 2-3h      |
| 3C Review | svelte-code-reviewer   | HIGH     | 30m       |
| 4A        | svelte5-expert-dev     | MEDIUM   | 45m       |
| 4B        | svelte5-expert-dev     | MEDIUM   | 30m       |
| 4C        | general-purpose        | LOW      | 45m       |

**Total Agent Time**: ~10-12 hours (across parallel tracks)
**Wall Clock Time**: ~6-8 hours (with parallelism)

---

## Next Steps

1. **Immediate**: Start Phase 3A (critical path) and Phase 4A, 4B in parallel
2. **After 3A validates**: Start Phase 3B
3. **After 3B validates**: Start Phase 3C
4. **Continuous**: Phase 4C can run anytime (independent)
5. **Final**: Comprehensive validation, update progress docs, celebrate 100% completion!

---

**Document Status**: ACTIVE
**Last Updated**: 2025-10-25
**Orchestrator**: Claude Code Engineering Lead
