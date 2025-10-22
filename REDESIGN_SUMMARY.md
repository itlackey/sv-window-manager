# Bwin Components Redesign - Declarative Svelte 5

## Overview

This redesign transforms the bwin components from imperative DOM manipulation to truly declarative Svelte 5 components that leverage reactive state and composition.

## Key Improvements

### 1. **Frame.svelte - Declarative Tree Renderer**

#### Before (BAD)
- Manual DOM manipulation with `createPane()` and `createMuntin()`
- Imperative `update()` method that manually compared DOM with state
- Used `updateTick` to force reactivity
- Duplicated tree-walking logic
- Components handled their own lifecycle via callbacks

#### After (GOOD)
- **Fully declarative rendering** using `{#each}` blocks
- Sash tree is the **single source of truth**
- Svelte automatically re-renders when tree changes (via `renderVersion`)
- Uses `$derived.by()` to reactively collect panes and muntins from tree
- Context API to share callbacks with child components
- Simple, clean template:
  ```svelte
  {#each allSashes.panes as sash (sash.id)}
    <Pane {sash} />
  {/each}
  {#each allSashes.muntins as sash (sash.id)}
    <Muntin {sash} />
  {/each}
  ```

#### Key Changes
- Removed: `onPaneCreate()`, `onPaneUpdate()`, `onMuntinCreate()`, `onMuntinUpdate()` methods
- Added: `onPaneRender`, `onMuntinRender`, `onPaneDrop` props (callbacks)
- Context API: `bwin-debug`, `bwin-pane-render`, `bwin-muntin-render`
- Renamed: `updateTick` → `renderVersion` (more semantically clear)
- Tree walking happens in `$derived.by()` - pure computation

### 2. **Pane.svelte - Pure Presentation Component**

#### Before (BAD)
- Managed its own lifecycle with `$effect()` hooks
- Handled content injection manually
- Mixed presentation with behavior
- Props: `debug`, `oncreate`, `onupdate`, `children`

#### After (GOOD)
- **Pure presentation** - only renders based on sash state
- All styles computed via `$derived` from sash properties
- Uses context API to get callbacks and debug flag
- Automatically stores `domNode` reference on sash
- No manual lifecycle management
- Props: `sash`, `children` (minimal API)

#### Key Changes
- Removed: `oncreate`, `onupdate` props
- Added: Context consumption for `bwin-debug` and `bwin-pane-render`
- Styles: Direct `$derived` computations (no object wrapping)
- Simplified: No manual content injection - delegated to render callback

### 3. **Muntin.svelte - Pure Presentation Component**

#### Before (BAD)
- Managed lifecycle with callbacks
- Computed styles in a function that returned an object
- Props: `sash`, `muntinSize`, `oncreate`, `onupdate`

#### After (GOOD)
- **Pure presentation** - only renders based on sash state
- Individual `$derived` functions for each style property
- Uses context API for render callback
- Automatically stores `domNode` reference
- Props: `sash`, `muntinSize` (minimal API)

#### Key Changes
- Removed: `oncreate`, `onupdate` props
- Added: Context consumption for `bwin-muntin-render`
- Styles: Individual `$derived` functions (more granular reactivity)
- Split direction logic stays purely declarative

### 4. **BinaryWindow.svelte - Composition over Inheritance**

#### Before (BAD)
- Duplicated all Frame logic
- Tried to "extend" Frame by copy-pasting code
- Mixed Glass management with frame rendering
- 500+ lines of duplicated code

#### After (GOOD)
- **Composes Frame as a child component**
- Delegates all tree management to Frame
- Only adds Glass-specific behavior
- Wraps Frame with drag action
- Uses context API to share window instance with Glass components
- ~350 lines (30% reduction)

#### Key Changes
- Uses `<Frame>` component directly
- Passes callbacks via props: `onPaneRender`, `onMuntinRender`, `onPaneDrop`
- Context API: `bwin-context` provides window instance to Glass
- Public API: Delegates to Frame methods
- Exposed properties: Changed from direct exports to getter functions
  ```typescript
  // Before: export const rootSash = $derived(...)  ❌
  // After:  export function getRootSash() { ... }  ✓
  ```

## Design Principles Applied

### Single Source of Truth
- **Sash tree** is the only state
- DOM is always derived from the tree
- No need to manually sync DOM with state

### Reactive by Default
- Mutations to the sash tree automatically trigger re-renders
- `renderVersion` increments when structure changes (add/remove panes)
- Individual sash properties trigger granular updates (resize)

### Declarative Rendering
- Use `{#each}`, `{#if}`, `$derived` - not imperative DOM methods
- Template clearly shows structure
- No manual DOM creation/update/removal

### Composition over Inheritance
- Frame is a reusable component
- BinaryWindow composes Frame + Glass behavior
- Context API for sharing state down the tree
- Callbacks for extending behavior

### Actions for Behavior
- `resize`, `drag`, `drop` as reusable Svelte actions
- Attach to elements declaratively with `use:action`
- Clean separation of concerns

## Benefits

1. **Easier to understand**: Template shows exactly what renders
2. **Less code**: Removed ~200 lines of imperative DOM manipulation
3. **More maintainable**: Single source of truth, clear data flow
4. **Better performance**: Svelte's fine-grained reactivity vs manual updates
5. **Type-safe**: Full TypeScript support with proper interfaces
6. **Testable**: Pure functions and declarative rendering
7. **Extensible**: Context API and callbacks for customization

## Migration Impact

### Breaking Changes
- **Frame.svelte**:
  - Removed: `onPaneCreate()`, `onPaneUpdate()`, `onMuntinCreate()`, `onMuntinUpdate()` export methods
  - Added: `onPaneRender`, `onMuntinRender`, `onPaneDrop` props
  - `triggerUpdate()` still exists but increments `renderVersion` instead of `updateTick`

- **Pane.svelte** & **Muntin.svelte**:
  - Removed: `oncreate`, `onupdate` props
  - Now use context API for callbacks

- **BinaryWindow.svelte**:
  - Changed exports from properties to getter functions:
    - `rootSash` → `getRootSash()`
    - `windowElement` → `getWindowElement()`
    - `containerElement` → `getContainerElement()`
    - `sillElement` → `getSillElement()`
    - `debug` → `getDebug()`

### Backward Compatibility
- Public API methods remain the same: `addPane()`, `removePane()`, `fit()`, `mount()`
- Sash tree structure unchanged
- CSS and styling unchanged
- Actions (resize, drag, drop) unchanged

## Testing Recommendations

1. **Unit tests**: Test individual components with mocked sash trees
2. **Integration tests**: Test Frame → Pane/Muntin rendering
3. **E2E tests**: Test BinaryWindow with Glass components
4. **Performance tests**: Compare render times before/after

## Future Improvements

1. **Eliminate `renderVersion`**: Use Svelte 5's fine-grained reactivity
   - Make Sash class properties reactive (`$state` runes)
   - Tree mutations would automatically trigger re-renders

2. **Type-safe Sash tree**: Convert `sash.js` to TypeScript with generics

3. **Virtual tree diffing**: For very large trees (100+ panes)

4. **Slots for customization**: Allow custom pane/muntin templates

5. **Memoization**: Use `$derived.by()` with shallow equality checks

## Conclusion

This redesign transforms the bwin components from an imperative, DOM-manipulating approach to a truly declarative, reactive Svelte 5 architecture. The code is now simpler, more maintainable, and leverages Svelte's strengths while maintaining the same public API for minimal migration impact.
