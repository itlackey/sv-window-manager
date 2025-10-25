# PARALLEL IMPLEMENTATION PLAN: sv-window-manager Refactoring

> **📍 Table of Contents Location**: Lines 202-219 (Main TOC), Lines 221-242 (Quick Reference)
>
> **For Orchestrator**: Use line number ranges to provide targeted context to agents (see Lines 10-88).
> **For Agents**: Use `grep` or `Read` tool with line ranges to load only relevant sections (see Lines 92-171).

---

## 🤖 Instructions for Orchestrator Agent

When launching specialized agents (svelte5-expert-dev, svelte-code-reviewer), provide them with **targeted context** using line number ranges to minimize token usage and maximize efficiency.

### Context Provision Strategy

**For Implementation Agents (svelte5-expert-dev)**:
```bash
# Provide only relevant sections using line ranges:
1. Workstream definition (lines vary by workstream - see TOC)
2. Review loop process (lines 634-751)
3. Launch commands for their workstream (lines 1286-1469)
4. Testing requirements (lines 853-936)
```

**For Review Agents (svelte-code-reviewer)**:
```bash
# Provide review-specific context:
1. Review loop process (lines 634-751)
2. Review checklist (lines 707-750)
3. Success metrics (lines 1197-1282)
4. Communication templates (lines 1595-1711)
```

### How to Provide Context

**Method 1: Direct Line Range Reading**
```typescript
// Read specific section for agent
Read tool: {
  file_path: "/path/to/PARALLEL_IMPLEMENTATION_PLAN.md",
  offset: 79,    // Start line
  limit: 170     // Number of lines to read
}
```

**Method 2: Grep for Section**
```bash
# Find workstream section by ID
Grep tool: {
  pattern: "#### Workstream 1.1: svelte-reactivity-utilities",
  file: "PARALLEL_IMPLEMENTATION_PLAN.md"
}
# Then read surrounding lines with Read tool
```

**Method 3: Provide Summary in Prompt**
```
When launching agent, include in prompt:
"Your workstream is defined in lines 79-111 of PARALLEL_IMPLEMENTATION_PLAN.md.
Read those lines for full context. Key points:
- Files: glass-manager.svelte.ts, sill-manager.svelte.ts
- Task: Replace $state.raw Maps with SvelteMap/SvelteSet
- Acceptance criteria: [list key items]"
```

### Efficient Agent Communication Pattern

```
STEP 1: Identify workstream
  → Extract workstream ID from request

STEP 2: Locate relevant sections
  → Use line ranges from TOC below
  → Workstream definition
  → Dependencies
  → Testing requirements
  → Review checklist

STEP 3: Provide minimal context
  → Only include necessary sections
  → Avoid loading entire document
  → Reference line numbers for agent to read

STEP 4: Monitor progress
  → Agents report back with status
  → Provide additional context on demand
  → Route to code reviewer when ready
```

---

## 📖 Instructions for Specialized Agents

**If you are a svelte5-expert-dev or svelte-code-reviewer agent**, use these instructions to efficiently load context.

### How to Use This Document

**STEP 1: Identify Your Workstream**
```bash
# Your orchestrator will tell you which workstream to work on, e.g., "1.1" or "2.3"
# Use the Quick Reference section (Lines 139-160) to find your workstream's line range
```

**STEP 2: Load Your Workstream Definition**
```typescript
// Use Read tool with line range for your specific workstream
Read({
  file_path: "/path/to/PARALLEL_IMPLEMENTATION_PLAN.md",
  offset: 167,  // Start line from Quick Reference
  limit: 33     // Number of lines (e.g., 199-167+1)
})
```

**STEP 3: Load Supporting Context**
```bash
# You'll need these sections (use line numbers from TOC):

For Implementation:
- Review Loop Process: Read lines 697-814
- Testing Strategy: Read lines 916-999
- Launch Commands: Read lines 1349-1532

For Code Review:
- Review Checklist: Read lines 707-750
- Success Metrics: Read lines 1260-1345
- Communication Templates: Read lines 1595-1774
```

**STEP 4: Search for Specific Information**
```bash
# Use Grep to find specific topics:

# Find file ownership info
Grep({ pattern: "glass-manager.svelte.ts", file: "...PLAN.md" })

# Find risk mitigation
Grep({ pattern: "Risk Matrix", file: "...PLAN.md" })

# Find your launch command
Grep({ pattern: "Agent 1.1:", file: "...PLAN.md" })
```

### What You DON'T Need to Read

To save tokens, you can skip these sections unless specifically needed:
- ❌ Other workstream definitions (only read yours)
- ❌ Execution Timeline (unless coordinating with other agents)
- ❌ Dependency Graph (unless checking dependencies)
- ❌ Appendices (reference only when needed)

### Example: Agent 1.1 (reactivity-utilities)

```bash
# 1. Read your workstream definition
Read(file, offset: 167, limit: 33)  # Lines 167-199

# 2. Read review process
Read(file, offset: 697, limit: 118) # Lines 697-814

# 3. Search for your files
Grep(pattern: "glass-manager.svelte.ts")

# 4. Start implementation
# ... your work ...

# 5. When done, read communication templates
Read(file, offset: 1595, limit: 180) # Lines 1595-1774
```

**Pro Tip**: Use `Grep` with `-n` flag to get line numbers, then use `Read` with offset/limit to load exact sections.

---

## Executive Summary

This document provides a comprehensive plan to systematically refactor the sv-window-manager library using multiple coordinated **svelte5-expert-dev agents** working in parallel. The plan is derived from two comprehensive analysis documents:

1. **SVELTE_QUALITY_REFACTORING_OPPORTUNITIES.md** - Quality-focused improvements
2. **SVELTE_ARCHITECTURAL_REFACTORING_GUIDE.md** - 4-phase architectural roadmap

**Parallel Execution Strategy**: Deploy multiple specialized agents simultaneously to maximize velocity while minimizing conflicts through careful file ownership assignment and dependency management.

### Key Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Total Lines of Code** | ~3,500 | ~2,100 | **40% reduction** |
| **Imperative API Calls** | ~50 | ~5 | **90% reduction** |
| **Manual Reactivity Patterns** | ~200 lines | ~20 lines | **90% reduction** |
| **Estimated Timeline** | - | 8-12 weeks | **Phased delivery** |

### Overall Approach

- **12 Workstreams** organized into **4 Phases**
- **Multiple agents** working in parallel (up to 5 concurrent)
- **Iterative review loops** for each workstream
- **Feature flags** for safe rollout
- **Comprehensive testing** at each phase

---

## Table of Contents

1. [Phase Organization](#phase-organization) (Lines 135-160)
2. [Workstream Definitions](#workstream-definitions) (Lines 163-635)
   - Phase 1: Quick Wins (Lines 165-335)
   - Phase 2: API Improvements (Lines 337-448)
   - Phase 3: Core Architecture (Lines 450-562)
   - Phase 4: Future Enhancements (Lines 565-635)
3. [Agent Assignment Strategy](#agent-assignment-strategy) (Lines 638-695)
4. [Iterative Review Loop Process](#iterative-review-loop-process) (Lines 697-814)
5. [Coordination Strategy](#coordination-strategy) (Lines 816-913)
6. [Testing Strategy](#testing-strategy) (Lines 916-999)
7. [Execution Timeline](#execution-timeline) (Lines 1002-1098)
8. [Dependency Graph](#dependency-graph) (Lines 1101-1183)
9. [Risk Mitigation](#risk-mitigation) (Lines 1186-1257)
10. [Success Metrics](#success-metrics) (Lines 1260-1345)
11. [Launch Commands](#launch-commands) (Lines 1349-1532)
12. [Appendices](#appendices) (Lines 1535-1774)

### Quick Reference: Workstream Line Numbers

**Phase 1 Workstreams:**
- 1.1 reactivity-utilities: Lines 167-199
- 1.2 shared-debug-utility: Lines 201-233
- 1.3 simplify-effects: Lines 235-266
- 1.4 type-safe-context: Lines 268-301
- 1.5 svelte-events-migration: Lines 303-335

**Phase 2 Workstreams:**
- 2.1 events-over-callbacks: Lines 339-373
- 2.2 snippet-content-api: Lines 375-410
- 2.3 declarative-glass-rendering: Lines 412-448

**Phase 3 Workstreams:**
- 3.1 reactive-sash-class: Lines 452-488
- 3.2 remove-update-counter: Lines 490-521
- 3.3 simplify-action-dom: Lines 523-562

**Phase 4 Workstreams:**
- 4.1 attach-directive-migration: Lines 567-598
- 4.2 reactive-window-primitives: Lines 600-635

---

## Phase Organization

### Phase 1: Quick Wins (Weeks 1-2)
**Goal**: Low-risk, high-impact improvements
**Risk Level**: Low
**Parallel Agents**: 5 concurrent workstreams
**Lines Changed**: ~260

### Phase 2: API Improvements (Weeks 3-6)
**Goal**: Modernize public API and component communication
**Risk Level**: Moderate
**Parallel Agents**: 3 concurrent workstreams
**Lines Changed**: ~500

### Phase 3: Core Architecture (Weeks 7-14)
**Goal**: Transform core data structures to reactive classes
**Risk Level**: Moderate-High
**Parallel Agents**: 3 concurrent workstreams (sequential dependencies)
**Lines Changed**: ~550

### Phase 4: Future Enhancements (Weeks 15+)
**Goal**: Adopt emerging Svelte 5 features
**Risk Level**: Low
**Parallel Agents**: 2 concurrent workstreams
**Lines Changed**: ~150

---

## Workstream Definitions

### PHASE 1: QUICK WINS (Weeks 1-2)

#### Workstream 1.1: svelte-reactivity-utilities
**Agent ID**: `svelte5-dev-agent-reactivity-utilities`

**Scope**: Replace manual `$state.raw` Maps/Sets with reactive `SvelteMap`/`SvelteSet`

**Primary Files**:
- `/src/lib/bwin/managers/glass-manager.svelte.ts` (lines 34, 39)
- `/src/lib/bwin/managers/sill-manager.svelte.ts` (similar patterns)

**Dependencies**: None (can start immediately)

**Tasks**:
1. Import `SvelteMap` and `SvelteSet` from `svelte/reactivity`
2. Replace `$state.raw(new Map<...>())` with `new SvelteMap<...>()`
3. Remove workaround reassignments (`this.glasses = [...this.glasses, instance]`)
4. Update derived values to use reactive map methods
5. Test that reactivity works without manual updates

**Acceptance Criteria**:
- All maps/sets use `SvelteMap`/`SvelteSet`
- No more `$state.raw` for collections
- All unit tests pass
- No performance degradation

**Estimated Effort**: 4-6 hours
**Complexity**: Easy
**Impact**: High (removes ~50 lines of workarounds)

**Reference**:
- Architectural Guide: Finding 3.4
- Quality Guide: Section 4.3

---

#### Workstream 1.2: shared-debug-utility
**Agent ID**: `svelte5-dev-agent-debug-utility`

**Scope**: Extract duplicate debug logging methods into shared utility

**Primary Files**:
- `/src/lib/bwin/managers/glass-manager.svelte.ts` (lines 346-357)
- `/src/lib/bwin/managers/sill-manager.svelte.ts` (lines 343-355)
- NEW: `/src/lib/bwin/utils/debug.svelte.ts` (create)

**Dependencies**: None (can start immediately)

**Tasks**:
1. Create `debug.svelte.ts` with `createDebugger(namespace, enabled)` factory
2. Implement `log()`, `warn()`, `error()` methods with namespace prefixes
3. Replace debug methods in GlassManager with shared debugger
4. Replace debug methods in SillManager with shared debugger
5. Add unit tests for debug utility

**Acceptance Criteria**:
- No duplicate debug code in managers
- Consistent debug output format
- Can toggle debug per namespace
- All tests pass

**Estimated Effort**: 2-3 hours
**Complexity**: Easy
**Impact**: Medium (removes ~30 lines, improves maintainability)

**Reference**:
- Architectural Guide: Finding 4.3

---

#### Workstream 1.3: simplify-effects
**Agent ID**: `svelte5-dev-agent-simplify-effects`

**Scope**: Break down complex `$effect` blocks into focused, single-purpose effects

**Primary Files**:
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (lines 404-424, 431-435, 534-537)

**Dependencies**: None (can start immediately)

**Tasks**:
1. Split mutation observer effect into derived paneCount + focused effect
2. Simplify sill mounting effect (remove `untrack()`)
3. Clarify fit container effect dependencies
4. Add comments documenting each effect's purpose
5. Test that behavior is unchanged

**Acceptance Criteria**:
- Each effect has single, clear responsibility
- No `untrack()` calls (indicates fighting reactivity)
- Clear dependency tracking
- All tests pass
- No performance degradation

**Estimated Effort**: 3-5 hours
**Complexity**: Easy
**Impact**: Moderate (improves ~80 lines of code clarity)

**Reference**:
- Architectural Guide: Finding 4.2

---

#### Workstream 1.4: type-safe-context
**Agent ID**: `svelte5-dev-agent-context`

**Scope**: Replace symbol-based context with `createContext` utility

**Primary Files**:
- `/src/lib/bwin/context.ts`
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (lines 79-97)
- NEW: `/src/lib/bwin/context/window-context.svelte.ts` (create)
- NEW: `/src/lib/bwin/context/layout-context.svelte.ts` (create)

**Dependencies**: None (can start immediately, coexists with old API)

**Tasks**:
1. Create `window-context.svelte.ts` with `createContext` for window element
2. Create `layout-context.svelte.ts` with `createContext` for layout actions
3. Update BinaryWindow to set new contexts alongside old
4. Add examples in showcase of using new context API
5. Add deprecation notice for old symbol-based context

**Acceptance Criteria**:
- New context API works alongside old API
- Type-safe context getters (no manual typing needed)
- Documentation shows migration path
- All tests pass

**Estimated Effort**: 4-6 hours
**Complexity**: Easy
**Impact**: Moderate (improves ~100 lines, better DX)

**Reference**:
- Architectural Guide: Finding 3.2

---

#### Workstream 1.5: svelte-events-migration
**Agent ID**: `svelte5-dev-agent-events`

**Scope**: Replace manual `addEventListener` with `svelte/events` in actions

**Primary Files**:
- `/src/lib/bwin/actions/drag.svelte.ts` (lines 78-88)
- `/src/lib/bwin/actions/drop.svelte.ts` (lines 78-95)
- `/src/lib/bwin/actions/resize.svelte.ts` (lines 243-265)

**Dependencies**: None (can start immediately)

**Tasks**:
1. Import `on` from `svelte/events`
2. Replace `addEventListener` calls with `on()` calls
3. Store cleanup functions returned by `on()`
4. Call cleanup functions in `destroy()` method
5. Test that event handling behavior is unchanged

**Acceptance Criteria**:
- All event listeners use `svelte/events`
- Cleaner cleanup in destroy() methods
- All tests pass
- No event handling regressions

**Estimated Effort**: 2-3 hours
**Complexity**: Easy
**Impact**: Medium (improves ~50 lines, better event ordering)

**Reference**:
- Quality Guide: Section 1.3

---

### PHASE 2: API IMPROVEMENTS (Weeks 3-6)

#### Workstream 2.1: events-over-callbacks
**Agent ID**: `svelte5-dev-agent-events-api`

**Scope**: Replace callback props with Svelte event dispatchers

**Primary Files**:
- `/src/lib/bwin/frame/Frame.svelte` (lines 32, 109-116)
- `/src/lib/bwin/frame/Pane.svelte` (lines 10, 25-27)
- `/src/lib/bwin/frame/Muntin.svelte` (similar pattern)

**Dependencies**:
- Phase 1 complete (recommended, not blocking)

**Tasks**:
1. Add `createEventDispatcher` to Pane and Muntin
2. Dispatch typed events (`panerender`, `muntinrender`, `panedrop`)
3. Support both callbacks (deprecated) and events (new)
4. Update Frame to use event handlers
5. Add deprecation warnings for callback props
6. Update documentation with migration guide

**Acceptance Criteria**:
- Both callback and event APIs work
- Deprecation warnings show in console
- Migration guide in CLAUDE.md
- All tests pass with both APIs
- Type-safe event handlers

**Estimated Effort**: 1 week
**Complexity**: Moderate
**Impact**: High (improves ~150 lines, better composability)

**Reference**:
- Architectural Guide: Finding 2.2

---

#### Workstream 2.2: snippet-content-api
**Agent ID**: `svelte5-dev-agent-snippets`

**Scope**: Add snippet support to Glass component for type-safe content composition

**Primary Files**:
- `/src/lib/bwin/binary-window/Glass.svelte` (lines 152-183, content rendering)
- NEW: `/src/lib/bwin/examples/SnippetExample.svelte` (create for showcase)

**Dependencies**:
- Phase 1 complete (recommended)

**Tasks**:
1. Add snippet types to GlassProps interface
2. Support `Snippet` type for `title` and `content` props
3. Implement `{@render}` blocks for snippet content
4. Keep backward compatibility with string/HTMLElement content
5. Create examples showing snippet usage
6. Update documentation

**Acceptance Criteria**:
- Snippets work for title and content
- Backward compatible with old API
- Type-safe snippet parameters
- Examples in showcase app
- All tests pass

**Estimated Effort**: 1-2 weeks
**Complexity**: Moderate
**Impact**: High (major API improvement, ~100 lines changed)

**Reference**:
- Architectural Guide: Finding 3.1

---

#### Workstream 2.3: declarative-glass-rendering
**Agent ID**: `svelte5-dev-agent-declarative-glass`

**Scope**: Replace GlassManager imperative mounting with declarative `{#each}` rendering

**Primary Files**:
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (add declarative rendering)
- `/src/lib/bwin/managers/glass-manager.svelte.ts` (eventually remove)
- `/src/lib/bwin/frame/Frame.svelte` (refactor pane collection)

**Dependencies**:
- **BLOCKING**: Phase 1 complete
- **RECOMMENDED**: Workstream 2.2 (snippets) complete

**Tasks**:
1. Add feature flag `USE_DECLARATIVE_GLASS_RENDERING`
2. Implement declarative Glass rendering with `{#each panes}`
3. Update derived panes collection to trigger on sash changes
4. Test both imperative and declarative paths
5. Once stable, remove GlassManager
6. Remove feature flag

**Acceptance Criteria**:
- Declarative rendering matches imperative behavior
- Visual regression tests pass
- Performance benchmarks maintained
- ~150 lines removed from GlassManager
- All tests pass with feature flag on/off

**Estimated Effort**: 1-2 weeks
**Complexity**: Moderate-High
**Impact**: Very High (removes entire manager, simplifies architecture)

**Reference**:
- Architectural Guide: Finding 1.1

---

### PHASE 3: CORE ARCHITECTURE (Weeks 7-14)

#### Workstream 3.1: reactive-sash-class
**Agent ID**: `svelte5-dev-agent-reactive-sash`

**Scope**: Convert vanilla JS Sash class to reactive Svelte 5 class

**Primary Files**:
- `/src/lib/bwin/sash.js` (553 lines - refactor to .svelte.ts)
- NEW: `/src/lib/bwin/sash.svelte.ts` (create reactive version)
- `/src/lib/bwin/sash.legacy.js` (rename old file)

**Dependencies**:
- **BLOCKING**: Phase 1 and Phase 2 complete

**Tasks**:
1. Create `sash.svelte.ts` with reactive class fields (`$state`, `$derived`)
2. Convert getter/setter propagation logic to `$effect` blocks
3. Add feature flag `USE_REACTIVE_SASH` for gradual rollout
4. Implement comprehensive test suite for both implementations
5. Run performance benchmarks (layout calculations)
6. Update all consumers to use reactive properties
7. Remove legacy implementation once stable

**Acceptance Criteria**:
- Reactive Sash passes all layout tests
- Performance meets or exceeds legacy
- Feature flag allows easy rollback
- ~400 lines refactored
- Automatic reactivity (no manual propagation)
- All tests pass

**Estimated Effort**: 3-4 weeks
**Complexity**: High
**Impact**: Very High (core data structure, enables other refactors)

**Reference**:
- Architectural Guide: Finding 2.1

---

#### Workstream 3.2: remove-update-counter
**Agent ID**: `svelte5-dev-agent-remove-counter`

**Scope**: Remove manual `updateCounter` pattern once Sash is reactive

**Primary Files**:
- `/src/lib/bwin/frame/Frame.svelte` (lines 49-52, remove counter)
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (remove counter usage)

**Dependencies**:
- **BLOCKING**: Workstream 3.1 (reactive-sash-class) complete

**Tasks**:
1. Remove `updateCounter` state variable
2. Remove `triggerUpdate()` calls throughout codebase
3. Remove `{#key updateCounter}` block wrappers
4. Verify automatic reactivity from reactive Sash
5. Test that pane updates happen automatically
6. Remove related comments explaining workaround

**Acceptance Criteria**:
- No more manual update counters
- Panes update automatically on sash tree changes
- ~50 lines removed
- All tests pass
- Performance improved (no full DOM recreation)

**Estimated Effort**: 1 week
**Complexity**: Easy (after 3.1 complete)
**Impact**: High (removes workaround, cleaner code)

**Reference**:
- Architectural Guide: Finding 4.1

---

#### Workstream 3.3: simplify-action-dom
**Agent ID**: `svelte5-dev-agent-action-dom`

**Scope**: Remove DOM caching in resize action, rely on Svelte reactivity

**Primary Files**:
- `/src/lib/bwin/actions/resize.svelte.ts` (lines 52-60, 176-218)
- `/src/lib/bwin/frame/Pane.svelte` (add reactive style bindings)
- `/src/lib/bwin/frame/Muntin.svelte` (add reactive style bindings)

**Dependencies**:
- **BLOCKING**: Workstream 3.1 (reactive-sash-class) complete
- **RECOMMENDED**: Workstream 3.2 complete

**Tasks**:
1. Add reactive `style:` directives to Pane/Muntin components
2. Update resize action to modify sash properties directly
3. Remove `domCache` Map and `getCachedElement()` function
4. Remove manual `style.cssText` manipulation
5. Test resize performance (should be equivalent or better)
6. Update drag/drop actions similarly if applicable

**Acceptance Criteria**:
- No DOM caching in actions
- Reactive styles update automatically
- Resize smoothness maintained (60fps)
- ~100 lines removed from actions
- All tests pass

**Estimated Effort**: 1-2 weeks
**Complexity**: Moderate
**Impact**: High (simpler actions, better maintainability)

**Reference**:
- Architectural Guide: Finding 1.3

---

### PHASE 4: FUTURE ENHANCEMENTS (Weeks 15+)

#### Workstream 4.1: attach-directive-migration
**Agent ID**: `svelte5-dev-agent-attach`

**Scope**: Migrate actions to `@attach` directive (Svelte 5.29+)

**Primary Files**:
- `/src/lib/bwin/actions/drag.svelte.ts`
- `/src/lib/bwin/actions/drop.svelte.ts`
- `/src/lib/bwin/actions/resize.svelte.ts`

**Dependencies**:
- **BLOCKING**: Svelte 5.29+ stable release
- **RECOMMENDED**: Phase 3 complete

**Tasks**:
1. Wait for Svelte 5.29+ stable with `@attach` support
2. Convert drag action to attachment behavior
3. Convert drop action to attachment behavior
4. Convert resize action to attachment behavior
5. Update component templates to use `@attach`
6. Test behavioral parity
7. Update documentation

**Acceptance Criteria**:
- All actions converted to attachments
- Cleaner integration with Svelte reactivity
- ~150 lines changed/simplified
- All tests pass

**Estimated Effort**: 1-2 weeks
**Complexity**: Easy (when feature stable)
**Impact**: Medium (cleaner API, better composition)

**Reference**:
- Architectural Guide: Finding 3.3

---

#### Workstream 4.2: reactive-window-primitives
**Agent ID**: `svelte5-dev-agent-window-reactivity`

**Scope**: Explore `svelte/reactivity/window` primitives for responsive behavior

**Primary Files**:
- `/src/lib/bwin/binary-window/BinaryWindow.svelte` (fitContainer logic)
- NEW: `/src/lib/bwin/utils/media-queries.svelte.ts` (exploratory)

**Dependencies**:
- None (exploratory, low priority)

**Tasks**:
1. Research `MediaQuery`, `innerWidth`, `innerHeight` from `svelte/reactivity/window`
2. Create proof-of-concept for responsive window management
3. Evaluate if beneficial over current ResizeObserver approach
4. Document findings
5. Implement if valuable, otherwise close as "not needed"

**Acceptance Criteria**:
- POC created and evaluated
- Decision documented (implement vs not needed)
- If implemented: tests pass, performance maintained

**Estimated Effort**: Exploratory (1-2 weeks max)
**Complexity**: Easy
**Impact**: Low-Medium (depends on findings)

**Reference**:
- Architectural Guide: Finding 3.4
- Quality Guide: Section 4.1

---

## Agent Assignment Strategy

### Agent Specialization

Each **svelte5-expert-dev agent** is assigned a specific workstream with exclusive file ownership during execution. This prevents merge conflicts and enables true parallel execution.

### Agent Naming Convention

`svelte5-dev-agent-[workstream-name]`

Example: `svelte5-dev-agent-reactivity-utilities`

### File Ownership Matrix

| Workstream | Agent ID | Primary Files | Shared Files |
|------------|----------|---------------|--------------|
| **1.1: reactivity-utilities** | svelte5-dev-agent-reactivity-utilities | glass-manager.svelte.ts, sill-manager.svelte.ts | None |
| **1.2: debug-utility** | svelte5-dev-agent-debug-utility | glass-manager.svelte.ts, sill-manager.svelte.ts, utils/debug.svelte.ts (new) | None |
| **1.3: simplify-effects** | svelte5-dev-agent-simplify-effects | BinaryWindow.svelte | None |
| **1.4: context** | svelte5-dev-agent-context | context.ts, BinaryWindow.svelte, context/*.svelte.ts (new) | None |
| **1.5: events** | svelte5-dev-agent-events | actions/drag.svelte.ts, actions/drop.svelte.ts, actions/resize.svelte.ts | None |
| **2.1: events-api** | svelte5-dev-agent-events-api | Frame.svelte, Pane.svelte, Muntin.svelte | None |
| **2.2: snippets** | svelte5-dev-agent-snippets | Glass.svelte, examples/*.svelte (new) | None |
| **2.3: declarative-glass** | svelte5-dev-agent-declarative-glass | BinaryWindow.svelte, glass-manager.svelte.ts, Frame.svelte | Glass.svelte (read-only) |
| **3.1: reactive-sash** | svelte5-dev-agent-reactive-sash | sash.js → sash.svelte.ts, sash.legacy.js | ALL (major refactor) |
| **3.2: remove-counter** | svelte5-dev-agent-remove-counter | Frame.svelte, BinaryWindow.svelte | None |
| **3.3: action-dom** | svelte5-dev-agent-action-dom | actions/resize.svelte.ts, Pane.svelte, Muntin.svelte | None |
| **4.1: attach** | svelte5-dev-agent-attach | actions/*.svelte.ts, component templates | None |
| **4.2: window-reactivity** | svelte5-dev-agent-window-reactivity | BinaryWindow.svelte, utils/*.svelte.ts (new) | None |

### Conflict Detection Strategy

**Phase 1 Conflicts**:
- **1.1 vs 1.2**: Both touch manager files
  - **Resolution**: Run **sequentially** (1.2 after 1.1) OR coordinate merge
  - **Recommended**: Sequential execution (1.1 first, then 1.2)

- **1.3 vs 1.4**: Both touch BinaryWindow.svelte
  - **Resolution**: Run **sequentially** (1.3 first, then 1.4)
  - **Recommended**: Sequential execution

**Updated Phase 1 Execution**:
```
BATCH 1 (Parallel): 1.1, 1.5 (no conflicts)
BATCH 2 (Parallel): 1.2 (depends on 1.1), continue 1.5
BATCH 3 (Parallel): 1.3, 1.4 (run after batches 1-2 complete)
```

**Phase 2 Conflicts**:
- No major conflicts (different files)
- All can run in parallel after Phase 1

**Phase 3 Conflicts**:
- 3.1 is foundational (must complete before 3.2, 3.3)
- 3.2 and 3.3 can run in parallel after 3.1

---

## Iterative Review Loop Process

Each workstream follows a **strict review loop** to ensure quality before merging.

### Review Loop Template

```
FOR EACH workstream:

  STEP 1: Assignment
    - Assign workstream to svelte5-expert-dev agent
    - Provide full context (this document + reference docs)
    - Agent reads affected files

  STEP 2: Implementation
    - Agent implements changes per workstream spec
    - Agent writes/updates tests
    - Agent runs all tests locally
    - Agent commits changes to feature branch

  STEP 3: Self-Check
    - Agent verifies all acceptance criteria met
    - Agent runs full test suite
    - Agent checks for regressions
    - Agent prepares summary of changes

  STEP 4: Review Request
    - Agent reports completion with summary:
      * Files changed
      * Lines added/removed
      * Test results
      * Acceptance criteria checklist
      * Known limitations/issues

  STEP 5: Code Review (svelte-code-reviewer agent)
    - Reviewer reads changed files
    - Reviewer checks against acceptance criteria
    - Reviewer runs tests independently
    - Reviewer validates Svelte 5 patterns
    - Reviewer checks for:
      * Correctness
      * Performance
      * Accessibility
      * Type safety
      * Documentation

  STEP 6: Decision Point

    IF reviewer approves:
      - Mark workstream COMPLETE
      - Merge feature branch
      - Update status tracking
      - BREAK loop

    ELSE IF reviewer requests changes:
      - Reviewer provides detailed feedback:
        * Specific issues with line numbers
        * Suggested improvements
        * Required fixes vs nice-to-haves

      - Agent reads feedback
      - Agent implements fixes
      - Agent updates tests if needed
      - Agent commits fixes

      - GOTO STEP 3 (repeat from self-check)

  END LOOP when approved

END FOR
```

### Review Checklist

Every code reviewer agent must verify:

**Correctness**:
- [ ] Acceptance criteria fully met
- [ ] No breaking changes (unless documented)
- [ ] Backward compatibility maintained (where required)
- [ ] Feature flags implemented correctly
- [ ] Edge cases handled

**Code Quality**:
- [ ] Follows Svelte 5 best practices
- [ ] No $state.raw workarounds (unless justified)
- [ ] No manual reactivity (unless justified)
- [ ] No `untrack()` (unless justified)
- [ ] Clear, focused `$effect` blocks
- [ ] Proper TypeScript types
- [ ] No `any` types (unless justified)

**Testing**:
- [ ] Unit tests for all new functions/components
- [ ] Integration tests for component interactions
- [ ] Visual regression tests (if UI changes)
- [ ] Performance benchmarks (if perf-critical)
- [ ] All tests pass
- [ ] Coverage maintained or improved

**Documentation**:
- [ ] CLAUDE.md updated if patterns changed
- [ ] JSDoc comments for public APIs
- [ ] Migration guide if breaking changes
- [ ] Inline comments for complex logic

**Performance**:
- [ ] No performance regressions
- [ ] Benchmarks run and documented
- [ ] Reactivity efficient (not over-tracking)
- [ ] No memory leaks

**Accessibility**:
- [ ] ARIA attributes correct
- [ ] Keyboard navigation works
- [ ] Screen reader tested (if applicable)

---

## Coordination Strategy

### Communication Protocol

**Status Updates**: Each agent reports status daily
- Current task
- Blockers (if any)
- Expected completion
- Help needed

**Blocker Resolution**:
- Agents report blockers immediately
- Coordinator (human or lead agent) resolves
- Options: resequence work, merge partial work, provide guidance

**Merge Conflicts**:
- Use **feature branches** per workstream
- Merge to `develop` branch (not `main`)
- Rebase before merge if conflicts
- Coordinate with conflicting workstream agent

### Merge Strategy

**Per Workstream**:
1. Agent creates feature branch: `feature/workstream-[id]-[name]`
2. Agent implements and commits to feature branch
3. Agent opens PR to `develop` branch
4. Code reviewer reviews PR
5. After approval: Merge to `develop` (squash merge)
6. Delete feature branch

**Per Phase**:
1. All phase workstreams merged to `develop`
2. Run full integration test suite
3. Run performance benchmarks
4. Run visual regression tests
5. If all pass: Merge `develop` to `main`
6. Tag release: `v0.[phase].0`

### Dependency Handling

**Explicit Dependencies**: Defined in each workstream
- **BLOCKING**: Must complete before starting
- **RECOMMENDED**: Should complete first, but not strictly required

**Implicit Dependencies**: Resolved through file ownership
- If two workstreams touch same file: run sequentially
- If workstreams touch different files: run in parallel

**Dependency Graph** (see section below for visual)

### Branch Strategy

```
main (production releases)
  └─ develop (integration branch)
      ├─ feature/1.1-reactivity-utilities
      ├─ feature/1.2-debug-utility
      ├─ feature/1.3-simplify-effects
      ├─ feature/1.4-context
      ├─ feature/1.5-events
      ├─ feature/2.1-events-api
      ├─ feature/2.2-snippets
      ├─ feature/2.3-declarative-glass
      ├─ feature/3.1-reactive-sash
      ├─ feature/3.2-remove-counter
      ├─ feature/3.3-action-dom
      ├─ feature/4.1-attach
      └─ feature/4.2-window-reactivity
```

### Integration Checkpoints

**After Phase 1**:
- Merge all Phase 1 feature branches to `develop`
- Run full test suite on `develop`
- Run Storybook visual tests
- Run performance benchmarks
- If pass: Tag `v0.1.0-phase1` and optionally merge to `main`

**After Phase 2**:
- Merge all Phase 2 feature branches to `develop`
- Run full test suite + e2e tests
- Test backward compatibility
- Performance benchmarks
- If pass: Tag `v0.2.0-phase2` or `v1.0.0-beta1`

**After Phase 3**:
- **CRITICAL CHECKPOINT** (major architecture change)
- Extensive testing (unit, integration, e2e, visual, performance)
- Beta testing with users
- Monitor for regressions
- If pass: Tag `v1.0.0` or `v2.0.0` (breaking changes)

**After Phase 4**:
- Incremental enhancements
- Tag minor versions: `v2.1.0`, `v2.2.0`

---

## Testing Strategy

### Test Types by Workstream

| Workstream | Unit Tests | Integration Tests | Visual Regression | Performance | Accessibility |
|------------|-----------|------------------|-------------------|-------------|---------------|
| **1.1: reactivity-utilities** | Required | Required | Not needed | Benchmark | Not needed |
| **1.2: debug-utility** | Required | Not needed | Not needed | Not needed | Not needed |
| **1.3: simplify-effects** | Required | Required | Not needed | Not needed | Not needed |
| **1.4: context** | Required | Required | Not needed | Not needed | Not needed |
| **1.5: events** | Required | Required | Not needed | Not needed | Not needed |
| **2.1: events-api** | Required | Required | Not needed | Not needed | Not needed |
| **2.2: snippets** | Required | Required | Required | Not needed | Not needed |
| **2.3: declarative-glass** | Required | Required | Required | Benchmark | Not needed |
| **3.1: reactive-sash** | **Critical** | **Critical** | Required | **Critical** | Not needed |
| **3.2: remove-counter** | Required | Required | Required | Benchmark | Not needed |
| **3.3: action-dom** | Required | Required | Required | **Critical** | Not needed |
| **4.1: attach** | Required | Required | Not needed | Not needed | Not needed |
| **4.2: window-reactivity** | Required | Required | Not needed | Not needed | Not needed |

### Test Requirements by Type

**Unit Tests**:
- Test individual functions/components in isolation
- Use Vitest with `vitest-browser-svelte` for components
- Mock dependencies
- Aim for 80%+ coverage on new/changed code

**Integration Tests**:
- Test component interactions
- Test state flow between components
- Test manager/component integration
- Use Vitest or Playwright component tests

**Visual Regression Tests**:
- Screenshot comparison before/after
- Use Playwright visual snapshots or Storybook + Chromatic
- Test all Glass variants, pane layouts

**Performance Benchmarks**:
- Measure layout calculation time (Sash propagation)
- Measure resize operation smoothness (60fps target)
- Measure component mount/unmount time
- Memory usage (no leaks)
- Tools: Chrome DevTools Performance, `performance.now()`

**Accessibility Tests**:
- Automated: Use `@storybook/addon-a11y` or `axe-core`
- Manual: Keyboard navigation, screen reader testing
- ARIA compliance

### Testing Timeline

**Before Starting Workstream**:
- Write baseline tests capturing current behavior
- Run benchmarks to establish performance baseline

**During Implementation**:
- Write tests for new code (TDD encouraged)
- Run tests frequently during development
- Fix regressions immediately

**Before Requesting Review**:
- All tests passing locally
- Coverage report generated
- Performance benchmarks run (if applicable)

**During Review**:
- Reviewer runs tests independently
- Reviewer may add additional test cases
- Tests must pass before approval

**After Merge to Develop**:
- Full test suite runs on CI
- Integration tests with other merged workstreams
- Phase-level smoke tests

**Before Release**:
- Full test suite (unit + integration + e2e)
- Visual regression suite
- Performance benchmarks
- Accessibility audit
- Manual exploratory testing

---

## Execution Timeline

### Gantt-Style Timeline

```
Week 1-2: PHASE 1 (Quick Wins)
├─ Week 1
│  ├─ [1.1] reactivity-utilities ████████ (complete)
│  ├─ [1.5] events               ████████ (complete)
│  └─ [1.2] debug-utility               (start after 1.1)
│
└─ Week 2
   ├─ [1.2] debug-utility        ████ (complete)
   ├─ [1.3] simplify-effects     ██████ (complete)
   ├─ [1.4] context              ████████ (complete)
   └─ Integration Testing        ████

Week 3-6: PHASE 2 (API Improvements)
├─ Week 3-4
│  ├─ [2.1] events-api           ████████████████ (2 weeks)
│  └─ [2.2] snippets             ████████████████ (2 weeks)
│
├─ Week 5-6
│  └─ [2.3] declarative-glass    ████████████████ (2 weeks)
│
└─ Integration Testing            ████

Week 7-14: PHASE 3 (Core Architecture)
├─ Week 7-10
│  └─ [3.1] reactive-sash        ████████████████████████████████ (4 weeks)
│
├─ Week 11-12
│  ├─ [3.2] remove-counter       ████████ (1 week, parallel start)
│  └─ [3.3] action-dom           ████████████████ (2 weeks, parallel start)
│
├─ Week 13-14
│  └─ Integration Testing        ████████
│
└─ Beta Testing                   ████████

Week 15+: PHASE 4 (Future Enhancements)
├─ [4.1] attach                   (wait for Svelte 5.29+)
└─ [4.2] window-reactivity        (exploratory, as time permits)
```

### Detailed Phase Timelines

**PHASE 1: Weeks 1-2**

| Week | Day | Agent | Activity |
|------|-----|-------|----------|
| 1 | Mon | 1.1 | Start reactivity-utilities |
| 1 | Mon | 1.5 | Start events migration |
| 1 | Tue | 1.1 | Continue implementation |
| 1 | Tue | 1.5 | Continue implementation |
| 1 | Wed | 1.1 | Testing & review prep |
| 1 | Wed | 1.5 | Testing & review prep |
| 1 | Thu | 1.1 | Code review → merge |
| 1 | Thu | 1.2 | Start debug-utility (after 1.1) |
| 1 | Thu | 1.5 | Code review → merge |
| 1 | Fri | 1.2 | Continue implementation |
| 2 | Mon | 1.2 | Complete & review → merge |
| 2 | Mon | 1.3 | Start simplify-effects |
| 2 | Mon | 1.4 | Start context |
| 2 | Tue | 1.3 | Continue implementation |
| 2 | Tue | 1.4 | Continue implementation |
| 2 | Wed | 1.3 | Testing & review → merge |
| 2 | Wed | 1.4 | Testing & review |
| 2 | Thu | 1.4 | Code review → merge |
| 2 | Thu | ALL | Integration testing |
| 2 | Fri | ALL | Phase 1 complete, merge to main |

**PHASE 2: Weeks 3-6**

| Week | Workstream | Status |
|------|------------|--------|
| 3-4 | 2.1 events-api | Parallel with 2.2 |
| 3-4 | 2.2 snippets | Parallel with 2.1 |
| 5-6 | 2.3 declarative-glass | After 2.1, 2.2 complete |
| 6 | Integration | Full phase testing |

**PHASE 3: Weeks 7-14**

| Week | Workstream | Status |
|------|------------|--------|
| 7-10 | 3.1 reactive-sash | **CRITICAL PATH** - blocks 3.2, 3.3 |
| 11-12 | 3.2 remove-counter | Parallel start (after 3.1) |
| 11-12 | 3.3 action-dom | Parallel start (after 3.1) |
| 13-14 | Integration & Beta | Extensive testing |

**PHASE 4: Weeks 15+**

| Week | Workstream | Status |
|------|------------|--------|
| TBD | 4.1 attach | Wait for Svelte 5.29+ |
| 15+ | 4.2 window-reactivity | Exploratory |

---

## Dependency Graph

### Visual Dependency Graph

```
PHASE 1 (Parallel Execution)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [1.1]                    [1.5]                     │
│  reactivity-utilities     events                    │
│  ████████                 ████████                  │
│      │                                              │
│      ▼                                              │
│  [1.2]                                              │
│  debug-utility                                      │
│  ████                                               │
│                                                     │
│  [1.3]                    [1.4]                     │
│  simplify-effects         context                   │
│  ██████                   ████████                  │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 2 (Sequential + Parallel)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [2.1]                    [2.2]                     │
│  events-api               snippets                  │
│  ████████████████         ████████████████          │
│      │                        │                     │
│      └────────────┬───────────┘                     │
│                   ▼                                 │
│  [2.3]                                              │
│  declarative-glass                                  │
│  ████████████████                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 3 (Sequential Critical Path)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [3.1] reactive-sash                                │
│  ████████████████████████████████                   │
│  CRITICAL PATH (4 weeks)                            │
│      │                                              │
│      ├──────────────┬──────────────┐                │
│      ▼              ▼              │                │
│  [3.2]          [3.3]              │                │
│  remove-counter action-dom         │                │
│  ████████       ████████████████   │                │
│                                    │                │
└────────────────────────────────────┼────────────────┘
                                     │
                                     ▼
PHASE 4 (Independent / Future)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [4.1] attach              [4.2] window-reactivity  │
│  (wait Svelte 5.29+)       (exploratory)            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Critical Path Analysis

**Critical Path**:
1.1 → 1.2 → 1.3/1.4 → 2.1/2.2 → 2.3 → **3.1** → 3.2/3.3

**Longest Sequence**:
- Phase 1: 2 weeks
- Phase 2: 4 weeks
- Phase 3: 7 weeks (including 3.1's 4 weeks)
- **Total: 13 weeks minimum**

**Parallelization Opportunities**:
- Phase 1: 5 workstreams, 3 can run truly parallel → saves ~1 week
- Phase 2: 2 workstreams parallel → saves ~2 weeks
- Phase 3: 2 workstreams parallel after 3.1 → saves ~1 week

**Optimized Timeline**: **~8-10 weeks** (vs 13 weeks sequential)

---

## Risk Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| **Reactive Sash breaks layout** | Medium | Critical | Feature flag, extensive testing, rollback plan | 3.1 agent |
| **File conflicts between agents** | Medium | Medium | File ownership matrix, sequential batching | Coordinator |
| **Performance regression** | Low | High | Benchmarks before/after, performance budget | All agents |
| **Breaking changes impact users** | Medium | High | Backward compatibility, deprecation warnings | Phase 2 agents |
| **Svelte 5.29+ delayed** | High | Low | Phase 4 is optional, can defer | 4.1 agent |
| **Agent implementation bugs** | Medium | Medium | Review loops, extensive testing | All agents |
| **Integration issues** | Low | Medium | Integration checkpoints, beta testing | Coordinator |

### Mitigation Strategies

**For Critical Changes** (3.1 reactive-sash, 2.3 declarative-glass):
1. **Feature Flags**:
   - Add environment variable toggle
   - Test both old and new paths
   - Deploy with flag OFF initially
   - Gradual rollout (10% → 50% → 100%)

2. **Extensive Testing**:
   - Unit tests for all methods
   - Integration tests for layout propagation
   - Visual regression tests
   - Performance benchmarks (< 16ms layout calc)
   - Soak testing (long-running app)

3. **Rollback Plan**:
   - Keep legacy implementation for 2-3 releases
   - Document rollback procedure
   - Monitor error logs
   - Quick rollback via feature flag

**For API Changes** (2.1 events-over-callbacks, 2.2 snippets):
1. **Backward Compatibility**:
   - Support both old and new APIs simultaneously
   - Deprecation warnings (console.warn)
   - Migration guide in docs
   - Version bump (semver)

2. **Communication**:
   - Announce changes in advance
   - Provide examples
   - Beta period for feedback
   - Clear release notes

**For File Conflicts**:
1. **Batched Execution**:
   - Group workstreams touching same files
   - Run sequentially within batch
   - Coordinate merge timing

2. **Merge Coordination**:
   - Daily standup to report progress
   - Merge to `develop` immediately on approval
   - Frequent rebases to stay current

**For Performance**:
1. **Performance Budget**:
   - Layout calc: < 16ms (60fps)
   - Component mount: < 100ms
   - Reactivity update: < 5ms
   - Memory: no leaks over time

2. **Monitoring**:
   - Automated benchmarks in CI
   - Visual performance timeline
   - Alert on regression > 10%

---

## Success Metrics

### Quantitative Metrics

**Code Metrics**:
- [ ] **40% reduction** in total lines of code (~3,500 → ~2,100)
- [ ] **90% reduction** in imperative API calls (~50 → ~5)
- [ ] **90% reduction** in manual reactivity (~200 → ~20 lines)
- [ ] **Zero** instances of `$state.raw` for collections (use SvelteMap/SvelteSet)
- [ ] **Zero** `untrack()` calls (proper reactivity)
- [ ] **100%** test coverage on new/changed code

**Performance Metrics**:
- [ ] Layout calculation: **< 16ms** (60fps)
- [ ] Component mount time: **< 100ms**
- [ ] Reactivity update: **< 5ms**
- [ ] Memory: **no leaks** over 1 hour runtime
- [ ] Bundle size: **no increase** > 5% (ideally decrease)

**Quality Metrics**:
- [ ] **Zero** TypeScript errors
- [ ] **Zero** ESLint errors
- [ ] **Zero** accessibility violations (axe-core)
- [ ] **100%** of unit tests passing
- [ ] **100%** of integration tests passing
- [ ] **100%** of e2e tests passing

### Qualitative Metrics

**Developer Experience**:
- [ ] Simpler API (fewer concepts to learn)
- [ ] Better TypeScript autocomplete
- [ ] Clearer error messages
- [ ] Easier to extend (snippets, events)
- [ ] Less boilerplate

**Code Quality**:
- [ ] More declarative patterns
- [ ] Fewer workarounds
- [ ] Better separation of concerns
- [ ] Easier to test
- [ ] Self-documenting code

**Maintainability**:
- [ ] Fewer files (managers removed)
- [ ] Smaller components
- [ ] Focused effects
- [ ] Clear dependencies
- [ ] Better documentation

### Phase-Specific Success Criteria

**Phase 1 Success**:
- [ ] All 5 workstreams complete and merged
- [ ] No `$state.raw` for collections
- [ ] Shared debug utility in use
- [ ] Simple, focused effects
- [ ] Type-safe context API available
- [ ] Events use `svelte/events`
- [ ] All tests pass
- [ ] Merge to `main` as `v0.1.0`

**Phase 2 Success**:
- [ ] Event-based component communication
- [ ] Snippet API available for Glass
- [ ] GlassManager removed (declarative rendering)
- [ ] ~150 lines removed
- [ ] Migration guide published
- [ ] All tests pass
- [ ] Merge to `main` as `v1.0.0-beta1`

**Phase 3 Success**:
- [ ] Reactive Sash in production
- [ ] Update counter removed
- [ ] DOM caching removed from actions
- [ ] ~550 lines improved
- [ ] Performance benchmarks met
- [ ] Beta testing complete
- [ ] All tests pass
- [ ] Merge to `main` as `v2.0.0`

**Phase 4 Success**:
- [ ] `@attach` directive adopted (when stable)
- [ ] Reactive window primitives evaluated
- [ ] Documentation complete
- [ ] Merge as `v2.1.0` or `v2.2.0`

---

## Launch Commands

### Phase 1 Launch Commands

**BATCH 1** (Week 1, Day 1 - Parallel Launch):

```bash
# Agent 1.1: reactivity-utilities
# No blocking dependencies - start immediately
Launch Agent: svelte5-dev-agent-reactivity-utilities
Workstream: 1.1
Files: glass-manager.svelte.ts, sill-manager.svelte.ts
Tasks: Replace $state.raw Maps with SvelteMap/SvelteSet

# Agent 1.5: events
# No blocking dependencies - start immediately
Launch Agent: svelte5-dev-agent-events
Workstream: 1.5
Files: actions/drag.svelte.ts, actions/drop.svelte.ts, actions/resize.svelte.ts
Tasks: Replace addEventListener with svelte/events
```

**BATCH 2** (Week 1, Day 4 - After 1.1 completes):

```bash
# Agent 1.2: debug-utility
# DEPENDS ON: 1.1 complete (touches same manager files)
Launch Agent: svelte5-dev-agent-debug-utility
Workstream: 1.2
Files: glass-manager.svelte.ts, sill-manager.svelte.ts, utils/debug.svelte.ts (new)
Tasks: Extract duplicate debug methods to shared utility
```

**BATCH 3** (Week 2, Day 1 - After Batch 1-2 complete):

```bash
# Agent 1.3: simplify-effects
# DEPENDS ON: Batches 1-2 complete (touches BinaryWindow.svelte)
Launch Agent: svelte5-dev-agent-simplify-effects
Workstream: 1.3
Files: BinaryWindow.svelte
Tasks: Split complex $effect blocks, remove untrack()

# Agent 1.4: context
# DEPENDS ON: Batches 1-2 complete (touches BinaryWindow.svelte)
Launch Agent: svelte5-dev-agent-context
Workstream: 1.4
Files: context.ts, BinaryWindow.svelte, context/*.svelte.ts (new)
Tasks: Replace symbol context with createContext
```

**After Phase 1**: Code reviewer reviews each workstream sequentially

---

### Phase 2 Launch Commands

**BATCH 1** (Week 3, Day 1 - Parallel Launch):

```bash
# Agent 2.1: events-api
# DEPENDS ON: Phase 1 complete (recommended)
Launch Agent: svelte5-dev-agent-events-api
Workstream: 2.1
Files: Frame.svelte, Pane.svelte, Muntin.svelte
Tasks: Replace callback props with event dispatchers

# Agent 2.2: snippets
# DEPENDS ON: Phase 1 complete (recommended)
Launch Agent: svelte5-dev-agent-snippets
Workstream: 2.2
Files: Glass.svelte, examples/*.svelte (new)
Tasks: Add snippet support to Glass component
```

**BATCH 2** (Week 5, Day 1 - After 2.1, 2.2 complete):

```bash
# Agent 2.3: declarative-glass
# DEPENDS ON: 2.1, 2.2 complete (recommended); Phase 1 complete (blocking)
Launch Agent: svelte5-dev-agent-declarative-glass
Workstream: 2.3
Files: BinaryWindow.svelte, glass-manager.svelte.ts, Frame.svelte
Tasks: Replace GlassManager with declarative rendering
```

**After Phase 2**: Full integration testing, merge to `main`

---

### Phase 3 Launch Commands

**BATCH 1** (Week 7, Day 1 - CRITICAL PATH):

```bash
# Agent 3.1: reactive-sash
# DEPENDS ON: Phase 1 and Phase 2 complete (blocking)
# NOTE: This is the CRITICAL PATH - all other Phase 3 work depends on this
Launch Agent: svelte5-dev-agent-reactive-sash
Workstream: 3.1
Files: sash.js → sash.svelte.ts, sash.legacy.js, ALL (major refactor)
Tasks: Convert vanilla JS Sash to reactive Svelte 5 class
Timeline: 4 weeks
Priority: HIGHEST
```

**BATCH 2** (Week 11, Day 1 - After 3.1 complete, Parallel Launch):

```bash
# Agent 3.2: remove-counter
# DEPENDS ON: 3.1 complete (BLOCKING)
Launch Agent: svelte5-dev-agent-remove-counter
Workstream: 3.2
Files: Frame.svelte, BinaryWindow.svelte
Tasks: Remove manual updateCounter pattern

# Agent 3.3: action-dom
# DEPENDS ON: 3.1 complete (BLOCKING)
Launch Agent: svelte5-dev-agent-action-dom
Workstream: 3.3
Files: actions/resize.svelte.ts, Pane.svelte, Muntin.svelte
Tasks: Remove DOM caching, use reactive style bindings
```

**After Phase 3**: Extensive integration testing, beta testing, merge to `main` as v2.0.0

---

### Phase 4 Launch Commands

**BATCH 1** (Week 15+ - Future/Optional):

```bash
# Agent 4.1: attach
# DEPENDS ON: Svelte 5.29+ stable release (BLOCKING)
# NOTE: Wait for ecosystem readiness before launching
Launch Agent: svelte5-dev-agent-attach
Workstream: 4.1
Files: actions/*.svelte.ts, component templates
Tasks: Migrate actions to @attach directive

# Agent 4.2: window-reactivity
# DEPENDS ON: None (exploratory)
Launch Agent: svelte5-dev-agent-window-reactivity
Workstream: 4.2
Files: BinaryWindow.svelte, utils/*.svelte.ts (new)
Tasks: Explore svelte/reactivity/window primitives
```

---

### Review Loop Launch Pattern

For **each workstream** after agent completes implementation:

```bash
# 1. Agent reports completion
Agent: svelte5-dev-agent-[workstream-name]
Status: IMPLEMENTATION_COMPLETE
Summary: [files changed, tests status, acceptance criteria checklist]

# 2. Launch code reviewer
Launch Agent: svelte-code-reviewer
Review Target: feature/workstream-[id]-[name] branch
Workstream: [id]
Checklist: [review checklist from this document]

# 3. Reviewer provides feedback
Reviewer: svelte-code-reviewer
Status: APPROVED | CHANGES_REQUESTED
Feedback: [detailed feedback if changes requested]

# 4a. If APPROVED:
- Merge feature branch to develop
- Mark workstream COMPLETE
- Update tracking dashboard
- Move to next workstream

# 4b. If CHANGES_REQUESTED:
- Agent implements fixes
- Agent re-requests review
- Repeat from step 2
```

---

## Appendix A: Workstream Reference Quick Guide

| ID | Name | Files | Effort | Complexity | Impact |
|----|------|-------|--------|------------|--------|
| 1.1 | reactivity-utilities | managers/*.svelte.ts | 4-6h | Easy | High |
| 1.2 | debug-utility | managers/*.svelte.ts, utils/debug.svelte.ts | 2-3h | Easy | Medium |
| 1.3 | simplify-effects | BinaryWindow.svelte | 3-5h | Easy | Moderate |
| 1.4 | context | context.ts, BinaryWindow.svelte, context/*.svelte.ts | 4-6h | Easy | Moderate |
| 1.5 | events | actions/*.svelte.ts | 2-3h | Easy | Medium |
| 2.1 | events-api | Frame.svelte, Pane.svelte, Muntin.svelte | 1 wk | Moderate | High |
| 2.2 | snippets | Glass.svelte, examples/*.svelte | 1-2 wk | Moderate | High |
| 2.3 | declarative-glass | BinaryWindow.svelte, glass-manager.svelte.ts, Frame.svelte | 1-2 wk | Mod-High | Very High |
| 3.1 | reactive-sash | sash.js → sash.svelte.ts, ALL | 3-4 wk | High | Very High |
| 3.2 | remove-counter | Frame.svelte, BinaryWindow.svelte | 1 wk | Easy | High |
| 3.3 | action-dom | actions/resize.svelte.ts, Pane.svelte, Muntin.svelte | 1-2 wk | Moderate | High |
| 4.1 | attach | actions/*.svelte.ts, templates | 1-2 wk | Easy | Medium |
| 4.2 | window-reactivity | BinaryWindow.svelte, utils/*.svelte.ts | Exploratory | Easy | Low-Med |

---

## Appendix B: File Ownership Reference

**Manager Files** (Phase 1 conflicts):
- `/src/lib/bwin/managers/glass-manager.svelte.ts`
  - 1.1: reactivity-utilities (FIRST)
  - 1.2: debug-utility (AFTER 1.1)
  - 2.3: declarative-glass (eventual removal)

- `/src/lib/bwin/managers/sill-manager.svelte.ts`
  - 1.1: reactivity-utilities (FIRST)
  - 1.2: debug-utility (AFTER 1.1)

**BinaryWindow.svelte** (Phase 1 & 2 conflicts):
- `/src/lib/bwin/binary-window/BinaryWindow.svelte`
  - 1.3: simplify-effects (FIRST in Week 2)
  - 1.4: context (PARALLEL with 1.3 in Week 2)
  - 2.3: declarative-glass
  - 3.2: remove-counter

**Action Files** (No conflicts):
- `/src/lib/bwin/actions/drag.svelte.ts` → 1.5
- `/src/lib/bwin/actions/drop.svelte.ts` → 1.5
- `/src/lib/bwin/actions/resize.svelte.ts` → 1.5, 3.3

**Frame Files** (Phase 2 & 3):
- `/src/lib/bwin/frame/Frame.svelte`
  - 2.1: events-api
  - 2.3: declarative-glass
  - 3.2: remove-counter

**Component Files** (Phase 2 & 3):
- `/src/lib/bwin/frame/Pane.svelte`
  - 2.1: events-api
  - 3.3: action-dom

- `/src/lib/bwin/frame/Muntin.svelte`
  - 2.1: events-api
  - 3.3: action-dom

- `/src/lib/bwin/binary-window/Glass.svelte`
  - 2.2: snippets

**Core Data Structure** (Phase 3 - CRITICAL):
- `/src/lib/bwin/sash.js`
  - 3.1: reactive-sash (MAJOR REFACTOR, affects ALL components)

---

## Appendix C: Rollback Procedures

### Quick Rollback via Feature Flags

```bash
# Rollback reactive Sash to legacy
export VITE_USE_REACTIVE_SASH=false
npm run build
npm run deploy

# Rollback declarative Glass rendering
export VITE_USE_DECLARATIVE_GLASS_RENDERING=false
npm run build
npm run deploy
```

### Git-Based Rollback

```bash
# Rollback specific workstream (before merge to main)
git revert <merge-commit-hash>
git push origin develop

# Rollback entire phase
git checkout main
git revert -m 1 <phase-merge-commit>
git push origin main

# Emergency: Reset to last stable release
git checkout main
git reset --hard v0.9.0  # last known good
git push --force origin main  # CAUTION: discuss with team first
```

### Monitoring for Issues

```bash
# Watch error logs
npm run dev -- --open
# Monitor browser console for errors

# Run automated tests
npm test
npm run test:e2e

# Performance monitoring
npm run benchmark

# Check bundle size
npm run build
ls -lh dist/
```

---

## Appendix D: Communication Templates

### Agent Start Message Template

```
WORKSTREAM START: [ID] [Name]
Agent: svelte5-dev-agent-[name]
Branch: feature/workstream-[id]-[name]
Start Date: YYYY-MM-DD
Expected Completion: YYYY-MM-DD

Dependencies Verified:
- [X] Phase [N] complete
- [X] Workstream [X.Y] complete (if applicable)
- [X] All blocking work merged

Files to Modify:
- /path/to/file1.svelte
- /path/to/file2.ts

Plan:
1. [First task]
2. [Second task]
3. [Testing]
4. [Review prep]

Estimated Effort: [X hours/days/weeks]
```

### Agent Completion Message Template

```
WORKSTREAM COMPLETE: [ID] [Name]
Agent: svelte5-dev-agent-[name]
Branch: feature/workstream-[id]-[name]
Completion Date: YYYY-MM-DD

Files Changed:
- /path/to/file1.svelte (+50, -30)
- /path/to/file2.ts (+20, -10)
- NEW: /path/to/file3.svelte (+100)

Total Lines: +170, -40

Tests:
- [X] Unit tests: 15/15 passing
- [X] Integration tests: 5/5 passing
- [X] Visual regression: 3/3 passing (if applicable)
- [X] Performance: meets benchmarks (if applicable)

Acceptance Criteria:
- [X] Criterion 1
- [X] Criterion 2
- [X] Criterion 3

Known Issues/Limitations:
- [None] or [List any known issues]

Ready for Review: YES
Requesting: svelte-code-reviewer
```

### Reviewer Approval Template

```
REVIEW APPROVED: [ID] [Name]
Reviewer: svelte-code-reviewer
Review Date: YYYY-MM-DD
Branch: feature/workstream-[id]-[name]

Review Checklist:
- [X] Correctness: All acceptance criteria met
- [X] Code Quality: Follows Svelte 5 best practices
- [X] Testing: Comprehensive test coverage
- [X] Documentation: Updated as needed
- [X] Performance: No regressions
- [X] Accessibility: No issues

Comments:
[Optional positive feedback or notes]

APPROVED FOR MERGE
Next Steps: Merge to develop, update tracking
```

### Reviewer Change Request Template

```
REVIEW: CHANGES REQUESTED: [ID] [Name]
Reviewer: svelte-code-reviewer
Review Date: YYYY-MM-DD
Branch: feature/workstream-[id]-[name]

Issues Found: [count]

CRITICAL Issues (must fix):
1. [File:Line] - [Description]
   Suggested Fix: [Suggestion]

IMPORTANT Issues (should fix):
1. [File:Line] - [Description]
   Suggested Fix: [Suggestion]

NICE-TO-HAVE Issues (optional):
1. [File:Line] - [Description]
   Suggested Fix: [Suggestion]

Overall Assessment:
[Summary of review]

Required Actions:
- [ ] Fix critical issue 1
- [ ] Fix critical issue 2
- [ ] Fix important issue 1

Next Steps: Agent implements fixes, re-requests review
```

---

## Document Metadata

**Version**: 1.0
**Created**: 2025-10-25
**Last Updated**: 2025-10-25
**Author**: Claude Code (Orchestration Agent)
**Status**: Ready for Execution

**Related Documents**:
- SVELTE_QUALITY_REFACTORING_OPPORTUNITIES.md
- SVELTE_ARCHITECTURAL_REFACTORING_GUIDE.md
- CLAUDE.md

**Approval Status**: Pending human review
**Estimated Total Effort**: 8-12 weeks with parallel execution
**Estimated Code Reduction**: 40% (~1,400 lines removed/simplified)

---

**END OF PARALLEL IMPLEMENTATION PLAN**
