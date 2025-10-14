# 007: Notifications & Modals

**Priority**: P3  
**Effort**: Small  
**Status**: Pending  
**Dependencies**: 001-window-manager-foundation

## Overview

Implement overlay systems for confirmations, alerts, notifications, and modal dialogs. These provide user feedback for background tasks, require confirmations, and communicate important information without navigating away from the workspace.

## Context from PRD

From `specs/window-manager-prd.md:L85-L89`:

> Modal system overlays the workspace for confirmations, editors, or large dialogs without leaving context.
> Notification bubbles (dev builds) summarize events or background tasks.
> Flash errors and configuration banners share space with core UI but remain dismissible.

**Note**: Flash errors are already implemented in 001-window-manager-foundation (T037-T040). Config error indicators are implemented in 002-tab-bar-lifecycle (T047-T049).

## Key Capabilities

### Modal System

- **Confirmation modals**: Yes/No, OK/Cancel decisions
- **Editor modals**: Multi-field forms, settings editors
- **Content modals**: Display detailed information, help docs
- **Overlay backdrop**: Dims workspace, prevents interaction
- **Close behaviors**: Click backdrop, Escape key, explicit close button
- **Modal stack**: Support multiple modals if needed

### Notification Bubbles (Dev Builds)

- **Background task summaries**: Build progress, sync status
- **Event notifications**: Connection status, updates available
- **Transient display**: Auto-dismiss after timeout (e.g., 5s)
- **Dismissible**: User can close manually
- **Position**: Bottom-right or top-right corner (non-intrusive)
- **Queue**: Multiple notifications stack gracefully

### Alert System

- **Dismissible alerts**: Inline warnings, info, success messages
- **Persistent alerts**: Remain until user action
- **Alert types**: Info, warning, error, success (with distinct styling)
- **Action buttons**: Optional actions within alert (e.g., "Learn More", "Retry")
- **Position**: Top of workspace or contextual to triggering element

## Technical Considerations

### Modal Architecture

- Portal/teleport to body for proper z-index layering
- Focus trap while modal is open
- Restore focus on close
- Prevent body scroll when modal open
- ARIA roles and labels for accessibility

### Notification System

- Notification queue and timing
- Animation for enter/exit
- Priority levels (info < warning < error)
- Grouping similar notifications
- Persistence across page interactions

### State Management

- Global modal state (which modal is open, props)
- Notification queue
- Alert persistence (which alerts are dismissed)

### Accessibility

- Focus management (trap in modal, restore on close)
- Screen reader announcements for notifications
- Keyboard navigation (Tab, Escape)
- ARIA roles: role="dialog", role="alertdialog", role="alert", aria-live regions
- High-contrast mode support

## Component Architecture

```
ModalManager (global portal)
├── ModalBackdrop (overlay)
└── Modal (content container)
    ├── ModalHeader (title, close button)
    ├── ModalBody (content)
    └── ModalFooter (action buttons)

NotificationManager (global portal)
└── NotificationList (bottom-right)
    └── Notification (individual bubble)
        ├── NotificationIcon (type indicator)
        ├── NotificationContent (message)
        └── NotificationClose (dismiss)

AlertManager (inline in workspace)
└── AlertList
    └── Alert (individual alert)
        ├── AlertIcon (type indicator)
        ├── AlertContent (message)
        ├── AlertActions (optional buttons)
        └── AlertClose (dismiss)
```

## Related Files

- **Foundation**: `src/lib/WindowManagerShell.svelte` (mounting points)
- **Flash Errors**: `src/lib/components/FlashErrorOverlay.svelte` (existing, similar pattern)
- **New Components**: `src/lib/components/Modal*.svelte`, `Notification*.svelte`, `Alert*.svelte`
- **Types**: `src/lib/types.ts` (modal/notification/alert definitions)

## Success Criteria

### Functional

- Modals display with backdrop and focus trap
- Escape and backdrop click close modals (configurable)
- Notification bubbles auto-dismiss after timeout
- Notifications queue and display without overlap
- Alerts can be dismissed individually
- All overlay types work on mobile/small screens

### Non-Functional

- Modal open/close animations are smooth (≤300ms)
- Notification enter/exit animations don't cause jank
- Multiple modals stack properly without z-index conflicts
- Screen reader announces notifications and modal state changes

### Accessibility

- Focus trapped in modal while open
- Focus restored to trigger element on close
- Keyboard navigation works in all overlay types
- ARIA roles and labels correct
- High-contrast mode support

## User Stories (to be detailed)

### US1: Modal System

Users see confirmation and editor modals that overlay the workspace, with focus trapped and proper close behaviors.

### US2: Notification Bubbles (Dev Builds)

Background task events and status updates appear as notification bubbles in the corner, auto-dismissing or manually closed.

### US3: Alert System

Important messages display as inline alerts at the top of the workspace, with actions and dismissal.

## Relationship to Existing Features

- **Flash Errors** (already implemented): Technical errors with click-to-copy, auto-expire
- **Config Error Indicator** (already implemented): Tab bar indicator for config issues
- **Modals**: User-facing confirmations and editors
- **Notifications**: Non-critical event summaries (dev builds)
- **Alerts**: Important user-facing messages requiring acknowledgment

## Next Steps

1. Define modal/notification/alert data models and API contracts
2. Create detailed specification following 001/002 pattern
3. Design state management for modal/notification queues
4. Plan component hierarchy and animation strategy
5. Define testing strategy (focus management, queue behavior)
6. Create plan.md with task breakdown
