# Data Model: Tab Bar Lifecycle & Customization

## Entities

### Tab

- id: string
- name: string (1..60 chars, trimmed)
- pinned: boolean
- order: integer (segment-local order)

### TabBarState

- tabs: Tab[]
- pinnedTabs: Tab[]
- regularTabs: Tab[]
- activeTabId: string
- overflow: boolean
- scrollPosition: number
- focusIndex: number

### Banner

- type: enum (config_error | update | info)
- priority: integer
- message: string

### DragState

- sourceIndex: number
- targetIndex: number
- segment: enum (pinned | regular)
- edgeProximity: enum (none | left | right)

### PersistenceModel

- authority: enum (host_primary)
- lastSyncedAt: ISO datetime
- version: integer

## Validation Rules

- Tab.name must be non-empty after trimming, length ≤60.
- Reorder across segments via drag is not allowed; Pin/Unpin toggles segment.
- Pinned segment always visible; reordering is segment-scoped.
- Title sync must reflect Tab.name upon successful rename.

## Relationships

- TabBarState maintains two ordered lists: pinnedTabs and regularTabs.
- activeTabId references a Tab in either segment.
- PersistenceModel applies to Tab order, pinned flag, and name.
