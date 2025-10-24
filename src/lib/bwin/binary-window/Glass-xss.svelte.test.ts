/**
 * XSS Security Test Suite for Glass Component
 *
 * This test file specifically tests various XSS attack vectors to ensure
 * the DOMPurify sanitization is working correctly.
 */

import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Glass from './Glass.svelte';

describe('Glass Component - XSS Attack Vector Prevention', () => {
	it('should block <script> tags', async () => {
		const malicious = '<p>Before</p><script>window.__xss_executed = true;</script><p>After</p>';

		render(Glass, {
			props: {
				content: malicious,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		// Script should not execute
		expect((window as any).__xss_executed).toBeUndefined();

		// Script tag should be removed
		const scripts = document.querySelectorAll('.glass-content script');
		expect(scripts.length).toBe(0);

		// Safe content should be preserved
		const glassContent = document.querySelector('.glass-content');
		expect(glassContent?.textContent).toContain('Before');
		expect(glassContent?.textContent).toContain('After');
	});

	it('should block inline event handlers', async () => {
		const attacks = [
			'<div onclick="alert(\'XSS\')">Click me</div>',
			'<button onmouseover="alert(\'XSS\')">Hover me</button>',
			'<span onload="alert(\'XSS\')">Load me</span>',
			'<p onerror="alert(\'XSS\')">Error me</p>'
		];

		for (const attack of attacks) {
			render(Glass, {
				props: {
					content: attack,
					// @ts-expect-error - Minimal mock for testing

					binaryWindow: {}
				}
			});

			// Find all elements in glass-content
			const elements = document.querySelectorAll('.glass-content *');
			elements.forEach((el) => {
				// Verify no event handler attributes exist
				expect(el.getAttribute('onclick')).toBeNull();
				expect(el.getAttribute('onmouseover')).toBeNull();
				expect(el.getAttribute('onload')).toBeNull();
				expect(el.getAttribute('onerror')).toBeNull();
			});
		}
	});

	it('should block image onerror attacks', async () => {
		(window as any).__img_xss = false;
		const malicious = '<p>Text</p><img src=invalid onerror="window.__img_xss=true">';

		render(Glass, {
			props: {
				content: malicious,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		// Wait for potential image error
		await new Promise((resolve) => setTimeout(resolve, 200));

		// XSS should not execute
		expect((window as any).__img_xss).toBe(false);

		// Img tag should be removed entirely
		const images = document.querySelectorAll('.glass-content img');
		expect(images.length).toBe(0);
	});

	it('should block javascript: URLs', async () => {
		const attacks = [
			'<a href="javascript:alert(\'XSS\')">Click</a>',
			'<iframe src="javascript:alert(\'XSS\')"></iframe>',
			'<object data="javascript:alert(\'XSS\')"></object>'
		];

		for (const attack of attacks) {
			render(Glass, {
				props: {
					content: attack,
					// @ts-expect-error - Minimal mock for testing

					binaryWindow: {}
				}
			});

			// These tags should be completely removed
			const dangerous = document.querySelectorAll(
				'.glass-content a, .glass-content iframe, .glass-content object'
			);
			expect(dangerous.length).toBe(0);
		}
	});

	it('should block iframe injections', async () => {
		const malicious = '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>';

		render(Glass, {
			props: {
				content: malicious,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		const iframes = document.querySelectorAll('.glass-content iframe');
		expect(iframes.length).toBe(0);
	});

	it('should block data URIs that could contain scripts', async () => {
		const malicious = '<object data="data:text/html,<script>alert(\'XSS\')</script>"></object>';

		render(Glass, {
			props: {
				content: malicious,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		const objects = document.querySelectorAll('.glass-content object');
		expect(objects.length).toBe(0);
	});

	it('should block SVG-based XSS', async () => {
		const malicious = "<svg onload=\"alert('XSS')\"><script>alert('XSS')</script></svg>";

		render(Glass, {
			props: {
				content: malicious,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		// SVG should be removed (not in ALLOWED_TAGS)
		const svgs = document.querySelectorAll('.glass-content svg');
		expect(svgs.length).toBe(0);
	});

	it('should preserve safe HTML with style attributes', async () => {
		const safe =
			'<div style="color: red; padding: 10px;"><h3>Title</h3><p style="margin: 0;">Content</p></div>';

		render(Glass, {
			props: {
				content: safe,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		// Safe elements should exist
		const div = document.querySelector('.glass-content div');
		const h3 = document.querySelector('.glass-content h3');
		const p = document.querySelector('.glass-content p');

		expect(div).toBeTruthy();
		expect(h3).toBeTruthy();
		expect(p).toBeTruthy();

		// Style attributes should be preserved
		expect(div?.getAttribute('style')).toContain('color');
		expect(div?.getAttribute('style')).toContain('padding');
	});

	it('should not execute javascript in style attributes', async () => {
		// Note: DOMPurify doesn't strip javascript: from CSS URLs in some cases,
		// but browsers won't execute it in background-url context anyway
		(window as any).__style_xss = false;
		const malicious = '<div style="background: url(javascript:window.__style_xss=true)">Test</div>';

		render(Glass, {
			props: {
				content: malicious,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		// Wait to see if any code executes
		await new Promise((resolve) => setTimeout(resolve, 100));

		// XSS should NOT execute (browsers don't execute javascript: URLs in CSS background)
		expect((window as any).__style_xss).toBe(false);

		// The div should exist (content is allowed)
		const div = document.querySelector('.glass-content div');
		expect(div).toBeTruthy();
		expect(div?.textContent).toBe('Test');
	});

	it('should handle mixed safe and malicious content', async () => {
		const mixed = `
      <div style="padding: 1rem;">
        <h3>Safe Header</h3>
        <script>alert('XSS')</script>
        <p>Safe paragraph</p>
        <img src=x onerror="alert('XSS')">
        <span onclick="alert('XSS')">Safe span</span>
      </div>
    `;

		render(Glass, {
			props: {
				content: mixed,
				// @ts-expect-error - Minimal mock for testing

				binaryWindow: {}
			}
		});

		// Safe elements should exist
		expect(document.querySelector('.glass-content h3')).toBeTruthy();
		expect(document.querySelector('.glass-content p')).toBeTruthy();
		expect(document.querySelector('.glass-content span')).toBeTruthy();

		// Dangerous elements should be removed
		expect(document.querySelector('.glass-content script')).toBeNull();
		expect(document.querySelector('.glass-content img')).toBeNull();

		// Event handlers should be removed
		const span = document.querySelector('.glass-content span');
		expect(span?.getAttribute('onclick')).toBeNull();
	});

	it('should handle empty and whitespace-only content safely', async () => {
		const tests = ['', '   ', '\n\t\n'];

		for (const content of tests) {
			render(Glass, {
				props: {
					content,
					// @ts-expect-error - Minimal mock for testing

					binaryWindow: {}
				}
			});

			const glassContent = document.querySelector('.glass-content');
			expect(glassContent).toBeTruthy();
			expect(glassContent?.innerHTML.trim()).toBe('');
		}
	});
});
