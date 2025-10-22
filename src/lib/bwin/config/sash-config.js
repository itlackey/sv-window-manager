import { Sash, DEFAULTS as SASH_DEFAULTS } from '../sash.js';
import { FEAT_DEFAULTS } from './config-root.js';
import { Position } from '../position.js';

export class SashConfig extends Sash {
  constructor(params = SASH_DEFAULTS) {
    super({ ...params, position: Position.Root });
    Object.assign(this, FEAT_DEFAULTS);
  }
}
