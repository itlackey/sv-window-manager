import { Sash, DEFAULTS as SASH_DEFAULTS } from '../sash.js';
import { FEAT_DEFAULTS } from './config-root.js';
import { Position } from '../position.js';

/**
 * SashConfig class - extends Sash with configuration defaults
 */
export class SashConfig extends Sash {
	/**
	 * @param {import('../sash.js').SashConstructorParams} [params]
	 */
	constructor(params = SASH_DEFAULTS) {
		super({ ...params, position: Position.Root });
		Object.assign(this, FEAT_DEFAULTS);
	}
}
