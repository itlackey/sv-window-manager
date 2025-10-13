# Events Contract — Window Manager Foundation

This document captures the initial event surface for the foundational shell.

## ready (UI → host)

- Emitted: once, within 100ms after visual reveal
- Payload:
  - title: string — current tab title
- Notes: Emission is idempotent-per-launch (no duplicates).

## appearance:update (host → UI)

- Purpose: live updates to appearance (zoom, opacity, transparency, background)
- Payload: see appearance.schema.json

## panel:toggle (UI internal)

- Purpose: user toggles side panel visibility; triggers layout reflow and session memory update
- Notes: Exposed as component event for consumers to track layout changes if desired (e.g., `on:paneltoggle`).

## contextmenu:open (UI internal)

- Purpose: open context menu adapted to selection/clipboard
- Notes: Keyboard accessible; items determined lazily.
