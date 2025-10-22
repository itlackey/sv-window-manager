import { expect, test } from 'vitest';
import { SashConfig } from './sash-config.js';
import { FEAT_DEFAULTS } from './config-root.js';

test('Instantiate', () => {
  const config = new SashConfig();

  expect(config.fitContainer).toBe(FEAT_DEFAULTS.fitContainer);
});
