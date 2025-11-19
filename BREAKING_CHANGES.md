# Breaking Changes

This document tracks all breaking changes introduced in sv-window-manager releases.

---

## Version 1.0.0 (Planned - May 2025)

**Release Type:** Major
**Status:** In Development
**API Stability:** ✅ Frozen (post-feature freeze: 2025-05-01)

### Breaking Changes

**None planned for 1.0.0 release.**

The 1.0.0 release is focused on **API stabilization** and does NOT introduce breaking changes from v0.2.2. All current APIs will be supported in 1.0.0.

### Deprecations (Will break in v2.0.0)

The following APIs are **deprecated** in v0.2.2 and will be **removed** in v2.0.0:

#### 1. `GlassManager` (Deprecated)

**Deprecated API:**
```typescript
import { GlassManager } from 'sv-window-manager';

const manager = new GlassManager({
  id: 'my-glass',
  title: 'My Pane'
});
```

**Migration to `GlassState`:**
```typescript
import { GlassState } from 'sv-window-manager';

const state = new GlassState({
  id: 'my-glass',
  title: 'My Pane'
});
```

**Timeline:**
- **v0.2.2:** `GlassManager` marked deprecated with runtime warnings
- **v0.3.0:** Deprecation warnings in console (non-blocking)
- **v2.0.0:** `GlassManager` removed (6+ months notice)

**Reason for Change:**
- `GlassState` uses Svelte 5 runes for better reactivity
- `GlassManager` is a legacy wrapper with no benefits
- Reduces bundle size by ~5KB

**Documentation:** See [MIGRATION.md §2.1](./MIGRATION.md#21-glassmana ger--glassstate)

---

#### 2. `SillManager` (Deprecated)

**Deprecated API:**
```typescript
import { SillManager } from 'sv-window-manager';

const manager = new SillManager({
  id: 'my-sill',
  orientation: 'horizontal'
});
```

**Migration to `SillState`:**
```typescript
import { SillState } from 'sv-window-manager';

const state = new SillState({
  id: 'my-sill',
  orientation: 'horizontal'
});
```

**Timeline:**
- **v0.2.2:** `SillManager` marked deprecated with runtime warnings
- **v0.3.0:** Deprecation warnings in console (non-blocking)
- **v2.0.0:** `SillManager` removed (6+ months notice)

**Reason for Change:**
- `SillState` uses Svelte 5 runes for better reactivity
- `SillManager` is a legacy wrapper with no benefits
- Reduces bundle size by ~5KB

**Documentation:** See [MIGRATION.md §2.2](./MIGRATION.md#22-sillmanager--sillstate)

---

### Non-Breaking Changes

The following changes are **backwards-compatible** and do NOT require migration:

#### 1. Enhanced Error Messages ✅

**Before (v0.2.1):**
```
BwinError: [bwin] Pane not found: my-pane
```

**After (v0.2.2):**
```
BwinError: [bwin] Pane not found: my-pane
  💡 Did you mean "my-panel"?
  ℹ️  Hint: Check that the pane ID exists. Use getAllLeafDescendants() to see all IDs.
  📖 Docs: https://github.com/itlackey/sv-window-manager#pane-management
```

**Compatibility:** ✅ Fully backwards-compatible
- Existing error handling code continues to work
- Additional properties (`hint`, `suggestion`, `docsUrl`) are optional
- Error message format is enhanced but core message unchanged

---

#### 2. Template System ✅

**New Features (v0.2.2):**
- 8 built-in templates (two-column, grid, IDE, etc.)
- Custom template registration
- Template validation and import/export

**Compatibility:** ✅ Fully backwards-compatible
- New optional feature (doesn't affect existing code)
- Requires explicit opt-in via `applyTemplate()`
- No changes to existing pane creation APIs

---

#### 3. State Persistence ✅

**New Features (v0.2.2):**
- `serializeTree()` / `deserializeTree()`
- localStorage integration helpers
- Component mapping support

**Compatibility:** ✅ Fully backwards-compatible
- New optional feature (doesn't affect existing code)
- Requires explicit opt-in via persistence API
- No changes to existing tree manipulation

---

#### 4. Accessibility Features ✅

**New Features (v0.2.2):**
- Keyboard shortcuts (`Ctrl+W`, `Ctrl+Tab`, etc.)
- ARIA announcements for screen readers
- Focus management

**Compatibility:** ✅ Fully backwards-compatible
- Features are opt-in via `createKeyboardShortcuts()` and `createAriaAnnouncer()`
- No changes to existing pane behavior
- Default behavior unchanged

---

#### 5. Performance Budgets ✅

**New Features (v0.2.2):**
- Bundle size tracking via `size-limit`
- Performance benchmarks and stress tests
- Memory leak detection

**Compatibility:** ✅ Fully backwards-compatible
- Dev-time tooling only (not runtime)
- No changes to library APIs
- No impact on existing applications

---

## Version 0.2.2 (Current)

**Release Date:** 2025-11-19
**Release Type:** Minor
**Breaking Changes:** None

### Changes

#### Added
- ✅ Enhanced error messages with hints, suggestions, and docs URLs
- ✅ Template system (8 built-in templates + custom registration)
- ✅ State persistence (serializeTree/deserializeTree + localStorage)
- ✅ Keyboard shortcuts (Ctrl+W, Ctrl+Tab, etc.)
- ✅ ARIA announcements for screen readers
- ✅ Focus management for accessibility
- ✅ Performance budgets and stress tests
- ✅ Comprehensive documentation (7 new docs, 4500+ lines)
- ✅ Storybook stories (2 → 26 stories across 5 files)

#### Deprecated
- ⚠️ `GlassManager` → Use `GlassState` (removal in v2.0.0)
- ⚠️ `SillManager` → Use `SillState` (removal in v2.0.0)

#### Fixed
- ✅ TypeScript errors in errors.ts (ErrorOptions type)
- ✅ Test environment issues (ARIA/keyboard/persistence tests)
- ✅ Error message test assertions for enhanced format

---

## Version 0.2.1 and Earlier

**Breaking Changes:** None

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0, 2.0.0): Breaking changes
- **MINOR** (0.1.0, 0.2.0): New features (backwards-compatible)
- **PATCH** (0.2.1, 0.2.2): Bug fixes (backwards-compatible)

Prior to v1.0.0, minor versions (0.x.0) may include breaking changes. Post-1.0.0, only major versions will include breaking changes.

---

## Deprecation Policy

Starting with v0.2.2, the project follows a **strict deprecation policy**:

### Deprecation Timeline

1. **Announcement (6+ months before removal)**
   - API marked as deprecated in JSDoc with `@deprecated` tag
   - Runtime warning added to deprecated APIs
   - Migration guide published in [MIGRATION.md](./MIGRATION.md)

2. **Active Development (until feature freeze)**
   - Deprecated APIs continue to work fully
   - New code should use replacement APIs
   - Deprecation warnings visible in console

3. **Feature Freeze → Release (1-2 months)**
   - No new features added
   - Deprecated APIs remain functional
   - Documentation updated with migration paths

4. **Removal (next major version)**
   - Deprecated APIs removed in next major release
   - Breaking change documented in this file
   - Users have had 6+ months to migrate

### Example Timeline (GlassManager)

```
v0.2.2 (Nov 2025)  → Deprecated, runtime warnings added
  ↓
v0.3.0 (Jan 2026)  → Still available, warnings continue
  ↓
v1.0.0 (May 2026)  → Still available, warnings continue
  ↓
v2.0.0 (Nov 2026+) → REMOVED (6+ months after deprecation)
```

### Checking for Deprecated APIs

**1. Runtime Warnings**
```javascript
// Using deprecated API triggers console warning:
const manager = new GlassManager({ id: 'test' });
// Console: [bwin] GlassManager is deprecated. Use GlassState instead. Will be removed in v2.0.0
```

**2. TypeScript Warnings**
```typescript
import { GlassManager } from 'sv-window-manager';
//        ^^^^^^^^^^^
// Warning: 'GlassManager' is deprecated. Use 'GlassState' instead.
```

**3. Documentation**
- See [MIGRATION.md](./MIGRATION.md) for migration guides
- Check JSDoc comments for deprecation notices
- Review this file for deprecation timelines

---

## API Stability Guarantees (v1.0.0+)

Starting with v1.0.0, the project commits to the following API stability guarantees:

### Stability Tiers

#### 1. **Core APIs** (Stable)
- ✅ **Guaranteed stable** across all 1.x releases
- Breaking changes only in major versions (2.0.0+)
- Examples: `BinaryWindow`, `Frame`, `Glass`, `Sash`

#### 2. **Advanced APIs** (Stable)
- ✅ **Guaranteed stable** across all 1.x releases
- Breaking changes only in major versions
- Examples: `persistence`, `templates`, `keyboard-shortcuts`, `aria-announcer`

#### 3. **Deprecated APIs** (Warning)
- ⚠️ **Marked for removal** in next major version
- Still functional but with runtime warnings
- Users must migrate before next major release
- Examples: `GlassManager`, `SillManager`

#### 4. **Experimental APIs** (Unstable)
- ⚠️ **May change** at any time (even in minor/patch releases)
- Use at your own risk in production
- Examples: Currently none (all APIs are stable or deprecated)

### Semantic Versioning Commitment

**Post-1.0.0:**
- **MAJOR (x.0.0):** Breaking changes (API removals, signature changes)
- **MINOR (1.x.0):** New features (backwards-compatible)
- **PATCH (1.0.x):** Bug fixes only (backwards-compatible)

**Pre-1.0.0 (Current):**
- **MINOR (0.x.0):** May include breaking changes (with deprecation warnings)
- **PATCH (0.2.x):** Backwards-compatible changes only

---

## Migration Resources

### Documentation
- [MIGRATION.md](./MIGRATION.md) - Complete migration guide with code examples
- [ROADMAP_1.0.md](./ROADMAP_1.0.md) - Roadmap to 1.0 release
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibility features guide
- [TEMPLATES.md](./TEMPLATES.md) - Template system documentation
- [PERSISTENCE.md](./PERSISTENCE.md) - State persistence guide
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Enhanced error handling guide

### Community Support
- **GitHub Issues:** https://github.com/itlackey/sv-window-manager/issues
- **Discussions:** https://github.com/itlackey/sv-window-manager/discussions

---

## Reporting Issues

If you encounter breaking changes not documented here:

1. **Check [MIGRATION.md](./MIGRATION.md)** for migration guides
2. **Search [GitHub Issues](https://github.com/itlackey/sv-window-manager/issues)** for existing reports
3. **Open a new issue** with:
   - Version you're upgrading from/to
   - Code example showing the break
   - Expected vs. actual behavior
   - Stack trace (if applicable)

---

**Last Updated:** 2025-11-19
**Next Update:** After v1.0.0 release (May 2025)
