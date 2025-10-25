import { Sash, DEFAULTS as SASH_DEFAULTS, type SashConstructorParams } from '../sash.js';
import { FEAT_DEFAULTS } from './config-root.js';
import { Position } from '../position.js';

/**
 * SashConfig class - extends Sash with configuration defaults
 */
export class SashConfig extends Sash {
	constructor(params: SashConstructorParams = SASH_DEFAULTS as SashConstructorParams) {
		super({ ...params, position: Position.Root });
		Object.assign(this, FEAT_DEFAULTS);
	}
}
