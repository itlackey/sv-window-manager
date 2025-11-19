import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReactiveSash } from './sash.svelte.js';
import { Position } from './position.js';
import {
	serializeTree,
	deserializeTree,
	saveToLocalStorage,
	loadFromLocalStorage,
	removeFromLocalStorage,
	listSavedLayouts,
	type SerializedSash,
	type SerializeOptions,
	type DeserializeOptions
} from './persistence.js';

// Mock component for testing
const MockComponent = () => {};
const AnotherMockComponent = () => {};

describe('Persistence Module', () => {
	describe('serializeTree', () => {
		it('serializes a single sash node', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 800,
				height: 600,
				minWidth: 100,
				minHeight: 100,
				resizeStrategy: 'classic',
				store: { title: 'Root Pane' }
			});

			const serialized = serializeTree(sash);

			expect(serialized).toBeDefined();
			expect(serialized.id).toBe(sash.id);
			expect(serialized.position).toBe(Position.Root);
			expect(serialized.width).toBe(800);
			expect(serialized.height).toBe(600);
			expect(serialized.minWidth).toBe(100);
			expect(serialized.minHeight).toBe(100);
			expect(serialized.resizeStrategy).toBe('classic');
			expect(serialized.store.title).toBe('Root Pane');
			expect(serialized.children).toEqual([]);
		});

		it('serializes a sash tree with children', () => {
			const root = new ReactiveSash({
				position: Position.Root,
				width: 800,
				height: 600
			});

			const left = new ReactiveSash({
				position: Position.Left,
				width: 400,
				height: 600,
				parent: root
			});

			const right = new ReactiveSash({
				position: Position.Right,
				width: 400,
				height: 600,
				parent: root
			});

			root.children.push(left, right);

			const serialized = serializeTree(root);

			expect(serialized.children).toHaveLength(2);
			expect(serialized.children[0].position).toBe(Position.Left);
			expect(serialized.children[1].position).toBe(Position.Right);
		});

		it('filters out functions from store', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				store: {
					title: 'Test',
					onClick: () => console.log('click') // Function should be filtered
				}
			});

			const serialized = serializeTree(sash);

			expect(serialized.store.title).toBe('Test');
			expect(serialized.store.onClick).toBeUndefined();
		});

		it('handles component mapping with componentToKey', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				store: {
					component: MockComponent,
					componentProps: { message: 'Hello' }
				}
			});

			const componentToKey = (component: any) => {
				if (component === MockComponent) return 'MockComponent';
				return undefined;
			};

			const serialized = serializeTree(sash, { componentToKey });

			expect(serialized.componentKey).toBe('MockComponent');
			expect(serialized.componentProps).toEqual({ message: 'Hello' });
			expect(serialized.store.component).toBeUndefined(); // Should be excluded from store
		});

		it('applies custom store filter', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				store: {
					public: 'visible',
					private: 'hidden',
					title: 'Test'
				}
			});

			const filterStore = (key: string) => key !== 'private';

			const serialized = serializeTree(sash, { filterStore });

			expect(serialized.store.public).toBe('visible');
			expect(serialized.store.title).toBe('Test');
			expect(serialized.store.private).toBeUndefined();
		});
	});

	describe('deserializeTree', () => {
		it('deserializes a single sash node', () => {
			const data: SerializedSash = {
				id: 'test-1',
				position: Position.Root,
				left: 0,
				top: 0,
				width: 800,
				height: 600,
				minWidth: 100,
				minHeight: 100,
				resizeStrategy: 'classic',
				store: { title: 'Root Pane' },
				children: []
			};

			const sash = deserializeTree(data);

			expect(sash).toBeInstanceOf(ReactiveSash);
			expect(sash.id).toBe('test-1');
			expect(sash.position).toBe(Position.Root);
			expect(sash.width).toBe(800);
			expect(sash.height).toBe(600);
			expect(sash.minWidth).toBe(100);
			expect(sash.minHeight).toBe(100);
			expect(sash.resizeStrategy).toBe('classic');
			expect(sash.store.title).toBe('Root Pane');
			expect(sash.children).toHaveLength(0);
		});

		it('deserializes a sash tree with children', () => {
			const data: SerializedSash = {
				id: 'root',
				position: Position.Root,
				left: 0,
				top: 0,
				width: 800,
				height: 600,
				minWidth: 50,
				minHeight: 50,
				resizeStrategy: 'classic',
				store: {},
				children: [
					{
						id: 'left',
						position: Position.Left,
						left: 0,
						top: 0,
						width: 400,
						height: 600,
						minWidth: 50,
						minHeight: 50,
						resizeStrategy: 'classic',
						store: {},
						children: []
					},
					{
						id: 'right',
						position: Position.Right,
						left: 400,
						top: 0,
						width: 400,
						height: 600,
						minWidth: 50,
						minHeight: 50,
						resizeStrategy: 'classic',
						store: {},
						children: []
					}
				]
			};

			const sash = deserializeTree(data);

			expect(sash.children).toHaveLength(2);
			expect(sash.children[0].id).toBe('left');
			expect(sash.children[1].id).toBe('right');
			expect(sash.children[0].parent).toBe(sash);
			expect(sash.children[1].parent).toBe(sash);
		});

		it('resolves component references with componentMap', () => {
			const data: SerializedSash = {
				id: 'test-1',
				position: Position.Root,
				left: 0,
				top: 0,
				width: 800,
				height: 600,
				minWidth: 50,
				minHeight: 50,
				resizeStrategy: 'classic',
				store: {},
				componentKey: 'MockComponent',
				componentProps: { message: 'Hello' },
				children: []
			};

			const componentMap = {
				MockComponent
			};

			const sash = deserializeTree(data, { componentMap });

			expect(sash.store.component).toBe(MockComponent);
			expect(sash.store.componentProps).toEqual({ message: 'Hello' });
		});

		it('throws error for invalid data (missing id)', () => {
			const data: any = {
				position: Position.Root,
				// missing id
				left: 0,
				top: 0,
				width: 800,
				height: 600,
				minWidth: 50,
				minHeight: 50,
				resizeStrategy: 'classic',
				store: {},
				children: []
			};

			expect(() => deserializeTree(data)).toThrow('missing or invalid id');
		});

		it('throws error for invalid data (negative dimensions)', () => {
			const data: SerializedSash = {
				id: 'test-1',
				position: Position.Root,
				left: 0,
				top: 0,
				width: -800, // negative!
				height: 600,
				minWidth: 50,
				minHeight: 50,
				resizeStrategy: 'classic',
				store: {},
				children: []
			};

			expect(() => deserializeTree(data)).toThrow('negative dimensions');
		});

		it('skips validation when skipValidation is true', () => {
			const data: any = {
				id: 'test-1',
				position: Position.Root,
				left: 0,
				top: 0,
				width: -800, // would normally fail validation
				height: 600,
				minWidth: 50,
				minHeight: 50,
				resizeStrategy: 'classic',
				store: {},
				children: []
			};

			// Should not throw with skipValidation
			const sash = deserializeTree(data, { skipValidation: true });
			expect(sash).toBeInstanceOf(ReactiveSash);
		});
	});

	describe('round-trip serialization', () => {
		it('preserves tree structure through serialize->deserialize', () => {
			// Create a tree
			const root = new ReactiveSash({
				id: 'root',
				position: Position.Root,
				width: 800,
				height: 600,
				store: { title: 'Root' }
			});

			const left = new ReactiveSash({
				id: 'left',
				position: Position.Left,
				width: 400,
				height: 600,
				parent: root,
				store: { title: 'Left' }
			});

			const right = new ReactiveSash({
				id: 'right',
				position: Position.Right,
				width: 400,
				height: 600,
				parent: root,
				store: { title: 'Right' }
			});

			root.children.push(left, right);

			// Serialize
			const serialized = serializeTree(root);

			// Deserialize
			const restored = deserializeTree(serialized);

			// Verify structure preserved
			expect(restored.id).toBe('root');
			expect(restored.children).toHaveLength(2);
			expect(restored.children[0].id).toBe('left');
			expect(restored.children[1].id).toBe('right');
			expect(restored.store.title).toBe('Root');
			expect(restored.children[0].store.title).toBe('Left');
			expect(restored.children[1].store.title).toBe('Right');
		});

		it('preserves component references through round-trip', () => {
			const root = new ReactiveSash({
				position: Position.Root,
				store: {
					component: MockComponent,
					componentProps: { value: 42 }
				}
			});

			const componentToKey = (component: any) => {
				if (component === MockComponent) return 'MockComponent';
				return undefined;
			};

			const componentMap = { MockComponent };

			// Serialize -> Deserialize
			const serialized = serializeTree(root, { componentToKey });
			const restored = deserializeTree(serialized, { componentMap });

			expect(restored.store.component).toBe(MockComponent);
			expect(restored.store.componentProps).toEqual({ value: 42 });
		});
	});

	describe('localStorage integration', () => {
		const testKey = 'test-layout';

		beforeEach(() => {
			// Clear localStorage before each test
			if (typeof localStorage !== 'undefined') {
				localStorage.clear();
			}
		});

		afterEach(() => {
			// Clean up after each test
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem(testKey);
			}
		});

		it('saves and loads from localStorage', () => {
			const sash = new ReactiveSash({
				position: Position.Root,
				width: 800,
				height: 600,
				store: { title: 'Test Layout' }
			});

			// Save
			const saveResult = saveToLocalStorage(testKey, sash);
			expect(saveResult.success).toBe(true);
			expect(saveResult.key).toBe(testKey);
			expect(saveResult.timestamp).toBeGreaterThan(0);

			// Load
			const loadResult = loadFromLocalStorage(testKey);
			expect(loadResult.success).toBe(true);
			expect(loadResult.data).toBeDefined();
			expect(loadResult.data!.width).toBe(800);
			expect(loadResult.data!.height).toBe(600);
			expect(loadResult.data!.store.title).toBe('Test Layout');
		});

		it('returns error when loading non-existent key', () => {
			const result = loadFromLocalStorage('non-existent-key');
			expect(result.success).toBe(false);
			expect(result.error).toContain('No data found');
		});

		it('removes saved layout', () => {
			const sash = new ReactiveSash({
				position: Position.Root
			});

			// Save
			saveToLocalStorage(testKey, sash);

			// Remove
			const removed = removeFromLocalStorage(testKey);
			expect(removed).toBe(true);

			// Verify removed
			const loadResult = loadFromLocalStorage(testKey);
			expect(loadResult.success).toBe(false);
		});

		it('lists saved layouts', () => {
			const sash1 = new ReactiveSash({ position: Position.Root });
			const sash2 = new ReactiveSash({ position: Position.Root });

			const prefix = 'sv-window-manager-test-';

			// Save multiple layouts
			saveToLocalStorage(prefix + 'layout1', sash1);
			saveToLocalStorage(prefix + 'layout2', sash2);

			// List
			const layouts = listSavedLayouts(prefix);

			expect(layouts.length).toBeGreaterThanOrEqual(2);
			expect(layouts[0].key).toMatch(new RegExp(prefix));
			expect(layouts[0].timestamp).toBeGreaterThan(0);
			expect(layouts[0].version).toBe(1);

			// Clean up
			removeFromLocalStorage(prefix + 'layout1');
			removeFromLocalStorage(prefix + 'layout2');
		});
	});
});
