# Feature Specification: Pane Lifecycle Events with Pane Payload

**Feature Branch**: `[003-we-need-to]`  
**Created**: 2025-10-26  
**Status**: Draft  
**Input**: User description: "we need to provide events for onpaneadded, onpaneremoved, onpaneminimized, onpanemaximized, onpanerestored, onpaneresized, and any other useful pane related event. it should pass the pane as the event arg including the props and store."

## Clarifications

### Session 2025-10-26

- Q: Resize event cadence during continuous resize? → A: Debounce 100 ms trailing

## User Scenarios & Testing for Pane Events

Constitution-aligned notes:

- Each scenario focuses on user value and observability of pane lifecycle events.
- Events must be discoverable, consistently named, and reliably emitted across all panes.
- Accessibility: No visual changes are mandated by this feature, but emitted events should not compromise interaction responsiveness or keyboard focus behavior.

### Pane Events — User Story 1: Listen to pane lifecycle (Priority: P1)

As an application developer, I can subscribe to pane lifecycle events to react to users adding, removing, minimizing, maximizing, restoring, resizing, and focusing panes, receiving a single, consistent payload describing the pane.

Why this priority: This is the core value of the feature—enabling host applications to respond to pane changes.

Independent Test: Attach listeners, perform each action on a pane, and verify one event is received per action with the expected payload fields.

Acceptance Scenarios:

1. Given an application with one pane, When the user maximizes the pane, Then an "onpanemaximized" event is emitted with the pane payload reflecting maximized state.
2. Given an application with multiple panes, When a new pane is added, Then an "onpaneadded" event is emitted with the payload for the new pane and no other panes.
3. Given a pane is minimized, When it is restored, Then an "onpanerestored" event is emitted with the pane payload reflecting the restored state.
4. Given a pane exists, When it is removed, Then an "onpaneremoved" event is emitted and no further events for that pane are emitted thereafter.

---

### Pane Events — User Story 2: Telemetry and audit logging (Priority: P2)

As a product owner, I can log pane lifecycle events with consistent names and payloads to understand usage patterns (e.g., how often panes are added, resized, or minimized) without modifying window manager internals.

Why this priority: Enables data-driven insights and informed UI/product decisions.

Independent Test: Wire event listeners to a logger, perform typical pane operations, and confirm logs contain correct event names and payloads.

Acceptance Scenarios:

1. Given logging is attached, When the user resizes a pane, Then each emitted "onpaneresized" event includes current size and position and can be correlated by pane id.
2. Given multiple panes, When the user cycles focus, Then "onpanefocused" and "onpaneblurred" events are emitted with the correct pane ids and timestamps.

---

### Pane Events — User Story 3: Business rules and app-side automation (Priority: P3)

As an application developer, I can enforce business rules (e.g., prevent orphan panes, trigger save prompts) by listening to pane events and acting accordingly on the app side.

Why this priority: Secondary value enabling richer behaviors without coupling to the window manager's internals.

Independent Test: Register listeners that update app state based on events; verify expected app behaviors occur in response to event streams.

Acceptance Scenarios:

1. Given a listener tracks active pane, When an "onpanefocused" event occurs, Then the app updates its active context label immediately.
2. Given a listener tracks layout changes, When "onpaneorderchanged" fires, Then the app persists new ordering in its own store.

---

### Edge Cases for Pane Events

- No-op transitions: Emitting an action that does not change state (e.g., maximize an already maximized pane) MUST NOT emit a duplicate event.
- Rapid resize: During continuous resize, "onpaneresized" is debounced with a trailing 100 ms window; emit exactly one event after no further size changes for ≥100 ms, with no intermediate resize events.
- Race conditions: Adding and immediately removing a pane SHOULD emit both events in chronological order; downstream must receive a final "onpaneremoved" with no subsequent events for that pane.
- Focus changes during removal: If a pane loses focus because it is removed, "onpaneblurred" SHOULD NOT be emitted redundantly after "onpaneremoved".
- Bulk operations: Adding or removing multiple panes in quick succession SHOULD emit per-pane events reliably without missed or merged payloads.

## Requirements for Pane Events

### Functional Requirements for Pane Events

- FR-001: The system MUST emit the following pane lifecycle events: onpaneadded, onpaneremoved, onpaneminimized, onpanemaximized, onpanerestored, onpaneresized.
- FR-002: The system MUST emit additional interaction events that are broadly useful: onpanefocused, onpaneblurred, onpaneorderchanged, onpanetitlechanged.
- FR-003: Each event MUST include a single "pane" payload argument that contains: a stable identifier, user-visible label/title (if available), current size and position, current visibility state (minimized/maximized/normal), and the pane's configuration properties and dynamic state.
- FR-004: Event names MUST be stable, lowercase, and consistently prefixed with "onpane" to ensure discoverability and filtering.
- FR-005: Events MUST reflect the post-action state (i.e., emitted after the state change is applied) to ensure payload consistency.
- FR-006: No-op transitions MUST NOT emit events (e.g., attempting to minimize an already minimized pane).
- FR-007: For "onpaneresized", the payload MUST include both size and position at the time of emission.
- FR-008: For "onpaneorderchanged", the payload MUST include ordering context sufficient to infer the pane's relative position (e.g., index within its group or a relative ordering key).
- FR-009: For "onpanetitlechanged", the payload MUST include both previous and new titles.
- FR-010: Event emission MUST be per-pane; a single user action on one pane MUST NOT produce lifecycle events for other panes unless those panes are directly affected (e.g., focus shift).
- FR-011: After "onpaneremoved" is emitted for a pane, the system MUST NOT emit further events for that pane id.
- FR-012: The system MUST debounce "onpaneresized" with a trailing 100 ms window during continuous resize (emit one event after the user stops changing size for ≥100 ms; no intermediate events).
- FR-013: The system MUST document all event names, payload fields, and example flows (add→maximize→resize→restore→remove) for integrators.

### Key Entities (pane data)

- Pane: A user-visible unit within the window manager. Attributes: id (stable), label/title, size (width/height), position (x/y or relative slot), z-order/index, state (minimized/maximized/normal), configuration properties, dynamic state.
- PaneEvent: A discrete occurrence tied to a single pane. Attributes: type (one of the defined event names), timestamp, pane payload (as above), optional previous values when relevant (e.g., previousTitle for onpanetitlechanged).

## Success Criteria for Pane Events

### Measurable Outcomes for Pane Events

- SC-001: For each defined action (add, remove, minimize, maximize, restore, resize, focus, blur), one corresponding event is emitted with a payload containing id, label/title, size, position, and state—verified across at least 3 panes per action.
- SC-002: No-op actions (e.g., maximizing an already maximized pane) produce zero lifecycle events in 100% of sampled attempts (minimum 20 attempts per action type).
- SC-003: During a continuous resize gesture, subscribers observe at most 1 "onpaneresized" event, emitted within 150 ms after the user stops resizing (no emissions during movement), while interaction remains responsive.
- SC-004: After a pane is removed, no further events referencing that pane id are observed across a 10-second observation window.
- SC-005: Event naming and payload fields are consistent across panes; automated checks confirm presence and types of required fields for all event types. Event names are lowercase and prefixed with "onpane".

### Traceability

- Each user story maps to automated checks that simulate the pane actions and assert event emission and payload content.
- Accessibility is preserved: interaction responsiveness and focus handling remain unaffected when listeners are attached.

## Assumptions for Pane Events

- Integrators will attach listeners using the host application's standard event/listener mechanism.
- The "pane payload" includes both configuration properties and dynamic state, sufficient for downstream logic without direct references to internal implementation.
- Title is optional; if absent, label/title fields may be empty while id remains present and stable.
- Resize events may be coalesced for performance; downstream consumers should not rely on receiving every intermediate pixel change.

 
