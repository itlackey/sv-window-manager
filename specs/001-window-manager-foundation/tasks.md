---
description: "Task list for implementing the Window Manager Foundation feature"
---

# Tasks: Window Manager Foundation — Initialization, Global Interaction, and Layout Skeleton

**Input**: Design documents from `/specs/001-window-manager-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Public components require automated component tests using Vitest + `vitest-browser-svelte` per the Constitution. Tests are included below per story in TDD order (write tests first, watch them fail, then implement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure repo tooling aligns with plan and constitution; no codegen, only verification/minor config.

- [X] T001 [P] Verify Vitest browser setup is enabled for Svelte components (check `vitest-setup-client.ts` referenced by config) — `vitest.config.ts`
- [X] T002 [P] Verify Storybook is configured for Svelte and a11y addon is enabled — `.storybook/*` or project config
- [X] T003 [P] Confirm packaging exports for library (types and svelte) — `package.json` and `src/lib/index.ts`
- [X] T004 [P] Ensure lint/format/svelte-check scripts exist and pass on current repo — `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared types, config surfaces, and exports that all stories depend on.

- [X] T005 [US-Foundation] Create shared types for shell config and events — `src/lib/types.ts`
  - ShellConfig: `keyboard`, `appearance`, `panel`
  - Events: `ReadyDetail { title: string }`
- [X] T006 [US-Foundation] Update public exports to include types and component placeholders — `src/lib/index.ts`
- [X] T007 [US-Foundation] Prepare example component placeholder to host in side panel — `src/lib/ExamplePanel.svelte`
- [X] T008 [US-Foundation] Add Storybook story scaffold for shell — `src/stories/WindowManagerShell.stories.svelte`

**Checkpoint**: Foundation ready — user stories can now be implemented in parallel.

---

## Phase 3: User Story 1 — Gated Initialization and Ready Reveal (Priority: P1) 🎯 MVP

**Goal**: Flicker-free reveal after appearance and minimal data ready; emit a single `ready` event with current tab title.

**Independent Test**: Render shell with delayed mock data; verify UI hidden before ready, appearance applied at reveal, single `ready` emitted with title.

### Tests for User Story 1 (Write first)

- [X] T009 [P] [US1] Component test: hidden-then-reveal sequencing and event emission — `src/lib/WindowManagerShell.svelte.spec.ts`
- [X] T010 [P] [US1] Component test: appearance application on first paint (zoom/opacity) — `src/lib/WindowManagerShell.svelte.spec.ts`

### Implementation for User Story 1

- [X] T011 [US1] Implement shell component skeleton with reveal gate and appearance application — `src/lib/WindowManagerShell.svelte`
- [X] T012 [US1] Implement `ready` event emission (≤100ms post-reveal) with `{ title }` payload — `src/lib/WindowManagerShell.svelte`
- [X] T013 [US1] Title sync on reveal using provided workspace summary — `src/lib/WindowManagerShell.svelte`
- [X] T014 [US1] SSR/browser guard for window-dependent APIs — `src/lib/WindowManagerShell.svelte`
- [X] T015 [US1] Storybook story: ready flow demonstration and knobs for appearance — `src/stories/WindowManagerShell.stories.svelte`

**Checkpoint**: US1 independently testable (reveal + ready + appearance).

---

## Phase 4: User Story 2 — Global Keyboard and Context Menu Framework (Priority: P2)

**Goal**: Config-driven keyboard shortcuts and adaptable context menu based on selection/clipboard.

**Independent Test**: Verify keyboard shortcuts actions (tab nav, side panel toggle) and context menu variants (Copy/Paste enablement; Open Link when URL-like content is detected).

### Tests for User Story 2 (Write first)

- [X] T016 [P] [US2] Component test: keyboard bindings configurable and overridable — `src/lib/WindowManagerShell.svelte.spec.ts`
- [X] T017 [P] [US2] Component test: context menu item states (enabled/disabled) based on selection/clipboard — `src/lib/WindowManagerShell.svelte.spec.ts`

### Implementation for User Story 2

- [X] T018 [US2] Implement config-driven keyboard handler (overridePolicy, allowlist, bindings with `togglePanel`) — `src/lib/WindowManagerShell.svelte`
- [X] T019 [US2] Add basic context menu controller and items model — `src/lib/WindowManagerShell.svelte`
- [X] T020 [US2] Add accessible context menu UI (keyboard navigable) — `src/lib/components/ContextMenu.svelte` (inlined for MVP)
- [X] T021 [US2] Wire selection/clipboard heuristics (non-blocking, lazy) — `src/lib/WindowManagerShell.svelte`
- [X] T022 [US2] Storybook story: keyboard + menu showcase with knobs — `src/stories/WindowManagerShell.stories.svelte`

**Checkpoint**: US1 + US2 independently testable (shortcuts + context menu).

---

## Phase 5: User Story 3 — Layout Skeleton with Side Panel Container (Priority: P3)

**Goal**: Render tab bar, main workspace, and a resizable side panel that remembers visibility/width within the session; host the example component in the side panel.

**Independent Test**: Verify landmarks/roles, panel toggle persistence within session, and smooth resize without overlap.

### Tests for User Story 3 (Write first)

- [X] T023 [P] [US3] Component test: landmarks/roles (toolbar/main/complementary) — `src/lib/WindowManagerShell.svelte.spec.ts`
- [X] T024 [P] [US3] Component test: side panel toggle persists visibility and width in-session — `src/lib/WindowManagerShell.svelte.spec.ts`
- [X] T025 [P] [US3] Component test: responsive resize without overlap — `src/lib/WindowManagerShell.svelte.spec.ts`

### Implementation for User Story 3

- [X] T026 [US3] Implement layout regions with roles and focus order — `src/lib/WindowManagerShell.svelte`
- [X] T027 [US3] Implement side panel container with session memory (visibility, widthPx) — `src/lib/WindowManagerShell.svelte`
- [X] T028 [US3] Implement resizable behavior with reduced-motion compatibility — `src/lib/WindowManagerShell.svelte`
- [X] T029 [US3] Render `ExamplePanel.svelte` inside the side panel — `src/lib/WindowManagerShell.svelte`
- [X] T030 [US3] Storybook story: layout/resize demo with side panel shown/hidden — `src/stories/WindowManagerShell.stories.svelte`

### Additional for User Story 3 — Host Precedence for Panel State

- [X] T030A [US3] Initialize side panel state from host-provided config; fall back to session cache — `src/lib/WindowManagerShell.svelte`
- [X] T030B [P] [US3] Component test: host precedence overrides session cache for panel state — `src/lib/WindowManagerShell.svelte.spec.ts`

**Checkpoint**: US1 + US2 + US3 independently testable; foundation complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Stabilize API, docs, and a11y; ensure exports and packaging.

- [X] T031 [P] Validate quickstart snippet works as-is — `specs/001-window-manager-foundation/quickstart.md`
- [X] T032 [P] Add component README with usage and events — `src/lib/README.md`
- [X] T033 [P] Ensure all public exports present in `src/lib/index.ts` and package type exports validate — `src/lib/index.ts`, `package.json`
- [X] T034 A11y audit in Storybook (fix critical issues) — `src/stories/WindowManagerShell.stories.svelte`
- [X] T035 Code cleanup and comments for non-obvious decisions — multiple files (WindowManagerShell and FlashErrorOverlay annotated; no behavior changes)
- [X] T036 [P] (Optional) E2E demo scenario: reveal + toggle panel — `e2e/demo.test.ts`

### Flash Error Overlay (FR-007)

- [X] T037 [P] Implement Flash Error Overlay UI with click-to-copy and auto-expire — `src/lib/components/FlashErrorOverlay.svelte`
- [X] T038 [US-Polish] Integrate overlay into shell with non-blocking queue and timeouts — `src/lib/WindowManagerShell.svelte`
- [X] T039 [P] Component test: overlay renders, auto-expires, click-to-copy works — `src/lib/components/FlashErrorOverlay.svelte.spec.ts`
- [X] T040 [P] Storybook story: flash error scenarios and a11y checks — `src/stories/WindowManagerShell.stories.svelte`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies — can start immediately
- Foundational (Phase 2): Depends on Setup completion — BLOCKS all user stories
- User Stories (Phase 3+): All depend on Foundational phase completion
- Polish (Final Phase): Depends on all desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Can start after Foundational; no dependencies on other stories
- User Story 2 (P2): Can start after Foundational; independent, may share handlers
- User Story 3 (P3): Can start after Foundational; independent layout work

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Implement in the order shown for deterministic results

### Parallel Opportunities

- [P] tasks in Setup can run together (T001–T004)
- [P] tasks in tests per story can run together (e.g., T009–T010, T016–T017, T023–T025)
- ContextMenu UI (T020) can be developed in parallel with handler wiring (T018/T019) once the shell file API surface exists
- Storybook updates per story are parallelizable once core implementation compiles

---

## Parallel Example: User Story 2

```bash
# Run tests first (in parallel if desired):
T016 Component test: keyboard bindings configurable and overridable
T017 Component test: context menu item states

# Then parallelize implementation where safe:
T020 ContextMenu UI (new file)  [P]
T018 Keyboard handler (shell)   
T019 Menu controller (shell)    
T021 Clipboard heuristics (shell)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (Phase 1)
2. Complete Foundational (Phase 2)
3. Complete User Story 1 (Phase 3)
4. STOP and VALIDATE: Test and demo US1 independently

### Incremental Delivery

1. Foundation → US1 → Demo
2. US2 → Demo
3. US3 → Demo

---

## Counts & Summary

- Total tasks: 42
- Task count per story: US1 = 7 (incl. 2 tests), US2 = 7 (incl. 2 tests + 1 UI file), US3 = 10 (incl. 4 tests)
- Parallel opportunities: Setup (4), Tests per story (2–3), ContextMenu UI (1), Docs (2)
- Independent test criteria:
  - US1: Hidden-then-reveal, appearance applied, single `ready` event with title
  - US2: Keyboard bindings configurable/overridable; context menu adapts to selection/clipboard
  - US3: Landmarks/roles present; side panel toggle persists visibility/width; resize without overlap; host precedence over session cache validated
- Suggested MVP scope: Complete US1 only
