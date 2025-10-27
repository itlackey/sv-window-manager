import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import BinaryWindow from '../bwin/binary-window/BinaryWindow.svelte';
import { Position } from '../bwin/position.js';
import type { Sash } from '../bwin/sash.js';
import {
  onpaneorderchanged,
  onpanetitlechanged,
  offPaneEvent
} from './dispatcher.js';
import type { PaneEvent } from './types.js';

interface BinaryWindowInstance {
  addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash;
  removePane: (sashId: string) => void;
  getRootSash: () => Sash | undefined;
}

function waitForEvents(
  register: (h: (e: PaneEvent) => void) => void,
  count: number,
  timeoutMs = 1500
) {
  return new Promise<PaneEvent[]>((resolve, reject) => {
    const events: PaneEvent[] = [];
    const handler = (e: PaneEvent) => {
      events.push(e);
      if (events.length >= count) {
        offPaneEvent(e.type, handler);
        resolve(events);
      }
    };
    register(handler);
    const to = setTimeout(() => {
      try {
        offPaneEvent('onpaneorderchanged', handler as any);
        offPaneEvent('onpanetitlechanged', handler as any);
      } catch {}
      reject(new Error(`Timed out waiting for ${count} pane events`));
    }, timeoutMs);
    // Clear timeout on resolve
    (resolve as any).finally?.(() => clearTimeout(to));
  });
}

describe('Pane order-changed and title-changed events', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '1000px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await cleanup();
    if (container && container.parentElement) container.parentElement.removeChild(container);
  });

  it('emits onpaneorderchanged for both panes when swapping via center drop', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;

    // Ensure two panes exist side-by-side
    const left = root;
    const right = bwin.addPane(left.id, { position: Position.Right, title: 'Right' });
    void right;

    // Source: first pane header; Target: second pane element
    const panes = Array.from(document.querySelectorAll('.pane')) as HTMLElement[];
    expect(panes.length).toBeGreaterThanOrEqual(2);
    const sourcePane = panes[0];
    const targetPane = panes[1];

    // Find the source glass header and glass element
    const header = sourcePane.querySelector('.glass-header') as HTMLElement | null;
    const glass = sourcePane.querySelector('.glass') as HTMLElement | null;
    expect(header).toBeTruthy();
    expect(glass).toBeTruthy();

    // Subscribe before initiating drag
    const wait = waitForEvents((h) => onpaneorderchanged(h), 2);

    // 1) mousedown on header to arm dragging
    header!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

    // 2) dragstart on glass
    const dragStart = new DragEvent('dragstart', { bubbles: true });
    glass!.dispatchEvent(dragStart);

    // 3) dragover on target pane center to mark DROP_AREA=center
    const rect = targetPane.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dragOver = new DragEvent('dragover', { bubbles: true, clientX: centerX, clientY: centerY });
    targetPane.dispatchEvent(dragOver);

    // 4) drop on target pane
    const drop = new DragEvent('drop', { bubbles: true, clientX: centerX, clientY: centerY });
    targetPane.dispatchEvent(drop);

    // 5) dragend on glass to cleanup
    const dragEnd = new DragEvent('dragend', { bubbles: true });
    glass!.dispatchEvent(dragEnd);

    const events = await wait;
    expect(events.length).toBeGreaterThanOrEqual(2);
    // Should emit for both panes with context including groupId and previousIndex
    for (const e of events) {
      expect(e.type).toBe('onpaneorderchanged');
      expect(e.context?.groupId).toBeTruthy();
      expect(typeof e.context?.previousIndex === 'number' || e.context?.previousIndex === undefined).toBe(true);
    }
  });

  it('emits onpanetitlechanged when pane title updates with previousTitle in context', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;

    const pane = bwin.addPane(root.id, { position: Position.Right, title: 'Initial' });
    expect(pane.store.title).toBe('Initial');

    const [evt] = await waitForEvents((h) => onpanetitlechanged(h), 1);

    // Update the title via the sash store to trigger reactivity
    pane.store.title = 'Updated';

    // Wait resolves when event captured; then assert
    expect(evt.type).toBe('onpanetitlechanged');
    expect(evt.pane.id).toBe(pane.id);
    expect(evt.context?.previousTitle).toBe('Initial');
  });
});
