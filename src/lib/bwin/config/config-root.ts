import { ConfigNode, type ConfigNodeParams } from './config-node.js';
import { Position } from '../position.js';

const DEFAULTS = {
	width: 333,
	height: 333
};

export const FEAT_DEFAULTS = {
	fitContainer: false
};

export interface ConfigRootParams {
	id?: string;
	children?: unknown;
	width?: number;
	height?: number;
	fitContainer?: boolean;
	[key: string]: unknown;
}

/**
 * ConfigRoot class - represents the root configuration node
 */
export class ConfigRoot extends ConfigNode {
	fitContainer: boolean;

	constructor({
		id,
		children,
		width = DEFAULTS.width,
		height = DEFAULTS.height,
		fitContainer = FEAT_DEFAULTS.fitContainer,
		...rest
	}: ConfigRootParams = {}) {
		const params: ConfigNodeParams = {
			id,
			children,
			size: NaN,
			position: Position.Root,
			parentRect: { width, height, left: 0, top: 0 },
			...rest
		};

		super(params);

		this.fitContainer = fitContainer;
	}
}
