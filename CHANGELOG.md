# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.4] - 2025-10-26

### Added

- **Component-only architecture**: All panes now use Svelte components exclusively (no HTML strings)
  - Type-safe component rendering using Svelte 5's `mount()` API
  - Components passed via `component` prop with optional `componentProps` object
- **BinaryWindow component**: Primary window manager component with imperative API
  - `addPane()` method for dynamic pane creation with Svelte components
  - `removePane()` method for programmatic pane removal
  - Support for positioning panes (top, right, bottom, left)
- **Glass component**: Individual pane wrapper with chrome (header, close button)
  - Accepts Svelte components via `component` prop
  - Props forwarding via `componentProps`
- **Declarative rendering support**: Glass components can be rendered using Svelte 5 snippets
  - Snippet-based pattern for flexible pane content rendering
  - Frame component with `paneContent` snippet API
- **Session components**: Example pluggable pane content types
  - ChatSession.svelte
  - TerminalSession.svelte
  - FileBrowserSession.svelte
  - FileEditorSession.svelte
- **Reactive state management**: Introduced GlassState and SillState modules
  - Modern Svelte 5 patterns using runes ($state, $derived, $effect)
  - Type-safe reactive updates throughout component tree
- **CSS customization**: Exposed CSS custom properties for theming
  - `--bw-*` variables for colors, sizing, and spacing
  - Full theming support via CSS variables
- **TypeScript support**: Complete type definitions included
  - Strict TypeScript configuration
  - Type exports for all public APIs
- **Development tooling**:
  - Storybook integration for component development
  - Vitest with browser testing via vitest-browser-svelte
  - Playwright e2e testing setup
  - ESLint and Prettier configuration

### Changed

- **Architectural evolution**: Transitioned from bwin.js wrapper to native Svelte 5 implementation
  - Reimplemented all core window management logic using Svelte 5 runes and reactive patterns
  - Binary space partitioning (BSP) tree now built natively in Svelte
  - Maintains bwin.js-inspired concepts but with full Svelte 5 reactivity
- Migrated from HTML string content to Svelte component-based architecture
- Refactored Sill component integration into BinaryWindow
- Updated demo app to showcase component-only API
- Improved TypeScript type definitions across the library

### Fixed

- Resolved TypeScript import errors and type mismatches
- Fixed component mounting lifecycle issues
- Corrected type safety in pane configuration

## Project Status

**This is an early proof of concept (v0.0.x).** The API is not stable and breaking changes should be expected between minor versions until v1.0.0 is reached.

### Current Limitations

- Native window manager implementation (proof of concept stage)
- Further work needed for production-ready features (drag-and-drop, persistence, etc.)
- API subject to change based on feedback and usage patterns

### Compatibility

- **Requires Svelte 5+** (`svelte: ^5.0.0`)
- Built with SvelteKit and modern Svelte 5 patterns
- Node.js 18+ recommended for development

## Links

- [Repository](https://github.com/itlackey/sv-window-manager)
- [Issue Tracker](https://github.com/itlackey/sv-window-manager/issues)
- [bwin.js Documentation](https://bhjsdev.github.io/bwin-docs/) (conceptual reference)

[unreleased]: https://github.com/itlackey/sv-window-manager/compare/v0.0.4...HEAD
[0.0.4]: https://github.com/itlackey/sv-window-manager/releases/tag/v0.0.4
