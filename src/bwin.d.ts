declare module 'bwin' {
	export class BinaryWindow {
		constructor(config?: any);
		mount(container: HTMLElement): void;
		addPane(nodeId: string, options: any): void;
		removePane(nodeId: string): void;
		rootSash: any;
		onPaneCreate(callback: (e: any, n: any) => void): void;
		onPaneUpdate(callback: () => void): void;
	}
}
