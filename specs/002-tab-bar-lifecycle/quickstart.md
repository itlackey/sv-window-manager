# Quickstart: Tab Bar Lifecycle & Customization

This guide shows how to use the Tab Bar in a host app and in Storybook.

## Install

- Ensure peer dependency: Svelte 5+.
- Library is packaged via `@sveltejs/package` and exported from `src/lib/index.ts`.

## Minimal Usage

1. Import the TabBar component from your library index (example names; adjust to actual export):

```svelte
<script lang="ts">
  import { TabBar } from '$lib';
  interface Tab { id: string; name: string; pinned: boolean; }
  let tabs: Tab[] = [
    { id: '1', name: 'Welcome', pinned: true },
    { id: '2', name: 'Project', pinned: false },
    { id: '3', name: 'Logs', pinned: false },
  ];
  let activeId = '2';
  function onReorder(e) {/* host updates persistence */}
  function onPin(e) {/* host updates persistence */}
  function onRename(e) {/* host updates persistence + title sync */}
</script>

<TabBar
  {tabs}
  activeId={activeId}
  on:reorder={onReorder}
  on:pin={onPin}
  on:rename={onRename}
/>
```

## Behavior Notes

- Reordering is within-segment (pinned/regular). Use context menu to Pin/Unpin across segments.
- Rename validation: trimmed non-empty, ≤60 chars.
- Host is the source of truth for persistence; renderer caches for the session.
- A11y: Keyboard navigation/reorder and ARIA roles/names are required.
- Reduced motion is respected.
