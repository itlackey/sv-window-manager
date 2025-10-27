# Implementation Plan: Pane Lifecycle Events with Pane Payload

**Branch**: `003-we-need-to` | **Date**: 2025-10-26 | **Spec**: /home/founder3/code/github/itlackey/sv-window-manager/specs/003-we-need-to/spec.md
**Input**: Feature specification from `/specs/003-we-need-to/spec.md`

## Summary

Implement a consistent set of on‑prefixed pane lifecycle and interaction events (e.g., onpaneadded, onpaneremoved, onpaneminimized, onpanemaximized, onpanerestored, onpaneresized, onpanefocused, onpaneblurred, onpaneorderchanged, onpanetitlechanged). Each event delivers a single pane payload including stable id, label/title, size, position, state, and configuration/dynamic state. For resize, emit using a trailing debounce of 100 ms (one event after the user stops moving).

## Technical Context

**Language/Version**: TypeScript, Svelte 5 (library)  
**Primary Dependencies**: SvelteKit (packaging/dev), Vitest + vitest-browser-svelte, Playwright (E2E), Storybook  
**Storage**: N/A (in‑memory state only)  
**Testing**: Vitest (browser for components), Playwright for E2E demo flows  
Contract validation: Validate emitted event payloads against `contracts/openapi.yaml` using a test suite.
**Target Platform**: Web (modern browsers), SSR-compatible components  
**Project Type**: Svelte component library with demo app  
**Performance Goals**: Interactions ≤16ms/frame; debounce onpaneresized trailing 100 ms with emission ≤150 ms after stop  
**Constraints**: Stable public API, typed events, no-op transitions emit nothing, no events after onpaneremoved for a pane id  
Naming: Event types are lowercase and prefixed with `onpane` (guarded by tests)  
**Scale/Scope**: Multiple panes per layout; frequent resize and focus changes expected

## Constitution Check

Pass (pre-design) — aligns with constitution:

- Reusability: Events are the public API; all exports from `src/lib/index.ts` will be maintained and documented.
- Clean Code: Add/extend types for pane payloads and events; no lint/type errors allowed.
- Tests: Component tests will assert emission and payload shape; target ≥80% coverage in `src/lib/*`.
- UX/A11y: No negative impact; focus events included and validated in tests/stories.
- DX: Quickstart will be added to spec folder and Storybook notes.
- Svelte 5 Runes: Props/state via runes; SSR safety respected.

## Project Structure

### Documentation (this feature)

```text
specs/003-we-need-to/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── openapi.yaml
```

### Source Code (repository root)

```text
src/
└── lib/
    └── (existing window manager components; event emissions will be added)

tests/
├── contract/           # JSON schema/OpenAPI payload checks (to be added)
└── unit/               # Vitest component tests co-located where applicable
```

**Structure Decision**: Single-project Svelte library; documentation and contracts live under the feature specs directory; public exports in `src/lib/index.ts`.

## Complexity Tracking

No violations anticipated.

## Phase Outputs

- Research: /home/founder3/code/github/itlackey/sv-window-manager/specs/003-we-need-to/research.md
- Data Model: /home/founder3/code/github/itlackey/sv-window-manager/specs/003-we-need-to/data-model.md
- Contracts (OpenAPI webhooks): /home/founder3/code/github/itlackey/sv-window-manager/specs/003-we-need-to/contracts/openapi.yaml
- Quickstart: /home/founder3/code/github/itlackey/sv-window-manager/specs/003-we-need-to/quickstart.md
