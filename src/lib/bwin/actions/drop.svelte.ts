import type { Action } from 'svelte/action';
import { on } from 'svelte/events';
import type { Sash } from '../sash.js';
import { getCursorPosition } from '../position.js';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants.js';

interface DropActionParams {
	rootSash: Sash;
	onDrop?: (event: DragEvent, sash: Sash, dropArea: string) => void;
}

export const drop: Action<HTMLElement, DropActionParams> = (node, params) => {
	let { rootSash, onDrop } = params;
	let activeDropPaneEl: HTMLElement | null = null;

	function handleDragOver(event: DragEvent) {
		// `preventDefault` is required to allow drop
		event.preventDefault();

		const target = event.target as HTMLElement;
		const paneEl = target.matches(`.${CSS_CLASSES.PANE}`)
			? target
			: (target.closest(`.${CSS_CLASSES.PANE}`) as HTMLElement);

		if (!paneEl) return;

		if (paneEl !== activeDropPaneEl) {
			if (activeDropPaneEl) {
				activeDropPaneEl.removeAttribute(DATA_ATTRIBUTES.DROP_AREA);
			}
			activeDropPaneEl = paneEl;
		}

		if (paneEl.getAttribute(DATA_ATTRIBUTES.CAN_DROP) === 'false') return;

		const position = getCursorPosition(paneEl, event);
		paneEl.setAttribute(DATA_ATTRIBUTES.DROP_AREA, position);
	}

	function handleDragLeave(event: DragEvent) {
		// Prevent `dragleave` from triggering on child elements in Chrome
		const relatedTarget = event.relatedTarget as Node;
		if (
			event.currentTarget &&
			(event.currentTarget as HTMLElement).contains(relatedTarget) &&
			event.currentTarget !== relatedTarget
		) {
			return;
		}

		if (activeDropPaneEl) {
			activeDropPaneEl.removeAttribute(DATA_ATTRIBUTES.DROP_AREA);
			activeDropPaneEl = null;
		}
	}

	function handleDrop(event: DragEvent) {
		if (!activeDropPaneEl) return;
		if (activeDropPaneEl.getAttribute(DATA_ATTRIBUTES.CAN_DROP) === 'false') return;

		const sashId = activeDropPaneEl.getAttribute(DATA_ATTRIBUTES.SASH_ID);
		if (!sashId) return;

		const sash = rootSash.getById(sashId);
		const dropArea = activeDropPaneEl.getAttribute(DATA_ATTRIBUTES.DROP_AREA) || '';

		if (onDrop && sash) {
			onDrop(event, sash, dropArea);
		}

		if (typeof sash?.store?.onDrop === 'function') {
			sash.store.onDrop(event, sash);
		}

		activeDropPaneEl.removeAttribute(DATA_ATTRIBUTES.DROP_AREA);
		activeDropPaneEl = null;
	}

	// Use svelte/events for automatic cleanup
	const cleanupDragOver = on(node, 'dragover', handleDragOver);
	const cleanupDragLeave = on(node, 'dragleave', handleDragLeave);
	const cleanupDrop = on(node, 'drop', handleDrop);

	return {
		update(newParams: DropActionParams) {
			rootSash = newParams.rootSash;
			onDrop = newParams.onDrop;
		},
		destroy() {
			cleanupDragOver();
			cleanupDragLeave();
			cleanupDrop();
			if (activeDropPaneEl) {
				activeDropPaneEl.removeAttribute(DATA_ATTRIBUTES.DROP_AREA);
			}
		}
	};
};
