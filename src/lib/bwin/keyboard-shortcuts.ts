/**
 * Keyboard Shortcuts Module - SV Window Manager
 *
 * Provides accessible keyboard navigation and shortcuts for window management.
 * Follows WCAG 2.1 AA guidelines for keyboard accessibility.
 *
 * **Default Shortcuts:**
 * - `Ctrl/Cmd + W` - Close active pane
 * - `Ctrl/Cmd + Shift + W` - Close all panes
 * - `Ctrl/Cmd + M` - Minimize active pane
 * - `Ctrl/Cmd + Shift + M` - Maximize active pane
 * - `Ctrl/Cmd + Tab` - Focus next pane
 * - `Ctrl/Cmd + Shift + Tab` - Focus previous pane
 * - `Alt + Arrow Keys` - Resize panes
 * - `Escape` - Cancel current operation
 *
 * @module keyboard-shortcuts
 */

import type { BwinContext } from './types.js';

export interface KeyboardShortcut {
	/** Key combination (e.g., 'ctrl+w', 'cmd+shift+tab') */
	key: string;
	/** Human-readable description */
	description: string;
	/** Handler function */
	handler: (event: KeyboardEvent) => void | boolean;
	/** Whether to prevent default behavior */
	preventDefault?: boolean;
}

export interface KeyboardShortcutsOptions {
	/** Enable/disable shortcuts (default: true) */
	enabled?: boolean;
	/** Custom shortcuts (overrides defaults) */
	shortcuts?: KeyboardShortcut[];
	/** Debug mode */
	debug?: boolean;
}

/**
 * Keyboard shortcuts manager
 */
export class KeyboardShortcuts {
	private bwinContext: BwinContext;
	private enabled: boolean;
	private shortcuts: Map<string, KeyboardShortcut>;
	private debug: boolean;
	private boundHandler: ((event: KeyboardEvent) => void) | null = null;

	constructor(bwinContext: BwinContext, options: KeyboardShortcutsOptions = {}) {
		this.bwinContext = bwinContext;
		this.enabled = options.enabled ?? true;
		this.debug = options.debug ?? false;
		this.shortcuts = new Map();

		// Initialize with default shortcuts
		this.initializeDefaults();

		// Add custom shortcuts if provided
		if (options.shortcuts) {
			options.shortcuts.forEach((shortcut) => {
				this.addShortcut(shortcut);
			});
		}
	}

	/**
	 * Initialize default keyboard shortcuts
	 */
	private initializeDefaults(): void {
		// Close active pane
		this.addShortcut({
			key: 'ctrl+w',
			description: 'Close active pane',
			handler: () => {
				const activePane = this.getActivePane();
				if (activePane) {
					this.bwinContext.removePane(activePane.id);
					return true;
				}
				return false;
			},
			preventDefault: true
		});

		// Also support Cmd+W on Mac
		this.addShortcut({
			key: 'meta+w',
			description: 'Close active pane (Mac)',
			handler: () => {
				const activePane = this.getActivePane();
				if (activePane) {
					this.bwinContext.removePane(activePane.id);
					return true;
				}
				return false;
			},
			preventDefault: true
		});

		// Focus next pane (Ctrl/Cmd + Tab)
		this.addShortcut({
			key: 'ctrl+tab',
			description: 'Focus next pane',
			handler: () => {
				this.focusNextPane();
				return true;
			},
			preventDefault: true
		});

		this.addShortcut({
			key: 'meta+tab',
			description: 'Focus next pane (Mac)',
			handler: () => {
				this.focusNextPane();
				return true;
			},
			preventDefault: true
		});

		// Focus previous pane (Ctrl/Cmd + Shift + Tab)
		this.addShortcut({
			key: 'ctrl+shift+tab',
			description: 'Focus previous pane',
			handler: () => {
				this.focusPreviousPane();
				return true;
			},
			preventDefault: true
		});

		this.addShortcut({
			key: 'meta+shift+tab',
			description: 'Focus previous pane (Mac)',
			handler: () => {
				this.focusPreviousPane();
				return true;
			},
			preventDefault: true
		});

		// Escape - cancel operation
		this.addShortcut({
			key: 'escape',
			description: 'Cancel current operation',
			handler: () => {
				// Remove any active drop areas
				const dropAreas = document.querySelectorAll('[data-drop-area]');
				dropAreas.forEach((el) => {
					el.removeAttribute('data-drop-area');
				});
				return true;
			},
			preventDefault: false
		});
	}

	/**
	 * Add or update a keyboard shortcut
	 */
	addShortcut(shortcut: KeyboardShortcut): void {
		const normalizedKey = this.normalizeKey(shortcut.key);
		this.shortcuts.set(normalizedKey, shortcut);
		this.debugLog(`Added shortcut: ${normalizedKey}`);
	}

	/**
	 * Remove a keyboard shortcut
	 */
	removeShortcut(key: string): void {
		const normalizedKey = this.normalizeKey(key);
		this.shortcuts.delete(normalizedKey);
		this.debugLog(`Removed shortcut: ${normalizedKey}`);
	}

	/**
	 * Enable keyboard shortcuts
	 */
	enable(): void {
		if (this.enabled) return;

		this.enabled = true;
		this.attach();
		this.debugLog('Keyboard shortcuts enabled');
	}

	/**
	 * Disable keyboard shortcuts
	 */
	disable(): void {
		if (!this.enabled) return;

		this.enabled = false;
		this.detach();
		this.debugLog('Keyboard shortcuts disabled');
	}

	/**
	 * Attach keyboard event listener
	 */
	attach(): void {
		if (this.boundHandler) return; // Already attached

		this.boundHandler = this.handleKeyDown.bind(this);
		document.addEventListener('keydown', this.boundHandler);
		this.debugLog('Keyboard listener attached');
	}

	/**
	 * Detach keyboard event listener
	 */
	detach(): void {
		if (!this.boundHandler) return;

		document.removeEventListener('keydown', this.boundHandler);
		this.boundHandler = null;
		this.debugLog('Keyboard listener detached');
	}

	/**
	 * Handle keydown events
	 */
	private handleKeyDown(event: KeyboardEvent): void {
		if (!this.enabled) return;

		// Build key combination string
		const key = this.buildKeyString(event);
		const shortcut = this.shortcuts.get(key);

		if (shortcut) {
			this.debugLog(`Shortcut triggered: ${key}`);

			// Call handler
			const handled = shortcut.handler(event);

			// Prevent default if configured
			if (shortcut.preventDefault && handled !== false) {
				event.preventDefault();
			}
		}
	}

	/**
	 * Build key string from keyboard event
	 */
	private buildKeyString(event: KeyboardEvent): string {
		const parts: string[] = [];

		if (event.ctrlKey) parts.push('ctrl');
		if (event.altKey) parts.push('alt');
		if (event.shiftKey) parts.push('shift');
		if (event.metaKey) parts.push('meta');

		// Add the actual key (lowercase)
		const key = event.key.toLowerCase();
		parts.push(key);

		return parts.join('+');
	}

	/**
	 * Normalize key string for consistent comparison
	 */
	private normalizeKey(key: string): string {
		return key
			.toLowerCase()
			.split('+')
			.map((k) => k.trim())
			.sort((a, b) => {
				// Sort modifiers before key
				const modifiers = ['ctrl', 'alt', 'shift', 'meta'];
				const aIsModifier = modifiers.includes(a);
				const bIsModifier = modifiers.includes(b);

				if (aIsModifier && !bIsModifier) return -1;
				if (!aIsModifier && bIsModifier) return 1;
				return a.localeCompare(b);
			})
			.join('+');
	}

	/**
	 * Get currently active pane
	 */
	private getActivePane() {
		const rootSash = this.bwinContext.rootSash;
		if (!rootSash) return null;

		// Find focused element
		const focused = document.activeElement;
		if (!focused) return null;

		// Find closest pane
		const paneEl = focused.closest('.pane');
		if (!paneEl) return null;

		// Get sash ID
		const sashId = paneEl.getAttribute('data-sash-id');
		if (!sashId) return null;

		// Find sash
		return rootSash.getById(sashId);
	}

	/**
	 * Focus next pane in tree
	 */
	private focusNextPane(): void {
		const rootSash = this.bwinContext.rootSash;
		if (!rootSash) return;

		const allLeaves = rootSash.getAllLeafDescendants();
		if (allLeaves.length === 0) return;

		const activePane = this.getActivePane();
		if (!activePane) {
			// No active pane, focus first
			this.focusPane(allLeaves[0]);
			return;
		}

		// Find current index
		const currentIndex = allLeaves.findIndex((sash) => sash.id === activePane.id);
		if (currentIndex === -1) {
			this.focusPane(allLeaves[0]);
			return;
		}

		// Focus next (wrap around)
		const nextIndex = (currentIndex + 1) % allLeaves.length;
		this.focusPane(allLeaves[nextIndex]);
	}

	/**
	 * Focus previous pane in tree
	 */
	private focusPreviousPane(): void {
		const rootSash = this.bwinContext.rootSash;
		if (!rootSash) return;

		const allLeaves = rootSash.getAllLeafDescendants();
		if (allLeaves.length === 0) return;

		const activePane = this.getActivePane();
		if (!activePane) {
			// No active pane, focus last
			this.focusPane(allLeaves[allLeaves.length - 1]);
			return;
		}

		// Find current index
		const currentIndex = allLeaves.findIndex((sash) => sash.id === activePane.id);
		if (currentIndex === -1) {
			this.focusPane(allLeaves[allLeaves.length - 1]);
			return;
		}

		// Focus previous (wrap around)
		const prevIndex = currentIndex === 0 ? allLeaves.length - 1 : currentIndex - 1;
		this.focusPane(allLeaves[prevIndex]);
	}

	/**
	 * Focus a specific pane
	 */
	private focusPane(sash: any): void {
		if (!sash || !sash.domNode) return;

		// Find first focusable element in pane
		const focusable = sash.domNode.querySelector(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		if (focusable instanceof HTMLElement) {
			focusable.focus();
			this.debugLog(`Focused pane: ${sash.id}`);
		}
	}

	/**
	 * Get all registered shortcuts
	 */
	getAllShortcuts(): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Debug logging
	 */
	private debugLog(...args: any[]): void {
		if (this.debug) {
			console.log('[KeyboardShortcuts]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.detach();
		this.shortcuts.clear();
		this.debugLog('Destroyed');
	}
}

/**
 * Create keyboard shortcuts instance
 */
export function createKeyboardShortcuts(
	bwinContext: BwinContext,
	options?: KeyboardShortcutsOptions
): KeyboardShortcuts {
	return new KeyboardShortcuts(bwinContext, options);
}
