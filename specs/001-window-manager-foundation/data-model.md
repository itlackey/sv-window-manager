# Data Model — Window Manager Foundation

Date: 2025-10-12

## Entities

- WindowAppearance
  - zoom: number
  - opacity: number
  - transparent: boolean
  - backgroundColor?: string
  - backgroundImage?: string (URI)
  - blur?: number

- WorkspaceState (summary)
  - clientId: string
  - windowId: string
  - tabs: Array<{ id: string; title: string; pinned?: boolean }>
  - currentTabId: string
  - currentTabTitle: string

- TabShell
  - id: string
  - title: string
  - pinned?: boolean

- PanelState (Side Panel)
  - visible: boolean
  - widthPx: number

- FlashError
  - id: string
  - message: string
  - timestamp: ISO8601
  - expiresAt: ISO8601

- ContextMenuItem
  - id: string
  - label: string
  - enabled: boolean
  - actionId?: string

## Relationships

- WorkspaceState has many TabShell entries; currentTabId references a TabShell.
- PanelState is independent but influences layout sizing in the shell component.
- FlashError is ephemeral; displayed via overlay and auto-expires.

## Validation Rules

- PanelState.widthPx ∈ [200, 800].
- Appearance.zoom ∈ [0.5, 3.0]; opacity ∈ [0.5, 1.0]; blur ≥ 0.
- ContextMenuItem must have unique id within a menu and an accessible label.

## State Transitions

- Initialization → Hidden → Data Ready → Reveal(emit "ready")
- Panel toggle: visible ↔ hidden, preserving widthPx within session.
- Title sync: currentTabTitle updates when currentTabId or TabShell.title changes.
