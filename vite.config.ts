import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(async () => {
	const base = sveltekit();
	const plugins = (Array.isArray(base) ? [...base] : [base]) as import('vite').Plugin[];
	// Avoid optional devtools plugin when running Storybook or in environments that can't resolve it
	if (!process.env.STORYBOOK) {
		try {
			const { default: devtoolsJson } = await import('vite-plugin-devtools-json');
			plugins.push(devtoolsJson());
		} catch {
			// Optional plugin not available; continue without it
		}
	}

	return {
		plugins,
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						environment: 'browser',
						browser: {
							enabled: true,
							provider: 'playwright',
							instances: [{ browser: 'chromium' }]
						},
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**'],
						setupFiles: ['./vitest-setup-client.ts']
					}
				},
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
