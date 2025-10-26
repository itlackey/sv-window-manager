# Snippet Usage Guide

## Overview

The sv-window-manager library uses a **component-only architecture** where all pane content must be provided as Svelte components. This guide covers advanced patterns using **Svelte 5 snippets** for declarative, type-safe content composition within your components.

## Why Component-Only?

- **Type Safety**: Full TypeScript support with compile-time type checking
- **Reactivity**: Component state automatically updates when props change
- **Performance**: No HTML parsing overhead, direct component instantiation
- **Modern Patterns**: Leverages Svelte 5 runes and snippets for clean composition
- **Maintainability**: Components are easier to test and refactor than HTML strings

## Basic Component Usage

### Creating a Simple Pane Component

All pane content must be Svelte components:

```svelte
<!-- MyPaneComponent.svelte -->
<script lang="ts">
  let { message = 'Hello' }: { message?: string } = $props();

  let count = $state(0);

  function increment() {
    count++;
  }
</script>

<div class="pane-content">
  <h2>{message}</h2>
  <p>Count: {count}</p>
  <button onclick={increment}>Increment</button>
</div>

<style>
  .pane-content {
    padding: 20px;
  }
</style>
```

### Adding Panes with Components

```svelte
<script lang="ts">
  import { BinaryWindow } from 'sv-window-manager';
  import MyPaneComponent from './MyPaneComponent.svelte';

  const settings = {
    id: 'root',
    title: 'Main Pane',
    component: MyPaneComponent,
    componentProps: { message: 'Welcome!' }
  };

  let bwin = $state<BinaryWindow>();

  function addPane() {
    bwin?.addPane('root', {
      position: 'right',
      title: 'New Pane',
      component: MyPaneComponent,
      componentProps: { message: 'Split view!' }
    });
  }
</script>

<BinaryWindow bind:this={bwin} {settings} />
<button onclick={addPane}>Add Pane</button>
```

## Advanced Patterns

### Using Snippets Within Components

You can use snippets inside your pane components for composable layouts:

```svelte
<!-- StatsPane.svelte -->
<script lang="ts">
  let { stats }: { stats: Array<{title: string, value: number}> } = $props();
</script>

{#snippet statsCard(title: string, value: number)}
  <div class="card">
    <h3>{title}</h3>
    <div class="value">{value}</div>
  </div>
{/snippet}

<div class="stats-grid">
  {#each stats as stat}
    {@render statsCard(stat.title, stat.value)}
  {/each}
</div>
```

Then use it as a pane component:

```svelte
<script lang="ts">
  import StatsPane from './StatsPane.svelte';

  bwin?.addPane('root', {
    position: 'right',
    component: StatsPane,
    componentProps: {
      stats: [
        { title: 'Users', value: 42 },
        { title: 'Revenue', value: 1000 }
      ]
    }
  });
</script>
```

### Complex Component Layouts

Build sophisticated pane components with nested snippets:

```svelte
<!-- DashboardPane.svelte -->
<script lang="ts">
  let { data }: { data: any } = $props();
</script>

{#snippet header()}
  <div class="header">
    <h1>Dashboard</h1>
  </div>
{/snippet}

{#snippet sidebar()}
  <nav>
    <ul>
      <li>Home</li>
      <li>Settings</li>
    </ul>
  </nav>
{/snippet}

<div class="layout">
  {@render header()}
  {@render sidebar()}
  <main>{data.content}</main>
</div>
```

Use it as a pane:

```svelte
bwin?.addPane('root', {
  position: 'right',
  component: DashboardPane,
  componentProps: { data: { content: 'Dashboard content' } }
});
```

### Conditional Rendering in Components

Use Svelte's conditional logic in your pane components:

```svelte
<!-- DataViewPane.svelte -->
<script lang="ts">
  let { initialData = [] }: { initialData?: any[] } = $props();

  let isLoading = $state(false);
  let data = $state(initialData);

  async function loadData() {
    isLoading = true;
    // Fetch data...
    isLoading = false;
  }
</script>

<div class="data-view">
  {#if isLoading}
    <div class="spinner">Loading...</div>
  {:else if data.length === 0}
    <p>No data available</p>
  {:else}
    <ul>
      {#each data as item}
        <li>{item.name}</li>
      {/each}
    </ul>
  {/if}
</div>
```

Add it as a pane:

```svelte
bwin?.addPane('root', {
  position: 'bottom',
  component: DataViewPane,
  componentProps: { initialData: [] }
});
```

## Component Architecture

The library follows a **component-only architecture**:

- **All pane content MUST be Svelte components**
- Components are passed via the `component` prop
- Component props are passed via the `componentProps` object
- No HTML strings or DOM elements are supported

This ensures type safety, maintainability, and leverages Svelte 5's reactive capabilities.

## Type Safety

Components and their props are fully typed with TypeScript:

```typescript
import type { Component } from 'svelte';

interface MyComponentProps {
  message: string;
  count?: number;
}

// Your component with typed props
const MyComponent: Component<MyComponentProps>;

// Type-safe pane configuration
bwin?.addPane('root', {
  position: 'right',
  component: MyComponent,
  componentProps: {
    message: 'Hello',  // TypeScript validates this
    count: 42          // TypeScript validates this too
  }
});
```

## Performance Considerations

### Component-Based Architecture Benefits

- **Direct Component Instantiation**: No HTML parsing or serialization overhead
- **Optimized Reactivity**: Svelte's compiler optimizes component updates
- **Tree Shaking**: Unused components are eliminated from the bundle
- **Type Safety**: Catch errors at compile time rather than runtime

### Best Practices

| Use Case | Recommended Pattern |
|----------|---------------------|
| Static content | Simple component with props |
| Interactive UI | Component with $state runes |
| Reusable widgets | Component with typed props |
| Complex layouts | Component with nested snippets |
| Form inputs | Component with bindings |

## Creating Reusable Pane Components

### Example: Form Component

```svelte
<!-- FormPane.svelte -->
<script lang="ts">
  interface FormData {
    name: string;
    email: string;
  }

  let {
    onSubmit,
    initialData = { name: '', email: '' }
  }: {
    onSubmit: (data: FormData) => void;
    initialData?: FormData;
  } = $props();

  let formData = $state<FormData>(initialData);

  function handleSubmit() {
    onSubmit(formData);
  }
</script>

<form class="form-pane">
  <input bind:value={formData.name} placeholder="Name" />
  <input bind:value={formData.email} placeholder="Email" />
  <button onclick={handleSubmit}>Submit</button>
</form>
```

Use it:

```svelte
bwin?.addPane('root', {
  position: 'right',
  component: FormPane,
  componentProps: {
    initialData: { name: 'John', email: 'john@example.com' },
    onSubmit: (data) => console.log('Submitted:', data)
  }
});
```

## Common Patterns

### Loading State Component

```svelte
<!-- LoadingPane.svelte -->
<script lang="ts">
  let { loadData }: { loadData: () => Promise<any> } = $props();

  let isLoading = $state(true);
  let data = $state(null);

  async function load() {
    isLoading = true;
    data = await loadData();
    isLoading = false;
  }

  $effect(() => {
    load();
  });
</script>

<div class="loading-pane">
  {#if isLoading}
    <div class="spinner">Loading...</div>
  {:else}
    <div>Data: {JSON.stringify(data)}</div>
  {/if}
</div>
```

### Dashboard Card Component

```svelte
<!-- DashboardCard.svelte -->
<script lang="ts">
  let {
    title,
    value,
    change
  }: {
    title: string;
    value: number;
    change: number;
  } = $props();
</script>

<div class="card">
  <h3>{title}</h3>
  <div class="value">{value}</div>
  <div class="change" class:positive={change > 0}>
    {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
  </div>
</div>

<style>
  .positive { color: green; }
</style>
```

Add as pane:

```svelte
bwin?.addPane('root', {
  position: 'right',
  component: DashboardCard,
  componentProps: { title: 'Sales', value: 1234, change: 12.5 }
});
```

## Working with Pane Components

### Accessing Window Context

Pane components can access the window manager context to interact with other panes:

```svelte
<!-- InteractivePane.svelte -->
<script lang="ts">
  import { getWindowContext } from 'sv-window-manager';
  import type { Sash } from 'sv-window-manager';
  import AnotherComponent from './AnotherComponent.svelte';

  let { sash }: { sash: Sash } = $props();

  const bwin = getWindowContext();

  function splitRight() {
    bwin.addPane(sash.id, {
      position: 'right',
      component: AnotherComponent,
      componentProps: { message: 'I was split off!' }
    });
  }

  function closeMe() {
    bwin.removePane(sash.id);
  }
</script>

<div class="interactive-pane">
  <button onclick={splitRight}>Split Right</button>
  <button onclick={closeMe}>Close</button>
</div>
```

## Examples

See the example components in the library source:

- `src/examples/` - Full examples showing component patterns
- `src/routes/components/` - Session component examples (Terminal, FileEditor, etc.)

## Questions?

If you have questions or issues with snippets, please open an issue on GitHub.
