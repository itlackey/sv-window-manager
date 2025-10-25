# Milestone 3: Visual Regression Testing Guide

## Overview

This guide provides a systematic approach to validating that the reactive Sash implementation renders identically to the legacy implementation.

## Manual Visual Testing Checklist

### Setup

1. **Start Dev Server with Reactive Implementation:**
   ```bash
   VITE_USE_REACTIVE_SASH=true npm run dev
   ```

2. **Open Browser:** Navigate to `http://localhost:5173`

### Test Scenarios

#### Scenario 1: Basic Layout Rendering

**Test Steps:**
- [ ] Open the demo page
- [ ] Verify initial single pane renders correctly
- [ ] Check that pane borders are visible
- [ ] Verify pane background color is correct
- [ ] Take screenshot: `reactive-initial.png`

**Switch to Legacy:**
```bash
VITE_USE_REACTIVE_SASH=false npm run dev
```

- [ ] Open the demo page
- [ ] Take screenshot: `legacy-initial.png`
- [ ] **Compare:** Screenshots should be pixel-identical

---

#### Scenario 2: Horizontal Split

**Reactive:**
- [ ] Add pane to the right
- [ ] Verify vertical muntin (divider) appears
- [ ] Verify both panes are equal width (500px each)
- [ ] Verify muntin is centered at x=500
- [ ] Check muntin styling (color, width, hover state)
- [ ] Take screenshot: `reactive-horizontal-split.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-horizontal-split.png`
- [ ] **Compare:** Layouts should be identical

**Acceptance Criteria:**
- ✅ Both panes render at exactly 500px width
- ✅ Muntin is positioned at x=500
- ✅ Muntin visual style matches (color, width, cursor)
- ✅ No layout shift or flicker

---

#### Scenario 3: Vertical Split

**Reactive:**
- [ ] Start with fresh page (single pane)
- [ ] Add pane to the bottom
- [ ] Verify horizontal muntin appears
- [ ] Verify both panes are equal height (300px each)
- [ ] Verify muntin is centered at y=300
- [ ] Take screenshot: `reactive-vertical-split.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-vertical-split.png`
- [ ] **Compare:** Layouts should be identical

---

#### Scenario 4: Nested Splits (Complex Layout)

**Test Layout:**
```
+-------+-------+
|   A   |   C   |
+-------+-------+
|   B   |   D   |
+-------+-------+
```

**Reactive:**
- [ ] Start fresh
- [ ] Add pane right (creates A, C)
- [ ] Add pane bottom on left child (creates A, B)
- [ ] Add pane bottom on right child (creates C, D)
- [ ] Verify all 4 panes are visible
- [ ] Verify muntins form a cross pattern
- [ ] Measure pane dimensions (should be 500x300 each)
- [ ] Take screenshot: `reactive-nested-split.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-nested-split.png`
- [ ] **Compare:** All pane sizes and muntin positions should match

**Acceptance Criteria:**
- ✅ 4 panes visible
- ✅ Each pane is 500x300px
- ✅ Vertical muntin at x=500 (full height)
- ✅ Two horizontal muntins at y=300 (one for each side)
- ✅ No gaps or overlaps

---

#### Scenario 5: Pane Removal

**Reactive:**
- [ ] Create the 4-pane layout from Scenario 4
- [ ] Remove pane B (bottom-left)
- [ ] Verify pane A expands to fill the space
- [ ] Verify pane A is now 500x600 (full left side)
- [ ] Verify vertical muntin remains at x=500
- [ ] Take screenshot: `reactive-after-remove.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-after-remove.png`
- [ ] **Compare:** Collapsed layout should be identical

**Acceptance Criteria:**
- ✅ Pane A expands to 500x600
- ✅ Panes C and D remain unchanged
- ✅ Horizontal muntin on right side remains
- ✅ No visual artifacts or flickering during removal

---

#### Scenario 6: Resize Operations

**Reactive:**
- [ ] Create horizontal split (2 panes)
- [ ] Open browser DevTools
- [ ] Change container width via DevTools (e.g., 800px)
- [ ] Verify both panes resize to 400px width
- [ ] Verify muntin moves to x=400
- [ ] Verify resize is smooth (no flicker)
- [ ] Take screenshot: `reactive-resized.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-resized.png`
- [ ] **Compare:** Resized layouts should be identical

**Acceptance Criteria:**
- ✅ Panes resize proportionally
- ✅ Muntin position updates correctly
- ✅ No layout jump or flash of unstyled content
- ✅ Resize animation is smooth

---

#### Scenario 7: Deep Tree (5 Levels)

**Test Layout:**
Create a deep tree by repeatedly adding panes to the right:
```
Root -> Right -> Right -> Right -> Right -> Right
```

**Reactive:**
- [ ] Add 5 panes sequentially to the right
- [ ] Verify all panes are visible (widths decrease each level)
- [ ] Verify muntins are positioned correctly
- [ ] Take screenshot: `reactive-deep-tree.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-deep-tree.png`
- [ ] **Compare:** Deep tree layouts should match

**Acceptance Criteria:**
- ✅ All panes visible (no clipping)
- ✅ Widths decrease proportionally
- ✅ Muntins positioned correctly
- ✅ No overflow or scroll issues

---

#### Scenario 8: Custom Minimum Dimensions

**Reactive:**
- [ ] Set minWidth: 200px, minHeight: 150px
- [ ] Create horizontal split
- [ ] Try to resize container below minimum
- [ ] Verify panes don't shrink below minimum
- [ ] Take screenshot: `reactive-min-dimensions.png`

**Legacy:**
- [ ] Repeat exact same steps
- [ ] Take screenshot: `legacy-min-dimensions.png`
- [ ] **Compare:** Min dimension enforcement should match

---

## Automated Visual Regression (Optional)

If Playwright is available, run the automated visual regression test:

```bash
npm run test:e2e -- reactive-sash-visual.spec.ts
```

This will automatically compare screenshots and report pixel differences.

---

## Visual Regression Checklist Summary

- [ ] **Scenario 1:** Initial render matches
- [ ] **Scenario 2:** Horizontal split layout matches
- [ ] **Scenario 3:** Vertical split layout matches
- [ ] **Scenario 4:** Nested split (4-pane) layout matches
- [ ] **Scenario 5:** Pane removal and collapse matches
- [ ] **Scenario 6:** Resize operations match
- [ ] **Scenario 7:** Deep tree (5 levels) matches
- [ ] **Scenario 8:** Minimum dimension constraints match

### Acceptance Criteria

**All scenarios MUST meet these criteria:**
- ✅ Pane dimensions are pixel-identical
- ✅ Muntin positions are pixel-identical
- ✅ No visual artifacts (flicker, flash, jump)
- ✅ Resize operations are smooth
- ✅ Tree operations preserve layout integrity
- ✅ CSS styling is identical (colors, borders, spacing)

### Tolerances

**Acceptable differences:**
- ±1px for sub-pixel rounding in browser rendering
- Minor anti-aliasing differences in muntin edges
- Timing differences in animations (not layout differences)

**Unacceptable differences:**
- Pane size differences > 1px
- Muntin position differences > 1px
- Missing elements (panes, muntins)
- Layout shifts or jumps
- CSS style differences

---

## Reporting Results

After completing all scenarios, create a summary:

### Visual Regression Test Results

**Date:** [Date]
**Tester:** [Name]
**Browser:** [Browser and version]
**Screen Resolution:** [Resolution]

| Scenario | Status | Notes |
|----------|--------|-------|
| Initial render | ✅ PASS | Identical |
| Horizontal split | ✅ PASS | Identical |
| Vertical split | ✅ PASS | Identical |
| Nested split | ✅ PASS | Identical |
| Pane removal | ✅ PASS | Identical |
| Resize operations | ✅ PASS | Identical |
| Deep tree | ✅ PASS | Identical |
| Min dimensions | ✅ PASS | Identical |

**Overall Result:** ✅ PASS - All visual regression tests passed

**Issues Found:** None

**Recommendation:** Reactive implementation is visually identical to legacy. Approved for production.

---

## Quick Visual Test (5 minutes)

If time is limited, run this quick test:

1. **Reactive:** Create 4-pane layout, resize window, remove a pane
2. **Legacy:** Repeat exact same steps
3. **Compare:** If these core operations match, visual regression is likely acceptable
4. **Document:** Take before/after screenshots as proof

**Note:** Full testing is recommended before production deployment.
