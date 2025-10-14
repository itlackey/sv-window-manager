# 011: Documentation & Examples

**Priority**: P3  
**Effort**: Medium  
**Status**: Pending  
**Dependencies**: Features complete (001-008)

## Overview

Comprehensive documentation for library consumers, covering API reference, integration guides, examples, troubleshooting, and best practices. Ensure developers can easily understand, integrate, and customize the window manager library.

## Goals

- **Discoverability**: Developers can quickly find relevant documentation
- **Clarity**: Documentation is clear, accurate, and up-to-date
- **Completeness**: All public APIs and features are documented
- **Actionability**: Examples and guides enable immediate integration
- **Maintainability**: Documentation structure supports ongoing updates

## Documentation Types

### 1. API Reference

Complete reference documentation for all public components, types, and utilities.

**Content**:

- Component props, events, slots
- TypeScript interfaces and types
- CSS custom properties
- Keyboard shortcuts
- Configuration options

**Format**:

- Auto-generated from TypeScript/JSDoc comments
- Hosted on documentation site (e.g., GitBook, Docusaurus)
- Searchable and linkable

**Location**: `docs/api/`

### 2. Integration Guides

Step-by-step guides for common integration scenarios.

**Guides**:

- **Getting Started**: Install, basic setup, first component
- **Workspace Setup**: Configure tabs, blocks, layouts
- **AI Panel Integration**: Connect to AI backend, context sharing
- **Widget Configuration**: Create custom widgets, register in rail
- **Settings Customization**: Theme setup, personalization options
- **Event Handling**: Listen to and respond to window manager events
- **Persistence Integration**: Connect to backend storage

**Format**: Markdown files with code examples

**Location**: `docs/guides/`

### 3. Examples & Demos

Runnable example applications demonstrating integration patterns.

**Examples**:

- **Minimal Setup**: Bare-bones integration (10 lines of code)
- **Full-Featured**: Complete app with all features enabled
- **Custom Widgets**: Example custom widget implementations
- **Theme Gallery**: Showcase of themes and customization
- **AI Integration**: Example AI backend integration
- **Electron App**: Packaging as desktop app
- **Web App**: Hosting as web application

**Format**: Separate example apps in `examples/` directory

**Location**: `examples/`

### 4. Storybook Stories

Interactive component documentation with live examples.

**Content**:

- All public components with interactive knobs
- Common usage patterns and variations
- Accessibility testing scenarios
- Visual regression test baselines

**Status**: Partially complete (stories exist for WindowManagerShell, TabBar, Button)

**Location**: `src/stories/`

### 5. Troubleshooting Guide

Common issues, errors, and solutions.

**Sections**:

- Installation issues
- Build/packaging errors
- Runtime errors
- Performance problems
- Accessibility issues
- Platform-specific quirks
- FAQ

**Format**: Markdown with search-friendly structure

**Location**: `docs/troubleshooting.md`

### 6. Migration Guides

Version-to-version migration instructions (when applicable).

**Content**:

- Breaking changes by version
- Deprecation notices
- Migration steps with code examples
- Automated migration tools (if applicable)

**Format**: Markdown, one file per major version

**Location**: `docs/migrations/`

### 7. Contributing Guide

Guide for contributors to the library.

**Content**:

- Development setup
- Code style and conventions
- Testing requirements
- PR process
- Release process

**Format**: Markdown

**Location**: `CONTRIBUTING.md` (already exists, may need updates)

### 8. Best Practices

Recommendations for optimal usage.

**Topics**:

- Performance optimization
- Accessibility best practices
- Theme design guidelines
- Widget design patterns
- State management strategies
- Testing strategies

**Format**: Markdown with examples

**Location**: `docs/best-practices/`

## Documentation Site

### Structure

```
docs/
├── index.md (landing page)
├── getting-started.md
├── api/
│   ├── components/
│   │   ├── WindowManagerShell.md
│   │   ├── TabBar.md
│   │   ├── Block.md
│   │   ├── AIPanel.md
│   │   └── ...
│   ├── types/
│   │   ├── TabState.md
│   │   ├── BlockLayout.md
│   │   └── ...
│   └── utilities/
│       └── ...
├── guides/
│   ├── workspace-setup.md
│   ├── ai-integration.md
│   ├── custom-widgets.md
│   ├── theming.md
│   └── ...
├── examples/
│   ├── minimal.md
│   ├── full-featured.md
│   └── ...
├── troubleshooting.md
├── best-practices/
│   ├── performance.md
│   ├── accessibility.md
│   └── ...
└── migrations/
    └── v1-to-v2.md
```

### Hosting Options

- **GitHub Pages**: Free, simple, good for open-source
- **Vercel/Netlify**: Free tier, auto-deploy on commit
- **Docusaurus**: React-based, versioning support
- **VitePress**: Vite-powered, lightweight, fast
- **GitBook**: Hosted solution, collaborative editing

**Recommendation**: VitePress (aligns with Vite/Svelte ecosystem)

## Code Examples Standard

All code examples should:

1. **Be runnable**: Copy-paste should work without modification (or with clearly stated setup)
2. **Use TypeScript**: Show type safety benefits
3. **Include comments**: Explain non-obvious parts
4. **Follow conventions**: Match project code style
5. **Be tested**: Examples run in CI to prevent docs drift

### Example Format

```svelte
<script lang="ts">
	import { WindowManagerShell } from 'sv-window-manager';
	import type { ShellConfig } from 'sv-window-manager';

	// Configuration for the window manager shell
	const config: ShellConfig = {
		appearance: {
			opacity: 0.95,
			blur: true
		},
		keyboard: {
			enabled: true
		},
		panel: {
			visible: false,
			widthPx: 400
		}
	};

	// Handle ready event when shell is initialized
	function handleReady(event: CustomEvent<{ title: string }>) {
		console.log('Shell ready with title:', event.detail.title);
	}
</script>

<WindowManagerShell {config} on:ready={handleReady}>
	<!-- Your workspace content -->
</WindowManagerShell>
```

## Screenshots & Diagrams

### Visual Assets

- **Component screenshots**: Showing various states and configurations
- **Workflow diagrams**: Illustrating user flows and interactions
- **Architecture diagrams**: Showing component relationships
- **State diagrams**: Showing state transitions

### Tools

- **Excalidraw**: Diagrams and flowcharts
- **Figma**: UI mockups and component states
- **Playwright**: Automated screenshot generation

**Location**: `docs/assets/`

## Success Criteria

### Completeness

- All public APIs documented
- All features have guides
- All common scenarios have examples
- Troubleshooting covers top 10 issues

### Quality

- Documentation is accurate (matches implementation)
- Code examples run without errors
- Writing is clear and concise
- Screenshots are up-to-date

### Usability

- Developers can integrate library in <30 minutes
- Documentation site loads quickly (<2s)
- Search functionality works well
- Navigation is intuitive

### Maintainability

- Documentation is version-controlled
- Auto-generated where possible (API reference)
- Update process is documented
- CI checks for broken links and outdated examples

## Related Files

- **Existing Docs**: `README.md`, `src/lib/README.md`
- **New Docs**: `docs/` directory (to be created)
- **Examples**: `examples/` directory (to be created)
- **Storybook**: `src/stories/` (extend existing)
- **Contributing**: `CONTRIBUTING.md` (update)

## Deliverables

1. **Documentation Site**: Hosted, searchable, versioned
2. **API Reference**: Complete coverage of public APIs
3. **Integration Guides**: 5-7 step-by-step guides
4. **Examples**: 3-5 runnable example applications
5. **Storybook**: Complete component coverage with stories
6. **Troubleshooting**: Common issues documented
7. **Best Practices**: Performance and accessibility guides

## Next Steps

1. Choose documentation site framework (recommend VitePress)
2. Set up documentation site structure and hosting
3. Extract API documentation from code comments
4. Write integration guides for key scenarios
5. Create example applications
6. Expand Storybook stories for all components
7. Set up CI for documentation testing (broken links, example runs)
8. Launch documentation site and promote to users
