/**
 * Bundle Size Limits Configuration
 *
 * This configuration defines size budgets for the sv-window-manager library.
 * Size-limit helps prevent bundle size regressions by enforcing strict limits.
 *
 * Target: <100KB minified + gzipped
 * Current: ~514KB unminified → ~80KB minified + gzipped (estimated)
 *
 * Run: npm run size
 *
 * @see https://github.com/ai/size-limit
 */

export default [
	{
		name: 'Full Library (default export)',
		path: 'dist/index.js',
		import: '*',
		limit: '100 KB',
		gzip: true,
		running: false, // Don't run webpack (we're a library, not an app)
		webpack: false
	},
	{
		name: 'BinaryWindow Component',
		path: 'dist/index.js',
		import: '{ BinaryWindow }',
		limit: '40 KB',
		gzip: true,
		running: false,
		webpack: false
	},
	{
		name: 'Core Components (BinaryWindow + Frame + Glass)',
		path: 'dist/index.js',
		import: '{ BinaryWindow, Frame, Glass }',
		limit: '50 KB',
		gzip: true,
		running: false,
		webpack: false
	},
	{
		name: 'State Management (ReactiveSash + GlassState + SillState)',
		path: 'dist/index.js',
		import: '{ ReactiveSash, GlassState, SillState }',
		limit: '30 KB',
		gzip: true,
		running: false,
		webpack: false
	},
	{
		name: 'Persistence API',
		path: 'dist/index.js',
		import: '{ serializeTree, deserializeTree, saveToLocalStorage, loadFromLocalStorage }',
		limit: '10 KB',
		gzip: true,
		running: false,
		webpack: false
	},
	{
		name: 'Accessibility APIs',
		path: 'dist/index.js',
		import: '{ KeyboardShortcuts, AriaAnnouncer }',
		limit: '15 KB',
		gzip: true,
		running: false,
		webpack: false
	}
];
