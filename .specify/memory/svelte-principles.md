# Svelte Development Principles

**Purpose**: Universal guidance for developers and AI agents working on Svelte 5 projects
**Scope**: General best practices, patterns, and gotchas applicable to any Svelte codebase
**Last Updated**: October 25, 2025

---

## Table of Contents

1. [Svelte 5 Fundamentals](#svelte-5-fundamentals)
2. [Reactivity Patterns](#reactivity-patterns)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Event Handling](#event-handling)
6. [Testing Strategies](#testing-strategies)
7. [Accessibility](#accessibility)
8. [Performance Optimization](#performance-optimization)
9. [Common Gotchas](#common-gotchas)
10. [Debugging Techniques](#debugging-techniques)
11. [TypeScript Integration](#typescript-integration)
12. [Best Practices Summary](#best-practices-summary)

---

## Svelte 5 Fundamentals

### Use Runes for All Reactive State

**Rule**: Always use Svelte 5 runes (`$state`, `$props`, `$derived`, `$effect`) instead of legacy syntax.

```typescript
// ✅ CORRECT - Svelte 5 Runes
let count = $state(0);
let doubled = $derived(count * 2);
const { items = [], title }: Props = $props();

// ❌ WRONG - Legacy Svelte syntax
export let items = [];
export let title;
let count = 0;
$: doubled = count * 2;
```

**Why**: Runes provide:
- Better TypeScript integration
- Clearer intent and code readability
- Improved performance
- Foundation of Svelte 5's reactivity system

---

### Props Destructuring with Defaults

**Pattern**: Use `$props()` with TypeScript interface and default values.

```typescript
interface ComponentProps {
  items: Item[];
  title?: string;
  onUpdate?: (item: Item) => void;
}

let {
  items,
  title = 'Default Title',
  onUpdate = () => {}
}: ComponentProps = $props();
```

**Benefits**:
- Type safety
- Clear default values
- Autocomplete in IDE
- Self-documenting API

---

### Derived State for Computed Values

**Pattern**: Use `$derived()` for values computed from reactive state.

```typescript
// ✅ CORRECT - Memoized computation
let items = $state<Item[]>([]);
let activeItems = $derived(items.filter(item => item.active));

// ❌ WRONG - Function call (re-runs every render)
function getActiveItems() {
  return items.filter(item => item.active);
}
```

**Why**: `$derived` only recalculates when dependencies change. Functions run on every render.

---

### Use $derived.by() for Complex Computations

**Pattern**: For multi-step derived values, use `$derived.by()`.

```typescript
let items = $state<Item[]>([]);

let stats = $derived.by(() => {
  const active = items.filter(i => i.active);
  const total = items.length;
  const percentage = total > 0 ? (active.length / total) * 100 : 0;

  return { active: active.length, total, percentage };
});
```

**Benefits**:
- Can use statements (not just expressions)
- Better for complex logic
- Still memoized like `$derived`

---

### Effects for Side Effects Only

**Rule**: Use `$effect()` ONLY for side effects, not for state updates.

```typescript
// ✅ CORRECT - Side effect (DOM manipulation, subscriptions)
$effect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  return () => {
    // Cleanup
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
});

// ❌ WRONG - State update in effect (use $derived instead)
$effect(() => {
  doubled = count * 2; // Should be: let doubled = $derived(count * 2)
});
```

**When to use `$effect`**:
- DOM manipulation
- External subscriptions (WebSocket, EventSource)
- Browser APIs (localStorage, ResizeObserver, IntersectionObserver)
- Third-party library integration
- Logging/analytics

**When NOT to use `$effect`**:
- Computing derived values (use `$derived`)
- Transforming props (use `$derived`)
- Filtering/mapping arrays (use `$derived`)

---

### Lifecycle Hooks

**Pattern**: Use `onMount`, `onDestroy`, and `$effect` appropriately.

```typescript
import { onMount, onDestroy } from 'svelte';

// ✅ onMount - Run once when component mounts
onMount(() => {
  console.log('Component mounted');

  // Return cleanup function
  return () => {
    console.log('Component will unmount');
  };
});

// ✅ onDestroy - Run once when component unmounts
onDestroy(() => {
  cleanup();
});

// ✅ $effect - Run when dependencies change
$effect(() => {
  // Runs on mount and when `userId` changes
  fetchUserData(userId);

  return () => {
    // Cleanup when effect re-runs or component unmounts
    cancelFetch();
  };
});
```

**Rule**: Use `onMount` for one-time initialization. Use `$effect` for reactive side effects.

---

## Reactivity Patterns

### Immutable Updates

**Rule**: Always create new arrays/objects instead of mutating.

```typescript
// ✅ CORRECT - Immutable update (triggers reactivity)
items = [...items, newItem];
items = items.filter(item => item.id !== removeId);
user = { ...user, name: newName };

// ❌ WRONG - Mutation (doesn't trigger reactivity)
items.push(newItem);
items.splice(index, 1);
user.name = newName;
```

**Why**: Svelte 5's reactivity relies on assignment. Mutations don't trigger updates.

---

### Arrays and Objects

**Pattern**: Use spread operators and array methods that return new arrays.

```typescript
// ✅ Adding items
items = [...items, newItem];
items = [newItem, ...items]; // Add to beginning

// ✅ Removing items
items = items.filter(item => item.id !== removeId);

// ✅ Updating items
items = items.map(item =>
  item.id === targetId
    ? { ...item, name: newName }
    : item
);

// ✅ Sorting (create new array first)
items = [...items].sort((a, b) => a.order - b.order);
```

---

### Nested Reactivity

**Pattern**: Use `$state.raw()` for objects with component instances or complex nested structures.

```typescript
// ✅ For objects containing component instances
let componentInstances = $state.raw<ComponentInstance[]>([]);
let componentMap = $state.raw(new Map<string, ComponentInstance>());

// ✅ For deeply nested reactive state
let nestedState = $state({
  user: { profile: { settings: { theme: 'dark' } } }
});

// Access works normally
nestedState.user.profile.settings.theme = 'light'; // Reactive
```

**Why**: `$state.raw()` prevents Svelte from wrapping values in proxies, which can cause issues with:
- Component instances (causes "state_proxy_unmount" errors)
- DOM nodes
- Class instances with complex internals
- Third-party library objects

---

### Avoid Circular Dependencies in Effects

**Anti-Pattern**: Reading and writing the same state in an effect creates infinite loops.

```typescript
// ❌ WRONG - Circular dependency
let count = $state(0);

$effect(() => {
  count = count + 1; // Infinite loop! Effect triggers itself
});

// ✅ CORRECT - Use $derived for computations
let count = $state(0);
let incremented = $derived(count + 1);

// ✅ CORRECT - Or use untrack() to break dependency
import { untrack } from 'svelte';

$effect(() => {
  const currentCount = untrack(() => count);
  doSomethingWith(currentCount);
});
```

---

## Component Architecture

### Single Responsibility Principle

**Pattern**: Each component should have one clear purpose.

```typescript
// ✅ GOOD - Focused components
<UserList users={users} />
<UserListItem user={user} />
<UserAvatar src={user.avatar} />

// ❌ BAD - Monolithic component
<UserManagement /> // Does everything: list, edit, delete, search, filter
```

---

### Composition Over Nesting

**Pattern**: Use component composition, not deep nesting.

```typescript
// ✅ GOOD - Flat composition
<div class="tab-bar">
  {#each tabs as tab}
    <TabButton {tab} />
  {/each}
</div>

{#if contextMenu}
  <ContextMenu items={menuItems} />
{/if}

// ❌ BAD - Deep nesting with nested interactive elements
<TabButton>
  <CloseButton>
    <Icon />
  </CloseButton>
</TabButton>
```

**Why**: Avoids nested interactive elements (invalid HTML) and improves accessibility.

---

### Context for Shared State

**Pattern**: Use context API for implicit prop passing.

```typescript
// Parent component
import { setContext } from 'svelte';

const themeContext = {
  theme: $state('dark'),
  toggleTheme: () => {
    themeContext.theme = themeContext.theme === 'dark' ? 'light' : 'dark';
  }
};

setContext('theme', themeContext);

// Child component (any depth)
import { getContext } from 'svelte';

const theme = getContext<typeof themeContext>('theme');
// Access: theme.theme, theme.toggleTheme()
```

**When to use**:
- Theme settings
- User preferences
- API client instances
- Feature flags
- Shared component state

**When NOT to use**:
- Data that changes frequently
- Data needed by only 1-2 components (use props)
- Data that needs to be serializable

---

### Snippets for Reusable Markup

**Pattern**: Use Svelte 5 snippets for reusable template fragments.

```svelte
<script>
  import type { Snippet } from 'svelte';

  interface Props {
    items: Item[];
    renderItem: Snippet<[Item]>;
  }

  let { items, renderItem }: Props = $props();
</script>

<ul>
  {#each items as item}
    <li>
      {@render renderItem(item)}
    </li>
  {/each}
</ul>
```

**Usage**:
```svelte
<ItemList items={products}>
  {#snippet renderItem(product)}
    <strong>{product.name}</strong> - ${product.price}
  {/snippet}
</ItemList>
```

---

## State Management

### Component-Level State

**Pattern**: Keep state at the lowest level possible.

```typescript
// ✅ GOOD - State owned by component that uses it
<script>
  let isOpen = $state(false);

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<button onclick={toggle}>Toggle</button>
{#if isOpen}
  <Panel />
{/if}
```

---

### Lifting State Up

**Pattern**: Lift state to common ancestor when multiple components need it.

```typescript
// Parent component
let selectedId = $state<string | null>(null);

<ItemList items={items} {selectedId} onSelect={(id) => selectedId = id} />
<ItemDetails itemId={selectedId} />
```

---

### Shared Reactive State (Stores Pattern)

**Pattern**: Create reactive modules for shared state across components.

```typescript
// stores/counter.svelte.ts
function createCounter() {
  let count = $state(0);

  return {
    get count() { return count; },
    increment: () => count++,
    decrement: () => count--,
    reset: () => count = 0
  };
}

export const counter = createCounter();
```

**Usage**:
```typescript
// Any component
import { counter } from './stores/counter.svelte';

<button onclick={counter.increment}>
  Count: {counter.count}
</button>
```

**Benefits**:
- Shared state across component tree
- No props drilling
- Encapsulated logic
- Reactive without subscriptions

---

### State Initialization

**Pattern**: Initialize state in module scope, not in effects.

```typescript
// ✅ CORRECT - Initialize in module scope
let items = $state<Item[]>(loadFromLocalStorage());

// ❌ WRONG - Initialize in effect (runs after mount)
let items = $state<Item[]>([]);

$effect(() => {
  items = loadFromLocalStorage(); // Too late, initial render already happened
});

// ✅ CORRECT - Or use onMount for async initialization
import { onMount } from 'svelte';

let items = $state<Item[]>([]);

onMount(async () => {
  items = await fetchItems();
});
```

---

## Event Handling

### Custom Events

**Pattern**: Dispatch strongly-typed custom events.

```typescript
// Define event types
interface ComponentEvents {
  select: { itemId: string };
  update: { item: Item };
  delete: { itemId: string };
}

// Props interface
interface Props {
  items: Item[];
  onselect?: (event: ComponentEvents['select']) => void;
  onupdate?: (event: ComponentEvents['update']) => void;
  ondelete?: (event: ComponentEvents['delete']) => void;
}

let { items, onselect, onupdate, ondelete }: Props = $props();

// Dispatch events
function handleClick(item: Item) {
  onselect?.({ itemId: item.id });
}
```

**Usage**:
```svelte
<ItemList
  items={products}
  onselect={(e) => console.log('Selected:', e.itemId)}
  ondelete={(e) => deleteItem(e.itemId)}
/>
```

---

### Event Payload Design

**Rule**: Keep event payloads minimal and JSON-serializable.

```typescript
// ✅ CORRECT - Minimal IDs
onreorder?.({ order: ['id1', 'id2', 'id3'] });

// ❌ WRONG - Entire objects
onreorder?.({ items: [item1, item2, item3] }); // Wasteful
```

---

### Prevent Event Bubbling

**Pattern**: Stop propagation when needed to prevent parent handlers.

```typescript
// Close button inside tab button
<button class="tab" onclick={() => activateTab(tab)}>
  {tab.name}

  <span
    role="button"
    tabindex="0"
    onclick={(e) => {
      e.stopPropagation(); // Prevent tab activation
      closeTab(tab);
    }}
  >
    ✕
  </span>
</button>
```

---

### Keyboard Event Handling

**Pattern**: Check modifier keys BEFORE plain keys in conditional chains.

```typescript
function handleKeydown(event: KeyboardEvent) {
  // ✅ CORRECT - Check modifiers first
  if (event.ctrlKey && event.key === 'ArrowRight') {
    reorderRight();
  }
  else if (event.key === 'ArrowRight') {
    navigateRight();
  }

  // ❌ WRONG - Plain key check first
  // if (event.key === 'ArrowRight') {
  //   // This matches even when Ctrl is pressed!
  //   navigateRight();
  // }
  // else if (event.ctrlKey && event.key === 'ArrowRight') {
  //   // UNREACHABLE CODE
  // }
}
```

**Why**: If/else chains short-circuit on first match. Always check more specific conditions first.

---

## Testing Strategies

### Test Organization

**Pattern**: Mirror user stories and features in test structure.

```typescript
describe('Component - Feature Name', () => {
  describe('User Story 1: Description', () => {
    it('should handle basic interaction', async () => {
      // Test
    });

    it('should handle edge case', async () => {
      // Test
    });
  });

  describe('User Story 2: Description', () => {
    // Related tests
  });
});
```

---

### Vitest Browser Mode

**Pattern**: Use Playwright's `page` API in component tests.

```typescript
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';

it('should handle keyboard navigation', async () => {
  render(Component, { props: { items } });

  const button = page.getByRole('button', { name: 'Submit' });
  await button.click();

  await expect(page.getByText('Success')).toBeVisible();
});
```

**Benefits**:
- Realistic browser simulation
- Tests actual user experience
- Playwright's powerful locators

---

### Await Reactivity in Tests

**Pattern**: Wait for Svelte's reactivity to settle after state changes.

```typescript
it('should update UI when state changes', async () => {
  const { component } = render(Component);

  // Change state
  component.items = newItems;

  // Wait for reactivity
  await new Promise(resolve => setTimeout(resolve, 0));

  // Now assert
  await expect(page.getByRole('listitem')).toHaveCount(3);
});
```

---

### Test User Workflows, Not Implementation

**Pattern**: Test user-visible behavior, not internal state.

```typescript
// ❌ BAD - Testing implementation
it('should update internal state', () => {
  component.internalState = newValue;
  expect(component.internalState).toBe(newValue);
});

// ✅ GOOD - Testing user experience
it('should show success message after form submission', async () => {
  const form = page.getByRole('form');
  await form.locator('input[name="email"]').fill('test@example.com');
  await form.locator('button[type="submit"]').click();

  await expect(page.getByText('Success!')).toBeVisible();
});
```

---

### Test Keyboard Interactions

**Pattern**: Always test keyboard accessibility.

```typescript
it('should support keyboard navigation', async () => {
  render(Component);

  const firstItem = page.getByRole('button').first();
  await firstItem.focus();

  await page.keyboard.press('ArrowDown');

  const secondItem = page.getByRole('button').nth(1);
  await expect(secondItem).toBeFocused();
});
```

---

### Rapid Event Testing

**Pattern**: Test features with rapid, repeated actions to catch race conditions.

```typescript
it('should handle rapid clicks without errors', async () => {
  render(Component);

  const button = page.getByRole('button');

  // Rapid clicks
  for (let i = 0; i < 10; i++) {
    await button.click();
    await page.waitForTimeout(10);
  }

  // Should not have errors
  await expect(page.getByRole('alert')).not.toBeVisible();
});
```

---

## Accessibility

### Semantic HTML First

**Rule**: Use semantic HTML elements before adding ARIA roles.

```svelte
<!-- ✅ CORRECT - Semantic HTML + ARIA enhancement -->
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

<!-- ❌ WRONG - Divs with roles -->
<div role="navigation">
  <div role="list">
    <div role="listitem">
      <div role="link">Home</div>
    </div>
  </div>
</div>
```

---

### Keyboard Navigation Pattern

**Pattern**: Arrow keys move focus, Enter/Space activate.

```typescript
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') {
    // Move focus, don't activate
    nextElement.focus();
  }
  else if (event.key === 'Enter' || event.key === ' ') {
    // Activate focused element
    handleActivate();
  }
}
```

**Why**: Matches native browser behavior and gives users control.

---

### ARIA Labels and Roles

**Pattern**: Provide context for screen readers.

```svelte
<button
  aria-label="Close {itemName}"
  aria-pressed={isActive}
  aria-expanded={isOpen}
>
  ✕
</button>

<div role="tablist" aria-label="Settings sections">
  <button role="tab" aria-selected={isActive}>
    General
  </button>
</div>
```

---

### Live Regions for Dynamic Content

**Pattern**: Announce important changes to screen readers.

```svelte
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {#if saving}
    Saving changes...
  {:else if saved}
    Changes saved successfully
  {/if}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

---

### Respect Reduced Motion

**Pattern**: Provide reduced-motion alternatives.

```css
.animate-in {
  animation: slideIn 300ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animate-in {
    animation-duration: 50ms; /* Shorter */
    /* Or remove entirely: animation: none; */
  }
}
```

---

### Focus Management

**Pattern**: Manage focus for dynamic content.

```typescript
// When opening modal
$effect(() => {
  if (isOpen) {
    modalElement?.querySelector('button')?.focus();
  }
});

// When closing modal
function closeModal() {
  const returnFocusTo = document.activeElement;
  isOpen = false;

  // Return focus to trigger element
  returnFocusTo?.focus();
}
```

---

## Performance Optimization

### Derived State vs Functions

**Rule**: Use `$derived` for computed values, not functions.

```typescript
// ✅ FAST - Memoized
let filtered = $derived(items.filter(item => item.active));

// ❌ SLOW - Recalculates every render
function getFiltered() {
  return items.filter(item => item.active);
}
```

---

### Keyed Each Blocks

**Rule**: Always provide unique keys for each blocks.

```svelte
<!-- ✅ CORRECT - Unique key -->
{#each items as item (item.id)}
  <ItemCard {item} />
{/each}

<!-- ❌ WRONG - No key (uses index) -->
{#each items as item}
  <ItemCard {item} />
{/each}

<!-- ❌ WRONG - Non-unique key -->
{#each logs as log (`${log.timestamp}-${log.type}`)}
  <!-- If logs happen in same second, keys duplicate! -->
{/each}
```

**For truly unique keys**:
```typescript
let counter = 0;
const log = {
  id: `${Date.now()}-${counter++}`, // Millisecond precision + counter
  timestamp: new Date().toLocaleTimeString(),
  message: 'Event occurred'
};
```

---

### Debounce/Throttle Expensive Operations

**Pattern**: Rate-limit frequent events.

```typescript
let searchTimeout: number;

function handleSearchInput(event: Event) {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    performSearch((event.target as HTMLInputElement).value);
  }, 300) as unknown as number;
}
```

---

### Virtual Lists for Large Data

**Pattern**: Use virtual scrolling for long lists.

```typescript
// Use libraries like:
// - svelte-virtual-list
// - svelte-tiny-virtual-list
import VirtualList from 'svelte-virtual-list';

<VirtualList items={largeArray} let:item>
  <ItemCard {item} />
</VirtualList>
```

---

### Lazy Loading Components

**Pattern**: Dynamically import large components.

```typescript
import { onMount } from 'svelte';

let HeavyComponent: any;

onMount(async () => {
  HeavyComponent = (await import('./HeavyComponent.svelte')).default;
});

{#if HeavyComponent}
  <svelte:component this={HeavyComponent} />
{/if}
```

---

## Common Gotchas

### Keyed Each Block Duplicate Keys

**Problem**: Using non-unique values as keys causes Svelte errors.

```typescript
// ❌ WRONG - Second-precision timestamps
type Log = { timestamp: string; message: string };
const log = { timestamp: new Date().toLocaleTimeString(), message: '...' };
// Multiple logs in same second = duplicate keys!

// ✅ CORRECT - Guaranteed unique ID
type Log = { id: string; timestamp: string; message: string };
let counter = 0;
const log = {
  id: `${Date.now()}-${counter++}`,
  timestamp: new Date().toLocaleTimeString(),
  message: '...'
};
```

---

### Async Component Initialization

**Gotcha**: DOM elements don't exist immediately in async patterns.

```typescript
// Component uses callbacks for DOM-ready events
function addComponent(containerId: string) {
  // ❌ WRONG ASSUMPTION - DOM exists immediately
  const container = document.getElementById(containerId);
  // container might be null! Frame renders DOM asynchronously

  // ✅ CORRECT - Use callbacks
  onPaneRender((paneElement) => {
    // paneElement is guaranteed to exist
    mountComponentInto(paneElement);
  });
}
```

---

### Nested Buttons

**Gotcha**: Buttons inside buttons is invalid HTML and breaks accessibility.

```svelte
<!-- ❌ WRONG - Nested interactive elements -->
<button>
  Tab Name
  <button onclick={closeTab}>✕</button>
</button>

<!-- ✅ CORRECT - Use span with role -->
<button onclick={activateTab}>
  Tab Name
  <span
    role="button"
    tabindex="0"
    onclick={(e) => { e.stopPropagation(); closeTab(); }}
  >
    ✕
  </span>
</button>
```

---

### Context Not Available in Module Scope

**Gotcha**: `getContext()` only works in component initialization.

```typescript
// ❌ WRONG - Context not available yet
import { getContext } from 'svelte';
const theme = getContext('theme'); // Error!

// ✅ CORRECT - Get context in component body
<script>
  import { getContext } from 'svelte';
  const theme = getContext('theme');
</script>
```

---

### Effect Infinite Loops

**Gotcha**: Reading and writing same state in effect causes infinite loops.

```typescript
// ❌ WRONG - Infinite loop
let count = $state(0);

$effect(() => {
  count = count + 1; // Triggers effect again!
});

// ✅ CORRECT - Use $derived or untrack
let count = $state(0);
let incremented = $derived(count + 1);
```

---

## Debugging Techniques

### Test in Browser First

**Rule**: Always verify issues exist in running app before deep code analysis.

**Debugging Checklist**:
1. ✅ Run the app: `npm run dev`
2. ✅ Reproduce the issue manually
3. ✅ Check browser console for errors
4. ✅ Use DevTools to inspect DOM
5. ✅ Test different scenarios
6. ⚠️ Only then dive into code

**Time savings**: 2-5 minutes of testing vs. hours of investigation.

---

### Console Output Levels

**Pattern**: Distinguish between different console output types.

```typescript
// 🔴 ERROR - Actual problem requiring fix
console.error('[Component] Failed to mount:', error);

// ⚠️ WARNING - Potential issue or expected edge case
console.warn('[Component] Missing optional prop, using default');

// 🔵 INFO - Diagnostic information
console.log('[Component] Initialized with', props);

// 🟢 DEBUG - Development-only diagnostics
function debugLog(...args: any[]) {
  if (DEBUG) console.log('[Component]', ...args);
}
```

**Rule**: Not all console output indicates bugs. Understand the context.

---

### Svelte DevTools

**Tool**: Use official Svelte DevTools browser extension.

**Features**:
- Inspect component tree
- View component state and props
- Track state changes
- Profile component renders
- Debug performance issues

---

### Understanding Async Patterns

**Principle**: Async operations don't fail just because state isn't immediate.

```typescript
// BinaryWindow example (from project)
const newSash = addPane(targetId, { component, props });

// ⚠️ This is EXPECTED behavior:
console.log(newSash.domNode); // undefined

// Why: Frame creates DOM asynchronously via Svelte's reactive rendering
// The callback pattern handles this:
handlePaneRender(paneElement, sash) {
  // NOW paneElement exists and component can mount
}
```

**Lesson**: Read architecture docs to understand expected behavior vs. actual bugs.

---

### Use TypeScript Strict Mode

**Rule**: Enable strict TypeScript checks.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Why**: Catches bugs at compile time, not runtime.

---

## TypeScript Integration

### Type-Safe Props

**Pattern**: Define explicit interfaces for component props.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onclick?: (event: MouseEvent) => void;
  children: Snippet;
}

let {
  variant = 'primary',
  size = 'md',
  disabled = false,
  onclick,
  children
}: ButtonProps = $props();
```

---

### Type-Safe Events

**Pattern**: Define event payload types.

```typescript
interface ComponentEvents {
  select: { itemId: string };
  update: { item: Item; changes: Partial<Item> };
  delete: { itemId: string; confirmed: boolean };
}

interface Props {
  items: Item[];
  onselect?: (event: ComponentEvents['select']) => void;
  onupdate?: (event: ComponentEvents['update']) => void;
  ondelete?: (event: ComponentEvents['delete']) => void;
}
```

---

### Generic Components

**Pattern**: Use TypeScript generics for flexible components.

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: Snippet<[T]>;
  onSelect?: (item: T) => void;
}

<script lang="ts" generics="T">
  let { items, renderItem, onSelect }: ListProps<T> = $props();
</script>

<ul>
  {#each items as item}
    <li onclick={() => onSelect?.(item)}>
      {@render renderItem(item)}
    </li>
  {/each}
</ul>
```

---

### Type Guards

**Pattern**: Use type guards for runtime type checking.

```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}

// Usage
if (isUser(data)) {
  // TypeScript knows data is User
  console.log(data.name);
}
```

---

## Best Practices Summary

### Core Principles

| Category | Best Practice |
|----------|--------------|
| **Reactivity** | Use `$state`, `$props`, `$derived` - never mutate |
| **Effects** | Only for side effects, not state updates |
| **Keys** | Always use unique keys in each blocks |
| **TypeScript** | Explicit types for props, events, and state |
| **Testing** | Test user behavior, not implementation |
| **Accessibility** | Semantic HTML + ARIA + keyboard support |
| **Performance** | `$derived` for computations, virtual lists for large data |
| **Events** | Minimal payloads, check modifiers before plain keys |
| **Debugging** | Test in browser first, understand async patterns |
| **Architecture** | Single responsibility, composition over nesting |

---

### Quick Decision Tree

**When should I use...**

- **`$state`**: For reactive values that can change
- **`$props`**: For values passed from parent
- **`$derived`**: For computed values based on reactive state
- **`$effect`**: For side effects (DOM, subscriptions, external APIs)
- **`onMount`**: For one-time initialization when component mounts
- **`onDestroy`**: For cleanup when component unmounts
- **Context**: For implicit prop passing across component tree
- **Stores**: For shared reactive state across unrelated components
- **Snippets**: For reusable template fragments within component

---

### Anti-Patterns to Avoid

| ❌ Anti-Pattern | ✅ Correct Pattern |
|----------------|-------------------|
| Mutating arrays/objects | Use spread operators and immutable methods |
| `$effect` for derived state | Use `$derived` |
| Nested interactive elements | Composition with `stopPropagation` |
| Functions for computed values | Use `$derived` |
| Testing implementation details | Test user-visible behavior |
| Arbitrary test delays | Wait for specific conditions |
| Non-unique each keys | Use guaranteed unique IDs |
| Missing TypeScript types | Explicit interfaces for all contracts |
| Deep prop drilling | Context API or stores |
| Magic strings/numbers | Named constants |

---

### Code Review Checklist

Before committing Svelte code, verify:

- [ ] All reactive state uses `$state`, `$props`, or `$derived`
- [ ] No mutations of arrays or objects (use spread operators)
- [ ] `$effect` only used for side effects, not state updates
- [ ] All each blocks have unique keys
- [ ] TypeScript interfaces defined for props and events
- [ ] Event payloads are minimal and serializable
- [ ] Keyboard interactions tested and working
- [ ] ARIA labels present for screen readers
- [ ] No nested interactive elements (buttons in buttons)
- [ ] Tests focus on user behavior, not implementation
- [ ] No TypeScript `any` or `@ts-ignore` without justification
- [ ] Performance considerations for large lists/expensive computations

---

## Additional Resources

### Official Documentation
- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs)
- [Svelte Tutorial](https://learn.svelte.dev/)
- [SvelteKit Docs](https://kit.svelte.dev/docs)

### Testing
- [Vitest Browser Mode](https://vitest.dev/guide/browser)
- [Playwright Testing Library](https://playwright.dev/)

### Accessibility
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Guidelines](https://webaim.org/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Svelte + TypeScript](https://svelte.dev/docs/typescript)

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Source**: Lessons learned from sv-window-manager project
**Maintained By**: Development team and AI agents

**Feedback**: Update this document as new patterns emerge and lessons are learned.
