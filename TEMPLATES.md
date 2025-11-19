# Pane Templates & Presets

This guide covers the template system for creating and applying pre-defined window layouts in `sv-window-manager`.

## Overview

Templates define the **structure** of pane layouts (position, size, relationships) without the actual content. This allows you to:

- Apply common layouts quickly (two-column, IDE, dashboard, etc.)
- Create reusable layout patterns
- Share layouts across applications
- Persist and restore layout structures

**Key Concept:** Templates define the layout structure, while your application provides the actual pane content through components.

## Quick Start

```typescript
import { getTemplate, BUILTIN_TEMPLATES } from 'sv-window-manager';

// Get a built-in template
const template = getTemplate('two-column');
console.log(template);
// {
//   id: 'two-column',
//   name: 'Two Column',
//   description: 'Simple two-column layout with equal split',
//   panes: [
//     { id: 'left', position: 'root', size: 0.5, title: 'Left Panel' },
//     { id: 'right', position: 'right', size: 0.5, title: 'Right Panel' }
//   ]
// }

// List all available templates
import { listTemplates } from 'sv-window-manager';

const all = listTemplates();
console.log(all.map(t => t.name));
// ['Two Column', 'Three Column', 'Sidebar Left', ...]
```

## Built-in Templates

The library includes 8 built-in templates:

### 1. Two Column (`two-column`)

Simple two-column layout with equal 50/50 split.

```
┌─────────┬─────────┐
│  Left   │  Right  │
│         │         │
└─────────┴─────────┘
```

### 2. Three Column (`three-column`)

Three-column layout with equal splits.

```
┌─────┬────────┬─────┐
│Left │ Center │Right│
│     │        │     │
└─────┴────────┴─────┘
```

### 3. Sidebar Left (`sidebar-left`)

Left sidebar (30%) with main content area (70%).

```
┌───────┬──────────────┐
│Side   │    Main      │
│bar    │   Content    │
└───────┴──────────────┘
```

### 4. Sidebar Right (`sidebar-right`)

Main content area (70%) with right sidebar (30%).

```
┌──────────────┬───────┐
│    Main      │  Side │
│   Content    │  bar  │
└──────────────┴───────┘
```

### 5. Grid 2x2 (`grid-2x2`)

Four equal quadrants in a 2x2 grid.

```
┌────────┬────────┐
│Top Left│Top Rght│
├────────┼────────┤
│Bot Left│Bot Rght│
└────────┴────────┘
```

### 6. Horizontal Split (`horizontal-split`)

Two horizontal panes with equal split.

```
┌──────────────────┐
│       Top        │
├──────────────────┤
│      Bottom      │
└──────────────────┘
```

### 7. Dashboard (`dashboard`)

Dashboard layout with header, sidebar, main content, and footer.

```
┌──────────────────┐
│     Header       │
├─────┬────────────┤
│Side │    Main    │
│ bar │  Content   │
│     ├────────────┤
│     │   Footer   │
└─────┴────────────┘
```

### 8. IDE (`ide`)

IDE-style layout with file browser, editor, and terminal.

```
┌──────┬───────────┐
│File  │  Editor   │
│Tree  │           │
│      ├───────────┤
│      │ Terminal  │
└──────┴───────────┘
```

## Template Structure

A template is defined by the `LayoutTemplate` interface:

```typescript
interface LayoutTemplate {
  id: string;              // Unique identifier
  name: string;            // Human-readable name
  description?: string;    // Optional description
  panes: TemplatePane[];   // Array of pane definitions
  metadata?: Record<string, unknown>;  // Optional custom metadata
}

interface TemplatePane {
  id: string;              // Unique pane identifier
  position: 'top' | 'right' | 'bottom' | 'left' | 'root';
  size?: number;           // Optional size ratio (0-1)
  title?: string;          // Optional default title
  metadata?: Record<string, unknown>;  // Optional custom metadata
}
```

## Creating Custom Templates

### Basic Custom Template

```typescript
import { registerTemplate, type LayoutTemplate } from 'sv-window-manager';

const myTemplate: LayoutTemplate = {
  id: 'my-layout',
  name: 'My Custom Layout',
  description: 'A custom layout for my app',
  panes: [
    {
      id: 'main',
      position: 'root',
      size: 0.7,
      title: 'Main Content'
    },
    {
      id: 'sidebar',
      position: 'right',
      size: 0.3,
      title: 'Sidebar'
    }
  ]
};

registerTemplate(myTemplate);
```

### Template Validation

Templates are automatically validated when registered:

```typescript
import { validateTemplate, registerTemplate } from 'sv-window-manager';

const template = {
  id: 'test',
  name: 'Test Layout',
  panes: [
    { id: 'pane1', position: 'root' },
    { id: 'pane2', position: 'right' }
  ]
};

// Validate before registering
const result = validateTemplate(template);
if (result.valid) {
  registerTemplate(template);
} else {
  console.error('Template errors:', result.errors);
}
```

### Validation Rules

Templates must satisfy these rules:

1. ✅ Must have an `id` and `name`
2. ✅ Must have at least one pane
3. ✅ Must have exactly one pane with `position: 'root'`
4. ✅ All panes must have unique `id` values
5. ✅ All panes must have a valid `position`: `top`, `right`, `bottom`, `left`, or `root`
6. ✅ Size values (if provided) must be numbers between 0 and 1

## Managing Templates

### Listing Templates

```typescript
import { listTemplates } from 'sv-window-manager';

// Get all templates
const all = listTemplates();

// Filter templates
const twoPane = listTemplates(t => t.panes.length === 2);
const devTemplates = listTemplates(t => t.metadata?.category === 'development');
```

### Retrieving Templates

```typescript
import { getTemplate } from 'sv-window-manager';

// Get built-in template
const template = getTemplate('two-column');

// Get custom template
const custom = getTemplate('my-layout');

// Returns undefined if not found
const missing = getTemplate('non-existent'); // undefined
```

### Unregistering Templates

```typescript
import { unregisterTemplate } from 'sv-window-manager';

// Unregister a custom template
const removed = unregisterTemplate('my-layout'); // true if removed

// Built-in templates cannot be unregistered
unregisterTemplate('two-column'); // false
```

### Clearing Custom Templates

```typescript
import { clearCustomTemplates } from 'sv-window-manager';

// Remove all custom templates (does not affect built-ins)
clearCustomTemplates();
```

## Import/Export

### Exporting Templates

```typescript
import { getTemplate, exportTemplateToJSON } from 'sv-window-manager';

const template = getTemplate('two-column');

// Compact JSON
const json = exportTemplateToJSON(template);

// Pretty-printed JSON
const prettyJson = exportTemplateToJSON(template, true);

console.log(prettyJson);
// {
//   "id": "two-column",
//   "name": "Two Column",
//   ...
// }
```

### Importing Templates

```typescript
import { importTemplateFromJSON, registerTemplate } from 'sv-window-manager';

const json = `{
  "id": "imported-layout",
  "name": "Imported Layout",
  "panes": [
    { "id": "main", "position": "root", "size": 0.6 },
    { "id": "side", "position": "right", "size": 0.4 }
  ]
}`;

try {
  const template = importTemplateFromJSON(json);
  registerTemplate(template);
  console.log('Template imported successfully');
} catch (error) {
  console.error('Import failed:', error.message);
}
```

## Using Templates with BinaryWindow

While the template system defines layouts, you need to manually apply them to your `BinaryWindow` instance:

```typescript
import BinaryWindow from 'sv-window-manager';
import { getTemplate } from 'sv-window-manager';
import ChatSession from './ChatSession.svelte';

let bwin;
const template = getTemplate('two-column');

function applyTemplate() {
  if (!bwin || !template) return;

  // Apply template by adding panes in order
  template.panes.forEach((pane, index) => {
    if (index === 0) {
      // First pane (root) - initialize
      return;
    }

    bwin.addPane(
      // Find the target based on pane relationships
      template.panes[index - 1].id,
      {
        position: pane.position,
        title: pane.title,
        component: ChatSession,
        componentProps: { /* your props */ }
      }
    );
  });
}
```

## Advanced Usage

### Templates with Metadata

```typescript
const template: LayoutTemplate = {
  id: 'blog-layout',
  name: 'Blog Layout',
  panes: [
    {
      id: 'posts',
      position: 'root',
      size: 0.6,
      metadata: { contentType: 'posts' }
    },
    {
      id: 'sidebar',
      position: 'right',
      size: 0.4,
      metadata: { contentType: 'widgets' }
    }
  ],
  metadata: {
    category: 'content',
    version: '1.0',
    author: 'My Team'
  }
};

registerTemplate(template);

// Use metadata in filtering
const contentTemplates = listTemplates(
  t => t.metadata?.category === 'content'
);
```

### Storing Templates in LocalStorage

```typescript
import {
  getTemplate,
  exportTemplateToJSON,
  importTemplateFromJSON
} from 'sv-window-manager';

// Save template
function saveTemplate(templateId: string) {
  const template = getTemplate(templateId);
  if (template) {
    const json = exportTemplateToJSON(template);
    localStorage.setItem(`template-${templateId}`, json);
  }
}

// Load template
function loadTemplate(templateId: string) {
  const json = localStorage.getItem(`template-${templateId}`);
  if (json) {
    try {
      return importTemplateFromJSON(json);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  }
  return null;
}

// Usage
saveTemplate('my-layout');
const template = loadTemplate('my-layout');
if (template) {
  registerTemplate(template);
}
```

## Best Practices

### 1. Use Descriptive IDs and Names

```typescript
// ✅ Good
{
  id: 'blog-post-editor',
  name: 'Blog Post Editor Layout',
  ...
}

// ❌ Avoid
{
  id: 'layout1',
  name: 'Layout',
  ...
}
```

### 2. Include Descriptions

```typescript
// ✅ Good
{
  id: 'dashboard',
  name: 'Analytics Dashboard',
  description: 'Three-column layout with metrics sidebar, main chart area, and details panel',
  ...
}
```

### 3. Use Metadata for Organization

```typescript
{
  id: 'code-review',
  name: 'Code Review Layout',
  metadata: {
    category: 'development',
    tags: ['git', 'review'],
    version: '2.0'
  },
  ...
}
```

### 4. Validate Before Registering

```typescript
const result = validateTemplate(myTemplate);
if (!result.valid) {
  console.error('Template validation errors:', result.errors);
  return;
}

registerTemplate(myTemplate);
```

### 5. Handle Import Errors

```typescript
try {
  const template = importTemplateFromJSON(json);
  registerTemplate(template);
} catch (error) {
  if (error.code === 'INVALID_CONFIG') {
    console.error('Invalid template structure:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Error Handling

The template system provides clear error messages:

```typescript
// Duplicate ID error
registerTemplate({ id: 'two-column', ... });
// ❌ BwinError: Template ID "two-column" conflicts with built-in template

// Validation error
registerTemplate({
  id: 'invalid',
  name: 'Invalid',
  panes: [] // Empty!
});
// ❌ BwinError: Invalid configuration: Template must have at least one pane

// Import error
importTemplateFromJSON('{ invalid json }');
// ❌ BwinError: Invalid configuration: Invalid JSON format
```

## API Reference

### Functions

- `registerTemplate(template)` - Register a custom template
- `unregisterTemplate(id)` - Unregister a custom template
- `getTemplate(id)` - Retrieve a template by ID
- `listTemplates(filter?)` - List all templates with optional filter
- `validateTemplate(template)` - Validate template structure
- `clearCustomTemplates()` - Clear all custom templates
- `exportTemplateToJSON(template, pretty?)` - Export to JSON string
- `importTemplateFromJSON(json)` - Import from JSON string

### Constants

- `BUILTIN_TEMPLATES` - Object containing all built-in templates

### Types

- `LayoutTemplate` - Template definition interface
- `TemplatePane` - Pane definition interface
- `ApplyTemplateOptions` - Options for applying templates
- `ApplyTemplateResult` - Result of template application

## Related Documentation

- [State Persistence](./PERSISTENCE.md) - For saving/loading full layout state including content
- [README](./README.md) - General usage and getting started
- [API Reference](./API.md) - Complete API documentation

## Examples

See `src/stories/Templates.stories.svelte` for interactive examples of:
- Browsing built-in templates
- Creating custom templates
- Validating and registering templates
- Import/export workflows

## Changelog

- **v0.2.2** - Template system introduced
  - 8 built-in templates
  - Custom template registration
  - Validation and error handling
  - JSON import/export
