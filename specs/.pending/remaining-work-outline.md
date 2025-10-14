# Remaining Work Outline - SV Window Manager

**Generated**: 2025-10-14  
**Status**: Planning  
**Context**: Review of completed features 001-window-manager-foundation and 002-tab-bar-lifecycle

## Overview

This document outlines the remaining work to complete the SV Window Manager library based on the Wave Terminal UI PRD. Features 001 and 002 have established the foundation (initialization, layout skeleton, tab bar lifecycle). The following work remains to deliver the complete product vision.

## Completed Features ✓

- **001-window-manager-foundation**: Initialization, global interaction, layout skeleton with side panel
- **002-tab-bar-lifecycle**: Tab reordering, inline rename, pinned tabs, tab bar controls

## Remaining Work

### 1. Demo Page Polish (002-tab-bar-lifecycle completion)
**Priority**: P1 - Needed to showcase completed work  
**Effort**: Small (8 tasks)  
**Dependencies**: None (builds on completed 002)

Tasks T068-T075 from 002-tab-bar-lifecycle need completion:
- Comprehensive demo page header with feature overview
- Interactive playground section
- Event log panel with real-time emissions
- Performance metrics display
- Accessibility testing controls
- Theme switcher demonstration
- Code examples section
- Responsive behavior showcase

**Reference**: `specs/002-tab-bar-lifecycle/tasks.md:L219-L235`

---

### 2. Workspace Layout & Blocks
**Priority**: P1 - Core content rendering  
**Effort**: Large  
**Dependencies**: 001 foundation

Block system for rendering terminal, web, preview, AI results, and other view types within tabs.

**Key capabilities** (from PRD L63-L68):
- Block layout management (saved per tab)
- Block states: "Tab Loading," "Tab Not Found," empty state
- Block headers with icon, name, text buttons, connection controls
- Magnify mode (focus single block)
- Block-level context menus
- Ephemeral block creation

**Reference**: `specs/window-manager-prd.md:L63-L68`

---

### 3. Wave AI Panel
**Priority**: P2 - Differentiating feature  
**Effort**: Large  
**Dependencies**: 001 foundation (side panel container exists)

AI chat interface in resizable side pane with context sharing and file upload.

**Key capabilities** (from PRD L70-L76):
- Resizable panel with width memory
- Chat history with text input
- Keyboard shortcuts (new chat, focus)
- File drag/drop with validation
- Widget context sharing toggle
- Welcome state and onboarding
- Rate-limit indicators and error messaging
- Auto-resizing input composer

**Reference**: `specs/window-manager-prd.md:L70-L76`

---

### 4. Widgets & Auxiliary UI
**Priority**: P2 - Task launching & discovery  
**Effort**: Medium  
**Dependencies**: 002 tab bar (for block launching)

Widget rail for launching predefined blocks and quick actions.

**Key capabilities** (from PRD L78-L83):
- Widget rail with responsive layouts (standard, compact, super-compact)
- Height-based reflow
- Launch predefined blocks in active tab
- Context menu for widget configuration
- Help/tutorial entries toggle
- Development build badge

**Reference**: `specs/window-manager-prd.md:L78-L83`

---

### 5. Notifications & Modals
**Priority**: P3 - Supporting UX  
**Effort**: Small  
**Dependencies**: 001 foundation

Overlay system for confirmations, alerts, and background task feedback.

**Key capabilities** (from PRD L85-L89):
- Modal overlay system for confirmations/editors
- Notification bubbles (dev builds)
- Dismissible alerts
- Integration with flash errors (already implemented)
- Config error banners (already implemented)

**Reference**: `specs/window-manager-prd.md:L85-L89`

---

### 6. Settings & Personalization
**Priority**: P3 - User customization  
**Effort**: Medium  
**Dependencies**: 001 foundation, 002 tab bar

Global and per-tab appearance controls.

**Key capabilities** (from PRD L91-L95):
- Window appearance settings (opacity, blur, transparency)
- Per-tab background presets (partially implemented in 002)
- Layout spacing preferences (tile gap)
- Background imagery/gradients from tab metadata
- Live updates as settings change

**Reference**: `specs/window-manager-prd.md:L91-L95`

---

### 7. Cross-Feature Integration & Testing
**Priority**: P2 - Quality assurance  
**Effort**: Medium  
**Dependencies**: Multiple features complete

End-to-end testing and integration validation across features.

**Key activities**:
- E2E scenarios covering multi-feature workflows
- Integration tests for feature interactions
- Data flow validation (events, state management)
- Performance profiling of complete system
- Memory leak detection
- Bundle size optimization

---

### 8. Performance & Accessibility Audit
**Priority**: P2 - Non-functional requirements  
**Effort**: Small-Medium  
**Dependencies**: Core features complete

Systematic validation of performance and accessibility standards.

**Key activities** (from PRD L97-L102):
- Reinitialization performance (≤100ms target)
- Layout resize responsiveness
- Animation fluidity (≥45 FPS during interactions)
- Reduced motion compliance
- Focus management audit
- Screen reader compatibility
- Keyboard navigation completeness
- ARIA roles and labels validation

**Reference**: `specs/window-manager-prd.md:L97-L102`

---

### 9. Documentation & Examples
**Priority**: P3 - Developer experience  
**Effort**: Medium  
**Dependencies**: Features complete

Comprehensive documentation for library consumers.

**Key deliverables**:
- API documentation for all public components
- Integration guides and quickstarts
- Storybook stories for all components
- Migration guides (if applicable)
- Troubleshooting guide
- Performance optimization guide
- Accessibility guide
- Example applications

---

## Suggested Implementation Order

### Phase 1: Complete Current Work
1. Demo Page Polish (002 completion)

### Phase 2: Core Content & Interaction
2. Workspace Layout & Blocks (enables content rendering)
3. Wave AI Panel (uses existing side panel infrastructure)

### Phase 3: Enhancement & Discovery
4. Widgets & Auxiliary UI
5. Settings & Personalization (complete tab backgrounds)

### Phase 4: Polish & Validation
6. Notifications & Modals (supporting UX)
7. Cross-Feature Integration & Testing
8. Performance & Accessibility Audit

### Phase 5: Developer Experience
9. Documentation & Examples

---

## Open Questions from PRD

From `specs/window-manager-prd.md:L104-L109`:

- **Document title syncing**: Ensure tab renames flow through without delay (partially addressed in 002)
- **Widget gallery scalability**: Evaluate search/filter if configurations grow large
- **AI panel file-size/error messaging**: Align with backend limits and document clearly
- **Startup "nohover" hack**: Consider permanent styling solution (implemented in 001)

---

## Metrics & Success Criteria

### User Experience
- Workspace restoration feels instant (< 500ms to interactive)
- Tab operations are smooth (≥45 FPS during drag/resize)
- Keyboard navigation is comprehensive (all features accessible)
- Screen reader announces all state changes appropriately

### Technical Quality
- All components have ≥80% test coverage
- Bundle size < 200KB (gzipped)
- No memory leaks in 1-hour usage session
- Accessibility score ≥95 (Lighthouse/axe)

### Developer Experience
- Quickstart works in < 5 minutes
- Storybook covers 100% of public components
- API documentation complete and accurate
- Zero TypeScript errors in consuming projects

---

## Next Steps

1. Review and prioritize remaining work items
2. Create detailed specifications for items 2-9 (similar to 001 and 002)
3. Assign ownership and estimated delivery dates
4. Begin implementation starting with Demo Page Polish
