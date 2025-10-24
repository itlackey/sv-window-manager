import { expect, test } from 'vitest';
import { SashConfig } from './sash-config.js';
import { FEAT_DEFAULTS } from './config-root.js';

test('Instantiate', () => {
	const config = new SashConfig();

	// @ts-expect-error - fitContainer is on ConfigRoot, not SashConfig
	expect(config.fitContainer).toBe(FEAT_DEFAULTS.fitContainer);
});
