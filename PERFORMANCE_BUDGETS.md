# Performance Budgets - SV Window Manager

This document defines performance budgets and monitoring strategies for sv-window-manager to ensure optimal user experience across all devices and use cases.

**Last Updated:** 2025-11-19
**Version:** 0.2.2

---

## Table of Contents

1. [Overview](#overview)
2. [Bundle Size Budgets](#bundle-size-budgets)
3. [Runtime Performance Budgets](#runtime-performance-budgets)
4. [Memory Budgets](#memory-budgets)
5. [Monitoring & Tracking](#monitoring--tracking)
6. [Performance Testing](#performance-testing)
7. [Performance Regression Detection](#performance-regression-detection)

---

## Overview

Performance budgets are enforced limits on various performance metrics to prevent regressions and ensure consistent user experience. All budgets are tracked in CI/CD pipelines with automated alerts for violations.

### Performance Philosophy

- **60fps minimum** - All interactive operations must maintain 60fps
- **<100KB bundle size** - Total library size (minified + gzipped)
- **<100ms initial render** - For typical layouts (5-10 panes)
- **<1MB memory overhead** - Beyond content rendered in panes
- **Zero memory leaks** - No retained memory after pane removal

---

## Bundle Size Budgets

### Overall Bundle Size

| Metric | Budget | Current (Estimated) | Status |
|--------|--------|---------------------|--------|
| **Minified + Gzipped** | <100 KB | ~80 KB | ✅ PASS |
| **Minified (no gzip)** | <250 KB | ~200 KB | ✅ PASS |
| **Unminified** | <600 KB | 514 KB | ✅ PASS |

### Module-Level Budgets

Individual module budgets ensure tree-shaking effectiveness:

| Module | Budget (gzip) | Purpose |
|--------|---------------|---------|
| **BinaryWindow Component** | <40 KB | Core window manager component |
| **Core Components** (BinaryWindow + Frame + Glass) | <50 KB | Complete UI layer |
| **State Management** (ReactiveSash + State modules) | <30 KB | Reactive state layer |
| **Persistence API** | <10 KB | Save/restore functionality |
| **Accessibility APIs** | <15 KB | Keyboard shortcuts + ARIA |
| **Event System** | <5 KB | Pane lifecycle events |

### Size Tracking

Bundle size is tracked using [@size-limit](https://github.com/ai/size-limit):

```bash
# Check current bundle size
npm run size

# Check with detailed output
npm run size:why
```

**Configuration:** `.size-limit.js`

**CI Integration:** Bundle size is checked on every PR. Size increases >5% trigger warnings.

---

## Runtime Performance Budgets

### Render Performance

| Operation | Budget | Measurement | Test Coverage |
|-----------|--------|-------------|---------------|
| **Initial Render** (10 panes) | <100ms | Time to first contentful paint | ✅ Benchmark |
| **Initial Render** (50 panes) | <500ms | Time to first contentful paint | ✅ Benchmark |
| **Pane Addition** | <50ms | Per pane, measured in isolation | ✅ Benchmark |
| **Pane Removal** | <30ms | Including cleanup and reflow | ✅ E2E |
| **Layout Switch** | <200ms | Complete layout replacement | ✅ E2E |

### Interactive Performance (60fps = 16.67ms per frame)

| Operation | Budget | FPS Target | Test Coverage |
|-----------|--------|------------|---------------|
| **Resize (Muntin Drag)** | <16.67ms/frame | 60fps | ✅ Benchmark |
| **Pane Drag** | <16.67ms/frame | 60fps | ⚠️ Manual |
| **Scroll in Pane** | <16.67ms/frame | 60fps | ⚠️ Manual |
| **Animation (Glass minimize)** | <16.67ms/frame | 60fps | ⚠️ Manual |

### Tree Operations

| Operation | Budget | Scale | Test Coverage |
|-----------|--------|-------|---------------|
| **Find by ID** | <1ms | 100-pane tree | ✅ Benchmark |
| **Get All Leaves** | <5ms | 100-pane tree | ✅ Benchmark |
| **Tree Walk** | <10ms | 100-pane tree | ✅ Benchmark |
| **Calculate Min Dimensions** | <10ms | 100-pane tree | ✅ Benchmark |

---

## Memory Budgets

### Base Memory Overhead

| Metric | Budget | Measurement |
|--------|--------|-------------|
| **Empty Window Manager** | <1 MB | Heap size with zero panes |
| **10-Pane Window** | <5 MB | Excluding pane content |
| **100-Pane Window** | <50 MB | Stress test scenario |

### Memory Leak Prevention

| Test | Budget | Frequency |
|------|--------|-----------|
| **Add/Remove 100 Panes** | <1 MB leak | Every build |
| **Switch Layouts 50x** | <1 MB leak | Every build |
| **Rapid Operations (1000x)** | <5 MB leak | Weekly |

**Leak Detection:** Run with `--expose-gc` flag:

```bash
# Run memory leak benchmarks
node --expose-gc node_modules/vitest/vitest.mjs bench --run performance.bench.ts
```

---

## Monitoring & Tracking

### Continuous Integration

Performance metrics are automatically tracked in CI:

1. **Bundle Size** - Checked on every PR (size-limit)
2. **Benchmarks** - Run on merge to main (Vitest bench)
3. **E2E Performance** - Run on release candidates (Playwright)
4. **Memory Tests** - Run weekly (GitHub Actions schedule)

### Performance Dashboard

Track performance trends over time:

- **Bundle Size History** - Tracked in CI artifacts
- **Benchmark Results** - JSON output stored per commit
- **Regression Alerts** - Automated GitHub issue creation for violations

**GitHub Actions Workflow:** `.github/workflows/performance.yml`

### Local Development

Developers can run performance checks locally:

```bash
# Quick performance check (bundle size only)
npm run size

# Full benchmark suite
npm run bench

# Memory leak detection
npm run bench:memory

# E2E performance tests
npm run test:e2e -- --grep "Performance"
```

---

## Performance Testing

### Test Suites

**1. Vitest Benchmarks** (`src/lib/bwin/performance.bench.ts`)

- Pane addition (20 panes sequentially)
- Resize operations (10-pane window)
- Initial render (5, 10, 20 panes)
- Memory leak detection (100 add/remove cycles)
- Tree traversal (find, walk, getAllLeaves)
- Dimension calculations

**2. E2E Performance Tests** (`e2e/test-page-performance.spec.ts`)

- Add 10+ panes without degradation
- Rapid button clicking (stress test)
- Large layout rendering
- Basic memory leak detection

**3. Stress Tests** (Proposed - see Task 6)

- 100-pane window creation and interaction
- 1000-pane tree (pathological case)
- Sustained 60fps during complex resize
- Memory usage under prolonged use (1 hour)

### Running Tests

```bash
# All performance tests
npm run test:performance

# Benchmarks only
npm run bench

# E2E performance only
npm run test:e2e -- --grep "Performance"

# Specific benchmark
npm run bench -- --grep "Pane Addition"
```

---

## Performance Regression Detection

### Automated Checks

Performance regressions are detected automatically in CI:

**Bundle Size:**
- ✅ **Pass:** Size within budget
- ⚠️ **Warn:** Size increased >5% but within budget
- ❌ **Fail:** Size exceeds budget

**Runtime Performance:**
- ✅ **Pass:** All benchmarks within budget
- ⚠️ **Warn:** Performance degraded >10% but within budget
- ❌ **Fail:** Performance exceeds budget

### Manual Review

For complex performance changes, manual review is required:

1. **Profiling:** Use Chrome DevTools Performance tab
2. **Flame Graphs:** Analyze CPU usage during operations
3. **Memory Snapshots:** Check for retained objects
4. **Network Tab:** Verify no unexpected requests

### Reporting Issues

When reporting performance regressions:

```markdown
## Performance Regression Report

**Metric:** [e.g., "Pane Addition Time"]
**Expected:** <50ms
**Actual:** 85ms
**Regression:** +70%

**Reproduction:**
1. Open showcase app
2. Add 20 panes sequentially
3. Measure time per addition

**Profiling Results:**
[Attach Chrome DevTools flame graph or performance trace]

**Git Bisect:**
- Last known good commit: abc123
- First bad commit: def456

**Root Cause:**
[Analysis of what caused the regression]

**Proposed Fix:**
[Link to PR with fix]
```

---

## Budget Enforcement

### CI/CD Pipeline

1. **Pre-commit:** Local size check (optional, via git hooks)
2. **PR Check:** Bundle size analysis (required)
3. **Merge Gate:** All performance tests pass (required)
4. **Post-merge:** Benchmark results archived

### Version Release Criteria

Before releasing a new version:

- ✅ All bundle size budgets met
- ✅ All runtime performance benchmarks pass
- ✅ No memory leaks detected
- ✅ E2E performance tests pass
- ✅ Manual performance review complete (for major versions)

---

## Performance Optimization Guidelines

### General Principles

1. **Measure First** - Always profile before optimizing
2. **Optimize Hot Paths** - Focus on operations in tight loops
3. **Lazy Loading** - Defer expensive operations when possible
4. **Memoization** - Cache expensive calculations
5. **Tree-Shaking** - Keep bundle size minimal

### Svelte 5 Specific

- Use `$state.raw()` for large arrays/objects (skip reactivity overhead)
- Use `$derived()` sparingly - only when actually derived
- Avoid unnecessary `$effect()` - prefer direct state updates
- Use `untrack()` for reads that shouldn't trigger reactivity

### Common Pitfalls

❌ **Avoid:**
- Creating new objects/arrays in render path
- Expensive calculations in `$derived()` without memoization
- Large inline styles (use CSS classes)
- Deep prop drilling (use context for shared state)

✅ **Prefer:**
- Static references for constant data
- CSS variables for dynamic styling
- Reactive state for minimal surface area
- Component splitting for code splitting

---

## Resources

### Internal Documentation

- [PROJECT_REVIEW.md](./PROJECT_REVIEW.md) - Architecture analysis
- [ROADMAP_1.0.md](./ROADMAP_1.0.md) - Feature timeline
- [STATUS.md](./STATUS.md) - Task tracking

### External Resources

- [size-limit Documentation](https://github.com/ai/size-limit)
- [Vitest Benchmarking](https://vitest.dev/guide/features.html#benchmarking)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Performance Budgets](https://web.dev/performance-budgets-101/)

---

**Maintained by:** SV Window Manager Team
**Questions:** Open an issue on [GitHub](https://github.com/itlackey/sv-window-manager/issues)
