import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Glass from './Glass.svelte';
import { page } from '@vitest/browser/context';

describe('Glass Component - XSS Security', () => {
	it('should safely render DOM element content', async () => {
		const contentDiv = document.createElement('div');
		contentDiv.textContent = 'Safe DOM content';
		contentDiv.className = 'test-content';

		render(Glass, {
			props: {
				content: contentDiv,
				// @ts-expect-error - Minimal mock for testing
				binaryWindow: {}
			}
		});

		const glassContent = page.getByText('Safe DOM content');
		await expect.element(glassContent).toBeVisible();
	});

	it('should prevent XSS when content contains malicious HTML', async () => {
		// This string contains a potential XSS attack via img onerror
		const maliciousContent = '<p>Safe text</p><img src=x onerror=alert("XSS")>';

		render(Glass, {
			props: {
				content: maliciousContent,
				// @ts-expect-error - Minimal mock for testing
				binaryWindow: {}
			}
		});

		// The safe HTML should be preserved
		const safeText = page.getByText('Safe text');
		await expect.element(safeText).toBeVisible();

		// Verify no img element was created (DOMPurify removes img tags)
		const images = document.querySelectorAll('.glass-content img');
		expect(images.length).toBe(0);
	});

	it('should allow safe HTML through DOMPurify', async () => {
		const safeContent = '<div style="padding: 1rem;"><h3>Title</h3><p>Paragraph text</p></div>';

		render(Glass, {
			props: {
				content: safeContent,
				// @ts-expect-error - Minimal mock for testing
				binaryWindow: {}
			}
		});

		// Safe HTML should be rendered
		const title = page.getByText('Title');
		await expect.element(title).toBeVisible();

		const paragraph = page.getByText('Paragraph text');
		await expect.element(paragraph).toBeVisible();

		// Verify HTML structure is preserved
		const h3 = document.querySelector('.glass-content h3');
		expect(h3).toBeTruthy();
		expect(h3?.textContent).toBe('Title');
	});

	it('should prevent script execution from HTML strings', async () => {
		// Track if script executes
		let scriptExecuted = false;
		(window as any).__testScriptExecuted = () => {
			scriptExecuted = true;
		};

		const maliciousContent = '<script>window.__testScriptExecuted()</script>Test';

		render(Glass, {
			props: {
				content: maliciousContent,
				// @ts-expect-error - Minimal mock for testing
				binaryWindow: {}
			}
		});

		// Wait a moment to see if script would execute
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Script should NOT have executed
		expect(scriptExecuted).toBe(false);

		// Cleanup
		delete (window as any).__testScriptExecuted;
	});

	it('should render content with title and actions', async () => {
		const contentDiv = document.createElement('div');
		contentDiv.textContent = 'Content with title';

		render(Glass, {
			props: {
				title: 'Test Window',
				content: contentDiv,
				// @ts-expect-error - Minimal mock for testing
				binaryWindow: {}
			}
		});

		const title = page.getByText('Test Window');
		await expect.element(title).toBeVisible();

		const content = page.getByText('Content with title');
		await expect.element(content).toBeVisible();
	});

	it('should handle null content gracefully', async () => {
		const { container } = render(Glass, {
			props: {
				content: null,
				// @ts-expect-error - Minimal mock for testing
				binaryWindow: {}
			}
		});

		const glassContent = container.querySelector('.glass-content');
		expect(glassContent).toBeTruthy();
		expect(glassContent?.textContent).toBe('');
	});
});
