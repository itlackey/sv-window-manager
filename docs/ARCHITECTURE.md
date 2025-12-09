# SV-Window-Manager: Architecture & Mental Model

This document explains the terminology, concepts, and mental model behind the sv-window-manager component library. Understanding these fundamentals will help you work effectively with the codebase.

## Table of Contents

1. [Core Concept: Binary Space Partitioning](#core-concept-binary-space-partitioning)
2. [Key Terminology](#key-terminology)
3. [The Sash Tree](#the-sash-tree)
4. [Component Hierarchy](#component-hierarchy)
5. [Positions and Directions](#positions-and-directions)
6. [How Panes Are Added](#how-panes-are-added)
7. [State Management](#state-management)
8. [The Store Pattern](#the-store-pattern)
9. [Resize and Drag-Drop](#resize-and-drag-drop)
10. [Empty State Handling](#empty-state-handling)

---

## Core Concept: Binary Space Partitioning

The library uses a **Binary Space Partitioning (BSP) tree** to organize window panes. This is the same technique used in many tiling window managers (like i3, bspwm) and game engines.

### The Key Insight

Every split creates exactly **two children**. When you split a pane, you don't just add a new pane—you transform the original pane into a **container** that holds two child panes.

```
BEFORE: Single pane
┌─────────────────┐
│                 │
│     Pane A      │
│                 │
└─────────────────┘

AFTER: Split right (adds Pane B)
┌────────┬────────┐
│        │        │
│ Pane A │ Pane B │
│        │        │
└────────┴────────┘

Tree structure:
       Container (was Pane A)
        /              \
    Pane A           Pane B
  (position:left)  (position:right)
```

This recursive structure allows for complex layouts while keeping the data model simple and predictable.

---

## Key Terminology

### Sash

A **Sash** is the fundamental data structure—a node in the binary tree. Every sash has:

- **Dimensions**: `left`, `top`, `width`, `height`
- **Position**: Where it sits relative to its parent (`left`, `right`, `top`, `bottom`, or `root`)
- **Children**: An array of 0-2 child sashes
- **Store**: A flexible object for storing component data, title, and other metadata

A sash is either:
- A **leaf node** (no children) → represents an actual **pane** with content
- A **parent node** (has children) → represents a **split/container**, rendered as a **muntin**

### Pane

A **Pane** is a leaf sash—a sash with no children. It's the actual content container where your Svelte components are rendered. In the DOM, panes are absolutely positioned `<div>` elements.

### Muntin

A **Muntin** is a parent sash—a sash with children. Visually, it's the **divider line** between panes that users can drag to resize. The term comes from window architecture (the strips that hold window panes in place).

```
┌────────┬────────┐
│        │        │
│ Pane   │ Pane   │
│        │        │
└────────┴────────┘
         ↑
      Muntin (draggable divider)
```

### Glass

**Glass** is the "chrome" or "decoration" around a pane's content. It includes:
- Title bar/header
- Tab bar (for multiple tabs in one pane)
- Action buttons (close, minimize, maximize)
- The content area where your component renders

Think of Glass as the window frame around your content.

### Sill

The **Sill** is the bottom bar that appears when panes are minimized. Minimized panes appear as buttons in the sill, and clicking them restores the pane. (Named after the bottom part of a window frame.)

### Frame

The **Frame** is the main layout container component. It:
- Manages the sash tree
- Renders all panes and muntins
- Handles resize and drop interactions
- Provides the API for adding/removing panes

---

## The Sash Tree

### Tree Structure

```
                    Root Sash
                   (container)
                    /        \
            Left Sash      Right Sash
           (container)       (pane)
            /      \
      Top Sash   Bottom Sash
       (pane)      (pane)
```

### Visual Layout

```
┌─────────────┬─────────────┐
│   Top Pane  │             │
├─────────────┤  Right Pane │
│ Bottom Pane │             │
└─────────────┴─────────────┘
```

### Key Properties

Every sash has these reactive properties:

```typescript
interface Sash {
  // Identity
  id: string;                    // Unique identifier
  position: Position;            // 'root', 'left', 'right', 'top', 'bottom'

  // Geometry (reactive - changes trigger re-render)
  left: number;                  // X position in pixels
  top: number;                   // Y position in pixels
  width: number;                 // Width in pixels
  height: number;                // Height in pixels

  // Constraints
  minWidth: number;              // Minimum allowed width
  minHeight: number;             // Minimum allowed height

  // Tree structure
  parent: Sash | null;           // Parent sash (null for root)
  children: Sash[];              // Child sashes (0-2)

  // Data storage
  store: Record<string, any>;    // Flexible metadata storage

  // DOM reference
  domNode: HTMLElement | null;   // Associated DOM element
}
```

### Tree Traversal

```typescript
// Walk all nodes (post-order depth-first)
rootSash.walk((sash) => {
  console.log(sash.id, sash.position);
});

// Get all leaf panes
const panes = rootSash.getAllLeafDescendants();

// Find a specific sash by ID
const targetSash = rootSash.getById('my-pane-id');
```

---

## Component Hierarchy

```
BinaryWindow
│
├── Frame
│   │
│   ├── Pane (for each leaf sash)
│   │   └── Glass (pane chrome)
│   │       └── [Your Component] (mounted via component prop)
│   │
│   └── Muntin (for each parent sash)
│
└── Sill (minimized panes bar)
```

### Rendering Flow

1. **BinaryWindow** creates a Frame with initial settings
2. **Frame** builds a sash tree from configuration
3. Frame derives two arrays from the tree:
   - `panes`: All leaf sashes (rendered as Pane components)
   - `muntins`: All parent sashes (rendered as Muntin components)
4. Each **Pane** receives a sash and renders content via snippet
5. **Glass** wraps your component with title bar and actions
6. **Muntin** dividers are positioned between adjacent panes

---

## Positions and Directions

### Position Enum

```typescript
enum Position {
  Root = 'root',       // The root sash (top-level container)
  Left = 'left',       // Left child of a horizontal split
  Right = 'right',     // Right child of a horizontal split
  Top = 'top',         // Top child of a vertical split
  Bottom = 'bottom',   // Bottom child of a vertical split
  Center = 'center',   // Used for drag-drop (swap content)
  Unknown = 'unknown', // Boundary area
  Outside = 'outside'  // Cursor outside element
}
```

### Split Types

- **Horizontal split**: Creates `left` and `right` children
- **Vertical split**: Creates `top` and `bottom` children

```
Horizontal Split          Vertical Split
┌───────┬───────┐        ┌─────────────┐
│       │       │        │     Top     │
│ Left  │ Right │        ├─────────────┤
│       │       │        │   Bottom    │
└───────┴───────┘        └─────────────┘
```

### Adding Panes by Position

When you call `addPane(targetId, { position: 'right' })`:

```
Target: Pane A
Position: right

Result:
┌─────────┬─────────┐
│         │         │
│ Pane A  │ New Pane│
│ (left)  │ (right) │
└─────────┴─────────┘
```

---

## How Panes Are Added

Understanding the pane addition process is crucial:

### Step-by-Step

1. **Find target sash** by ID
2. **Transform target** into a container (parent)
3. **Create two children**:
   - One child inherits the original content (opposite position)
   - One child is the new empty pane (requested position)
4. **Generate new ID** for the parent (it's now a muntin, not a pane)
5. **Reactive update** triggers re-render

### Example: Adding Right of "editor"

```typescript
binaryWindow.addPane('editor', {
  position: 'right',
  size: '40%',
  component: Terminal,
  componentProps: { sessionId: 'term-1' },
  title: 'Terminal'
});
```

**Before:**
```
Root
└── editor (pane) ← store: { component: Editor, title: 'Editor' }
```

**After:**
```
Root
└── abc-123 (muntin) ← new generated ID
    ├── editor (pane, position: left) ← keeps original ID and store
    └── xyz-456 (pane, position: right) ← new pane with Terminal
```

### Key Insight

The original pane **keeps its ID and content**—it just moves to become a child. This preserves references and state.

---

## State Management

### Module-Level State

The library uses Svelte 5's `$state` rune at the module level for shared state:

```typescript
// In glass-state.svelte.ts
let glasses = $state.raw<GlassInstance[]>([]);
let activeGlass = $state<GlassInstance | undefined>();

// In sill-state.svelte.ts
let sillElement = $state<HTMLElement | undefined>();
```

### Reactive Sash Properties

Sash dimensions use `$state` with custom setters that propagate changes:

```typescript
class ReactiveSash {
  private _width = $state<number>(150);

  get width() { return this._width; }

  set width(value: number) {
    this._width = value;
    // Automatically propagate to children
    this.propagateWidthToChildren(value);
  }
}
```

### Context System

Two contexts provide component-wide access:

```typescript
// BwinContext - Window-level operations
interface BwinContext {
  windowElement: HTMLElement | undefined;
  rootSash: Sash | undefined;
  addPane(targetId: string, props: object): Sash;
  removePane(sashId: string): void;
  // ...
}

// FrameContext - Layout-level settings
interface FrameContext {
  debug: boolean;
}
```

---

## The Store Pattern

Each sash has a `store` object for flexible data storage:

```typescript
sash.store = {
  // Glass properties
  title: 'My Pane',
  actions: [{ label: 'Save', onClick: handleSave }],
  draggable: true,

  // Component mounting
  component: MyComponent,
  componentProps: { data: myData },

  // Custom metadata
  isPlaceholder: false,
  customData: { ... }
};
```

### Why Store?

1. **Flexibility**: Store any data without changing the Sash class
2. **Component Props**: Pass props to mounted components
3. **Glass Configuration**: Title, actions, tabs all live here
4. **Swapping**: When panes swap, only stores are exchanged

---

## Resize and Drag-Drop

### Resize (Muntin Dragging)

1. User mousedown on muntin
2. `resize` action captures initial positions
3. mousemove → RAF-throttled updates to sash dimensions
4. Dimension setters propagate changes to children
5. Svelte reactivity updates DOM styles
6. mouseup → emit `onpaneresized` event

### Drag-Drop (Pane Reordering)

1. User drags glass header
2. `drag` action enables dragging
3. `drop` action detects cursor position in target pane:
   - **Edge zones** (top/right/bottom/left): Split target pane
   - **Center zone**: Swap pane content
4. Drop triggers appropriate action
5. Events emitted for UI feedback

### Cursor Position Detection

The drop system divides each pane into 5 zones using diagonal lines:

```
       TOP (split above)
      ╱    ╲
     ╱      ╲
LEFT ╲ CENTER╱ RIGHT
(split╲     ╱(split
left)  ╲   ╱  right)
        ╲ ╱
       BOTTOM
     (split below)
```

---

## Empty State Handling

When there are no panes, the window can show custom content:

### The `empty` Snippet

```svelte
<BinaryWindow settings={{ fitContainer: true }}>
  {#snippet empty()}
    <div class="welcome">
      <h2>Welcome!</h2>
      <p>Add a pane to get started.</p>
    </div>
  {/snippet}
</BinaryWindow>
```

### How It Works

1. `isEmpty` derived state checks if only placeholder or no panes exist
2. When `isEmpty && empty` snippet provided:
   - Empty snippet renders in `bw-empty-state` container
   - Frame is hidden but still mounted (for `addPane` to work)
3. When first real pane is added:
   - `isEmpty` becomes false
   - Empty state hides, Frame shows

### Placeholder Pane

A special pane (`__bwin_placeholder__`) is created when the window initializes empty:
- Marked with `isPlaceholder: true` in store
- Automatically replaced when first pane is added
- Glass component skips rendering for placeholder panes

---

## Quick Reference

| Term | Definition |
|------|------------|
| **Sash** | Binary tree node (either pane or container) |
| **Pane** | Leaf sash with content |
| **Muntin** | Parent sash rendered as divider |
| **Glass** | Pane chrome (title bar, actions) |
| **Sill** | Bottom bar for minimized panes |
| **Frame** | Main layout component |
| **Store** | Flexible data object on each sash |
| **Position** | Direction relative to parent |

## Common Operations

```typescript
// Get reference to BinaryWindow
let bwin: BinaryWindow;

// Add a pane
bwin.addPane('target-id', {
  position: 'right',      // 'top' | 'right' | 'bottom' | 'left'
  size: '40%',            // '40%', 300, 0.4
  component: MyComponent,
  componentProps: { ... },
  title: 'My Pane'
});

// Remove a pane
bwin.removePane('pane-id');

// Get root sash
const root = bwin.getRootSash();

// Find all panes
const panes = root?.getAllLeafDescendants();

// Check if empty
const empty = bwin.getIsEmpty();

// Trigger reflow
bwin.fit();
```

---

## Further Reading

- `CLAUDE.md` - Development guide and patterns
- `docs/SNIPPET_USAGE_GUIDE.md` - Using snippets for custom rendering
- `docs/EVENTS_MIGRATION_GUIDE.md` - Event system documentation
- Source: `src/lib/bwin/` - Core implementation
