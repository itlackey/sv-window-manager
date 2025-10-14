# 004: Workspace Layout & Blocks

**Priority**: P1  
**Effort**: Large  
**Status**: Pending  
**Dependencies**: 001-window-manager-foundation

## Overview

Implement the block system for rendering multiple view types (terminal, web, preview, AI results, system stats) within tabs, with saved layouts, magnification mode, and block-level interactions.

## Context from PRD

From `specs/window-manager-prd.md:L63-L68`:

> Each tab renders its saved block layout; "Tab Loading," "Tab Not Found," or empty states communicate status clearly.
> Blocks represent views such as terminal, web, preview, AI results, system stats, or quick tips.
> Blocks include headers with icon, name, optional text buttons, connection controls, magnify, and close options.
> Users can magnify a block to focus on one view, add ephemeral blocks to layouts, and manage block-level context menus.

## Key Capabilities

### Block Layout Management

- Saved block configurations per tab
- Layout persistence and restoration
- Dynamic block addition/removal
- Layout state synchronization with host

### Block Types

- Terminal view
- Web/browser view
- Preview/markdown view
- AI results view
- System stats/monitoring
- Quick tips/help content
- Custom/extensible block types

### Block States

- **Loading**: "Tab Loading" with spinner/progress
- **Not Found**: "Tab Not Found" with retry action
- **Empty**: Friendly empty state with suggestions
- **Active**: Normal rendering with content
- **Error**: Error state with recovery options

### Block Headers

- Icon representing block type
- Editable/display block name
- Optional text buttons (context-specific actions)
- Connection controls (for remote sessions)
- Magnify button (enter focus mode)
- Close button (remove block)

### Block Interactions

- Block-level context menu
- Resize/reposition within layout
- Drag to reorder
- Magnify mode (single block fills tab)
- Focus management between blocks

### Ephemeral Blocks

- Add temporary blocks to current tab
- Auto-close on tab switch or explicit dismiss
- Use cases: quick calculations, ad-hoc terminals, temporary previews

## Technical Considerations

### Layout Engine

- Grid/flexbox-based positioning
- Saved layout configurations
- Responsive behavior
- Performance with many blocks

### State Management

- Block metadata (type, config, position)
- Block content/data separation
- Sync with workspace persistence

### Component Architecture

```
TabContent (renders blocks for active tab)
└── BlockLayout (manages block positioning)
    └── Block (individual block wrapper)
        ├── BlockHeader
        └── BlockContent (type-specific renderer)
            ├── TerminalBlock
            ├── WebBlock
            ├── PreviewBlock
            ├── AIResultsBlock
            └── ... (extensible)
```

## Related Files

- **Foundation**: `src/lib/WindowManagerShell.svelte` (main workspace area)
- **Tab System**: `src/lib/components/TabBar.svelte` (tab context)
- **New Components**: `src/lib/components/Block*.svelte` (to be created)
- **Types**: `src/lib/types.ts` (block definitions)

## Success Criteria

### Functional

- Tabs can render 1-N blocks in saved layouts
- Block states (loading, error, empty) display correctly
- Block headers include all required controls
- Magnify mode focuses single block without layout loss
- Ephemeral blocks can be added and auto-cleanup
- Block context menus provide relevant actions

### Non-Functional

- Layout renders smoothly with 10+ blocks
- Block resize/reorder feels fluid (≥45 FPS)
- State synchronization happens without flicker
- Memory usage scales linearly with block count

### Accessibility

- Blocks have proper ARIA roles and labels
- Keyboard navigation between blocks
- Focus management in magnify mode
- Screen reader announces block state changes

## User Stories (to be detailed)

### US1: Basic Block Rendering

Tabs display saved block layouts with appropriate states (loading, active, error, empty).

### US2: Block Headers & Controls

Each block has a header with icon, name, and action buttons (magnify, close, connection status).

### US3: Magnify Mode

Users can focus a single block to fill the tab workspace, then exit back to layout.

### US4: Block Context Menus

Right-click on blocks reveals context-specific actions (duplicate, move to new tab, change type, etc.).

### US5: Ephemeral Blocks

Users can add temporary blocks that auto-cleanup on tab switch or explicit dismiss.

## Next Steps

1. Create detailed specification following 001/002 pattern
2. Define block type registry and extension API
3. Design layout state model and persistence contract
4. Plan component hierarchy and data flow
5. Define testing strategy for block system
6. Create plan.md with task breakdown
