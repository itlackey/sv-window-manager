declare module 'bwin' {
	export interface BwinConfig {
		id?: string;
		children?: unknown;
		width?: number;
		height?: number;
		fitContainer?: boolean;
		[key: string]: unknown;
	}

	export interface AddPaneOptions {
		position?: string;
		size?: string | number;
		id?: string;
		[key: string]: unknown;
	}

	export interface BwinSash {
		id: string;
		width: number;
		height: number;
		left: number;
		top: number;
		children: BwinSash[];
		store: Record<string, unknown>;
		[key: string]: unknown;
	}

	export class BinaryWindow {
		constructor(config?: BwinConfig);
		mount(container: HTMLElement): void;
		addPane(nodeId: string, options: AddPaneOptions): void;
		removePane(nodeId: string): void;
		rootSash: BwinSash;
		onPaneCreate(callback: (event: unknown, node: BwinSash) => void): void;
		onPaneUpdate(callback: () => void): void;
	}
}
