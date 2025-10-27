# Data Model: Pane Lifecycle Events

Date: 2025-10-26

## Entities

### Pane

- id: string (stable, unique within manager instance)
- title: string | null
- size: { width: number; height: number } (px)
- position: { x: number; y: number } (px, relative to container)
- state: "normal" | "minimized" | "maximized"
- groupId: string | null (layout grouping context)
- index: number | null (0-based within group)
- config: object (snapshot of user-specified properties)
- dynamic: object (snapshot of internal runtime state exposed for consumers)

### PaneEvent

- type: "onpaneadded" | "onpaneremoved" | "onpaneminimized" | "onpanemaximized" | "onpanerestored" | "onpaneresized" | "onpanefocused" | "onpaneblurred" | "onpaneorderchanged" | "onpanetitlechanged"
- timestamp: string (ISO 8601)
- pane: Pane
- context (optional):
  - previousTitle?: string (for onpanetitlechanged)
  - previousIndex?: number (for onpaneorderchanged)
  - groupId?: string (for onpaneorderchanged)

## Validation Rules

- id: non-empty string; unique per live pane
- size: width,height ≥ 0 integers
- position: x,y integers (may be negative if partially off-container)
- state transitions: see below
- order change: if `onpaneorderchanged`, include `groupId` and new `index`; previousIndex optional
- title change: include `previousTitle` and new `title` in `pane`

## State Transitions

- normal → maximized → restored → normal
- normal → minimized → restored → normal
- minimized ↔ maximized is not direct; must restore first
- Removed: after `onpaneremoved`, no further events for that `pane.id`

## Notes

- `onpaneresized` is debounced trailing 100 ms; only one event emitted after user stops resizing. The payload includes final `size` and `position`.
- `config` and `dynamic` are snapshots intended for downstream use; structure is defined by the component and may evolve with semantic versioning.
