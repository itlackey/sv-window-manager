# Research: Tab Bar Lifecycle & Customization

## Decisions and Rationale

### Persistence Authority (Host-Primary)

- Decision: Host is the primary source of truth for tab order, pin state, and names.
- Rationale: Aligns with PRD that host controls appearance/behavior and workspace memory; ensures consistency across windows/instances.
- Alternatives considered:
  - Renderer-primary: Simpler for demos; risks divergence across instances.
  - Hybrid with conflict resolution: Flexible but adds complexity without clear benefit over host-primary for this feature.

### Cross-Segment Drag Policy (Restricted)

- Decision: Dragging between pinned and regular segments is restricted; use Pin/Unpin via context menu to move across segments.
- Rationale: Prevents accidental cross-segment moves; keeps pinned region semantics stable; discoverability handled via context menu and shortcut affordances.
- Alternatives considered:
  - Allowed with clear affordance: More intuitive but higher risk of accidental moves.
  - Configurable policy: Flexible but increases preference surface and testing matrix.

### Rename Validation (60 Characters)

- Decision: Tab name max length is 60 characters; trimmed non-empty required.
- Rationale: Balances information density with readability and layout stability.
- Alternatives considered:
  - 80 characters: Allows longer labels but increases overflow/truncation.
  - Unlimited: Requires robust truncation and tooltip handling; validation shifts away from length.

### Performance Targets

- Decision: Edge auto-scroll engage ≤150ms; ≥45 FPS during drag interactions; rename→title sync ≤100ms.
- Rationale: Matches PRD expectations for smoothness and responsiveness; aligns with constitution (<16ms per frame ideal).
- Alternatives considered: Tighter thresholds (e.g., 60 FPS everywhere) not strictly necessary for initial library release.

## Best Practices Referenced

- A11y for tablists: roles, focus order, keyboard navigation (Left/Right to switch, Shift+ modifiers to reorder when supported).
- DnD UX: Lock axis for horizontal strips, edge auto-scroll with hysteresis to prevent overshoot.
- Overflow handling: Scrollbar + mouse wheel + keyboard access; visible active tab centering on focus change.
- Reduced motion: Prefer opacity/scale changes over large translations; preserve discernible state changes.

## Open Risks and Mitigations

- Risk: Very large tab counts (>200) may degrade performance.
  - Mitigation: Virtualization if needed; defer until benchmarks indicate necessity.
- Risk: Host/renderer divergence on rapid updates.
  - Mitigation: Debounce updates and apply host precedence; maintain idempotent apply logic.
- Risk: Discoverability of cross-segment move (restricted drag).
  - Mitigation: Clear Pin/Unpin in context menu; tooltip hint on pinned indicator.
