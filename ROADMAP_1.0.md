# Roadmap to 1.0 - SV Window Manager

**Current Version:** 0.2.2
**Target Version:** 1.0.0
**Target Date:** 2025-05-19 (6 months from 2025-11-19)
**Status:** 🟡 In Progress

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Public API Surface](#public-api-surface)
3. [API Stability Guarantees](#api-stability-guarantees)
4. [Breaking Changes Policy](#breaking-changes-policy)
5. [Versioning Strategy](#versioning-strategy)
6. [Feature Freeze Timeline](#feature-freeze-timeline)
7. [Migration Guide Template](#migration-guide-template)
8. [Release Criteria](#release-criteria)

---

## Vision & Goals

### What is 1.0?

Version 1.0 represents **production-ready stability** with:

- ✅ **Stable Public API** - No breaking changes without major version bump
- ✅ **Feature Complete** - All core features implemented and tested
- ✅ **Production Tested** - Used in real-world applications with feedback
- ✅ **Well Documented** - Comprehensive docs, examples, and migration guides
- ✅ **Performance Validated** - Meets or exceeds performance budgets
- ✅ **Accessible** - WCAG 2.1 AA compliant

### Success Criteria

**Technical:**
- [ ] Zero known critical bugs
- [ ] 90%+ test coverage
- [ ] <100KB bundle size (minified + gzipped)
- [ ] 60fps resize performance
- [ ] <100ms render time for 50 panes
- [ ] WCAG 2.1 AA compliance

**Process:**
- [ ] API frozen for 4+ weeks
- [ ] 3+ production deployments with feedback
- [ ] All deprecations removed or documented with timeline
- [ ] Migration guide complete
- [ ] Breaking changes log complete

**Community:**
- [ ] 5+ GitHub stars
- [ ] 2+ external contributors
- [ ] Documentation feedback incorporated

---

## Public API Surface

### Tier 1: Core API (Stability Guaranteed)

**These exports will NOT break in minor/patch releases:**

#### Components
```typescript
// Primary component - main entry point
export { BinaryWindow } from './bwin/binary-window/BinaryWindow.svelte';

// Advanced usage (stable but less common)
export { Glass } from './bwin/binary-window/Glass.svelte';
export { Frame } from './bwin/frame/Frame.svelte';
export { Pane } from './bwin/frame/Pane.svelte';
export { Muntin } from './bwin/frame/Muntin.svelte';
```

**BinaryWindow Props (Stable):**
```typescript
interface BinaryWindowProps {
  settings: SashConfig | ConfigRoot;  // ✅ Stable
  debug?: boolean;                    // ✅ Stable
  fitContainer?: boolean;             // ✅ Stable
}
```

**BinaryWindow Methods (Stable):**
```typescript
class BinaryWindow {
  addPane(targetSashId: string, props: PaneProps): Sash | null;  // ✅ Stable
  removePane(sashId: string): void;                               // ✅ Stable
  fit(): void;                                                    // ✅ Stable
  getRootSash(): Sash | undefined;                                // ✅ Stable
  getTreeVersion(): number;                                       // ✅ Stable
}
```

#### Configuration
```typescript
export { SashConfig } from './bwin/config/sash-config.js';  // ✅ Stable
export { ConfigRoot } from './bwin/config/config-root.js';  // ✅ Stable
export { Position } from './bwin/position.js';              // ✅ Stable
```

#### Events
```typescript
// Event subscription API (stable)
export {
  addEventHandler,      // ✅ Stable
  removeEventHandler,   // ✅ Stable
  emitPaneEvent,        // ✅ Stable
  // Convenience helpers
  onpaneadded,          // ✅ Stable
  onpaneremoved,        // ✅ Stable
  onpaneresized,        // ✅ Stable
  onpanefocused,        // ✅ Stable
  onpaneblurred,        // ✅ Stable
  onpaneminimized,      // ✅ Stable
  onpanemaximized,      // ✅ Stable
  onpanerestored,       // ✅ Stable
  onpaneorderchanged,   // ✅ Stable
  onpanetitlechanged    // ✅ Stable
} from './events/dispatcher.js';

// Event types (stable)
export type {
  PanePayload,    // ✅ Stable
  PaneEvent,      // ✅ Stable
  PaneEventType,  // ✅ Stable
  PaneContext     // ✅ Stable
} from './events/types.js';
```

#### State Management (Modern API)
```typescript
// Module-level reactive state (stable, recommended)
export * as GlassState from './bwin/managers/glass-state.svelte.js';  // ✅ Stable
export * as SillState from './bwin/managers/sill-state.svelte.js';    // ✅ Stable
```

#### Context API
```typescript
export {
  setWindowContext,     // ✅ Stable
  getWindowContext,     // ✅ Stable
  tryGetWindowContext,  // ✅ Stable
  setLayoutContext,     // ✅ Stable
  getLayoutContext,     // ✅ Stable
  tryGetLayoutContext   // ✅ Stable
} from './bwin/context.js';
```

#### Types
```typescript
export type {
  BwinContext,      // ✅ Stable
  GlassProps,       // ✅ Stable
  PaneConfig,       // ✅ Stable
  BwinConfig,       // ✅ Stable
  PanePayload,      // ✅ Stable
  PaneEvent         // ✅ Stable
} from './types.js';
```

---

### Tier 2: Advanced API (Stable but Evolving)

**These exports are stable but may gain new features in minor releases:**

#### Actions
```typescript
export { resize } from './bwin/actions/resize.svelte';  // ⚠️ May add options
export { drag } from './bwin/actions/drag.svelte';      // ⚠️ May add options
export { drop } from './bwin/actions/drop.svelte';      // ⚠️ May add options
```

#### Window Actions
```typescript
export { closeAction } from './bwin/binary-window/actions.close.js';      // ⚠️ May extend
export { minimizeAction } from './bwin/binary-window/actions.minimize.js';// ⚠️ May extend
export { maximizeAction } from './bwin/binary-window/actions.maximize.js';// ⚠️ May extend
```

#### Constants
```typescript
export {
  MUNTIN_SIZE,      // ⚠️ May add more constants
  TRIM_SIZE,
  MIN_WIDTH,
  MIN_HEIGHT,
  CSS_CLASSES,      // ⚠️ May add new classes
  DATA_ATTRIBUTES   // ⚠️ May add new attributes
} from './bwin/constants.js';
```

#### Error Handling
```typescript
export { BwinError, BwinErrors } from './bwin/errors.js';  // ⚠️ May add new error types
```

---

### Tier 3: Deprecated API (Breaking in 2.0)

**These exports will be REMOVED in version 2.0.0:**

```typescript
// ❌ DEPRECATED - Will be removed in 2.0.0
export { GlassManager } from './bwin/managers/glass-manager.svelte.js';
export { SillManager } from './bwin/managers/sill-manager.svelte.js';
export { Sash } from './bwin/sash.js';  // Legacy non-reactive version
```

**Migration Path:**
```typescript
// BEFORE (deprecated):
import { GlassManager } from 'sv-window-manager';
const manager = new GlassManager(bwinContext, debug);
manager.removeGlass(sashId);

// AFTER (recommended):
import { GlassState } from 'sv-window-manager';
GlassState.initialize(bwinContext, debug);
GlassState.removeGlass(sashId);
```

---

### Tier 4: Experimental API (May Change)

**These exports may have breaking changes in minor releases (0.x.y):**

```typescript
// 🧪 EXPERIMENTAL - API may change
// (Currently none - all APIs have been stabilized)
```

**Note:** After 1.0, experimental features will be clearly marked in documentation.

---

## API Stability Guarantees

### Semantic Versioning Commitment

SV Window Manager follows [Semantic Versioning 2.0.0](https://semver.org/):

**MAJOR version (X.0.0)** - Incompatible API changes
- Breaking changes to Tier 1 (Core API)
- Removal of deprecated APIs
- Major architectural changes

**MINOR version (0.X.0)** - Backward-compatible functionality
- New features to Tier 1 (Core API)
- New optional parameters to existing functions
- Additions to Tier 2 (Advanced API)
- New experimental features (clearly marked)
- Deprecations (with warnings and migration guides)

**PATCH version (0.0.X)** - Backward-compatible bug fixes
- Bug fixes
- Performance improvements
- Documentation updates
- Internal refactoring

### Pre-1.0 Exception

**During 0.x.y versions (before 1.0):**
- Minor versions (0.X.0) MAY include breaking changes
- Breaking changes will be documented in CHANGELOG.md
- Deprecation warnings will be added 1 minor version before removal
- Migration guides will be provided

**After 1.0.0:**
- Full semantic versioning guarantees apply
- Breaking changes ONLY in major versions
- 6-month deprecation period for Tier 1 APIs

---

## Breaking Changes Policy

### Pre-1.0 (Current: 0.2.2 → 1.0.0)

**Process:**
1. Identify breaking change needed
2. Add deprecation warning in current version (0.x.y)
3. Document migration path in MIGRATION.md
4. Wait 1 minor version (e.g., 0.2.x → 0.3.0)
5. Remove deprecated API in next minor version (0.3.0 → 0.4.0)

**Example Timeline:**
- v0.2.2 (Nov 2024): Add deprecation warnings to `GlassManager`
- v0.3.0 (Jan 2025): `GlassManager` marked as deprecated (runtime warnings)
- v0.4.0 (Mar 2025): `GlassManager` still available but discouraged
- v1.0.0 (May 2025): Decision point - keep or remove
- v2.0.0 (Future): `GlassManager` removed

### Post-1.0

**Process:**
1. Identify breaking change needed
2. Add deprecation warning in current version (1.x.y)
3. Document migration path in MIGRATION.md
4. Wait 6 months OR 2 minor versions (whichever is longer)
5. Remove in next major version (2.0.0)

**Communication:**
- GitHub issue for each deprecation
- CHANGELOG.md entry
- Runtime console warnings (in development mode)
- Migration guide in MIGRATION.md
- Blog post for major deprecations

---

## Versioning Strategy

### Version History (Actual)

- **v0.1.0** (Initial POC) - Basic BSP tree implementation
- **v0.2.0** (Events refactor) - Event system implementation
- **v0.2.1** (Bug fixes) - Minor fixes
- **v0.2.2** (Current) - Stability improvements

### Roadmap to 1.0

#### v0.3.0 - Deprecation & Features (Target: 2025-01-19)
**Focus:** Add deprecation warnings, complete core features

- [ ] Add runtime deprecation warnings to `GlassManager`, `SillManager`
- [ ] Complete drag-and-drop pane reordering
- [ ] Add state persistence API
- [ ] Create MIGRATION.md guide
- [ ] Add bundle size tracking to CI

**Breaking Changes:**
- None (deprecation warnings only)

---

#### v0.4.0 - Testing & Accessibility (Target: 2025-03-01)
**Focus:** Test coverage expansion, accessibility enhancements

- [ ] Expand test coverage to 90%+
- [ ] Add keyboard shortcuts
- [ ] Add screen reader support (ARIA live regions)
- [ ] Add focus management
- [ ] Performance benchmarking suite
- [ ] Visual regression testing (Chromatic)

**Breaking Changes:**
- None

---

#### v0.5.0 - Polish & Optimization (Target: 2025-04-01)
**Focus:** Performance, bundle size, developer experience

- [ ] Bundle size optimization (<100KB target)
- [ ] Performance profiling and optimization
- [ ] Storybook expansion
- [ ] Interactive playground (CodeSandbox)
- [ ] Video tutorials

**Breaking Changes:**
- None

---

#### v0.6.0 - Release Candidate (Target: 2025-04-15)
**Focus:** API freeze, production testing

- [ ] API freeze (no new features)
- [ ] Production deployment testing (3+ apps)
- [ ] Security audit
- [ ] Documentation review
- [ ] Migration guide finalization

**Breaking Changes:**
- None (API frozen)

---

#### v1.0.0 - Stable Release (Target: 2025-05-19)
**Focus:** Production-ready, stable, documented

- [ ] All release criteria met
- [ ] Remove or keep deprecated APIs (final decision)
- [ ] Comprehensive documentation
- [ ] Marketing materials (blog post, demo video)
- [ ] npm publish with `latest` tag

**Breaking Changes:**
- Possible removal of deprecated APIs (to be decided in 0.6.0)
- If removed, migration guide will be complete

---

## Feature Freeze Timeline

### Phase 1: Active Development (Now → 2025-04-01)
**Status:** ✅ New features accepted

- Pull requests for new features welcomed
- API changes allowed with deprecation warnings
- Breaking changes allowed in minor versions (with warnings)

### Phase 2: Feature Freeze (2025-04-01 → 2025-05-19)
**Status:** 🔒 No new features

- No new features merged
- Bug fixes only
- Documentation improvements
- Performance optimization
- Test coverage expansion

### Phase 3: Code Freeze (2025-05-01 → 2025-05-19)
**Status:** 🔒 Critical fixes only

- Critical bug fixes only
- No refactoring
- No optimization unless regression found
- Documentation updates only

### Phase 4: Post-1.0 (After 2025-05-19)
**Status:** ✅ New features in minor versions

- New features in minor versions (1.x.0)
- Bug fixes in patch versions (1.0.x)
- Breaking changes only in major versions (2.0.0)

---

## Migration Guide Template

### Template for Deprecation Announcements

```markdown
# Migration Guide: [Feature Name]

## Status
- **Deprecated in:** v0.x.y
- **Removal planned:** v2.0.0
- **Migration deadline:** 6 months from deprecation

## What's Changing
[Clear explanation of what's being deprecated and why]

## Migration Steps

### Before (Deprecated)
\`\`\`typescript
// Old code example
\`\`\`

### After (Recommended)
\`\`\`typescript
// New code example
\`\`\`

## Why This Change?
[Rationale for the deprecation]

## Need Help?
- GitHub Discussions: [link]
- GitHub Issues: [link]
- Discord: [link if available]
```

### Current Migration: GlassManager → GlassState

**Status:**
- Deprecated in: v0.3.0 (planned)
- Removal planned: v2.0.0
- Migration deadline: 6+ months from v0.3.0

**Before:**
```typescript
import { GlassManager } from 'sv-window-manager';

const glassManager = new GlassManager(bwinContext, debug);
glassManager.removeGlass(sashId);
glassManager.addGlass({
  sashId: 'pane-1',
  title: 'My Pane',
  component: MyComponent
});
```

**After:**
```typescript
import { GlassState } from 'sv-window-manager';

GlassState.initialize(bwinContext, debug);
GlassState.removeGlass(sashId);
GlassState.addGlass({
  sashId: 'pane-1',
  title: 'My Pane',
  component: MyComponent
});
```

**Benefits:**
- Simpler API (no `new` required)
- Better tree-shaking
- Module-level reactive state
- Functional programming style

---

## Release Criteria

### Must-Have for 1.0

#### Functionality
- [x] Binary space partitioning tree
- [x] Reactive pane management
- [x] Event system
- [ ] Drag-and-drop pane reordering (complete)
- [ ] State persistence/serialization
- [ ] Undo/redo support (optional - may defer to 1.1)

#### Quality
- [ ] 90%+ test coverage
- [ ] Zero known critical bugs
- [ ] Performance budgets met
- [ ] WCAG 2.1 AA compliance
- [ ] Security audit passed

#### Documentation
- [ ] API reference complete
- [ ] Migration guides complete
- [ ] Examples and tutorials
- [ ] Video walkthrough
- [ ] Interactive playground

#### Process
- [ ] API frozen for 4+ weeks
- [ ] 3+ production deployments
- [ ] External contributor feedback
- [ ] CHANGELOG.md complete
- [ ] npm package validated (publint)

---

## Risk Register

### High Risk

**Risk:** Breaking changes needed after API freeze
**Impact:** Delays 1.0 release
**Mitigation:** Extensive testing in 0.5.0-0.6.0, gather community feedback early

**Risk:** Performance issues at scale
**Impact:** Unable to meet performance budgets
**Mitigation:** Performance testing in 0.4.0, profiling, optimization in 0.5.0

### Medium Risk

**Risk:** Insufficient production testing
**Impact:** Unknown bugs in 1.0
**Mitigation:** Recruit beta testers, deploy in own projects, create demo apps

**Risk:** Documentation gaps
**Impact:** Poor adoption, support burden
**Mitigation:** Documentation review in each version, user feedback surveys

### Low Risk

**Risk:** Community adoption slow
**Impact:** Limited feedback
**Mitigation:** Marketing, blog posts, demos, Reddit/HN posts

---

## Success Metrics

### Pre-1.0 Metrics (Tracked per version)

| Metric | Current (0.2.2) | Target (1.0.0) |
|--------|-----------------|----------------|
| Bundle Size (min+gzip) | Unknown | <100KB |
| Test Coverage | Good | 90%+ |
| Production Deployments | 0 | 3+ |
| GitHub Stars | Unknown | 50+ |
| npm Downloads/week | Unknown | 100+ |
| Documentation Pages | 3 | 10+ |
| Video Tutorials | 0 | 2+ |

### Post-1.0 Metrics (Tracked monthly)

- Monthly npm downloads
- GitHub stars growth
- Issues opened vs. closed
- Community contributions
- Documentation improvements
- Stack Overflow mentions

---

## Communication Plan

### Changelog Format

Each version includes:
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security fixes

### Release Announcements

- GitHub Releases (all versions)
- Twitter/X (major/minor versions)
- Reddit r/sveltejs (major versions)
- Hacker News (1.0 only)
- Dev.to blog post (major versions)

---

## FAQ

### When will 1.0 be released?
Target: May 19, 2025 (6 months from now)

### Can I use this in production before 1.0?
Yes, but be aware the API may change. Pin to a specific version and review changelogs before upgrading.

### What happens to deprecated APIs?
They'll continue working with console warnings until removed in 2.0.0. Migration guides will be provided.

### Will there be breaking changes in 0.x versions?
Yes, but they'll be documented and migration guides provided. After 1.0, breaking changes only in major versions.

### How long will 1.x be supported?
At least 12 months after 2.0 release, with security fixes only.

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-11-19
**Next Review:** 2025-12-19 (monthly)
