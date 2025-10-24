# BinaryWindow Examples

This directory contains working examples that demonstrate the key features and capabilities of the sv-window-manager library. Each example is self-contained, well-commented, and showcases a specific aspect of the window manager.

## Table of Contents

- [Getting Started](#getting-started)
- [Examples Overview](#examples-overview)
- [Running Examples](#running-examples)
- [Example Details](#example-details)

## Getting Started

All examples follow the same pattern:

1. **Import the component** - Either `BinaryWindow` or `BwinHost`
2. **Configure settings** - Set up fitContainer, dimensions, etc.
3. **Add panes** - Use `addPane()` to add content
4. **Interact** - Resize, drag, minimize, maximize, close

## Examples Overview

| Example | File | Features Demonstrated |
|---------|------|----------------------|
| **Basic Setup** | `01-basic-setup.svelte` | Minimal configuration, static 2-pane layout |
| **Dynamic Panes** | `02-dynamic-panes.svelte` | Add/remove panes programmatically, button controls |
| **Custom Content** | `03-custom-content.svelte` | BwinHost wrapper, mounting Svelte components |
| **Drag & Drop** | `04-drag-drop.svelte` | Rearranging panes, drop zones, visual feedback |
| **Glass Actions** | `05-glass-actions.svelte` | Minimize, maximize, close, sill restoration |
| **Responsive Fit** | `06-responsive-fit.svelte` | Container resizing, responsive behavior |

## Running Examples

### In Storybook

The easiest way to view all examples is through Storybook:

```bash
npm run storybook
```

Navigate to **Examples** in the sidebar to see all examples.

### In Development Server

You can also import and use examples in the dev server:

```bash
npm run dev
```

Then import an example in your page:

```svelte
<script>
  import BasicSetup from '$lib/../examples/01-basic-setup.svelte';
</script>

<BasicSetup />
```

### As Templates

Each example can be used as a template for your own implementation. Simply copy the relevant code and adapt it to your needs.

## Example Details

### 01 - Basic Setup

**File:** `01-basic-setup.svelte`

The simplest possible BinaryWindow setup. Perfect for getting started.

**Key Concepts:**
- Basic BinaryWindow configuration
- Using `onMount` to add panes after initialization
- Creating DOM elements for pane content
- Positioning panes (top, right, bottom, left)

**Code Snippet:**
```svelte
<script lang="ts">
  import BinaryWindow from '$lib/bwin/binary-window/BinaryWindow.svelte';

  let bwinRef = $state<BinaryWindow | undefined>();

  const settings = {
    width: 800,
    height: 500,
    fitContainer: false
  };

  onMount(() => {
    bwinRef.addPane('root', {
      title: 'Welcome',
      content: createContent()
    });
  });
</script>

<BinaryWindow bind:this={bwinRef} {settings} />
```

**Use Cases:**
- Learning the basics
- Simple static layouts
- Prototyping layouts

---

### 02 - Dynamic Panes

**File:** `02-dynamic-panes.svelte`

Demonstrates adding and removing panes dynamically based on user actions.

**Key Concepts:**
- Adding panes programmatically with buttons
- Removing specific panes by ID
- Tracking active panes
- State management for dynamic layouts

**Code Snippet:**
```svelte
function addPaneRight() {
  const newPaneId = `pane-${counter++}`;
  bwinRef.addPane(targetPaneId, {
    id: newPaneId,
    position: 'right',
    title: `Pane ${counter}`,
    content: createContent()
  });
}

function removePane(paneId: string) {
  bwinRef.removePane(paneId);
}
```

**Use Cases:**
- Dynamic dashboards
- Tab-like interfaces
- Session-based applications
- Workspace management

---

### 03 - Custom Content

**File:** `03-custom-content.svelte`

Shows how to use BwinHost to mount full Svelte components inside panes.

**Key Concepts:**
- Using BwinHost wrapper
- Mounting Svelte components with `mount()`
- Passing props to child components
- Mixing different component types

**Code Snippet:**
```svelte
<script lang="ts">
  import BwinHost from '$lib/components/BwinHost.svelte';
  import ChatSession from './ChatSession.svelte';

  let bwinHostRef = $state<BwinHost | undefined>();

  function addChatPane() {
    bwinHostRef.addPane(
      'chat-1',
      { position: 'right' },
      ChatSession,
      {
        sessionId: 'chat-1',
        data: { welcome: 'Hello!' }
      }
    );
  }
</script>
```

**Use Cases:**
- Complex interactive components
- Full Svelte reactivity needed
- Component composition
- Code editors, chat interfaces, terminals

---

### 04 - Drag & Drop

**File:** `04-drag-drop.svelte`

Demonstrates the built-in drag-and-drop functionality for rearranging panes.

**Key Concepts:**
- Drag-and-drop is enabled by default
- Drop zones appear automatically
- Center drop swaps panes
- Edge drops create splits
- Visual feedback during drag

**Code Snippet:**
```svelte
bwinRef.addPane('root', {
  title: 'Draggable Pane',
  content: createContent(),
  draggable: true  // Default is true
});
```

**Use Cases:**
- User-customizable layouts
- Workspace arrangement
- Dashboard configuration
- IDE-like interfaces

---

### 05 - Glass Actions

**File:** `05-glass-actions.svelte`

Shows window management controls: minimize, maximize, and close.

**Key Concepts:**
- Default actions (minimize, maximize, close)
- Minimize to sill at bottom
- Click sill button to restore
- Maximize to full window
- Last pane cannot be closed

**Code Snippet:**
```svelte
bwinRef.addPane('root', {
  title: 'My Pane',
  actions: true  // Enable default actions (default)
});

// Disable actions
bwinRef.addPane('root', {
  title: 'No Actions',
  actions: false
});
```

**Use Cases:**
- Standard window management
- User-controlled layout
- Minimizing inactive panes
- Focus management

---

### 06 - Responsive Fit

**File:** `06-responsive-fit.svelte`

Demonstrates automatic resizing to fit parent container dimensions.

**Key Concepts:**
- `fitContainer: true` for responsive behavior
- ResizeObserver for efficient resize detection
- Proportional pane resizing
- Testing with different container sizes

**Code Snippet:**
```svelte
const settings = {
  fitContainer: true  // Key setting for responsive behavior
};

<div class="container" style="width: {width}; height: {height};">
  <BinaryWindow {settings} />
</div>
```

**Use Cases:**
- Responsive web applications
- Mobile-friendly layouts
- Embedded windows in dynamic containers
- Full-screen applications

## Common Patterns

### Pattern 1: Creating Pane Content

**Using DOM elements:**
```typescript
function createContent() {
  const div = document.createElement('div');
  div.style.cssText = 'padding: 20px;';
  div.innerHTML = '<h2>Hello</h2>';
  return div;
}
```

**Using Svelte components (BwinHost):**
```typescript
bwinHostRef.addPane(
  'pane-id',
  { position: 'right' },
  MyComponent,
  { prop1: 'value', prop2: 123 }
);
```

### Pattern 2: Positioning Panes

```typescript
// Add to the right
bwinRef.addPane(targetId, { position: 'right' });

// Add below
bwinRef.addPane(targetId, { position: 'bottom' });

// Add to the left
bwinRef.addPane(targetId, { position: 'left' });

// Add above
bwinRef.addPane(targetId, { position: 'top' });
```

### Pattern 3: Sizing Panes

```typescript
// Percentage size (relative)
bwinRef.addPane(targetId, {
  position: 'right',
  size: '30%'  // 30% of parent
});

// Fixed size (absolute)
bwinRef.addPane(targetId, {
  position: 'bottom',
  size: 200  // 200px height
});

// Default (splits evenly)
bwinRef.addPane(targetId, {
  position: 'right'
  // size omitted = 50/50 split
});
```

### Pattern 4: Tracking Layout Changes

```typescript
let paneCount = $state(0);
let activePanes = $state<string[]>([]);

function addPane() {
  const id = `pane-${paneCount++}`;
  activePanes = [...activePanes, id];
  bwinRef.addPane('root', { id, /* ... */ });
}

function removePane(id: string) {
  bwinRef.removePane(id);
  activePanes = activePanes.filter(p => p !== id);
}
```

## Best Practices

### 1. Always Use `fitContainer` for Responsive Apps

```svelte
const settings = {
  fitContainer: true  // Recommended for most apps
};
```

### 2. Use Percentage Sizes for Flexible Layouts

```typescript
// Good: Scales with container
bwinRef.addPane(targetId, {
  position: 'right',
  size: '25%'
});

// Less flexible: Fixed size
bwinRef.addPane(targetId, {
  position: 'right',
  size: 300
});
```

### 3. Provide Meaningful Pane IDs

```typescript
// Good: Descriptive IDs
bwinRef.addPane('root', {
  id: 'editor-main',
  title: 'Main Editor'
});

// Less clear
bwinRef.addPane('root', {
  id: 'pane1',
  title: 'Pane 1'
});
```

### 4. Handle Pane Removal Safely

```typescript
function removePane(id: string) {
  // Check if it's the last pane
  if (activePanes.length <= 1) {
    alert('Cannot remove the last pane');
    return;
  }

  bwinRef.removePane(id);
  activePanes = activePanes.filter(p => p !== id);
}
```

### 5. Use BwinHost for Complex Components

```typescript
// For simple HTML content: use BinaryWindow
bwinRef.addPane('root', {
  content: createDomElement()
});

// For Svelte components: use BwinHost
bwinHostRef.addPane(
  'pane-id',
  {},
  SvelteComponent,
  { props }
);
```

## Troubleshooting

### Panes Not Appearing

- Ensure `onMount` is used for adding initial panes
- Check that settings include valid dimensions or fitContainer
- Verify the target pane ID exists

### Drag & Drop Not Working

- Drag is enabled by default on glass headers
- Ensure you're dragging the header, not the content
- Check that `draggable: false` hasn't been set

### Container Not Resizing

- Set `fitContainer: true` in settings
- Ensure parent container has explicit dimensions
- Check that container isn't display: inline

### Actions Not Showing

- Actions are enabled by default
- Check that `actions: false` hasn't been set
- Verify glass header is visible

## Next Steps

1. **Explore the Examples** - Run through each example in Storybook
2. **Copy and Modify** - Use examples as templates for your own code
3. **Check the Docs** - Read the full API documentation
4. **Build Something** - Start building your own window-managed application!

## Resources

- **API Documentation:** See main README.md
- **Type Definitions:** `/src/lib/types.ts` and `/src/lib/bwin/types.ts`
- **Storybook:** `npm run storybook`
- **Dev Server:** `npm run dev`

## Contributing

Found an issue or have an idea for a new example? Contributions are welcome!

1. Create a new example following the existing pattern
2. Add it to `Examples.stories.svelte`
3. Update this README
4. Submit a pull request

---

**Happy coding!** 🚀
