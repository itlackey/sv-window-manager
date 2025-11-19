/**
 * ARIA Live Region Announcer - SV Window Manager
 *
 * Provides screen reader announcements for window manager state changes.
 * Implements WCAG 2.1 AA guideline 4.1.3 (Status Messages).
 *
 * **Features:**
 * - Announces pane additions/removals
 * - Announces pane focus changes
 * - Announces resize operations
 * - Announces minimize/maximize/restore
 * - Debounced announcements to avoid spam
 * - Polite and assertive modes
 *
 * @module aria-announcer
 */

export type AriaLiveMode = 'polite' | 'assertive' | 'off';

export interface AnnouncerOptions {
	/** Enable/disable announcements (default: true) */
	enabled?: boolean;
	/** Live region mode (default: 'polite') */
	mode?: AriaLiveMode;
	/** Debounce delay in ms (default: 100) */
	debounceDelay?: number;
	/** Debug mode */
	debug?: boolean;
}

/**
 * ARIA Live Region Announcer
 *
 * Creates and manages ARIA live regions for screen reader announcements.
 * Automatically debounces rapid announcements to avoid overwhelming users.
 */
export class AriaAnnouncer {
	private liveRegion: HTMLElement | null = null;
	private enabled: boolean;
	private mode: AriaLiveMode;
	private debounceDelay: number;
	private debug: boolean;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingAnnouncements: string[] = [];

	constructor(options: AnnouncerOptions = {}) {
		this.enabled = options.enabled ?? true;
		this.mode = options.mode ?? 'polite';
		this.debounceDelay = options.debounceDelay ?? 100;
		this.debug = options.debug ?? false;

		if (this.enabled) {
			this.createLiveRegion();
		}
	}

	/**
	 * Create ARIA live region element
	 */
	private createLiveRegion(): void {
		// Skip if already created or in SSR
		if (this.liveRegion || typeof document === 'undefined') return;

		this.liveRegion = document.createElement('div');
		this.liveRegion.setAttribute('aria-live', this.mode);
		this.liveRegion.setAttribute('aria-atomic', 'true');
		this.liveRegion.setAttribute('role', 'status');
		this.liveRegion.className = 'sr-only bwin-announcer';

		// Visually hidden but accessible to screen readers
		this.liveRegion.style.cssText = `
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border-width: 0;
		`;

		document.body.appendChild(this.liveRegion);
		this.debugLog('Live region created');
	}

	/**
	 * Announce a message to screen readers
	 */
	announce(message: string): void {
		if (!this.enabled || !message.trim()) return;

		this.debugLog('Announce:', message);

		// Add to pending announcements
		this.pendingAnnouncements.push(message);

		// Clear existing timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Debounce announcements
		this.debounceTimer = setTimeout(() => {
			this.flushAnnouncements();
			this.debounceTimer = null;
		}, this.debounceDelay);
	}

	/**
	 * Flush pending announcements
	 */
	private flushAnnouncements(): void {
		if (!this.liveRegion || this.pendingAnnouncements.length === 0) return;

		// Combine multiple announcements
		const combined = this.pendingAnnouncements.join('. ');
		this.pendingAnnouncements = [];

		// Update live region
		this.liveRegion.textContent = combined;

		// Clear after announcement to allow re-announcement of same message
		setTimeout(() => {
			if (this.liveRegion) {
				this.liveRegion.textContent = '';
			}
		}, 1000);
	}

	/**
	 * Announce pane added
	 */
	announcePaneAdded(paneTitle?: string): void {
		const message = paneTitle
			? `Pane "${paneTitle}" added`
			: 'New pane added';
		this.announce(message);
	}

	/**
	 * Announce pane removed
	 */
	announcePaneRemoved(paneTitle?: string): void {
		const message = paneTitle
			? `Pane "${paneTitle}" removed`
			: 'Pane removed';
		this.announce(message);
	}

	/**
	 * Announce pane focused
	 */
	announcePaneFocused(paneTitle?: string): void {
		const message = paneTitle
			? `Focused pane "${paneTitle}"`
			: 'Pane focused';
		this.announce(message);
	}

	/**
	 * Announce pane minimized
	 */
	announcePaneMinimized(paneTitle?: string): void {
		const message = paneTitle
			? `Pane "${paneTitle}" minimized`
			: 'Pane minimized';
		this.announce(message);
	}

	/**
	 * Announce pane maximized
	 */
	announcePaneMaximized(paneTitle?: string): void {
		const message = paneTitle
			? `Pane "${paneTitle}" maximized`
			: 'Pane maximized';
		this.announce(message);
	}

	/**
	 * Announce pane restored
	 */
	announcePaneRestored(paneTitle?: string): void {
		const message = paneTitle
			? `Pane "${paneTitle}" restored`
			: 'Pane restored';
		this.announce(message);
	}

	/**
	 * Announce pane resized
	 */
	announcePaneResized(paneTitle?: string, dimensions?: { width: number; height: number }): void {
		let message = paneTitle
			? `Pane "${paneTitle}" resized`
			: 'Pane resized';

		if (dimensions) {
			message += ` to ${Math.round(dimensions.width)} by ${Math.round(dimensions.height)} pixels`;
		}

		this.announce(message);
	}

	/**
	 * Announce pane title changed
	 */
	announcePaneTitleChanged(oldTitle?: string, newTitle?: string): void {
		if (oldTitle && newTitle) {
			this.announce(`Pane title changed from "${oldTitle}" to "${newTitle}"`);
		} else if (newTitle) {
			this.announce(`Pane title set to "${newTitle}"`);
		}
	}

	/**
	 * Announce keyboard shortcut
	 */
	announceShortcut(shortcut: string, description: string): void {
		this.announce(`${description}: ${shortcut}`);
	}

	/**
	 * Enable announcements
	 */
	enable(): void {
		if (this.enabled) return;

		this.enabled = true;
		this.createLiveRegion();
		this.debugLog('Announcements enabled');
	}

	/**
	 * Disable announcements
	 */
	disable(): void {
		if (!this.enabled) return;

		this.enabled = false;
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		this.pendingAnnouncements = [];
		this.debugLog('Announcements disabled');
	}

	/**
	 * Change live region mode
	 */
	setMode(mode: AriaLiveMode): void {
		this.mode = mode;
		if (this.liveRegion) {
			this.liveRegion.setAttribute('aria-live', mode);
		}
		this.debugLog(`Mode changed to: ${mode}`);
	}

	/**
	 * Debug logging
	 */
	private debugLog(...args: any[]): void {
		if (this.debug) {
			console.log('[AriaAnnouncer]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		if (this.liveRegion && this.liveRegion.parentNode) {
			this.liveRegion.parentNode.removeChild(this.liveRegion);
		}

		this.liveRegion = null;
		this.pendingAnnouncements = [];
		this.debugLog('Destroyed');
	}
}

/**
 * Create ARIA announcer instance
 */
export function createAriaAnnouncer(options?: AnnouncerOptions): AriaAnnouncer {
	return new AriaAnnouncer(options);
}
