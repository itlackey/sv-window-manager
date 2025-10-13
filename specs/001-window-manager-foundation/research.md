# Research — Window Manager Foundation

Date: 2025-10-12
Branch: 001-window-manager-foundation
Spec: ./spec.md

## Decisions and Rationale

### Ready Signal Contract

- Decision: Emit a single event named "ready" within 100ms after visual reveal; payload includes only the current tab title.
- Rationale: Minimal, stable contract that enables title sync and host timing without overfitting payload.
- Alternatives: "window-ready" with timestamp (more verbose); two-phase ready/focus (more complex).

### Preference Persistence Boundary

- Decision: Hybrid model. Renderer remembers side panel visibility/width within-session; host-stored values take precedence when available; renderer cache is fallback only.
- Rationale: Maintains UX continuity with host as source of truth; resilient in host-absent contexts.
- Alternatives: Renderer-only persistence (risks divergence); host-only (no graceful offline fallback).

### Shortcut Precedence (Configuration-Driven)

- Decision: Config-driven shortcuts. Minimal allowlist may override OS/host for core actions (tab nav, side panel toggle). Consumers can override/disable to avoid conflicts or defer to OS.
- Rationale: Balances power users’ needs and accessibility; avoids hardcoding conflicts; promotes reusability in host environments.
- Alternatives: Always defer to OS (limits functionality); always override (host conflict risk).

## Best Practices and Patterns

- Svelte 5 runes: use `$props()` to define typed config/events; `$derived` for computed modes; respect SSR by guarding browser-only APIs at runtime.
- Accessibility: Provide explicit roles/landmarks (toolbar/main/complementary); maintain visible focus; honor `prefers-reduced-motion`.
- Context menu: Determine items lazily; avoid heavy clipboard parsing; ensure menu navigable via keyboard.
- Event hygiene: Deduplicate ready signal; idempotent toggles; document event payloads and timing.
- Performance: Minimize layout thrash on panel toggle; debounce resize; prefer CSS transitions compatible with reduced motion.

## Open Follow-ups

- Document exact allowlist defaults for shortcuts in contracts (to be finalized in Phase 1).
- Define minimal appearance fields for initial contract (zoom, opacity, transparency, background color/image) and note extensibility.
