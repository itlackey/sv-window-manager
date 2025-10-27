# Tasks: Pane Lifecycle Events with Pane Payload

Branch: 003-we-need-to | Owners: window-manager | Date: 2025-10-26

Conventions

- Tasks are numbered T001+ in rough execution order; use deps to control sequencing.
- [P] indicates tasks that can run in parallel once their deps are met.
- Deliverable: runnable code + tests (unit/browser/E2E) + docs; exports stable via `src/lib/index.ts`.

## Phase 0 – Prep and Hygiene

- T001: Confirm spec artifacts and cleanups [DONE by doc edit]
  - Deps: none
  - Actions: Remove placeholder block from `specs/003-we-need-to/spec.md`. Ensure spec, research, data-model, contracts, quickstart align on event names and debounce.
  - Acceptance: `spec.md` contains only final content; no duplicated template sections.

- [X] T002: Verify test environments run
  - Deps: none
  - Actions: Run `npm run test:unit`, `npm run test` locally; note current failures unrelated to feature.
  - Acceptance: Baseline tests pass (or failures documented with scope).
  - Notes: Unit tests passed; observed one "vitest browser connection closed" unhandled error from @vitest/browser during run. Treating as unrelated to this feature and will monitor.

- [X] T003: Create or switch to feature branch `003-we-need-to`
  - Deps: none
  - Actions: Ensure branch exists and is used for commits.
  - Acceptance: Branch present and clean.

## Phase 1 – Types and Public API

- [X] T010: Define event payload types [P]
  - Deps: none
  - Files: `src/lib/events/types.ts` (new) or extend `src/lib/bwin/types.ts` (if preferred)
  - Actions: Add `PanePayload`, `PaneEventType`, `PaneEvent`, `PaneContext` types mirroring `contracts/openapi.yaml`.
  - Acceptance: TypeScript builds; types align with OpenAPI enums and shapes.

- [X] T011: Export event types from package [P]
  - Deps: T010
  - Files: `src/lib/index.ts`
  - Actions: Re-export types so consumers can import `import type { PaneEvent, PanePayload } from 'sv-window-manager'`.
  - Acceptance: Types resolvable from library root.

## Phase 2 – Event Dispatcher (Typed, SSR-safe)

- [X] T020: Implement a lightweight typed event bus
  - Deps: T010
  - Files: `src/lib/events/dispatcher.ts` (new)
  - Actions: Provide `on(event, handler)`, `off(event, handler)`, `emit(event, payload)`; no DOM/window usage (SSR-safe). Keep listeners in module scope.
  - Acceptance: Unit tests verify subscribe/unsubscribe/emit semantics; emitter stamps ISO 8601 `timestamp` and sets `type` consistently for all events.

- [X] T021: Public API for subscriptions [P]
  - Deps: T020
  - Files: `src/lib/index.ts`
  - Actions: Export `onPaneEvent`, `offPaneEvent`, and specific helpers like `onpaneadded(handler)` as thin wrappers (optional convenience).
  - Acceptance: Consumers can subscribe; type inference works per event type.

- [X] T022: Pane payload builder [P]
  - Deps: T010
  - Files: `src/lib/events/payload.ts` (new)
  - Actions: Provide `buildPanePayload(sash, paneEl?)` that composes id, title, size, position, state, config (store snapshot), dynamic (runtime snapshot).
  - Acceptance: Used by all emit sites; unit tests cover shape and undefined handling.

## Phase 3 – Instrumentation (Emit Events)

- [X] T030: Emit onpaneadded in BinaryWindow.addPane
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/binary-window/BinaryWindow.svelte`
  - Actions: After `treeVersion++` (post-action), construct `PanePayload` with `buildPanePayload` from `newPaneSash` and emit `onpaneadded` (includes config and dynamic).
  - Acceptance: Browser test sees one event with correct id/title/size/position/state.

- [X] T031: Emit onpaneremoved in BinaryWindow.removePane
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/binary-window/BinaryWindow.svelte`
  - Actions: After pane removal (post-action), emit `onpaneremoved` using `buildPanePayload` (last known store/config where possible); enforce terminal rule (no later events for that id from our emit points).
  - Acceptance: Event emitted once; follow-on actions for that id don’t emit.

- [X] T032: Emit onpaneminimized in minimize action
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/binary-window/actions.minimize.ts`
  - Actions: Emit strictly post-action per FR-005: after minimized glass element is created and pane removal completes, emit `onpaneminimized` using `buildPanePayload` (state minimized; include original bounds for size/position if available). Suppress no-op if already minimized.
  - Acceptance: Event emitted with pane id and minimized state.

- [X] T033: Emit onpanerestored when restoring from minimized
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/managers/sill-state.svelte.ts`
  - Actions: In `restoreGlass`, after pane is reinserted and store restored (post-action), emit `onpanerestored` via `buildPanePayload`.
  - Acceptance: Event emitted with restored state; title preserved.

- [X] T034: Emit onpanemaximized and onpanerestored in maximize toggle
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/binary-window/actions.maximize.js`
  - Actions: Update action signature to accept `(event, binaryWindow)` like minimize. On maximize: emit `onpanemaximized`; on unmaximize: emit `onpanerestored`. Use `buildPanePayload` combining pane DOM bounds and `rootSash.getById` store. Suppress no-op when already in target state.
  - Acceptance: Correct event type for toggle; no-op transitions emit nothing.

- T035: Emit debounced onpaneresized from user muntin drags
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/actions/resize.svelte.ts`
  - Actions: Track the two affected leaf panes during a drag; schedule a trailing 100 ms debounce after last movement (or mouseup) and emit `onpaneresized` for each affected pane with final `size`/`position` via `buildPanePayload` (includes config/dynamic). Ensure no emissions during movement; ignore container `fit()` changes.
  - Acceptance: During a continuous drag, at most one event per affected pane, ≤150 ms after stop.

- T036: Emit onpanefocused/onpaneblurred
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/frame/Pane.svelte` (or `Glass.svelte`)
  - Actions: Add delegated `focusin`/`focusout` listeners on the pane container; treat any descendant focus as pane focus; emit via `buildPanePayload`. Suppress redundant blur on removal.
  - Acceptance: Tabbing/click sets focus; events received with correct ids.

- T037: Emit onpaneorderchanged on swapPanes
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/frame/Frame.svelte`
  - Actions: After swapping stores, define `groupId` as parent sash id and `index` as order within the parent's leaf panes; emit for each affected pane with `context.previousIndex` and new `index` via `buildPanePayload`.
  - Acceptance: Events emitted for both panes; indices reflect new order.

- T038: Emit onpanetitlechanged when title changes
  - Deps: T020, T010, T022
  - Files: `src/lib/bwin/binary-window/Glass.svelte`
  - Actions: Track previous `title` prop via `$effect`; when it changes, emit with `context.previousTitle` and new `pane.title` via `buildPanePayload`.
  - Acceptance: Event fires exactly once per effective title change.

## Phase 4 – Tests (Unit + Browser)

- [X] T040: Unit tests for dispatcher and type safety [P]
  - Deps: T020
  - Files: `src/lib/events/dispatcher.spec.ts`
  - Actions: Subscribe/emit/off scenarios; ensure memory-safe behavior and no cross-event leakage.
  - Acceptance: Passes in `npm run test:unit`.

- T041: Browser tests for add/remove/minimize/maximize/restore
  - Deps: T030–T034
  - Files: co-located `*.svelte.spec.ts` under relevant components
  - Actions: Render `BinaryWindow`, perform actions, assert events captured with correct payloads.
  - Acceptance: All event tests green; payload shape validated.

- T042: Browser test for debounced resize
  - Deps: T035
  - Actions: Simulate muntin drag with multiple moves; assert exactly one `onpaneresized` per pane after 100 ms idle.
  - Acceptance: Matches SC-003.

- T043: Browser tests for focus/blur
  - Deps: T036
  - Actions: Keyboard tab and click; assert `onpanefocused`/`onpaneblurred` sequence.
  - Acceptance: Correct sequencing; no redundant blur on removal.

- T044: Browser test for order changed
  - Deps: T037
  - Actions: Use `swapPanes`; assert `onpaneorderchanged` for both panes with index/context.
  - Acceptance: Indices match expectations.

- T045: Browser test for title changed
  - Deps: T038
  - Actions: Update `sash.store.title`; assert `onpanetitlechanged` with previous/new titles.
  - Acceptance: Fires once per change.

- T041a: No-op suppression tests
  - Deps: T030–T038
  - Actions: For each event type, attempt no-op action (e.g., minimize when minimized) and assert no event is emitted.
  - Acceptance: Matches FR-006 across all event types.

- T041b: No events after removal (terminal rule)
  - Deps: T031
  - Actions: Remove a pane, then attempt further actions or observe for a 10s window; assert zero events for that pane id.
  - Acceptance: Matches SC-004.

- T046: Contract validation against OpenAPI
  - Deps: T021, T030–T038
  - Files: `tests/contract/` (new)
  - Actions: Validate emitted payloads against `specs/003-we-need-to/contracts/openapi.yaml` schemas.
  - Acceptance: All events conform to schema; failing payloads fail tests.

- T047: Naming convention assertion
  - Deps: T021
  - Actions: Add assertion that all exported event names are lowercase and start with `onpane`.
  - Acceptance: Fails if nonconforming event types are introduced.

## Phase 5 – Docs and Storybook

- T050: Update quickstart with subscription examples [P]
  - Deps: T021
  - Files: `specs/003-we-need-to/quickstart.md`
  - Actions: Add `onPaneEvent` usage and snippet to filter by type/id.
  - Acceptance: Docs show working example.

- T051: Storybook event logger story [P]
  - Deps: T021
  - Files: `src/stories/` (new story)
  - Actions: Add a story that subscribes and logs events in a panel; simple interactions.
  - Acceptance: Story renders; a11y passes; events visible.

- T052: README update – Events API
  - Deps: T021
  - Files: `README.md`
  - Actions: Describe event names, payload, debounce; link to spec and contracts.
  - Acceptance: Lint passes; content accurate.

## Phase 6 – E2E Enhancements (Optional but Recommended)

- T060: E2E: Validate core event flow in demo
  - Deps: T030–T035, T036
  - Files: `e2e/` new spec
  - Actions: Run demo page flows; assert presence of event logs via a simple in-page sink.
  - Acceptance: Green in CI Playwright run.

- T061: Ensure a11y unaffected
  - Deps: none
  - Actions: Re-run existing accessibility E2E; ensure no regressions.
  - Acceptance: All existing a11y specs pass.

## Phase 7 – Packaging and Quality Gates

- T070: Public exports wired
  - Deps: T011, T021
  - Files: `src/lib/index.ts`
  - Actions: Re-export types and subscription API.
  - Acceptance: `npm pack` includes types and public API; publint clean.

- T071: Lint, typecheck, and coverage
  - Deps: All
  - Actions: `npm run check`, `npm run test` with coverage; ensure ≥80% in `src/lib/*` for touched files.
  - Acceptance: PASS on Build/Lint/Typecheck; coverage threshold met.

## Dependencies (Graph)

- T002 → none
- T003 → none
- T010 → none
- T011 → T010
- T020 → T010
- T021 → T020
- T030 → T020, T010, T022
- T031 → T020, T010, T022
- T032 → T020, T010, T022
- T033 → T020, T010, T022
- T034 → T020, T010, T022
- T035 → T020, T010, T022
- T036 → T020, T010, T022
- T037 → T020, T010, T022
- T038 → T020, T010, T022
- T040 → T020
- T041 → T030–T034
- T041a → T030–T038
- T041b → T031
- T042 → T035
- T043 → T036
- T044 → T037
- T045 → T038
- T046 → T021, T030–T038
- T047 → T021
- T050 → T021
- T051 → T021
- T052 → T021
- T060 → T030–T036
- T061 → none
- T070 → T011, T021
- T071 → All feature tasks complete

## Notes and Assumptions

- Resize events are only for user-driven muntin drags, not container `fit()` changes.
- When resizing a divider, two panes are directly affected; emit `onpaneresized` for each.
- Focus/blur should use delegated focusin/focusout to capture within pane region.
- Title changes are observed via `Glass` props; if in future titles migrate elsewhere, move the observer accordingly.
