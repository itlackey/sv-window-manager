import { parseSize, isPlainObject } from '../utils.js';
import { Sash } from '../sash.js';
import { Position, getOppositePosition } from '../position.js';
import { BwinErrors } from '../errors.js';

const PRIMARY_NODE_DEFAULTS = {
	size: '50%',
	position: Position.Left
};

/**
 * @typedef {Object} ParentRect
 * @property {number} left - Left position
 * @property {number} top - Top position
 * @property {number} width - Width
 * @property {number} height - Height
 */

/**
 * @typedef {Object} ConfigNodeParams
 * @property {ParentRect} parentRect - Parent rectangle dimensions
 * @property {any} [children] - Child configuration
 * @property {ConfigNode} [siblingConfigNode] - Sibling config node
 * @property {string} [id] - Unique identifier
 * @property {number} [minWidth] - Minimum width
 * @property {number} [minHeight] - Minimum height
 * @property {string} [position] - Position relative to parent
 * @property {string | number} [size] - Size (percentage or absolute)
 * @property {string} [resizeStrategy] - Resize strategy
 */

/**
 * ConfigNode class - represents configuration for a sash node before it's created
 */
export class ConfigNode {
	/** @type {number} */
	left = 0;
	/** @type {number} */
	top = 0;
	/** @type {number} */
	width = 0;
	/** @type {number} */
	height = 0;

	/**
	 * @param {ConfigNodeParams & Record<string, any>} params
	 */
	constructor({
		parentRect,
		children,
		siblingConfigNode,
		id,
		minWidth,
		minHeight,
		position,
		size,
		resizeStrategy,
		...rest
	}) {
		this.parentRect = parentRect;
		this.children = children;
		this.siblingConfigNode = siblingConfigNode;
		this.id = id;
		this.minWidth = minWidth;
		this.minHeight = minHeight;
		this.position = this.getPosition(position);
		this.size = this.getSize(size);
		this.resizeStrategy = resizeStrategy;
		this.nonCoreData = rest;

		this.setBounds();
	}

	/**
	 * Get the position, validating against sibling if present
	 *
	 * @param {string | undefined} position - The position to validate
	 * @returns {string} The validated position
	 */
	getPosition(position) {
		if (!this.siblingConfigNode) {
			return position || '';
		}

		const oppositePositionOfSibling = getOppositePosition(this.siblingConfigNode.position);

		if (!position) {
			return oppositePositionOfSibling;
		}

		// Validation of explicit setting of both positions
		if (position !== oppositePositionOfSibling) {
			throw BwinErrors.siblingsNotOpposite();
		}

		return position;
	}

	/**
	 * Get the size, validating against sibling if present
	 *
	 * @param {string | number | undefined} size - The size to validate
	 * @returns {number} The validated size
	 */
	getSize(size) {
		if (!this.siblingConfigNode) {
			return parseSize(size || 0);
		}

		if (!size) {
			if (this.siblingConfigNode.size < 1) {
				return 1 - this.siblingConfigNode.size;
			} else {
				if (
					this.siblingConfigNode.position === Position.Left ||
					this.siblingConfigNode.position === Position.Right
				) {
					return this.parentRect.width - this.siblingConfigNode.width;
				} else if (
					this.siblingConfigNode.position === Position.Top ||
					this.siblingConfigNode.position === Position.Bottom
				) {
					return this.parentRect.height - this.siblingConfigNode.height;
				}
			}
		}

		const parsedSize = parseSize(size || 0);

		// Validation of explicit setting of both sizes
		if (parsedSize < 1) {
			if (parsedSize + this.siblingConfigNode.size !== 1) {
				throw BwinErrors.siblingSizesSumNot1();
			}
		} else {
			if (
				(this.position === Position.Left || this.position === Position.Right) &&
				parsedSize + this.siblingConfigNode.size !== this.parentRect.width
			) {
				throw BwinErrors.siblingSizesSumNotWidth();
			}

			if (
				(this.position === Position.Top || this.position === Position.Bottom) &&
				parsedSize + this.siblingConfigNode.size !== this.parentRect.height
			) {
				throw BwinErrors.siblingSizesSumNotHeight();
			}
		}

		return parsedSize;
	}

	/**
	 * Set the bounds (left, top, width, height) based on position and size
	 */
	setBounds() {
		if (this.position === Position.Root) {
			this.left = 0;
			this.top = 0;
			this.width = this.parentRect.width;
			this.height = this.parentRect.height;
		} else if (this.position === Position.Left) {
			const absoluteSize = this.size < 1 ? this.parentRect.width * this.size : this.size;
			this.left = this.parentRect.left;
			this.top = this.parentRect.top;
			this.width = absoluteSize;
			this.height = this.parentRect.height;
		} else if (this.position === Position.Right) {
			const absoluteSize = this.size < 1 ? this.parentRect.width * this.size : this.size;
			this.left = this.parentRect.left + this.parentRect.width - absoluteSize;
			this.top = this.parentRect.top;
			this.width = absoluteSize;
			this.height = this.parentRect.height;
		} else if (this.position === Position.Top) {
			const absoluteSize = this.size < 1 ? this.parentRect.height * this.size : this.size;
			this.left = this.parentRect.left;
			this.top = this.parentRect.top;
			this.width = this.parentRect.width;
			this.height = absoluteSize;
		} else if (this.position === Position.Bottom) {
			const absoluteSize = this.size < 1 ? this.parentRect.height * this.size : this.size;
			this.left = this.parentRect.left;
			this.top = this.parentRect.top + this.parentRect.height - absoluteSize;
			this.width = this.parentRect.width;
			this.height = absoluteSize;
		}
	}

	/**
	 * Create a Sash instance from this config node
	 *
	 * @param {{ resizeStrategy?: string }} [options] - Options for sash creation
	 * @returns {Sash} The created sash
	 */
	createSash({ resizeStrategy } = {}) {
		return new Sash({
			left: this.left,
			top: this.top,
			width: this.width,
			height: this.height,
			position: this.position,
			id: this.id,
			minWidth: this.minWidth,
			minHeight: this.minHeight,
			resizeStrategy: resizeStrategy || this.resizeStrategy,
			store: this.nonCoreData
		});
	}

	/**
	 * Normalize configuration to a standard object format
	 *
	 * @param {any} config - Configuration in various formats
	 * @returns {Record<string, any>} Normalized configuration object
	 */
	normConfig(config) {
		if (isPlainObject(config)) {
			return config;
		} else if (Array.isArray(config)) {
			return {
				children: config
			};
		} else if (typeof config === 'string' || typeof config === 'number') {
			const size = parseSize(config);
			if (isNaN(size)) {
				throw BwinErrors.invalidSize(config);
			}

			return {
				size: config
			};
		} else if (config === null || config === undefined) {
			return {};
		} else {
			throw BwinErrors.invalidConfigValue(config);
		}
	}

	/**
	 * Create the primary (first) config node from this parent
	 *
	 * @param {Record<string, any>} params - Configuration parameters
	 * @returns {ConfigNode} The created config node
	 */
	createPrimaryConfigNode({ size, position, children, id, minWidth, minHeight, ...rest }) {
		return new ConfigNode({
			parentRect: this,
			size: size ?? PRIMARY_NODE_DEFAULTS.size,
			position: position ?? PRIMARY_NODE_DEFAULTS.position,
			children,
			id,
			minWidth,
			minHeight,
			...rest
		});
	}

	/**
	 * Create the secondary (second) config node from this parent
	 *
	 * @param {Record<string, any>} params - Configuration parameters
	 * @param {ConfigNode} primaryConfigNode - The primary sibling node
	 * @returns {ConfigNode} The created config node
	 */
	createSecondaryConfigNode(
		{ size, position, children, id, minWidth, minHeight, ...rest },
		primaryConfigNode
	) {
		return new ConfigNode({
			parentRect: this,
			size,
			position,
			children,
			siblingConfigNode: primaryConfigNode,
			id,
			minWidth,
			minHeight,
			...rest
		});
	}

	/**
	 * Build a sash tree from this configuration
	 *
	 * @param {{ resizeStrategy?: string }} [options] - Options for tree building
	 * @returns {Sash} The root sash of the built tree
	 */
	buildSashTree({ resizeStrategy } = {}) {
		const sash = this.createSash({ resizeStrategy });

		if (!Array.isArray(this.children) || this.children.length === 0) {
			return sash;
		}

		const firstChildConfig = this.normConfig(this.children[0]);
		const secondChildConfig = this.normConfig(this.children.at(1));

		let primaryChildConfigNode;
		let secondaryChildConfigNode;

		// Use second child as primary if first child is like e.g. [[0.3, 0.7], 0.6]
		if (!firstChildConfig.size && !firstChildConfig.position && secondChildConfig) {
			if (!secondChildConfig.position) {
				secondChildConfig.position = Position.Right;
			}

			primaryChildConfigNode = this.createPrimaryConfigNode(secondChildConfig);
			secondaryChildConfigNode = this.createSecondaryConfigNode(
				firstChildConfig,
				primaryChildConfigNode
			);
		} else {
			primaryChildConfigNode = this.createPrimaryConfigNode(firstChildConfig);
			secondaryChildConfigNode = this.createSecondaryConfigNode(
				secondChildConfig,
				primaryChildConfigNode
			);
		}

		if (primaryChildConfigNode && secondaryChildConfigNode) {
			const primaryChildSash = primaryChildConfigNode.buildSashTree({ resizeStrategy });
			const secondaryChildSash = secondaryChildConfigNode.buildSashTree({ resizeStrategy });

			primaryChildSash.parent = sash;
			secondaryChildSash.parent = sash;

			sash.children.push(primaryChildSash);
			sash.children.push(secondaryChildSash);
		}

		return sash;
	}
}
