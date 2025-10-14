---
description: "Tasks for implementing Tab Bar Lifecycle & Customization"
---

# Tasks: Tab Bar Lifecycle & Customization

**Input**: Design documents from `/specs/002-tab-bar-lifecycle/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. The feature spec does not explicitly request a TDD flow, but the constitution requires component tests for public components. We'll include component tests as part of each user story's tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/`, `e2e/`, `src/stories/`
- Library components: `src/lib/`, exported from `src/lib/index.ts`
- Component tests (browser): colocated as `.svelte.spec.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure local environment and scaffolding exist for tab bar work

- [ ] T001 [P] Create placeholder TabBar component file `src/lib/components/TabBar.svelte`
- [ ] T002 [P] Export `TabBar` from `src/lib/index.ts`
- [ ] T003 [P] Add Storybook story scaffold `src/stories/TabBar.stories.svelte`
- [ ] T004 [P] Verify lint/typecheck pipeline recognizes new files (`npm run check` locally)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST exist before stories

- [ ] T005 Define public props and events contract for `TabBar` per spec in `src/lib/components/TabBar.svelte` header doc (name, id, pinned, order, activeId; events: reorder, pin, rename)
- [ ] T006 [P] Ensure `src/lib/WindowManagerShell.svelte` (or shell) exposes mounting region for tab bar if not already present
- [ ] T007 [P] Add minimal styles (CSS vars) for tab strip regions (pinned, regular, controls) in `src/lib/components/TabBar.svelte`
- [ ] T008 Establish a11y roles and landmarks for tablist and tabs (ARIA roles) in `TabBar`
- [ ] T009 Add reduced motion handling toggle via `prefers-reduced-motion` CSS respect

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reorder Tabs with Persistence (Priority: P1) 🎯 MVP

**Goal**: Drag-and-drop and keyboard reordering with edge auto-scroll; order updates immediately and persists via host

**Independent Test**: Render 8+ tabs; reorder across overflow with edge auto-scroll; verify final order and that `reorder` event publishes new segment-local order

### Tests (Component) — US1

- [ ] T010 [US1] Create `TabBar.svelte.spec.ts` happy-path render and role assertions near `src/lib/components/TabBar.svelte.spec.ts`
- [ ] T011 [US1] Add DnD reorder test with edge auto-scroll simulation; assert order emitted and focus remains sensible
- [ ] T012 [US1] Add keyboard reorder test (move left/right); assert order emitted and a11y focus indicators visible

### Implementation — US1

- [ ] T013 [US1] Implement tab rendering with segmented pinned/regular lists in `TabBar.svelte`
- [ ] T014 [US1] Implement drag-and-drop reorder within segment with edge auto-scroll logic
- [ ] T015 [US1] Emit `reorder` event with new order per segment; throttle/debounce if needed
- [ ] T016 [US1] Implement keyboard reorder actions and focus handling
- [ ] T017 [US1] Overflow handling: horizontal scroll, active tab visibility on focus change
- [ ] T044 [US1] Add overflow usability test asserting ≤2 interactions to access any tab (keyboard/scroll paths)
- [ ] T045 [US1] Implement host update application (apply order/pin/name updates with host precedence)
- [ ] T046 [US1] Add precedence test: local reorder then host update; assert host wins deterministically

**Checkpoint**: US1 independently functional — reorder works with event emission and a11y

---

## Phase 4: User Story 2 - Inline Rename with Validation (Priority: P2)

**Goal**: Inline rename with validation (trimmed non-empty, ≤60 chars), commit/cancel behaviors, and title sync

**Independent Test**: Activate rename; test empty and too-long inputs; commit valid name and verify `rename` event and window title sync call site hooks

### Tests (Component) — US2

- [ ] T018 [US2] Add rename activation test (context menu or direct affordance); verify editable state and selection
- [ ] T019 [US2] Add validation tests: empty → error stays in edit; >60 chars → error; valid → emits rename, exits edit
- [ ] T020 [US2] Add title sync timing assertion (rename → title update within 100ms via mock)

### Implementation — US2

- [ ] T021 [US2] Implement inline rename UI for a single tab, selection on enter, Escape to cancel, Enter/blur to commit
- [ ] T022 [US2] Enforce validation (trimmed non-empty, ≤60) with inline error state and tooltip/aria-live
- [ ] T023 [US2] Emit `rename` event `{ tabId, name }`; add hook for host title sync

**Checkpoint**: US2 independently functional — rename validated and emits events

---

## Phase 5: User Story 3 - Pinned Tabs and Tab Bar Controls (Priority: P3)

**Goal**: Pin/unpin with a clear indicator and segment behavior; integrate companion controls and config error indicator

**Independent Test**: Pin/unpin tabs; pinned indicator visible; pinned list remains visible regardless of scroll; controls present; injected config error shows indicator

### Tests (Component) — US3

- [ ] T024 [US3] Add pin/unpin test and verify movement to/from pinned segment without selection loss
- [ ] T025 [US3] Add pinned indicator visibility test and reduced motion behavior on activation animation
- [ ] T026 [US3] Add controls presence test (AI toggle, workspace switcher, add-tab) and config error indicator visibility
- [ ] T035 [US3] Add test for add-tab roll‑in animation; verify reduced motion minimizes or disables motion
- [ ] T036 [US3] Add test for close behavior: focus moves to left neighbor or right if none; no focus loss
- [ ] T040 [US3] Add context menu completeness test: Copy Tab ID, Background Presets, Close; keyboard accessible
- [ ] T048 [US3] Add test for config error indicator discoverability and action to open details
- [ ] T049 [US3] Add test for pinned segment overflow scroll; ensure regular tabs are not masked

### Implementation — US3

- [ ] T027 [US3] Implement pin/unpin via context menu and shortcut; move within segments accordingly (drag remains in-segment)
- [ ] T028 [US3] Render pinned segment that remains visible irrespective of horizontal scroll; maintain separate overflow scrolling if needed
- [ ] T029 [US3] Render companion controls and wire stub events for toggles/switcher/add; render config error indicator with accessible label
- [ ] T037 [US3] Implement add-tab roll‑in animation (≤200ms ease‑out; ≤100ms with reduced motion)
- [ ] T038 [US3] Implement close behavior focus logic and guard against content jump
- [ ] T041 [US3] Implement Copy Tab ID action with accessible feedback (non-intrusive announcement)
- [ ] T042 [US3] Implement Background Presets submenu; emit selection for host to apply
- [ ] T043 [US3] Implement Close action; ensure selection/focus rules applied and no layout jump
- [ ] T047 [US3] Wire config error indicator to emit `openConfigDetails` (or open detail panel) with accessible name/description

**Checkpoint**: US3 independently functional — pin behavior and UI controls present

---

## Final Phase: Polish & Cross‑Cutting

- [ ] T030 [P] Performance profiling pass: ensure ≥45 FPS during drag; auto-scroll engage ≤150ms
- [ ] T031 [P] A11y audit pass in Storybook (roles, labels, focus order, reduced motion)
- [ ] T032 [P] Documentation: Update `src/lib/README.md` and `src/stories/TabBar.stories.svelte` with usage and a11y notes
- [ ] T033 [P] Export verification: `src/lib/index.ts` exports `TabBar`
- [ ] T034 [P] Demo integration: mount TabBar in `src/routes/+page.svelte` if applicable
- [ ] T050 [P] Build gate: ensure `npm run build` and `publint` pass with new component exports

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational → US1 → US2 → US3 → Polish

### User Story Dependencies

- US1 has no dependency on other stories; US2/US3 can be implemented in parallel once foundational tasks are done, but both may reuse the same component file (sequence edits to avoid conflicts)

### Parallel Opportunities

- [P] tasks within different files: exports/index, stories, tests, docs
- US2 tests can run in parallel with US3 tests
- Polish tasks are parallelizable

---

## Implementation Strategy

### MVP First

- Deliver US1 (reorder + persistence event) with a11y and overflow

### Incremental Delivery

- Add US2 (rename + title sync hook)
- Add US3 (pinned + controls + error indicator)

---

## Independent Test Criteria (per story)

- US1: Reorder across overflow with edge auto-scroll; verify emitted order and focus
- US2: Rename validation and commit/cancel; window title sync timing
- US3: Pin/unpin behavior; controls presence; config error indicator visibility

---

## Task Counts

- Total tasks: 50
- US1: 11 (T010–T017, T044–T046)
- US2: 6 (T018–T023)
- US3: 14 (T024–T029, T035–T043, T047–T049)
- Setup + Foundational + Polish: 19
