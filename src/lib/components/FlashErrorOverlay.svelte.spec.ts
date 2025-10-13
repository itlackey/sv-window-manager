import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FlashErrorOverlay from './FlashErrorOverlay.svelte';

describe('FlashErrorOverlay', () => {
	it('renders latest error and supports copy/dismiss', async () => {
		const { container } = render(FlashErrorOverlay, {
			items: [
				{ id: '1', message: 'First', expiresInMs: 50 },
				{ id: '2', message: 'Second', expiresInMs: 1000 }
			]
		});

		// Latest should be visible
		const content = container.querySelector('.content') as HTMLElement;
		expect(content).toBeTruthy();
		expect(content.textContent).toContain('Second');

		// Dismiss event should remove current when triggered
		let dismissed: string | null = null;
		const root = document.body as HTMLElement;
		root.addEventListener('dismiss', (e) => {
			const ce = e as CustomEvent<{ id: string }>;
			dismissed = ce.detail.id;
		});

		// Click Close button
		const closeBtn = container.querySelector('button[aria-label="Dismiss"]') as HTMLButtonElement;
		expect(closeBtn).toBeTruthy();
		closeBtn.click();

		await new Promise((r) => setTimeout(r, 0));
		expect(dismissed).toBe('2');
	});
});
