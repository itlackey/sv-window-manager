# Pane and Content Management

This document explains how panes and their content are managed in the sv-window-manager library to ensure data persistence across operations like minimize, restore, drag-and-drop, and layout changes.

## Architecture Overview

The window manager uses a **three-layer architecture** for managing panes:

1. **Sash Tree** - Logical structure that defines the layout hierarchy
2. **Frame Component** - Renders panes and muntins based on the sash tree
3. **Glass Components** - Window chrome (title bar, content area, action buttons) for each pane

## The Sash Store Pattern

### What is the Store?

Each leaf node in the sash tree has a `store` property that holds pane-specific data:

```typescript
interface SashStore {
  title?: string;           // Window title
  content?: string | HTMLElement;  // Window content (HTML or DOM element)
  tabs?: Array<string | {label: string}>;  // Optional tabs
  actions?: any[];          // Custom action buttons
  draggable?: boolean;      // Whether pane can be dragged
  // ... other Glass component props
}
```

The store acts as the **source of truth** for pane data and persists across:
- Layout changes (when Frame re-renders)
- Pane movements (drag-and-drop)
- Minimize/restore operations
- Component unmount/remount cycles

### Store Lifecycle

#### 1. Initial Pane Creation

When panes are created from configuration:

```javascript
// In test page
const config = {
  children: [{
    position: Position.Left,
    title: 'Left Pane',
    content: '<p>Content here</p>'
  }]
};
```

The `title` and `content` are passed to the Glass component as props, but **initially NOT stored in `sash.store`**. This is a key point - the configuration properties are separate from the store.

#### 2. Dynamic Pane Addition

When adding panes programmatically via `BinaryWindow.addPane()`:

```typescript
// src/lib/bwin/binary-window/BinaryWindow.svelte:176-194
export function addPane(targetPaneSashId: string, props: any) {
  const { position, size, id, ...glassProps } = props;

  // Create new sash in the tree
  const newPaneSash = frameComponent.addPane(targetPaneSashId, { position, size, id });

  // Store glass props (title, content, etc.) in the sash's store
  newPaneSash.store = glassProps;

  // Create and mount Glass component
  if (newPaneSash.domNode) {
    createGlassForPane(newPaneSash.domNode, newPaneSash);
  }

  return newPaneSash;
}
```

Here the store is **explicitly populated** with all Glass-related props.

## Handling Frame Re-renders

### The Problem

The Frame component uses a `{#key updateCounter}` block (src/lib/bwin/frame/Frame.svelte:164) that destroys and recreates the entire DOM when the sash tree changes. This happens when:
- Panes are added or removed
- Panes are swapped
- The tree is restructured

### The Solution

**Glass Components are Recreated with Preserved Store Data**

When Frame re-renders:

```typescript
// src/lib/bwin/binary-window/BinaryWindow.svelte:66-103
function createGlassForPane(paneEl: HTMLElement, sash: Sash) {
  // Cleanup existing glass instance for this sash
  const existingGlass = glassesBySashId.get(sash.id);
  if (existingGlass) {
    unmount(existingGlass.instance);
    glassesBySashId.delete(sash.id);
  }

  // Create NEW Glass instance with data from store
  const glassInstance = svelteMount(Glass, {
    target: container,
    props: {
      ...sash.store,  // ← Restore all props from store
      sash,
      binaryWindow: bwinContext
    }
  });
}
```

The store persists in the sash tree, so when Glass is recreated, it receives the same props and appears unchanged to the user.

## Minimize/Restore Operations

### Minimizing a Pane

When a pane is minimized (src/lib/bwin/binary-window/actions.minimize.js):

1. **Extract ALL data from the pane** - both from `sash.store` AND the DOM:

```javascript
// Get store data
const sash = rootSash?.getById(paneSashId);
const store = { ...(sash?.store || {}) };

// Extract from DOM if missing from store
const glassTitleEl = glassEl?.querySelector('.glass-title');
const glassContentEl = glassEl?.querySelector('.glass-content');

if (glassTitleEl && !store.title) {
  store.title = glassTitleEl.textContent;
}
if (glassContentEl && !store.content) {
  store.content = glassContentEl.innerHTML;
}
```

This **fallback extraction** is critical because initial panes from configuration may not have their title/content in the store.

2. **Attach data to minimized button**:

```javascript
minimizedGlassEl.bwOriginalStore = store;
minimizedGlassEl.bwOriginalSashId = paneSashId;
minimizedGlassEl.bwOriginalPosition = panePosition;
minimizedGlassEl.bwOriginalBoundingRect = getMetricsFromElement(paneEl);
```

3. **Remove the pane from the tree** but keep the button in the sill.

### The Sill Persistence Challenge

**Problem**: When Frame re-renders (due to pane removal), the sill is destroyed because it's a child of `windowElement`.

**Solution**: Preserve minimized glass buttons across sill recreations:

```typescript
// src/lib/bwin/binary-window/BinaryWindow.svelte:386-394
// Preserve minimized glass buttons from old sill if it exists
// Move (not clone) the buttons to preserve all custom properties
if (sillElement) {
  const minimizedGlasses = Array.from(sillElement.querySelectorAll('.bw-minimized-glass'));
  minimizedGlasses.forEach(glassBtn => {
    sillEl.append(glassBtn); // Move the original element
  });
}
```

**Key Point**: We **move** the actual DOM elements (not clone), which preserves all custom properties (bwOriginalStore, etc.) naturally.

### Restoring a Pane

When clicking a minimized button (src/lib/bwin/binary-window/BinaryWindow.svelte:235-313):

1. **Retrieve stored data**:

```typescript
const originalStore = minimizedGlassEl.bwOriginalStore || {};
const originalSashId = minimizedGlassEl.bwOriginalSashId;
```

2. **Add pane with preserved data**:

```typescript
addPane(targetPaneSashId, {
  id: originalSashId,
  position: newPosition,
  size: newSize,
  ...originalStore  // ← Restore ALL original props
});
```

3. **Remove minimized button from sill**.

The `addPane` function (as shown earlier) stores the props in `sash.store`, and then creates a Glass component with those props.

## Drag-and-Drop Operations

### Swapping Panes

When panes are swapped (drag pane A onto pane B in center drop zone):

```typescript
// src/lib/bwin/binary-window/BinaryWindow.svelte:126-147
export function swapPanes(sourcePaneEl, targetPaneEl) {
  const sourceSashId = sourcePaneEl.getAttribute('data-sash-id');
  const targetSashId = targetPaneEl.getAttribute('data-sash-id');

  const sourceSash = rootSash.getById(sourceSashId);
  const targetSash = rootSash.getById(targetSashId);

  // Swap stores in the sash tree
  const tempStore = sourceSash.store;
  sourceSash.store = targetSash.store;
  targetSash.store = tempStore;

  // Trigger re-render
  triggerUpdate();
}
```

After swapping stores, `triggerUpdate()` causes Frame to re-render, and Glass components are recreated with the swapped stores.

### Moving Panes (Split Operations)

When dragging pane A onto pane B at a side drop zone (top/right/bottom/left):

```typescript
// src/lib/bwin/binary-window/BinaryWindow.svelte:142-163
const oldSashId = getSashIdFromPane(activeDragGlassEl);

// Preserve the store before removing
const oldSash = frameComponent.rootSash?.getById(oldSashId);
const oldStore = oldSash?.store || {};

// Remove from old location
removePane(oldSashId);

// Add at new location with preserved store
const newPaneSash = addPane(targetSashId, {
  position: actualDropArea,
  id: oldSashId,
  ...oldStore  // ← Preserve all data
});
```

## Best Practices for Store Management

### 1. Always Use the Store for Dynamic Panes

When programmatically adding panes, pass all relevant data:

```typescript
binaryWindow.addPane(targetId, {
  position: Position.Right,
  size: 400,
  title: 'My Pane',
  content: '<div>Content</div>',
  // Any other Glass props
});
```

### 2. Initial Configuration vs Dynamic Addition

**Initial panes** (from configuration) work differently:

```typescript
// Configuration approach - props passed to Glass directly
const config = {
  children: [{
    title: 'Pane 1',
    content: '<p>Content</p>'
  }]
};
```

These props are NOT automatically stored in `sash.store`. This is why the minimize action extracts them from the DOM as a fallback.

**Dynamic panes** (via `addPane`) have props automatically stored.

### 3. Preserve Store on Tree Mutations

When manipulating the sash tree, always preserve the store:

```typescript
// Bad - store is lost
const newSash = addPaneSash(targetSash, { position, size });

// Good - store is preserved
const newSash = addPaneSash(targetSash, { position, size });
newSash.store = { title: 'My Title', content: '<div>...</div>' };
```

## Common Pitfalls

### 1. Modifying DOM Directly

❌ **Don't** modify Glass content via DOM manipulation:

```javascript
// Bad - changes lost on re-render
document.querySelector('.glass-content').innerHTML = 'New content';
```

✅ **Do** update the store and trigger a re-render:

```javascript
// Good - persists across re-renders
sash.store.content = 'New content';
createGlassForPane(paneEl, sash);
```

### 2. Cloning vs Moving DOM Elements

❌ **Don't** clone elements with custom properties:

```javascript
// Bad - custom properties lost
const clone = element.cloneNode(true);
```

✅ **Do** move elements when possible:

```javascript
// Good - all properties preserved
newParent.append(element);
```

### 3. Assuming Store Exists

❌ **Don't** assume `sash.store` is populated:

```javascript
// Bad - may fail for initial panes
const title = sash.store.title;
```

✅ **Do** provide fallbacks:

```javascript
// Good - extract from DOM if needed
const title = sash.store?.title ||
              paneEl.querySelector('.glass-title')?.textContent ||
              'Untitled';
```

## Summary

The sv-window-manager uses a **store-based architecture** where:

1. Each sash (pane) has a `store` object containing all Glass component props
2. Glass components are recreated on every Frame re-render using data from the store
3. Minimize/restore operations preserve the store in minimized button custom properties
4. Drag-and-drop operations swap or move stores along with panes
5. The sill persists minimized buttons by moving (not cloning) DOM elements

This architecture ensures **data persistence** across all layout operations while maintaining Svelte 5's reactive patterns.
