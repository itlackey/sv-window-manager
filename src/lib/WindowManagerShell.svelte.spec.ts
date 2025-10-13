import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WindowManagerShell from './WindowManagerShell.svelte';

describe('WindowManagerShell — US1 Ready & Appearance', () => {
	it('emits a single ready event with title after reveal', async () => {
		const title = 'Demo Workspace';

		let captured: CustomEvent | null = null;
		const { container } = render(WindowManagerShell, { title });
		// Attach listener on the root element; vitest-browser-svelte returns container as the root
		const rootEl = container.firstElementChild as HTMLElement | null;
		expect(rootEl).toBeTruthy();
		rootEl!.addEventListener('ready', (e) => (captured = e as CustomEvent), { once: true });

		// Wait up to 500ms for the ready event
		const evt = await new Promise<CustomEvent>((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('ready not emitted')), 500);
			const check = () => {
				if (captured) {
					clearTimeout(timeout);
					resolve(captured);
				} else {
					requestAnimationFrame(check);
				}
			};
			check();
		});
		expect((evt.detail as { title: string }).title).toBe(title);

		// Ensure revealed flag reflects in DOM attribute eventually
		const root = container.querySelector('.wm-root');
		expect(root).toBeTruthy();
		// Wait a tick for attribute to be applied
		await new Promise((r) => setTimeout(r, 0));
		expect(root?.getAttribute('data-revealed')).toBe('true');
	});

	it('applies appearance config (zoom, opacity) on first paint', async () => {
		const { container } = render(WindowManagerShell, {
			title: 'Appearance Check',
			config: {
				appearance: { zoom: 1.2, opacity: 0.8, transparent: false }
			}
		});

		const root = container.querySelector('.wm-root') as HTMLElement;
		expect(root).toBeTruthy();

		const cs = getComputedStyle(root);
		// Custom properties should be set on the element
		expect(cs.getPropertyValue('--wm-zoom').trim()).toBe('1.2');
		expect(cs.getPropertyValue('--wm-opacity').trim()).toBe('0.8');
	});
});
