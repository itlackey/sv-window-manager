import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardShortcuts, createKeyboardShortcuts } from './keyboard-shortcuts.js';
import { ReactiveSash } from './sash.svelte.js';
import { Position } from './position.js';
import type { BwinContext } from './types.js';

describe('KeyboardShortcuts', () => {
	let mockContext: BwinContext;
	let rootSash: ReactiveSash;
	let shortcuts: KeyboardShortcuts;

	beforeEach(() => {
		// Create mock root sash
		rootSash = new ReactiveSash({
			id: 'root',
			position: Position.Root,
			width: 800,
			height: 600
		});

		// Create mock context
		mockContext = {
			get rootSash() {
				return rootSash;
			},
			get windowElement() {
				return document.body;
			},
			removePane: vi.fn(),
			addPane: vi.fn(),
			getMinimizedGlassElementBySashId: vi.fn(),
			getSillElement: vi.fn(),
			ensureSillElement: vi.fn()
		};
	});

	afterEach(() => {
		if (shortcuts) {
			shortcuts.destroy();
		}
	});

	describe('Initialization', () => {
		it('creates keyboard shortcuts instance', () => {
			shortcuts = new KeyboardShortcuts(mockContext);
			expect(shortcuts).toBeInstanceOf(KeyboardShortcuts);
		});

		it('creates with factory function', () => {
			shortcuts = createKeyboardShortcuts(mockContext);
			expect(shortcuts).toBeInstanceOf(KeyboardShortcuts);
		});

		it('initializes with default shortcuts', () => {
			shortcuts = new KeyboardShortcuts(mockContext);
			const allShortcuts = shortcuts.getAllShortcuts();

			// Should have default shortcuts
			expect(allShortcuts.length).toBeGreaterThan(0);

			// Should include close pane shortcut
			const closeShortcut = allShortcuts.find((s) => s.description.includes('Close'));
			expect(closeShortcut).toBeDefined();
		});

		it('initializes disabled when enabled: false', () => {
			shortcuts = new KeyboardShortcuts(mockContext, { enabled: false });

			// Trigger keyboard event - should not handle
			const event = new KeyboardEvent('keydown', {
				key: 'w',
				ctrlKey: true
			});

			document.dispatchEvent(event);

			// removePane should not be called
			expect(mockContext.removePane).not.toHaveBeenCalled();
		});
	});

	describe('Shortcut Registration', () => {
		it('adds custom shortcut', () => {
			const handler = vi.fn();
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+n',
						description: 'New pane',
						handler
					}
				]
			});

			const allShortcuts = shortcuts.getAllShortcuts();
			const customShortcut = allShortcuts.find((s) => s.description === 'New pane');

			expect(customShortcut).toBeDefined();
			expect(customShortcut!.key).toBe('ctrl+n');
		});

		it('adds shortcut after initialization', () => {
			shortcuts = new KeyboardShortcuts(mockContext);
			const handler = vi.fn();

			shortcuts.addShortcut({
				key: 'ctrl+shift+p',
				description: 'Command palette',
				handler
			});

			const allShortcuts = shortcuts.getAllShortcuts();
			const added = allShortcuts.find((s) => s.description === 'Command palette');

			expect(added).toBeDefined();
		});

		it('removes shortcut', () => {
			shortcuts = new KeyboardShortcuts(mockContext);

			shortcuts.addShortcut({
				key: 'ctrl+k',
				description: 'Test shortcut',
				handler: () => {}
			});

			let allShortcuts = shortcuts.getAllShortcuts();
			expect(allShortcuts.find((s) => s.description === 'Test shortcut')).toBeDefined();

			shortcuts.removeShortcut('ctrl+k');

			allShortcuts = shortcuts.getAllShortcuts();
			expect(allShortcuts.find((s) => s.description === 'Test shortcut')).toBeUndefined();
		});
	});

	describe('Keyboard Event Handling', () => {
		it('triggers shortcut on matching key combination', () => {
			const handler = vi.fn();
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+n',
						description: 'New pane',
						handler
					}
				]
			});

			shortcuts.attach();

			// Trigger Ctrl+N
			const event = new KeyboardEvent('keydown', {
				key: 'n',
				ctrlKey: true,
				bubbles: true
			});

			document.dispatchEvent(event);

			expect(handler).toHaveBeenCalled();
		});

		it('prevents default when preventDefault is true', () => {
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+s',
						description: 'Save',
						handler: () => true,
						preventDefault: true
					}
				]
			});

			shortcuts.attach();

			const event = new KeyboardEvent('keydown', {
				key: 's',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			});

			document.dispatchEvent(event);

			expect(event.defaultPrevented).toBe(true);
		});

		it('does not prevent default when handler returns false', () => {
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+s',
						description: 'Save',
						handler: () => false,
						preventDefault: true
					}
				]
			});

			shortcuts.attach();

			const event = new KeyboardEvent('keydown', {
				key: 's',
				ctrlKey: true,
				bubbles: true,
				cancelable: true
			});

			document.dispatchEvent(event);

			expect(event.defaultPrevented).toBe(false);
		});

		it('handles modifier keys correctly', () => {
			const handler = vi.fn();
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+shift+alt+k',
						description: 'Complex shortcut',
						handler
					}
				]
			});

			shortcuts.attach();

			// Trigger Ctrl+Shift+Alt+K
			const event = new KeyboardEvent('keydown', {
				key: 'k',
				ctrlKey: true,
				shiftKey: true,
				altKey: true,
				bubbles: true
			});

			document.dispatchEvent(event);

			expect(handler).toHaveBeenCalled();
		});

		it('normalizes key combinations for comparison', () => {
			const handler = vi.fn();
			shortcuts = new KeyboardShortcuts(mockContext);

			// Add with different ordering
			shortcuts.addShortcut({
				key: 'shift+ctrl+a', // Different order
				description: 'Test',
				handler
			});

			shortcuts.attach();

			// Trigger with different order
			const event = new KeyboardEvent('keydown', {
				key: 'a',
				ctrlKey: true,
				shiftKey: true,
				bubbles: true
			});

			document.dispatchEvent(event);

			expect(handler).toHaveBeenCalled();
		});
	});

	describe('Enable/Disable', () => {
		it('enables shortcuts', () => {
			shortcuts = new KeyboardShortcuts(mockContext, { enabled: false });

			const handler = vi.fn();
			shortcuts.addShortcut({
				key: 'ctrl+k',
				description: 'Test',
				handler
			});

			shortcuts.enable();
			shortcuts.attach();

			const event = new KeyboardEvent('keydown', {
				key: 'k',
				ctrlKey: true,
				bubbles: true
			});

			document.dispatchEvent(event);

			expect(handler).toHaveBeenCalled();
		});

		it('disables shortcuts', () => {
			const handler = vi.fn();
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+k',
						description: 'Test',
						handler
					}
				]
			});

			shortcuts.attach();
			shortcuts.disable();

			const event = new KeyboardEvent('keydown', {
				key: 'k',
				ctrlKey: true,
				bubbles: true
			});

			document.dispatchEvent(event);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('Cleanup', () => {
		it('detaches event listeners on destroy', () => {
			const handler = vi.fn();
			shortcuts = new KeyboardShortcuts(mockContext, {
				shortcuts: [
					{
						key: 'ctrl+k',
						description: 'Test',
						handler
					}
				]
			});

			shortcuts.attach();
			shortcuts.destroy();

			const event = new KeyboardEvent('keydown', {
				key: 'k',
				ctrlKey: true,
				bubbles: true
			});

			document.dispatchEvent(event);

			expect(handler).not.toHaveBeenCalled();
		});

		it('clears all shortcuts on destroy', () => {
			shortcuts = new KeyboardShortcuts(mockContext);

			shortcuts.destroy();

			const allShortcuts = shortcuts.getAllShortcuts();
			expect(allShortcuts.length).toBe(0);
		});
	});

	describe('Default Shortcuts', () => {
		it('handles Escape key', () => {
			shortcuts = new KeyboardShortcuts(mockContext);
			shortcuts.attach();

			// Create element with drop area
			const div = document.createElement('div');
			div.setAttribute('data-drop-area', 'center');
			document.body.appendChild(div);

			// Trigger Escape
			const event = new KeyboardEvent('keydown', {
				key: 'Escape',
				bubbles: true
			});

			document.dispatchEvent(event);

			// Drop area should be removed
			expect(div.hasAttribute('data-drop-area')).toBe(false);

			document.body.removeChild(div);
		});
	});
});
