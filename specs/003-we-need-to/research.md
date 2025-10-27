# Research: Pane Lifecycle Events

Date: 2025-10-26

## Decisions and Rationale

### Resize Emission Policy

- Decision: Debounce trailing 100 ms (emit once after stop)
- Rationale: Minimizes event volume during continuous resize, aligns with spec’s success criteria (≤150 ms after stop), preserves responsiveness.
- Alternatives considered:
  - Throttle 10 Hz: Too jumpy for UX; may still be noisy.
  - Throttle 30 Hz: Smoother but increases event volume and subscriber load.
  - RAF (~60 Hz): Smooth but excessive for consumers; unnecessary for downstream logging/automation.

### Pane Identity

- Decision: `pane.id` is a stable string (unique within a window manager instance)
- Rationale: String identifiers (e.g., UUID, slug) are robust for logging and cross-system correlation without numeric collisions.
- Alternatives: Numeric ids (smaller) — rejected to avoid accidental reuse and to ease external correlation.

### Size and Position Units

- Decision: Pixels (integer) relative to the containing layout/viewport at emission time
- Rationale: Consumers typically need concrete rendered dimensions/coordinates for analytics and constraints; avoids ambiguity of percentages during transient layout states.
- Alternatives: Percentages or fractions — rejected due to rounding and multi-container ambiguity.

### Ordering Context (onpaneorderchanged)

- Decision: Provide `groupId` and `index` (0-based) within that group
- Rationale: Sufficient to reconstruct relative ordering in common layouts; avoids leaking internal structures.
- Alternatives: Full adjacency lists or z-order maps — rejected as overly detailed and unstable.

### Title Change Payload

- Decision: Include `previousTitle` and `title` (current) in payload
- Rationale: Supports audit trails and app-side UI updates without additional lookups.
- Alternatives: Current title only — rejected for lack of context.

## Implications for Design and Tests

- Event payload schemas will be defined in OpenAPI (webhooks) and reused in component tests.
- Tests will validate: one event per action, no-op suppression, terminal behavior after onpaneremoved, and debounce behavior for onpaneresized.
- Quickstart will demonstrate subscribing to multiple events and inspecting payload.
