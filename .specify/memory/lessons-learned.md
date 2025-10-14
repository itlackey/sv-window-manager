# Lessons Learned: Tab Bar Lifecycle & Customization Implementation

**Feature**: 002-tab-bar-lifecycle  
**Implementation Period**: October 13-14, 2025  
**Status**: Complete (67/75 tasks, 89% - MVP delivered)  
**Final Test Results**: 59/59 tests passing (100%)

---

## Executive Summary

This document captures critical lessons learned during the implementation of the Tab Bar Lifecycle & Customization feature. These insights cover Svelte 5 patterns, testing strategies, accessibility implementation, and debugging approaches that will inform future feature development.

**Key Takeaway**: Implementing in priority order (P1 → P2 → P3) with independent user stories enabled rapid iteration and early value delivery, while comprehensive testing caught subtle bugs before they reached production.

---

## Table of Contents

1. [Svelte 5 Patterns & Gotchas](#svelte-5-patterns--gotchas)
2. [Testing Strategy & Patterns](#testing-strategy--patterns)
3. [Accessibility Implementation](#accessibility-implementation)
4. [Component Architecture Decisions](#component-architecture-decisions)
5. [Bug Patterns & Debugging](#bug-patterns--debugging)
6. [Event Handling & State Management](#event-handling--state-management)
7. [Performance & UX Considerations](#performance--ux-considerations)
8. [Documentation & Communication](#documentation--communication)
9. [Process Improvements](#process-improvements)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Svelte 5 Patterns & Gotchas

### ✅ Use Runes for All Reactive State

**Pattern**: Always use `$state`, `$props`, and `$derived` instead of legacy patterns.

```typescript
// ✅ CORRECT - Svelte 5 Runes
const { tabs, activeId = '', ...props }: Props = $props();
let renamingTabId = $state<string | null>(null);
let pinnedTabs = $derived(tabs.filter(t => t.pinned));
```

```typescript
// ❌ WRONG - Legacy Svelte syntax
export let tabs;
export let activeId = '';
let renamingTabId = null;
$: pinnedTabs = tabs.filter(t => t.pinned);
```

**Why it matters**: Svelte 5 runes provide better TypeScript integration, clearer intent, and better performance. They're not just syntax sugar—they're the foundation of Svelte 5's reactivity system.

---

### ⚠️ Svelte Keyed Each Blocks Need TRULY Unique Keys

**Problem**: Used composite keys like `timestamp + type` for event log entries, causing duplicate key errors during rapid events.

```typescript
// ❌ WRONG - Second-precision timestamps create duplicates
type EventLog = {
  timestamp: string;  // toLocaleTimeString() - only second precision!
  type: string;
};
{#each eventLog as event (event.timestamp + event.type)}
```

**Solution**: Always use guaranteed-unique identifiers combining millisecond timestamps with counters.

```typescript
// ✅ CORRECT - Millisecond precision + counter
type EventLog = {
  id: string;  // `${Date.now()}-${counter++}`
  timestamp: string;
  type: string;
};
let eventCounter = 0;
const id = `${Date.now()}-${eventCounter++}`;
{#each eventLog as event (event.id)}
```

**Lesson**: Don't rely on human-readable timestamps for keys. User-facing display values and unique identifiers serve different purposes. Svelte's each blocks require the latter.

**Related Bug**: `BUGFIX-EVENT-LOG-DUPLICATE-KEYS.md`

---

### 🎯 Event Handlers Should Use Function References, Not Inline Arrows

**Pattern**: Define event handlers as functions and reference them, rather than inline arrow functions.

```typescript
// ✅ CORRECT - Function reference (better for debugging)
function handleTabClick(tab: Tab) {
  dispatch('activate', { tabId: tab.id });
}
<button onclick={() => handleTabClick(tab)}>

// ⚠️ ACCEPTABLE but harder to debug
<button onclick={() => dispatch('activate', { tabId: tab.id })}>
```

**Why it matters**: Named functions appear in stack traces, making debugging easier. They also make the component structure clearer and enable easier testing.

---

### 🔄 Await Svelte Reactivity in Tests with `$effect` Timing

**Pattern**: When testing reactive changes, always await at least one microtask for Svelte's reactivity to settle.

```typescript
// ✅ CORRECT - Wait for Svelte reactivity
it('should update derived state', async () => {
  const { component } = render(TabBar, { tabs: sampleTabs });
  
  // Trigger change
  component.tabs = updatedTabs;
  
  // Wait for reactivity to settle
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Now assert
  expect(page.getByRole('tab')).toHaveCount(3);
});
```

**Why it matters**: Svelte's reactive updates happen asynchronously. Without awaiting, assertions may run before the DOM updates, causing flaky tests.

---

## Testing Strategy & Patterns

### 📋 Test Organization: Mirror User Stories

**Pattern**: Organize test files with clear markers for which user story each test belongs to.

```typescript
describe('TabBar - US1: Reorder Tabs', () => {
  describe('T010: Happy-path render and role assertions', () => {
    it('should render all tabs with proper ARIA roles', () => {
      // Test implementation
    });
  });
});

describe('TabBar - US2: Inline Rename', () => {
  describe('T018: Rename activation', () => {
    it('should activate rename on double-click', async () => {
      // Test implementation
    });
  });
});
```

**Benefits**:
- Easy to trace test failures back to requirements
- Clear audit trail for feature completion
- Enables parallel development of user stories
- Makes test maintenance easier

---

### 🎪 Use Playwright's `page` API for Component Tests

**Pattern**: Vitest browser mode provides Playwright's `page` object—use it!

```typescript
import { page } from '@vitest/browser/context';

it('should handle keyboard navigation', async () => {
  render(TabBar, { tabs: sampleTabs, activeId: '1' });
  
  const tab = page.getByRole('tab', { name: 'Welcome' });
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  
  await expect(page.getByRole('tab', { name: 'Docs' })).toBeFocused();
});
```

**Why it matters**: The `page` API provides realistic browser interaction simulation. It's better than directly calling component methods because it tests the actual user experience.

---

### 🐛 Test Keyboard Events with Modifier Keys Explicitly

**Pattern**: When testing keyboard shortcuts with modifiers, be explicit about the combination.

```typescript
// ✅ CORRECT - Test the actual key combination users press
await page.keyboard.press('Control+ArrowRight');

// ❌ WRONG - Separate keys don't test the combination
await page.keyboard.down('Control');
await page.keyboard.press('ArrowRight');
await page.keyboard.up('Control');
```

**Lesson**: Users press key combinations simultaneously. Tests should mirror that behavior. Playwright's `press('Control+ArrowRight')` syntax simulates this correctly.

---

### 🔍 Add Regression Tests for Every Bug Fix

**Pattern**: When fixing a bug, first write a test that reproduces it, then fix the code.

**Example from this project**:
1. **Bug**: Duplicate keys in event log during rapid reordering
2. **Test Added**: `should handle multiple rapid reorder events without duplicate keys`
3. **Verification**: Test failed before fix, passed after fix
4. **Future**: Test prevents regression

```typescript
it('should handle multiple rapid reorder events without duplicate keys', async () => {
  render(DemoPage);
  
  const tab = page.getByRole('tab', { name: /Tab 1/ });
  await tab.focus();
  
  // Rapid reorder events (within same second)
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForTimeout(10);
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForTimeout(10);
  await page.keyboard.press('Control+ArrowRight');
  
  // Assert no duplicate key errors
  // (Vitest captures unhandled errors automatically)
});
```

**Related**: `TAB-REORDER-FIX.md`, `TAB-ACTIVATION-FIXED.md`, `BUGFIX-EVENT-LOG-DUPLICATE-KEYS.md`

---

### 🎯 Test User Workflows, Not Implementation Details

**Anti-Pattern**: Testing internal state changes instead of user-visible behavior.

```typescript
// ❌ WRONG - Testing implementation details
it('should update draggedTab state', () => {
  component.draggedTab = sampleTabs[0];
  expect(component.draggedTab).toBe(sampleTabs[0]);
});

// ✅ CORRECT - Testing user experience
it('should show dragging visual feedback', async () => {
  const tab = page.getByRole('tab', { name: 'Welcome' });
  await tab.dispatchEvent('dragstart', { dataTransfer: new DataTransfer() });
  
  await expect(tab).toHaveClass('dragging');
  await expect(page.getByText('Dragging: Welcome')).toBeVisible();
});
```

**Why it matters**: Tests that focus on user-visible behavior are more maintainable and less brittle. They don't break when you refactor internal implementation.

---

## Accessibility Implementation

### ♿ Use Semantic HTML + ARIA Roles Correctly

**Pattern**: Start with semantic HTML, then enhance with ARIA roles.

```svelte
<!-- ✅ CORRECT - Semantic HTML + ARIA -->
<nav aria-label="Tab navigation">
  <div role="tablist" aria-label="Pinned tabs">
    {#each pinnedTabs as tab (tab.id)}
      <button
        role="tab"
        aria-selected={tab.id === activeId}
        aria-label={tab.pinned ? `${tab.name} (pinned)` : tab.name}
        tabindex={tab.id === activeId ? 0 : -1}
      >
        {tab.name}
      </button>
    {/each}
  </div>
</nav>

<!-- ❌ WRONG - Divs with roles (not semantic) -->
<div role="navigation" aria-label="Tab navigation">
  <div role="tablist">
    <div role="tab">Tab Name</div>
  </div>
</div>
```

**Why it matters**: Semantic HTML provides built-in accessibility features (keyboard handling, focus management). ARIA roles enhance, but shouldn't replace semantic elements.

---

### ⌨️ Keyboard Navigation: Focus vs. Activation Pattern

**Key Insight**: Arrow keys should move focus, Enter/Space should activate.

```typescript
// ✅ CORRECT - Separate focus from activation
if (event.key === 'ArrowRight') {
  // Move focus only, don't activate
  const nextTab = getNextTab(currentIndex);
  nextTab.focus();
}
else if (event.key === 'Enter' || event.key === ' ') {
  // Activate the focused tab
  dispatch('activate', { tabId: tab.id });
}
```

**Why it matters**: This pattern matches native browser behavior (like native tabs) and gives users control. They can browse without accidentally activating tabs, then consciously activate with Enter/Space.

**Related**: `TAB-ACTIVATION-FIXED.md` - documents why we implemented this pattern

---

### 🎨 Respect `prefers-reduced-motion`

**Pattern**: Always provide reduced-motion alternatives for animations.

```css
/* Default animation */
.tab-enter {
  animation: slideIn 200ms ease-out;
}

/* Reduced motion alternative */
@media (prefers-reduced-motion: reduce) {
  .tab-enter {
    animation: slideIn 100ms ease-out; /* Shorter duration */
  }
}

/* Or remove animation entirely */
@media (prefers-reduced-motion: reduce) {
  .tab-enter {
    animation: none;
  }
}
```

**Why it matters**: Users with vestibular disorders can experience nausea from motion. This is a WCAG Level AA requirement.

---

### 📢 Use `aria-live` for Dynamic Content Changes

**Pattern**: Announce important state changes to screen readers.

```svelte
<!-- ✅ CORRECT - Screen reader announces changes -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {#if renamingTabId}
    Editing tab name
  {:else if lastAction === 'close'}
    Tab closed. {tabsRemaining} tabs remaining.
  {/if}
</div>
```

**Why it matters**: Screen reader users need to know about dynamic changes that aren't in their focus path.

---

## Component Architecture Decisions

### 🏗️ Context Menu Pattern: Backdrop + Positioning

**Problem**: Nested buttons inside tab buttons caused HTML validation errors.

**Solution**: Separate context menu with backdrop for outside-click detection.

```svelte
<!-- ✅ CORRECT - Context menu as sibling, not child -->
<div class="tab-bar">
  {#each tabs as tab}
    <button oncontextmenu={(e) => openContextMenu(e, tab)}>
      {tab.name}
    </button>
  {/each}
</div>

{#if contextMenuTab}
  <!-- Backdrop for outside clicks -->
  <div class="context-menu-backdrop" onclick={closeContextMenu}></div>
  
  <!-- Menu positioned absolutely -->
  <div
    class="context-menu"
    role="menu"
    style="top: {contextMenuY}px; left: {contextMenuX}px;"
  >
    <button role="menuitem" onclick={handlePin}>Pin Tab</button>
    <button role="menuitem" onclick={handleCopyId}>Copy ID</button>
    <button role="menuitem" onclick={handleClose}>Close</button>
  </div>
{/if}
```

**Benefits**:
- No nested interactive elements (valid HTML)
- Clear separation of concerns
- Easy outside-click detection
- Proper ARIA menu semantics

---

### 🔘 Close Buttons: `<span role="button">` Pattern

**Problem**: Close button inside tab button creates nested buttons (invalid HTML).

**Solution**: Use `<span role="button">` with keyboard and mouse handlers.

```svelte
<button class="tab">
  {tab.name}
  
  <!-- ✅ CORRECT - span with role=button -->
  <span
    class="tab-close"
    role="button"
    tabindex="0"
    aria-label="Close {tab.name}"
    onmousedown={(e) => handleClose(e, tab)}
    onkeydown={(e) => handleCloseKey(e, tab)}
    onclick={(e) => e.stopPropagation()}
  >
    ✕
  </span>
</button>
```

**Critical Details**:
- Use `onmousedown` not `onclick` to prevent bubbling to parent
- Stop propagation to prevent tab activation when closing
- Handle both mouse and keyboard (`Enter`/`Space`)
- Set `tabindex="0"` for keyboard accessibility

---

### 🎭 Segmented State Management: Pinned vs. Regular

**Pattern**: Separate state management for pinned and regular tabs enables independent reordering.

```typescript
// ✅ CORRECT - Derived segments from single source
const { tabs }: Props = $props();

let pinnedTabs = $derived(
  tabs.filter(t => t.pinned).sort((a, b) => a.order - b.order)
);

let regularTabs = $derived(
  tabs.filter(t => !t.pinned).sort((a, b) => a.order - b.order)
);

// Reorder only affects one segment
function reorderInSegment(segment: 'pinned' | 'regular', newOrder: string[]) {
  dispatch('reorder', { segment, order: newOrder });
}
```

**Why it matters**: Separate segments prevent accidental mixing of pinned and regular tabs during drag operations. Users can't accidentally unpin by dragging across the boundary.

---

### 🔄 Host Precedence Model

**Pattern**: Local changes are optimistic, but host updates always win.

```typescript
// User makes local change (optimistic)
function handleReorder(event: CustomEvent) {
  // Local UI updates immediately
  localTabs = applyReorder(localTabs, event.detail);
  
  // Emit to host
  dispatch('reorder', event.detail);
}

// Host responds with updated data
// Component re-renders with host's version
$effect(() => {
  // Props update from host
  if (tabs !== localTabs) {
    localTabs = tabs; // Host wins
  }
});
```

**Why it matters**: Single source of truth prevents sync conflicts. If host rejects a change (e.g., due to permissions), the UI automatically rolls back.

---

## Bug Patterns & Debugging

### 🐞 If/Else Order Matters with Modifier Keys

**Critical Bug**: Keyboard reordering with `Ctrl+Arrow` didn't work because if/else conditions were in the wrong order.

**Problem**:
```typescript
// ❌ WRONG - Plain arrow check FIRST
if (event.key === 'ArrowRight') {
  // This matches even when Ctrl is pressed!
  // So the Ctrl+Arrow case never executes
}
else if (event.ctrlKey && event.key === 'ArrowRight') {
  // UNREACHABLE CODE when Ctrl+Arrow pressed
}
```

**Solution**:
```typescript
// ✅ CORRECT - Check modifiers FIRST
if (event.ctrlKey && event.key === 'ArrowRight') {
  // Reorder with Ctrl+Arrow
  handleReorder();
}
else if (event.key === 'ArrowRight') {
  // Navigate with plain Arrow
  handleNavigation();
}
```

**Lesson**: When handling keyboard events with optional modifiers, ALWAYS check more specific conditions (with modifiers) BEFORE general conditions (without modifiers). If/else chains short-circuit on first match.

**Related**: `TAB-REORDER-FIX.md`

---

### 🎯 Missing Event Activation Pattern

**Bug**: Tabs couldn't be clicked or activated—no `onclick` handlers existed.

**Root Cause**: Component focused on reordering and forgot basic activation.

**Fix**: Added activation as a first-class concern.

```typescript
// ✅ Added activation event
function handleTabClick(tab: Tab) {
  dispatch('activate', { tabId: tab.id });
}

// ✅ Added to every tab button
<button onclick={() => handleTabClick(tab)}>
```

**Lesson**: Start with core interactions (click, activate) BEFORE advanced features (drag, reorder). Basic usability comes first.

**Related**: `TAB-ACTIVATION-FIXED.md`

---

### 🔍 Segment Mislabeling Bug

**Bug**: Regular tabs were labeled as `'pinned'` in event handlers.

**Problem**:
```typescript
// ❌ WRONG - Copy/paste error
{#each regularTabs as tab}
  <button
    ondragstart={(e) => handleDragStart(e, tab, 'pinned')}  <!-- WRONG! -->
    ondrop={(e) => handleDrop(e, tab, 'pinned')}            <!-- WRONG! -->
  >
{/each}
```

**Solution**:
```typescript
// ✅ CORRECT - Use correct segment identifier
{#each regularTabs as tab}
  <button
    ondragstart={(e) => handleDragStart(e, tab, 'regular')}
    ondrop={(e) => handleDrop(e, tab, 'regular')}
  >
{/each}
```

**Lesson**: When duplicating code patterns, carefully review hardcoded values. Consider extracting segment identifier as a constant or parameter.

---

### ⏱️ Rapid Event Testing Reveals Timing Issues

**Pattern**: Always test features with rapid, repeated actions to reveal timing bugs.

**Example**: The duplicate key bug only appeared when rapidly pressing `Ctrl+Arrow` multiple times within one second.

```typescript
// ✅ Good test - Rapid actions
it('should handle multiple rapid reorder events', async () => {
  // 3 reorders in ~30ms
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForTimeout(10);
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForTimeout(10);
  await page.keyboard.press('Control+ArrowRight');
  
  // Would reveal duplicate key errors
});
```

**Lesson**: Power users will stress-test your UI. Test with rapid, repeated actions to catch race conditions and timing bugs before they do.

---

## Event Handling & State Management

### 📤 Event Dispatching: Payload Design

**Pattern**: Event payloads should be JSON-serializable and contain minimal data.

```typescript
// ✅ CORRECT - Minimal, serializable payload
dispatch('reorder', {
  segment: 'pinned',
  order: ['tab-1', 'tab-2', 'tab-3']  // Just IDs
});

// ❌ WRONG - Sending entire objects
dispatch('reorder', {
  segment: 'pinned',
  tabs: [{ id: '1', name: 'Welcome', ...}, ...]  // Wasteful
});
```

**Why it matters**: Event payloads cross component boundaries. Keep them small and serializable for easier debugging and potential future serialization (e.g., undo/redo).

---

### 🎪 Custom Event Types Should Be Strongly Typed

**Pattern**: Define event payload types in a central location.

```typescript
// src/lib/types.ts
export interface TabBarEvents {
  activate: { tabId: string };
  reorder: { segment: 'pinned' | 'regular'; order: string[] };
  pin: { tabId: string; pinned: boolean };
  rename: { tabId: string; name: string };
  close: { tabId: string };
}

// Component
import type { TabBarEvents } from '../types';

// Props
interface Props {
  onactivate?: (event: TabBarEvents['activate']) => void;
  onreorder?: (event: TabBarEvents['reorder']) => void;
  // ...
}
```

**Benefits**:
- Autocomplete for event handlers
- Type safety for payload access
- Single source of truth for event contracts
- Easy to document and maintain

---

### 🔄 State Updates Should Be Immutable

**Pattern**: Always create new arrays/objects instead of mutating.

```typescript
// ✅ CORRECT - Immutable update
function reorder(tabs: Tab[], fromIndex: number, toIndex: number) {
  const newTabs = [...tabs];
  const [moved] = newTabs.splice(fromIndex, 1);
  newTabs.splice(toIndex, 0, moved);
  return newTabs;
}

// ❌ WRONG - Mutation
function reorder(tabs: Tab[], fromIndex: number, toIndex: number) {
  const [moved] = tabs.splice(fromIndex, 1);  // Mutates input!
  tabs.splice(toIndex, 0, moved);
  return tabs;
}
```

**Why it matters**: Svelte 5's reactivity relies on assignment. Mutations don't trigger updates. Immutable updates ensure reactivity works correctly.

---

## Performance & UX Considerations

### ⚡ Debounce/Throttle Expensive Operations

**Pattern**: Debounce or throttle operations that fire frequently.

```typescript
let scrollTimeout: number;

function handleScroll() {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    // Expensive operation: update visible tabs calculation
    updateVisibleTabs();
  }, 100) as unknown as number;
}
```

**Applies to**:
- Scroll events
- Window resize events
- Drag events (use `requestAnimationFrame`)
- Search input (debounce API calls)

---

### 🎭 Optimize Derived State with Memoization

**Pattern**: Use `$derived` for computed values that depend on props.

```typescript
// ✅ CORRECT - Derived state (memoized)
let pinnedTabs = $derived(tabs.filter(t => t.pinned));

// ❌ WRONG - Function call (re-runs every render)
function getPinnedTabs() {
  return tabs.filter(t => t.pinned);
}
```

**Why it matters**: `$derived` only recalculates when dependencies change. Function calls run on every render, even if inputs haven't changed.

---

### 👁️ Keep Active Tab Visible

**Pattern**: Automatically scroll to active tab when it changes.

```typescript
$effect(() => {
  if (activeId) {
    const activeTab = document.getElementById(`tab-${activeId}`);
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
});
```

**Why it matters**: Users should never lose sight of the active tab. Auto-scrolling provides instant feedback and maintains context.

---

## Documentation & Communication

### 📝 Document Decisions in Markdown Files

**Pattern**: Create decision documents for significant bugs and architectural choices.

**Examples from this project**:
- `TAB-ACTIVATION-FIXED.md` - Why/how activation was implemented
- `TAB-REORDER-FIX.md` - Why if/else order matters for keyboard events
- `BUGFIX-EVENT-LOG-DUPLICATE-KEYS.md` - Svelte keyed each blocks lesson

**Benefits**:
- Knowledge transfer to future developers
- Reference for similar problems
- Audit trail of decisions

---

### 🎯 Use Task IDs in Commit Messages

**Pattern**: Reference task IDs from `tasks.md` in commits.

```bash
git commit -m "feat(TabBar): Add activation event (T010, T016)"
git commit -m "fix(TabBar): Keyboard reordering with Ctrl+Arrow (T012)"
git commit -m "test(TabBar): Add rapid reorder test for duplicate keys"
```

**Benefits**:
- Traceability from code to requirements
- Easy to generate progress reports
- Clear audit trail

---

### 📊 Track Progress with Checklists

**Pattern**: Use checkboxes in tasks.md to track completion.

```markdown
## Phase 3: User Story 1 - Reorder Tabs

### Tests
- [x] T010 [US1] Create component test file
- [x] T011 [US1] Add DnD reorder test
- [x] T012 [US1] Add keyboard reorder test

### Implementation
- [x] T013 [US1] Implement tab rendering
- [x] T014 [US1] Implement drag-and-drop
- [ ] T015 [US1] Emit reorder event
```

**Benefits**:
- Visual progress tracking
- Easy to see what's left
- Can generate completion percentages

---

## Process Improvements

### 🎯 Independent User Stories Enable Parallel Work

**Key Insight**: Each user story should be independently testable and valuable.

**Example from this project**:
- US1 (Reorder): Delivered first, immediately usable
- US2 (Rename): Added second, enhanced existing functionality
- US3 (Pin/Controls): Added third, extended feature set

**Benefits**:
- Can ship US1 while working on US2/US3
- Can demo progress early and often
- Bugs in US2 don't block US1 delivery

---

### 🔄 Test-First When Possible, Test-After When Needed

**Insight**: TDD is ideal, but not always practical. Adapt based on certainty.

**When to test-first (TDD)**:
- Clear requirements with known acceptance criteria
- Bug fixes (write failing test, then fix)
- Refactoring existing code

**When to test-after**:
- Exploratory implementation (unclear requirements)
- Rapid prototyping for demo/feedback
- Complex integrations with external APIs

**From this project**: Most tests were written alongside implementation, with test-first approach for bug fixes.

---

### 📋 Spec Review Before Implementation Saves Time

**Pattern**: Review spec, research, and data model BEFORE writing code.

**Example from this project**:
- Read `spec.md` to understand user stories
- Read `research.md` to see what others do
- Read `data-model.md` to understand state shape
- Read `tasks.md` to see implementation order

**Time saved**: Avoided implementing wrong patterns, caught edge cases early, understood dependencies upfront.

---

### 🚀 Build and Test Frequently

**Pattern**: Run full test suite before breaks and commits.

```bash
# Before commit
npm run test:unit -- --run
npm run check
npm run lint
npm run build

# Ideally automated with git hooks
```

**Benefits**:
- Catch breaking changes early
- Prevent broken commits
- Maintain confidence in codebase

---

## Anti-Patterns to Avoid

### ❌ Don't Copy-Paste Without Reviewing

**Anti-Pattern**: Copy pinned tab code to create regular tab code without updating identifiers.

**Result**: Regular tabs mislabeled as `'pinned'` in event handlers.

**Solution**: When duplicating code, carefully review ALL values for context-specific changes.

---

### ❌ Don't Hardcode Test Delays

**Anti-Pattern**: Using arbitrary `setTimeout` delays in tests.

```typescript
// ❌ AVOID - Arbitrary delay
await page.waitForTimeout(500);  // Why 500? Too slow? Too fast?
```

**Better**: Wait for specific conditions.

```typescript
// ✅ BETTER - Wait for specific condition
await expect(page.getByRole('tab', { name: 'New Tab' })).toBeVisible();
```

**Exception**: Short delays (10-50ms) are acceptable for testing rapid event sequences where you're explicitly testing timing behavior.

---

### ❌ Don't Skip Accessibility Testing

**Anti-Pattern**: Implementing features without keyboard/screen reader testing.

**Result**: Features work with mouse but fail for keyboard-only or assistive tech users.

**Solution**: Test keyboard navigation and ARIA roles as part of every feature implementation. Use browser dev tools' accessibility inspector.

---

### ❌ Don't Emit Events for Every State Change

**Anti-Pattern**: Emitting events for internal state changes that parent doesn't need to know about.

```typescript
// ❌ WRONG - Too chatty
dispatch('focusChange', { tabId: tab.id });
dispatch('hoverStart', { tabId: tab.id });
dispatch('hoverEnd', { tabId: tab.id });
```

**Better**: Only emit events for user-initiated actions that require parent coordination.

```typescript
// ✅ CORRECT - Only meaningful actions
dispatch('activate', { tabId: tab.id });
dispatch('reorder', { segment, order });
dispatch('close', { tabId: tab.id });
```

---

### ❌ Don't Ignore TypeScript Errors

**Anti-Pattern**: Using `@ts-ignore` or `any` to silence type errors.

**Why it's dangerous**: Type errors often reveal real bugs. Silencing them creates technical debt.

**Solution**: Fix the root cause. If types are truly wrong, define proper types. If logic is wrong, fix the logic.

---

## Quick Reference: Key Learnings

| Category | Key Lesson |
|----------|-----------|
| **Svelte 5** | Use runes (`$state`, `$props`, `$derived`) for all reactive state |
| **Keyed Each** | Always use guaranteed-unique keys (timestamp + counter, not just timestamp) |
| **Testing** | Await `setTimeout(0)` after state changes for Svelte reactivity to settle |
| **Keyboard** | Check modifier keys BEFORE plain keys in if/else chains |
| **Accessibility** | Separate focus (arrow keys) from activation (Enter/Space) |
| **Events** | Keep event payloads minimal and JSON-serializable |
| **Timing** | Test with rapid repeated actions to catch race conditions |
| **Architecture** | Context menus as siblings, not nested children |
| **Documentation** | Write decision docs for bugs and architectural choices |
| **Process** | Independent user stories enable early delivery |

---

## Conclusion

The Tab Bar implementation was successful due to:
1. **Clear specification** with prioritized user stories
2. **Comprehensive testing** that caught bugs before production
3. **Iterative development** that delivered value incrementally
4. **Documentation** of decisions and learnings

**Most Critical Lesson**: Small details matter. If/else order, key uniqueness, event timing—these "minor" implementation details can make or break user experience. Test thoroughly, document decisions, and learn from every bug.

**For Next Feature**: Apply these patterns from day one:
- ✅ Use Svelte 5 runes consistently
- ✅ Write tests alongside implementation
- ✅ Test keyboard interactions and accessibility
- ✅ Document architectural decisions
- ✅ Create regression tests for bugs
- ✅ Review specs before coding

---

**Document Version**: 1.0  
**Last Updated**: October 14, 2025  
**Related Documents**:
- `specs/002-tab-bar-lifecycle/spec.md`
- `specs/002-tab-bar-lifecycle/tasks.md`
- `PROGRESS-002-tab-bar-complete.md`
- `TAB-ACTIVATION-FIXED.md`
- `TAB-REORDER-FIX.md`
- `BUGFIX-EVENT-LOG-DUPLICATE-KEYS.md`
