<!--
Sync Impact Report

- Version change: N/A → 1.0.0
- Modified principles: New document established
  - I. Reusability and Composition
  - II. Clean Code and Maintainability
  - III. Automated Component Testing (Vitest + Browser)
  - IV. User Experience and Accessibility
  - V. Developer Experience and Integration
  - VI. Svelte 5 Runes Best Practices
- Added sections: Quality Gates; Development Workflow and Review Process
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gates aligned)
  - ✅ .specify/templates/tasks-template.md (tests guidance aligned with constitution)
  - ✅ .specify/templates/spec-template.md (a11y/testing guidance aligned)
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): original adoption date not recorded; set when first adopted.
-->

# SV Window Manager Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### I. Reusability and Composition

Reusable first. Components MUST be self-contained, composable, and usable across
projects without repo-specific assumptions.

- Public API stability: We are in early POC phase, but should work to identify a stable public API/usage pattern
- No hidden globals or singletons; pass dependencies via props/slots/context intentionally.
- Export all public symbols from `src/lib/index.ts` and document them.
- Styles are opt-in: component CSS is scoped; global CSS only via explicit import and marked as side-effect in `package.json`.
- Styling should be minimal and use consistent CSS custom properties to allow consumers to style the components. Component styles should focus mainly on layout.
- Provide snippets and events to enable extension without forking.

Rationale: A tiling window manager UI must be embeddable in diverse apps; composition
keeps the surface small and flexible.

### II. Clean Code and Maintainability

Code MUST be clear, typed, and minimal.

- TypeScript everywhere; all props and events are fully typed.
- Small files and functions; prefer pure derived state over imperative effects.
- No dead code, TODOs require issue links, and lint errors are treated as build failures.
- Naming is descriptive; avoid abbreviations in public APIs.
- Document non-obvious decisions inline and in component README/story.
- Use `npm run lint`, `npm run format`, `npm run check`, and `npm run build` often to check/correct code quality issues.

Rationale: Clean code lowers cognitive load and accelerates safe changes.

### III. Automated Component Testing (Vitest + Browser)

Automated tests are REQUIRED for all public components. TDD is not required, but
coverage of critical behaviors is mandatory.

- Write Svelte component tests using Vitest with `vitest-browser-svelte`.
- Each component test MUST cover: render, primary interactions, and accessibility assertions (roles/labels/keyboard focus order).
- E2E tests with Playwright are added for cross-component flows in the demo app.
- Aim for ≥80% line coverage for files in `src/lib/`; exceptions require justification.
- Flaky tests are not allowed; fix or quarantine with linked issue and timebox.

Rationale: Fast, browser-based component tests validate behavior without requiring
TDD while preserving reliability.

### IV. User Experience and Accessibility

User experience and ease of use are NON-NEGOTIABLE.

- A11y: Keyboard navigation, focus management, and ARIA roles/names are REQUIRED.
- Sensible defaults: components work out-of-the-box with minimal props.
- Clear error states and empty-state UX; never fail silently.
- Performance: interactions target <16ms per frame under typical load.
- The demo and Storybook must demonstrate primary flows and include a11y checks.

Rationale: A window manager interacts heavily with input and layout; accessibility
and clarity are essential.

### V. Developer Experience and Integration

Integrating the component MUST be straightforward.

- Quickstart snippet in README and Storybook for each public component.
- Peer deps limited to Svelte 5+; avoid heavy runtime deps without justification.
- No side effects on import; supports SSR by default unless clearly documented.
- Semantic versioning enforced; changelog highlights breaking changes and migrations.
- Publish types and Svelte components via `@sveltejs/package` with valid exports.

Rationale: Easy adoption grows usage and encourages community contributions.

### VI. Svelte 5 Runes Best Practices

Use Svelte 5 runes idiomatically.

- Props via `$props()` with typed interfaces; derived state via `$derived`, local state via `$state`.
- Prefer reactive declarations over `onMount` side effects; cleanup disposers where effects are needed.
    - Keep effects to a minimum, prefer standard events when reasonable.
- Avoid direct DOM manipulation; use Svelte bindings and actions.
- Snippets & events over context unless inheritance is intended; document any context keys.
- SSR safety: guard browser-only APIs and avoid hydration mismatches.

Rationale: Idiomatic runes produce predictable, performant components.

## Quality Gates
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

All changes MUST pass these gates before merge:

- Build: `npm run build` completes without errors.
- Lint/Typecheck: ESLint, `svelte-check`, and TypeScript pass with zero errors.
- Tests: Vitest unit/component tests pass; coverage for `src/lib/*` is recorded (goal ≥80%).
- A11y: Storybook a11y addon reports no critical violations for stories.
- Exports: All public components re-exported from `src/lib/index.ts`; package exports/types validate with `publint`.
- Docs: README/Storybook updated for new or changed APIs.
- Size/Deps: No unjustified large dependencies or regressions.

## Development Workflow and Review Process
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

- TDD is NOT required; however, tests for component functionality ARE required as part of the change.
- For a new component: create `src/lib/Component.svelte`, add story in `src/stories/`, add tests `Component.svelte.spec.ts`, and export from `src/lib/index.ts`.
- Code review MUST verify conformance to Core Principles and Quality Gates.
- E2E tests in `e2e/` are added/updated when demo flows change.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution defines the non-negotiable engineering standards for the SV Window Manager project.

Amendments and Versioning

- Propose amendments via PR including a Sync Impact Report and rationale.
- Versioning follows SemVer for the constitution itself:
  - MAJOR: remove/redefine principles or incompatible governance changes.
  - MINOR: add a new principle/section or materially expand guidance.
  - PATCH: clarifications/wording with no semantic change.
- Upon amendment, update the "Last Amended" date and increment version accordingly.

Compliance and Exceptions

- Reviewers MUST check compliance during PR review and block merges on violations.
- Temporary exceptions require an issue link, explicit rationale, and a scheduled removal date.
- The constitution supersedes ad-hoc practices in this repository.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not recorded | **Last Amended**: 2025-10-12
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->