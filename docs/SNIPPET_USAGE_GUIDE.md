# Snippet Usage Guide

## Overview

As of version 1.x, the Glass component supports **Svelte 5 snippets** for type-safe, reactive content composition. Snippets provide a modern, performant alternative to HTML strings and DOM elements.

## Why Snippets?

- **Type Safety**: Full TypeScript support with compile-time type checking
- **Reactivity**: Snippet content automatically updates when state changes
- **Performance**: No HTML parsing or DOM serialization overhead
- **Clean Syntax**: Declarative `{@render}` syntax is more readable
- **Composability**: Snippets can be passed as props and composed easily

## Basic Usage

### Title Snippets

Replace string titles with reactive snippet content:

```svelte
<script>
  import { Glass } from 'sv-window-manager';
  import type { Snippet } from 'svelte';

  let count = $state(0);
</script>

{#snippet customTitle()}
  <strong style="color: #4A90E2;">
    🎨 Counter: {count}
  </strong>
{/snippet}

<Glass
  title={customTitle}
  content="Some content"
  {binaryWindow}
/>
```

### Content Snippets

Create interactive, reactive pane content:

```svelte
<script>
  import { Glass } from 'sv-window-manager';

  let message = $state('Hello');

  function updateMessage() {
    message = 'Updated!';
  }
</script>

{#snippet interactiveContent()}
  <div style="padding: 20px;">
    <h2>{message}</h2>
    <button onclick={updateMessage}>Update</button>
    <p>Snippets support full Svelte reactivity!</p>
  </div>
{/snippet}

<Glass
  title="Interactive Pane"
  content={interactiveContent}
  {binaryWindow}
/>
```

## Advanced Patterns

### Parameterized Snippets

Snippets can accept parameters for reusability:

```svelte
{#snippet statsCard(title: string, value: number)}
  <div class="card">
    <h3>{title}</h3>
    <div class="value">{value}</div>
  </div>
{/snippet}

<!-- Use with different parameters -->
<Glass content={() => statsCard('Users', 42)} {binaryWindow} />
<Glass content={() => statsCard('Revenue', 1000)} {binaryWindow} />
```

### Nested Snippets

Compose complex layouts by nesting snippets:

```svelte
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

{#snippet layout()}
  <div class="layout">
    {@render header()}
    {@render sidebar()}
    <main>Content here</main>
  </div>
{/snippet}

<Glass content={layout} {binaryWindow} />
```

### Conditional Rendering

Use Svelte's conditional logic inside snippets:

```svelte
<script>
  let isLoading = $state(false);
  let data = $state([]);
</script>

{#snippet dataView()}
  <div>
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
{/snippet}

<Glass content={dataView} {binaryWindow} />
```

## Backward Compatibility

Snippets are fully compatible with existing content types:

```svelte
<!-- String content (still supported) -->
<Glass
  title="String Title"
  content="<p>HTML string content</p>"
  {binaryWindow}
/>

<!-- DOM element content (still supported) -->
<script>
  const contentEl = document.createElement('div');
  contentEl.textContent = 'DOM content';
</script>

<Glass
  title="DOM Title"
  content={contentEl}
  {binaryWindow}
/>

<!-- Snippet content (new) -->
{#snippet myContent()}
  <div>Snippet content</div>
{/snippet}

<Glass
  title="Snippet Title"
  content={myContent}
  {binaryWindow}
/>
```

## Type Safety

Snippets are fully typed with TypeScript:

```typescript
import type { Snippet } from 'svelte';
import type { GlassProps } from 'sv-window-manager';

// Define custom snippet types
type TitleSnippet = Snippet;
type ContentSnippet = Snippet<[data: MyData]>;

// Glass component props are fully typed
const props: GlassProps = {
  title: myTitleSnippet,  // TypeScript knows this can be Snippet
  content: myContentSnippet,
  binaryWindow
};
```

## Performance Considerations

### Snippets vs Strings

- **Snippets**: No HTML parsing, direct DOM manipulation, faster initial render
- **Strings**: HTML parsing overhead, sanitization required, slower

### Snippets vs Components

- **Snippets**: Lightweight, no component lifecycle overhead
- **Components**: Full lifecycle, heavier but more powerful for complex cases

### When to Use Each

| Use Case | Recommended Approach |
|----------|---------------------|
| Static HTML | String |
| Simple reactive content | Snippet |
| Complex interactive UI | Component (via `mount()`) |
| Reusable card/widget | Snippet with parameters |
| Full app section | Component |

## Migration Path

### From Strings to Snippets

**Before**:
```svelte
<Glass
  title="My Title"
  content="<div>My content</div>"
  {binaryWindow}
/>
```

**After**:
```svelte
{#snippet title()}
  My Title
{/snippet}

{#snippet content()}
  <div>My content</div>
{/snippet}

<Glass {title} {content} {binaryWindow} />
```

### From DOM Elements to Snippets

**Before**:
```svelte
<script>
  const contentEl = document.createElement('div');
  contentEl.innerHTML = '<h2>Title</h2><p>Content</p>';
</script>

<Glass content={contentEl} {binaryWindow} />
```

**After**:
```svelte
{#snippet content()}
  <div>
    <h2>Title</h2>
    <p>Content</p>
  </div>
{/snippet}

<Glass content={content} {binaryWindow} />
```

## Common Patterns

### Loading State

```svelte
<script>
  let isLoading = $state(true);

  async function loadData() {
    isLoading = true;
    await fetchData();
    isLoading = false;
  }
</script>

{#snippet content()}
  {#if isLoading}
    <div class="spinner">Loading...</div>
  {:else}
    <div>Data loaded!</div>
  {/if}
{/snippet}
```

### Form Snippet

```svelte
<script>
  let name = $state('');

  function handleSubmit() {
    console.log('Name:', name);
  }
</script>

{#snippet formContent()}
  <form onsubmit={handleSubmit}>
    <input bind:value={name} placeholder="Enter name" />
    <button type="submit">Submit</button>
  </form>
{/snippet}
```

### Dashboard Card

```svelte
{#snippet dashboardCard(title: string, value: number, change: number)}
  <div class="card">
    <h3>{title}</h3>
    <div class="value">{value}</div>
    <div class="change" class:positive={change > 0}>
      {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
    </div>
  </div>
{/snippet}

<Glass content={() => dashboardCard('Sales', 1234, 12.5)} {binaryWindow} />
```

## Examples

See the `SnippetExample.svelte` component in the library for a complete working example:

```typescript
import { SnippetExample } from 'sv-window-manager';
```

## Limitations

Current limitations (to be addressed in Phase 2.3):

1. **BinaryWindow.addPane()**: Snippets cannot currently be passed through `addPane()` due to store serialization limitations. Use direct Glass component instantiation for now.

2. **Snippet Serialization**: Snippets are functions and cannot be stored in plain objects. Declarative rendering (Phase 2.3) will resolve this.

## Future Enhancements

Planned for Phase 2.3 (declarative-glass-rendering):

- Direct snippet support in `BinaryWindow.addPane()`
- Snippet-based tab content
- Snippet-based action button content
- Full declarative rendering with `{#each}` over panes

## Questions?

If you have questions or issues with snippets, please open an issue on GitHub.
