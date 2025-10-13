# Implementation Plan: Window Manager Foundation — Initialization, Global Interaction, and Layout Skeleton

**Branch**: `001-window-manager-foundation` | **Date**: 2025-10-12 | **Spec**: `./spec.md`
**Input**: Feature specification from `/specs/001-window-manager-foundation/spec.md`

## Summary

Establish the foundational shell for the SV Window Manager library: gated initialization with a flicker-free reveal and a single “ready” event; global keyboard and context menu frameworks; and a responsive layout skeleton with tab bar, main workspace, and a generic side panel container that initially hosts an example component. This plan delivers a reusable Svelte 5 component surface with clear events/config schemas and browser-based tests, forming the base for subsequent feature specs.

## Technical Context

**Language/Version**: TypeScript + Svelte 5 (Runes)
**Primary Dependencies**: SvelteKit (build/package), Vitest + vitest-browser-svelte (component tests), Playwright (E2E, demo), Storybook (docs)
**Storage**: N/A (library state in component; persistence via host contract when provided)
**Testing**: Vitest browser environment for components; Playwright E2E in demo app; Storybook a11y addon
**Target Platform**: Web (browser, Electron renderer); SSR-safe by default
**Project Type**: Svelte 5 component library (packaged via `@sveltejs/package`)
**Performance Goals**: UI reveal ≤500ms after data-ready; shortcuts ≤100ms; panel toggle ≤150ms
**Constraints**: A11y baseline (visible focus, roles/landmarks, reduced motion), composable API, no heavy runtime deps
**Scale/Scope**: Initial shell only (no terminal engine, AI chat, or tab operations)

NEEDS CLARIFICATION: None (resolved in spec). Where patterns need research, see Phase 0.

## Constitution Check

Pre-Design Gate (PASS: all planned):

- Reusability: Library surface minimal; export shell components/events from `src/lib/index.ts` (planned).
- Clean Code: Typed props/events; small modules; lint/svelte-check CI gates (planned).
- Tests: Component tests for render, interactions, and a11y; target ≥80% for new files in `src/lib/*` (planned).
- UX/A11y: Focus order, roles, reduced motion, and keyboard coverage are defined in spec and will be validated in stories/tests (planned).
- DX: Quickstart snippet included; Storybook story will document events/config (planned).
- Svelte 5 Runes: `$props()`, `$derived`, `$state` idioms; SSR guards for browser APIs (planned).

Post-Design Gate will re-check after artifacts are generated (see end of this plan).

## Project Structure

### Documentation (this feature)

```text
specs/001-window-manager-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── events.md
    ├── keyboard-shortcuts.schema.json
    ├── appearance.schema.json
    └── panel-state.schema.json
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── index.ts                      # re-exports
│   ├── WindowManagerShell.svelte     # main layout skeleton
│   ├── WindowManagerShell.svelte.spec.ts  # co-located component tests
│   ├── ExamplePanel.svelte           # example side-panel content
│   └── types.ts                      # shared types (events/config)
└── stories/
    └── WindowManagerShell.stories.svelte
```

**Structure Decision**: Single Svelte 5 library package. This feature adds a reusable shell component and supporting types, plus stories and component tests following existing repo conventions.

## Complexity Tracking

No constitution violations anticipated at plan time.
