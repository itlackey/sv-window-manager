# Quickstart: Listening to Pane Events

This guide shows how to subscribe to on‑prefixed pane events and inspect the pane payload.

## Subscribe to events

- Attach listeners for the events you care about: `onpaneadded`, `onpaneremoved`, `onpaneminimized`, `onpanemaximized`, `onpanerestored`, `onpaneresized`, `onpanefocused`, `onpaneblurred`, `onpaneorderchanged`, `onpanetitlechanged`.
- Each listener receives a single `pane` payload argument with:
  - `id` (stable), `title`, `size {width,height}`, `position {x,y}`, `state`, `groupId/index`, plus `config` and `dynamic` snapshots.

## Notes

- `onpaneresized` uses trailing debounce 100 ms and emits once after the user stops resizing.
- No events will fire for a pane after `onpaneremoved`.
- No-op transitions (e.g., maximizing an already maximized pane) do not emit events.
