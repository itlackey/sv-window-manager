# SV Window Manager - AI Coding Instructions

## Project Overview
This is a Svelte 5 library package built with SvelteKit, designed for creating reusable window management components. The project uses modern Svelte 5 syntax (`$props()`, `$derived`) and follows a dual-purpose structure: `src/lib/` contains the exportable library code, while `src/routes/` serves as a showcase/demo app.


**IMPORTANT**: Do not prefix commands with bash -lc "cd /home/founder3/code/github/itlackey/sv-window-manager && ...". The system automatically runs commands in the project root.

## Architecture & Key Patterns

### Library Structure
- **Main exports**: All library components must be re-exported through `src/lib/index.ts`
- **Package output**: The library builds to `dist/` via `@sveltejs/package`, exporting both types and Svelte components
- **Peer dependency**: Svelte 5+ is required (`"svelte": "^5.0.0"`)

### Svelte 5 Component Patterns
Components use the new Svelte 5 syntax:
```typescript
const { primary = false, backgroundColor, size = 'medium', label, ...props }: Props = $props();
let mode = $derived(primary ? 'storybook-button--primary' : 'storybook-button--secondary');
```
Always define TypeScript interfaces for component props and use `$props()` destructuring.

### Testing Strategy (Dual Environment)
The project runs tests in **two separate environments** via Vitest projects:

1. **Client tests** (`*.svelte.{test,spec}.{js,ts}`): Run in browser via Playwright
   - Use `vitest-browser-svelte` for component rendering
   - Example: `render(Component)` then `page.getByRole()` assertions

2. **Server tests** (`*.{test,spec}.{js,ts}` excluding `.svelte.`): Run in Node.js
   - Standard Vitest unit tests for utilities/logic

3. **E2E tests** (`e2e/`): Playwright tests against the built preview app

## Development Workflows

### Core Commands
- `npm run dev` - Start development server with showcase app
- `npm run storybook` - Launch Storybook for component development
- `npm run test` - Run all tests (unit + e2e)
- `npm run test:unit` - Run Vitest tests only
- `npm pack` - Build the library package

### Linting & Type Checking

- `npm run lint` - Run ESLint and `svelte-check` for type checking
- `npm run format` - Format code with Prettier
- `npm run check` - Combined lint and type check

### Building & Publishing
- `npm run build` builds the showcase app
- `npm run prepack` syncs SvelteKit and packages the library via `svelte-package`
- The `publint` tool validates the package before publishing

### Storybook Integration
- Stories live in `src/stories/` and use the `@storybook/addon-svelte-csf` format
- Components follow the pattern: `Component.svelte` + `Component.stories.svelte`
- Stories automatically include accessibility testing via `@storybook/addon-a11y`

## Code Quality & Conventions

### File Organization
- Library components: `src/lib/`
- Demo/showcase: `src/routes/`
- Stories: `src/stories/` 
- E2E tests: `e2e/`
- Component tests: Co-located with components (`.svelte.spec.ts`)

### TypeScript & Linting
- ESLint config includes Svelte, TypeScript, and Storybook rules
- Prettier handles formatting with `prettier-plugin-svelte`
- `svelte-check` runs TypeScript validation on Svelte files
- `no-undef` rule is disabled for TypeScript projects per typescript-eslint recommendations

### CSS Approach
- Component-specific CSS files (e.g. `button.css` imported into `Button.svelte`)
- CSS marked as side effects in `package.json` to prevent tree-shaking

## Key Dependencies & Integrations
- **Svelte 5**: Use modern syntax (`$props`, `$derived`, `$state`)
- **SvelteKit**: For packaging (`@sveltejs/package`) and development server
- **Vitest**: Dual-environment testing with browser support
- **Playwright**: E2E testing and browser automation for component tests
- **Storybook**: Component development and documentation

## Common Patterns
When adding new library components:
1. Create component in `src/lib/`
2. Export from `src/lib/index.ts`
3. Add Storybook story in `src/stories/`
4. Write component test using `vitest-browser-svelte`
5. Use TypeScript interfaces for all props
6. Follow Svelte 5 syntax patterns from existing components
