# 006: Widgets & Auxiliary UI

**Priority**: P2  
**Effort**: Medium  
**Status**: Pending  
**Dependencies**: 002-tab-bar-lifecycle (for block launching in active tab)

## Overview

Implement the widget rail system for launching predefined blocks, quick actions, and common tasks. Widgets provide visual shortcuts to frequently-used terminal commands, dashboards, and tools.

## Context from PRD

From `specs/window-manager-prd.md:L78-L83`:

> Widget rail reflows between standard, compact, and super-compact layouts based on available height.
> Widgets launch predefined blocks (terminal, help, dashboards, etc.) in the active tab; icons and colors reflect intent.
> Context menu offers quick access to edit widget configuration and toggle help/tutorial entries.
> Development builds display a subtle badge so testers know they're not in production.

## Key Capabilities

### Widget Rail Layouts

- **Standard**: Full labels + icons, spacious padding
- **Compact**: Smaller icons + abbreviated labels
- **Super-compact**: Icons only, tooltips on hover
- Auto-reflow based on available vertical space
- Smooth transitions between layouts

### Widget Types

- **Terminal widgets**: Launch terminal with pre-configured command
- **Dashboard widgets**: Open monitoring/stats views
- **Help widgets**: Quick tips, documentation, tutorials
- **Tool widgets**: Calculators, converters, utilities
- **Custom widgets**: User-defined or plugin-contributed

### Widget Actions

- **Primary action**: Click to launch (creates block in active tab)
- **Context menu**: Edit config, duplicate, delete, reorder
- **Drag-and-drop**: Reorder widgets in rail
- **Help toggle**: Show/hide tutorial and help widgets

### Widget Configuration

- Icon selection (from library or custom)
- Color/theme
- Label text
- Target block type and configuration
- Keyboard shortcut (optional)

### Development Badge

- Subtle indicator in dev builds (e.g., "DEV" badge)
- Doesn't interfere with normal usage
- Helps testers identify non-production builds

## Technical Considerations

### Responsive Layout

- Height breakpoints for layout transitions
- CSS Grid or Flexbox for widget arrangement
- Smooth animations on layout change
- Maintain scroll position during reflow

### Widget Registry

- Predefined widget library
- User-customized widgets
- Plugin/extension API for third-party widgets
- Widget persistence and sync

### Block Launch Integration

- Coordinate with block system (004-workspace-layout-blocks)
- Target active tab for new blocks
- Handle errors (no active tab, tab full, etc.)
- Provide feedback on successful launch

### Accessibility

- Full keyboard navigation
- Screen reader announces widget purpose
- High-contrast mode support
- Reduced motion for layout transitions

## Component Architecture

```
WidgetRail (main container)
├── WidgetRailHeader (optional filter/search)
├── WidgetList (scrollable)
│   ├── Widget (individual widget button)
│   │   ├── WidgetIcon
│   │   ├── WidgetLabel (responsive)
│   │   └── WidgetBadge (dev builds)
│   └── ... (more widgets)
├── WidgetContextMenu
└── HelpToggle (show/hide help widgets)
```

## Related Files

- **Foundation**: `src/lib/WindowManagerShell.svelte` (widget rail region)
- **Tab System**: `src/lib/components/TabBar.svelte` (active tab context)
- **Block System**: `src/lib/components/Block*.svelte` (launch target)
- **New Components**: `src/lib/components/Widget*.svelte` (to be created)
- **Types**: `src/lib/types.ts` (widget definitions)

## Success Criteria

### Functional

- Widget rail renders in all three layout modes
- Layout transitions smoothly based on available height
- Widgets launch blocks in active tab successfully
- Context menu provides edit/delete/reorder actions
- Drag-and-drop reordering works with persistence
- Help toggle shows/hides help widgets
- Dev badge displays only in non-production builds

### Non-Functional

- Layout reflow completes in ≤200ms
- Widget click responds within ≤100ms
- Rail scrolls smoothly with 50+ widgets
- Memory usage scales linearly with widget count

### Accessibility

- Full keyboard navigation (Tab, Arrow keys, Enter, Space)
- Screen reader announces widget names and states
- Focus indicators always visible
- Context menu keyboard accessible

## User Stories (to be detailed)

### US1: Widget Rail Rendering & Layouts

Widget rail displays configured widgets and reflows between standard/compact/super-compact based on vertical space.

### US2: Widget Launch

Clicking a widget launches a predefined block in the active tab with appropriate configuration.

### US3: Widget Configuration

Users can edit widget properties (icon, label, color, target block config) via context menu.

### US4: Widget Reordering

Users can drag-and-drop widgets to reorder them, with changes persisting across sessions.

### US5: Help Widget Toggle

Users can show/hide help/tutorial widgets to declutter the rail for expert usage.

## Open Questions

From `specs/window-manager-prd.md:L104-L109`:

- **Widget gallery scalability**: Evaluate search/filter if configurations grow large
  - Should we add search/filter now or wait for user feedback?
  - What's a reasonable widget count before UX degrades?
  - Consider categories/folders for organization?

## Next Steps

1. Design widget data model and configuration schema
2. Create detailed specification following 001/002 pattern
3. Define widget registry API and persistence contract
4. Plan component hierarchy and layout logic
5. Coordinate with 004-workspace-layout-blocks for launch integration
6. Define testing strategy for widget interactions
7. Create plan.md with task breakdown
