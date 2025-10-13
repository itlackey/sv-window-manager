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
		const evt = await new Promise<CustomEvent<{ title: string }>>((resolve, reject) => {
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
		expect(evt.detail.title).toBe(title);

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

describe('WindowManagerShell — US2 Keyboard & Context Menu', () => {
	it('respects keyboard bindings to toggle panel (default and override)', async () => {
		// Default binding Ctrl+` toggles panel
		const { container, unmount } = render(WindowManagerShell, {
			title: 'KB Test',
			config: { panel: { visible: false } }
		});
		const root = container.querySelector('.wm-root') as HTMLElement;
		expect(root).toBeTruthy();

		// Ensure panel starts hidden
		expect(container.querySelector('.wm-panel')).toBeNull();

		// Dispatch Ctrl+` keydown
		const evt1 = new KeyboardEvent('keydown', {
			key: '`',
			ctrlKey: true,
			bubbles: true,
			cancelable: true
		});
		root.dispatchEvent(evt1);
		await new Promise((r) => setTimeout(r, 0));
		expect(container.querySelector('.wm-panel')).toBeTruthy();

		// Override binding to Alt+P and verify it works (remount with new config)
		unmount();
		const { container: c2 } = render(WindowManagerShell, {
			title: 'KB Test',
			config: { keyboard: { bindings: { togglePanel: 'Alt+P' } }, panel: { visible: false } }
		});

		const evt2 = new KeyboardEvent('keydown', {
			key: 'p',
			altKey: true,
			bubbles: true,
			cancelable: true
		});
		(c2.querySelector('.wm-root') as HTMLElement).dispatchEvent(evt2);
		await new Promise((r) => setTimeout(r, 0));
		expect(c2.querySelector('.wm-panel')).toBeTruthy();
	});

	it('adapts context menu items based on selection and clipboard', async () => {
		const { container } = render(WindowManagerShell, { title: 'Menu Test' });
		const root = container.querySelector('.wm-root') as HTMLElement;
		expect(root).toBeTruthy();

		// Stub clipboard for empty case using global fallback
		(globalThis as typeof globalThis & { __svwm_clipboard?: string }).__svwm_clipboard = '';

		// Clear selection
		const sel = window.getSelection();
		sel?.removeAllRanges();

		// Open context menu
		root.dispatchEvent(
			new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 })
		);
		await new Promise((r) => setTimeout(r, 0));

		const menu1 = document.querySelector('.wm-menu') as HTMLElement | null;
		expect(menu1).toBeTruthy();
		const copyItem1 = menu1!.querySelector('[data-id="copy"]') as HTMLElement;
		const pasteItem1 = menu1!.querySelector('[data-id="paste"]') as HTMLElement;
		expect(copyItem1.getAttribute('aria-disabled')).toBe('true');
		expect(pasteItem1.getAttribute('aria-disabled')).toBe('true');

		// Now simulate clipboard containing a URL
		(globalThis as typeof globalThis & { __svwm_clipboard?: string }).__svwm_clipboard =
			'http://example.com';

		// Also create a selection with URL-like text
		const p = document.createElement('p');
		p.textContent = 'Visit http://example.com now';
		document.body.appendChild(p);
		const range = document.createRange();
		range.selectNodeContents(p);
		sel?.removeAllRanges();
		sel?.addRange(range);

		// Re-open context menu to recompute items
		root.dispatchEvent(
			new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 12 })
		);
		await new Promise((r) => setTimeout(r, 0));

		const menu2 = document.querySelector('.wm-menu') as HTMLElement | null;
		expect(menu2).toBeTruthy();
		const openLinkItem = menu2!.querySelector('[data-id="open-link"]') as HTMLElement;
		expect(openLinkItem.getAttribute('aria-disabled')).toBe('false');
	});
});

describe('WindowManagerShell — US3 Layout & Panel Persistence', () => {
	it('renders landmarks/roles for toolbar, main, and side panel', async () => {
		const { container } = render(WindowManagerShell, {
			title: 'A11y',
			config: { panel: { visible: true, widthPx: 360 } }
		});
		// toolbar
		expect(container.querySelector('[role="toolbar"]')).toBeTruthy();
		// main
		expect(container.querySelector('main.wm-main')).toBeTruthy();
		// side panel should be present when visible=true
		await new Promise((r) => setTimeout(r, 0));
		const aside = container.querySelector('aside.wm-panel[aria-label="Side panel"]');
		expect(aside).toBeTruthy();
	});

	it('persists side panel visibility and width within session', async () => {
		// Ensure starting clean
		sessionStorage.clear();
		// Mount hidden
		const { container, unmount } = render(WindowManagerShell, {
			title: 'Persist Test',
			config: { panel: { visible: false, widthPx: 360 } }
		});
		const root = container.querySelector('.wm-root') as HTMLElement;
		// Toggle via keyboard to show
		root.dispatchEvent(
			new KeyboardEvent('keydown', { key: '`', ctrlKey: true, bubbles: true, cancelable: true })
		);
		await new Promise((r) => setTimeout(r, 0));
		expect(container.querySelector('.wm-panel')).toBeTruthy();

		// Resize via drag handle simulation
		const handle = container.querySelector('.wm-resizer') as HTMLElement;
		expect(handle).toBeTruthy();
		handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: 300, bubbles: true }));
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 260 })); // +40px wider
		window.dispatchEvent(new PointerEvent('pointerup', {}));
		await new Promise((r) => setTimeout(r, 0));
		const aside = container.querySelector('.wm-panel') as HTMLElement;
		const widthAfter = parseInt(aside.style.width);
		expect(widthAfter).toBeGreaterThan(360);

		// Unmount and remount; expect persisted state
		unmount();
		const { container: container2 } = render(WindowManagerShell, { title: 'Persist Test' });
		const aside2 = container2.querySelector('.wm-panel') as HTMLElement | null;
		expect(aside2).toBeTruthy();
		if (aside2) {
			const widthRemount = parseInt(aside2.style.width);
			expect(widthRemount).toBe(widthAfter);
		}
	});

	it('clamps panel resize within bounds and avoids overlap', async () => {
		const { container } = render(WindowManagerShell, {
			title: 'Resize Test',
			config: { panel: { visible: true, widthPx: 360 } }
		});
		const handle = container.querySelector('.wm-resizer') as HTMLElement;
		const aside = container.querySelector('.wm-panel') as HTMLElement;
		expect(handle && aside).toBeTruthy();

		// Try to resize below minimum
		handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: 500, bubbles: true }));
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 190 }));
		window.dispatchEvent(new PointerEvent('pointerup', {}));
		await new Promise((r) => setTimeout(r, 0));
		expect(parseInt(aside.style.width)).toBeGreaterThanOrEqual(200);

		// Try to resize above maximum
		handle.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }));
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1200 }));
		window.dispatchEvent(new PointerEvent('pointerup', {}));
		await new Promise((r) => setTimeout(r, 0));
		expect(parseInt(aside.style.width)).toBeLessThanOrEqual(800);

		// Basic non-overlap sanity: main region still present and has non-zero clientWidth
		const main = container.querySelector('.wm-main') as HTMLElement;
		expect(main).toBeTruthy();
		expect(main.clientWidth).toBeGreaterThan(0);
	});

	it('uses host-provided panel state over session cache on mount', async () => {
		// Pre-populate session with conflicting values
		sessionStorage.setItem('svwm:panel:visible', 'false');
		sessionStorage.setItem('svwm:panel:width', '240');

		const { container } = render(WindowManagerShell, {
			title: 'Host Precedence',
			config: { panel: { visible: true, widthPx: 500 } }
		});
		const aside = container.querySelector('.wm-panel') as HTMLElement | null;
		expect(aside).toBeTruthy();
		expect(parseInt(aside!.style.width)).toBe(500);
	});
});
