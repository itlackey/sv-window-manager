import { ConfigNode } from './config-node.js';
import { Position } from '../position.js';

const DEFAULTS = {
	width: 333,
	height: 333
};

export const FEAT_DEFAULTS = {
	fitContainer: false
};

/**
 * @typedef {Object} ConfigRootParams
 * @property {string} [id] - Unique identifier
 * @property {any} [children] - Child configuration
 * @property {number} [width] - Width
 * @property {number} [height] - Height
 * @property {boolean} [fitContainer] - Whether to fit container
 */

/**
 * ConfigRoot class - represents the root configuration node
 */
export class ConfigRoot extends ConfigNode {
	/**
	 * @param {ConfigRootParams & Record<string, any>} [params]
	 */
	constructor(
		{
			id,
			children,
			width = DEFAULTS.width,
			height = DEFAULTS.height,
			fitContainer = FEAT_DEFAULTS.fitContainer,
			...rest
		} = {
			...DEFAULTS,
			...FEAT_DEFAULTS
		}
	) {
		super({
			id,
			children,
			size: NaN,
			position: Position.Root,
			parentRect: { width, height, left: 0, top: 0 },
			...rest
		});

		this.fitContainer = fitContainer;
	}
}
