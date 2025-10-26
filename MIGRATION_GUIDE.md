# Migration Guide: v1.x to v2.0

## Breaking Changes

### Removed Deprecated Context Symbols

The deprecated Symbol-based context API has been removed in v2.0. Use the new type-safe context utilities instead.

#### What Changed

**Removed:**
- `BWIN_CONTEXT` symbol
- `FRAME_CONTEXT` symbol
- `setContext(BWIN_CONTEXT, ...)` / `getContext(BWIN_CONTEXT)`
- `setContext(FRAME_CONTEXT, ...)` / `getContext(FRAME_CONTEXT)`

**Use Instead:**
- `setWindowContext()` / `getWindowContext()` / `tryGetWindowContext()`
- `setLayoutContext()` / `getLayoutContext()` / `tryGetLayoutContext()`

#### Migration Steps

**Before (v1.x):**
```typescript
import { getContext } from 'svelte';
import { BWIN_CONTEXT } from 'sv-window-manager';

const bwin = getContext(BWIN_CONTEXT);
bwin.addPane('root', {
  position: 'right',
  title: 'New Pane'
});
```

**After (v2.0):**
```typescript
import { getWindowContext } from 'sv-window-manager';

const bwin = getWindowContext();
bwin.addPane('root', {
  position: 'right',
  title: 'New Pane'
});
```

#### Frame Context Migration

**Before (v1.x):**
```typescript
import { getContext } from 'svelte';
import { FRAME_CONTEXT, type FrameContext } from 'sv-window-manager';

const frame = getContext<FrameContext>(FRAME_CONTEXT);
const isDebug = frame?.debug ?? false;
```

**After (v2.0):**
```typescript
import { getLayoutContext } from 'sv-window-manager';

const frame = getLayoutContext();
const isDebug = frame.debug ?? false;
```

#### Safe Context Access

If you need to access context that might not exist (optional context), use the `try*` variants:

**Before (v1.x):**
```typescript
import { getContext } from 'svelte';
import { BWIN_CONTEXT } from 'sv-window-manager';

const bwin = getContext(BWIN_CONTEXT); // Could be undefined
if (bwin) {
  bwin.addPane(...);
}
```

**After (v2.0):**
```typescript
import { tryGetWindowContext } from 'sv-window-manager';

const bwin = tryGetWindowContext(); // Returns undefined instead of throwing
if (bwin) {
  bwin.addPane(...);
}
```

#### Benefits of the New API

- **Type Safety**: Full TypeScript support with autocomplete and type checking
- **Runtime Validation**: Clear error messages if context is not found (instead of silent undefined)
- **Better DX**: Consistent naming and improved documentation
- **Svelte 5 Compatible**: Designed for modern Svelte 5 patterns

#### Automatic Migration (Find & Replace)

You can use the following find/replace patterns in your codebase:

1. **Remove BWIN_CONTEXT imports:**
   - Find: `import { getContext } from 'svelte';\nimport { BWIN_CONTEXT } from 'sv-window-manager';`
   - Replace: `import { getWindowContext } from 'sv-window-manager';`

2. **Replace getContext(BWIN_CONTEXT):**
   - Find: `getContext(BWIN_CONTEXT)`
   - Replace: `getWindowContext()`

3. **Replace getContext(FRAME_CONTEXT):**
   - Find: `getContext(FRAME_CONTEXT)`
   - Replace: `getLayoutContext()`

4. **Remove type casting (no longer needed):**
   - Find: `getContext<BwinContext>(BWIN_CONTEXT)`
   - Replace: `getWindowContext()`

## Version Planning

This migration guide is for the v2.0 release which includes breaking changes to the context API.

## Need Help?

If you encounter issues during migration:

1. Check the [API Documentation](./README.md) for updated examples
2. Review the [TypeScript types](./src/lib/bwin/types.ts) for context interfaces
3. Open an issue on GitHub with your migration question

## Timeline

- **v1.x**: Deprecated symbols with warnings
- **v2.0**: Symbols removed (current release)
- All code now uses the modern type-safe context API
