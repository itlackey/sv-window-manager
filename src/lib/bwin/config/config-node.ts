import { parseSize, isPlainObject } from '../utils.js';
import { Sash, type SashConstructorParams } from '../sash.js';
import { Position, getOppositePosition } from '../position.js';
import { BwinErrors } from '../errors.js';

const PRIMARY_NODE_DEFAULTS = {
	size: '50%',
	position: Position.Left
};

export interface ParentRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface ConfigNodeParams {
	parentRect: ParentRect;
	children?: unknown;
	siblingConfigNode?: ConfigNode;
	id?: string;
	minWidth?: number;
	minHeight?: number;
	position?: Position | string;
	size?: string | number;
	resizeStrategy?: string;
	[key: string]: unknown;
}

export interface SashCreationOptions {
	resizeStrategy?: string;
}

/**
 * ConfigNode class - represents configuration for a sash node before it's created
 */
export class ConfigNode implements ParentRect {
	left = 0;
	top = 0;
	width = 0;
	height = 0;

	parentRect: ParentRect;
	children?: unknown;
	siblingConfigNode?: ConfigNode;
	id?: string;
	minWidth?: number;
	minHeight?: number;
	position: Position;
	size: number;
	resizeStrategy?: string;
	nonCoreData: Record<string, unknown>;

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
	}: ConfigNodeParams) {
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
	 * @param position - The position to validate
	 * @returns The validated position
	 */
	getPosition(position: Position | string | undefined): Position {
		if (!this.siblingConfigNode) {
			return (position as Position) || Position.Left;
		}

		const oppositePositionOfSibling = getOppositePosition(this.siblingConfigNode.position);

		if (!position) {
			return oppositePositionOfSibling;
		}

		// Validation of explicit setting of both positions
		if (position !== oppositePositionOfSibling) {
			throw BwinErrors.siblingsNotOpposite();
		}

		return position as Position;
	}

	/**
	 * Get the size, validating against sibling if present
	 *
	 * @param size - The size to validate
	 * @returns The validated size
	 */
	getSize(size: string | number | undefined): number {
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
	setBounds(): void {
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
	 * @param options - Options for sash creation
	 * @returns The created sash
	 */
	createSash({ resizeStrategy }: SashCreationOptions = {}): Sash {
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
		} as SashConstructorParams);
	}

	/**
	 * Normalize configuration to a standard object format
	 *
	 * @param config - Configuration in various formats
	 * @returns Normalized configuration object
	 */
	normConfig(config: unknown): Record<string, unknown> {
		if (isPlainObject(config)) {
			return config as Record<string, unknown>;
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
	 * @param params - Configuration parameters
	 * @returns The created config node
	 */
	createPrimaryConfigNode({
		size,
		position,
		children,
		id,
		minWidth,
		minHeight,
		...rest
	}: Record<string, unknown>): ConfigNode {
		return new ConfigNode({
			parentRect: this,
			size: (size as string | number | undefined) ?? PRIMARY_NODE_DEFAULTS.size,
			position: (position as Position | string | undefined) ?? PRIMARY_NODE_DEFAULTS.position,
			children,
			id: id as string | undefined,
			minWidth: minWidth as number | undefined,
			minHeight: minHeight as number | undefined,
			...rest
		});
	}

	/**
	 * Create the secondary (second) config node from this parent
	 *
	 * @param params - Configuration parameters
	 * @param primaryConfigNode - The primary sibling node
	 * @returns The created config node
	 */
	createSecondaryConfigNode(
		{ size, position, children, id, minWidth, minHeight, ...rest }: Record<string, unknown>,
		primaryConfigNode: ConfigNode
	): ConfigNode {
		return new ConfigNode({
			parentRect: this,
			size: size as string | number | undefined,
			position: position as Position | string | undefined,
			children,
			siblingConfigNode: primaryConfigNode,
			id: id as string | undefined,
			minWidth: minWidth as number | undefined,
			minHeight: minHeight as number | undefined,
			...rest
		});
	}

	/**
	 * Build a sash tree from this configuration
	 *
	 * @param options - Options for tree building
	 * @returns The root sash of the built tree
	 */
	buildSashTree({ resizeStrategy }: SashCreationOptions = {}): Sash {
		const sash = this.createSash({ resizeStrategy });

		if (!Array.isArray(this.children) || this.children.length === 0) {
			return sash;
		}

		const firstChildConfig = this.normConfig(this.children[0]);
		const secondChildConfig = this.normConfig(this.children.at(1));

		let primaryChildConfigNode: ConfigNode;
		let secondaryChildConfigNode: ConfigNode;

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
