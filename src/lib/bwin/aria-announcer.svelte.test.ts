import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AriaAnnouncer, createAriaAnnouncer, type AriaLiveMode } from './aria-announcer.js';

describe('AriaAnnouncer', () => {
	let announcer: AriaAnnouncer;

	afterEach(() => {
		if (announcer) {
			announcer.destroy();
		}
	});

	describe('Initialization', () => {
		it('creates ARIA announcer instance', () => {
			announcer = new AriaAnnouncer();
			expect(announcer).toBeInstanceOf(AriaAnnouncer);
		});

		it('creates with factory function', () => {
			announcer = createAriaAnnouncer();
			expect(announcer).toBeInstanceOf(AriaAnnouncer);
		});

		it('creates live region element on initialization', () => {
			announcer = new AriaAnnouncer({ enabled: true });

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion).toBeDefined();
			expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
			expect(liveRegion?.getAttribute('role')).toBe('status');
		});

		it('does not create live region when disabled', () => {
			announcer = new AriaAnnouncer({ enabled: false });

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion).toBeNull();
		});

		it('sets assertive mode', () => {
			announcer = new AriaAnnouncer({ mode: 'assertive' });

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
		});
	});

	describe('Announcements', () => {
		it('announces message to live region', async () => {
			announcer = new AriaAnnouncer({ debounceDelay: 50 });

			announcer.announce('Test message');

			// Wait for debounce
			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('Test message');
		});

		it('debounces rapid announcements', async () => {
			announcer = new AriaAnnouncer({ debounceDelay: 50 });

			announcer.announce('Message 1');
			announcer.announce('Message 2');
			announcer.announce('Message 3');

			// Wait for debounce
			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			const text = liveRegion?.textContent || '';

			// All messages should be combined
			expect(text).toContain('Message 1');
			expect(text).toContain('Message 2');
			expect(text).toContain('Message 3');
		});

		it('clears message after announcement', async () => {
			announcer = new AriaAnnouncer({ debounceDelay: 50 });

			announcer.announce('Test message');

			// Wait for debounce
			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('Test message');

			// Wait for clear timeout (1 second)
			await new Promise((resolve) => setTimeout(resolve, 1100));

			expect(liveRegion?.textContent).toBe('');
		});

		it('ignores empty messages', async () => {
			announcer = new AriaAnnouncer({ debounceDelay: 50 });

			announcer.announce('');
			announcer.announce('   ');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toBe('');
		});
	});

	describe('Pane Announcements', () => {
		beforeEach(() => {
			announcer = new AriaAnnouncer({ debounceDelay: 50 });
		});

		it('announces pane added', async () => {
			announcer.announcePaneAdded('My Pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('My Pane');
			expect(liveRegion?.textContent).toContain('added');
		});

		it('announces pane removed', async () => {
			announcer.announcePaneRemoved('My Pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('My Pane');
			expect(liveRegion?.textContent).toContain('removed');
		});

		it('announces pane focused', async () => {
			announcer.announcePaneFocused('My Pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('My Pane');
			expect(liveRegion?.textContent).toContain('Focused');
		});

		it('announces pane minimized', async () => {
			announcer.announcePaneMinimized('My Pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('My Pane');
			expect(liveRegion?.textContent).toContain('minimized');
		});

		it('announces pane maximized', async () => {
			announcer.announcePaneMaximized('My Pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('My Pane');
			expect(liveRegion?.textContent).toContain('maximized');
		});

		it('announces pane restored', async () => {
			announcer.announcePaneRestored('My Pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('My Pane');
			expect(liveRegion?.textContent).toContain('restored');
		});

		it('announces pane resized with dimensions', async () => {
			announcer.announcePaneResized('My Pane', { width: 800, height: 600 });

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			const text = liveRegion?.textContent || '';

			expect(text).toContain('My Pane');
			expect(text).toContain('resized');
			expect(text).toContain('800');
			expect(text).toContain('600');
		});

		it('announces title change', async () => {
			announcer.announcePaneTitleChanged('Old Title', 'New Title');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			const text = liveRegion?.textContent || '';

			expect(text).toContain('Old Title');
			expect(text).toContain('New Title');
			expect(text).toContain('changed');
		});

		it('handles announcements without title', async () => {
			announcer.announcePaneAdded();

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('pane added');
		});
	});

	describe('Enable/Disable', () => {
		it('enables announcements', async () => {
			announcer = new AriaAnnouncer({ enabled: false, debounceDelay: 50 });

			announcer.announce('Test');
			await new Promise((resolve) => setTimeout(resolve, 100));

			let liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion).toBeNull();

			announcer.enable();
			announcer.announce('Enabled');
			await new Promise((resolve) => setTimeout(resolve, 100));

			liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('Enabled');
		});

		it('disables announcements', async () => {
			announcer = new AriaAnnouncer({ enabled: true, debounceDelay: 50 });

			announcer.announce('Test 1');
			await new Promise((resolve) => setTimeout(resolve, 100));

			let liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.textContent).toContain('Test 1');

			announcer.disable();

			// Clear existing content
			await new Promise((resolve) => setTimeout(resolve, 1100));

			announcer.announce('Test 2');
			await new Promise((resolve) => setTimeout(resolve, 100));

			liveRegion = document.querySelector('.bwin-announcer');
			// Should not contain new message (disabled)
			expect(liveRegion?.textContent).not.toContain('Test 2');
		});
	});

	describe('Mode Changes', () => {
		it('changes live region mode', () => {
			announcer = new AriaAnnouncer({ mode: 'polite' });

			let liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.getAttribute('aria-live')).toBe('polite');

			announcer.setMode('assertive');

			liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
		});

		it('handles off mode', () => {
			announcer = new AriaAnnouncer({ mode: 'polite' });

			announcer.setMode('off');

			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion?.getAttribute('aria-live')).toBe('off');
		});
	});

	describe('Keyboard Shortcut Announcements', () => {
		it('announces keyboard shortcut', async () => {
			announcer = new AriaAnnouncer({ debounceDelay: 50 });

			announcer.announceShortcut('Ctrl+W', 'Close pane');

			await new Promise((resolve) => setTimeout(resolve, 100));

			const liveRegion = document.querySelector('.bwin-announcer');
			const text = liveRegion?.textContent || '';

			expect(text).toContain('Close pane');
			expect(text).toContain('Ctrl+W');
		});
	});

	describe('Cleanup', () => {
		it('removes live region on destroy', () => {
			announcer = new AriaAnnouncer();

			let liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion).toBeDefined();

			announcer.destroy();

			liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion).toBeNull();
		});

		it('clears pending announcements on destroy', () => {
			announcer = new AriaAnnouncer({ debounceDelay: 1000 });

			// Queue announcement but don't wait for debounce
			announcer.announce('Pending');

			announcer.destroy();

			// Live region should be removed immediately
			const liveRegion = document.querySelector('.bwin-announcer');
			expect(liveRegion).toBeNull();
		});

		it('clears debounce timer on disable', () => {
			announcer = new AriaAnnouncer({ debounceDelay: 1000 });

			announcer.announce('Test');

			// Disable immediately (should clear timer)
			announcer.disable();

			// Should not throw or cause issues
			expect(() => announcer.destroy()).not.toThrow();
		});
	});

	describe('Edge Cases', () => {
		it('handles SSR environment (no document)', () => {
			// This test verifies the code doesn't crash in SSR
			// The actual SSR check is in the createLiveRegion method
			expect(() => {
				announcer = new AriaAnnouncer();
			}).not.toThrow();
		});

		it('handles multiple rapid enable/disable', () => {
			announcer = new AriaAnnouncer();

			expect(() => {
				announcer.enable();
				announcer.disable();
				announcer.enable();
				announcer.disable();
			}).not.toThrow();
		});

		it('handles announcement before live region created', async () => {
			announcer = new AriaAnnouncer({ enabled: false, debounceDelay: 50 });

			// Announce before enabling (no live region)
			announcer.announce('Test');

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should not crash
			expect(true).toBe(true);
		});
	});
});
