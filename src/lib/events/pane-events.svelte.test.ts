import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import BinaryWindow from '../bwin/binary-window/BinaryWindow.svelte';
import { Position } from '../bwin/position.js';
import type { Sash } from '../bwin/sash.js';
import {
  onpaneadded,
  onpaneremoved,
  onpaneminimized,
  onpanemaximized,
  onpanerestored,
  onpanefocused,
  onpaneblurred,
  onpaneresized,
  offPaneEvent
} from './dispatcher.js';
import type { PaneEvent } from './types.js';

interface BinaryWindowInstance {
  addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash;
  removePane: (sashId: string) => void;
  getRootSash: () => Sash | undefined;
}

function waitForEvent(register: (h: (e: PaneEvent) => void) => void, timeoutMs = 1000) {
  return new Promise<PaneEvent>((resolve, reject) => {
    const handler = (e: PaneEvent) => {
      offPaneEvent(e.type, handler);
      resolve(e);
    };
    register(handler);
    const to = setTimeout(() => {
      offPaneEvent('onpaneadded', handler as any);
      offPaneEvent('onpaneremoved', handler as any);
      offPaneEvent('onpaneminimized', handler as any);
      offPaneEvent('onpanemaximized', handler as any);
      offPaneEvent('onpanerestored', handler as any);
      offPaneEvent('onpanefocused', handler as any);
      offPaneEvent('onpaneblurred', handler as any);
      offPaneEvent('onpaneresized', handler as any);
      reject(new Error('Timed out waiting for pane event'));
    }, timeoutMs);
    // Clear timeout on resolve
    (resolve as any).finally?.(() => clearTimeout(to));
  });
}

describe('Pane Lifecycle Events', () => {
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

  it('emits onpaneadded and onpaneremoved', async () => {
    const result = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 1000, height: 600 }
      }
    });
    const bwin = result.component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;

    const addedP = waitForEvent((h) => onpaneadded(h));
    const newPane = bwin.addPane(root.id, { position: Position.Right, title: 'Added' });
    const added = await addedP;
    expect(added.type).toBe('onpaneadded');
    expect(added.pane.id).toBe(newPane.id);

    const removedP = waitForEvent((h) => onpaneremoved(h));
    bwin.removePane(newPane.id);
    const removed = await removedP;
    expect(removed.type).toBe('onpaneremoved');
    expect(removed.pane.id).toBe(newPane.id);
  });

  it('emits onpaneminimized and onpanerestored via UI actions', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;

    // Create two panes so minimize button is enabled
    const p1 = bwin.addPane(root.id, { position: Position.Right, title: 'P1' });
    void p1;

    // Click the first minimize button
    const minimizeBtn = document.querySelector('.glass-action--minimize') as HTMLButtonElement | null;
    expect(minimizeBtn).toBeTruthy();
    minimizeBtn!.click();

    const minimized = await waitForEvent((h) => onpaneminimized(h));
    expect(minimized.type).toBe('onpaneminimized');
    expect(minimized.pane.state).toBe('minimized');

    // Sill should have a minimized glass button we can click to restore
  // Find minimized glass button in sill and click to restore
  const sillBtn = document.querySelector('.bw-minimized-glass') as HTMLButtonElement | null;
  expect(sillBtn).toBeTruthy();
  sillBtn!.click();

    const restored = await waitForEvent((h) => onpanerestored(h));
    expect(restored.type).toBe('onpanerestored');
    expect(restored.pane.id).toBe(minimized.pane.id);
  });

  it('emits onpanemaximized and onpanerestored via maximize toggle', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;
    // Create two panes to enable maximize
    bwin.addPane(root.id, { position: Position.Right, title: 'P1' });

    const maxBtn = document.querySelector('.glass-action--maximize') as HTMLButtonElement | null;
    expect(maxBtn).toBeTruthy();

    const maximizedP = waitForEvent((h) => onpanemaximized(h));
    maxBtn!.click();
    const maximized = await maximizedP;
    expect(maximized.type).toBe('onpanemaximized');

    const restoredP = waitForEvent((h) => onpanerestored(h));
    maxBtn!.click();
    const restored = await restoredP;
    expect(restored.type).toBe('onpanerestored');
  });

  it('emits onpanefocused and suppresses onpaneblurred on removal', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 600, height: 400 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;
    const pane = bwin.addPane(root.id, { position: Position.Right, title: 'Focus Me' });

    const paneEl = document.querySelector(`[data-sash-id="${pane.id}"] .pane-content`) as HTMLElement | null
      || document.querySelector(`[data-sash-id="${pane.id}"]`) as HTMLElement | null;
    expect(paneEl).toBeTruthy();

    const focusedP = waitForEvent((h) => onpanefocused(h));
    paneEl!.focus();
    const focused = await focusedP;
    expect(focused.type).toBe('onpanefocused');

    let blurred = false;
    const blurHandler = () => { blurred = true; };
    onpaneblurred(blurHandler);
    bwin.removePane(pane.id);
    // Allow a short delay to ensure no blur after removal
    await new Promise((r) => setTimeout(r, 150));
    offPaneEvent('onpaneblurred', blurHandler);
    expect(blurred).toBe(false);
  });

  it('emits debounced onpaneresized for adjacent panes', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;
    bwin.addPane(root.id, { position: Position.Right, title: 'Right' });

    // Find a muntin and simulate a drag
    const muntin = document.querySelector('.muntin') as HTMLElement | null;
    expect(muntin).toBeTruthy();

    const rect = muntin!.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Collect resize events
    const events: PaneEvent[] = [];
    const resizeHandler = (e: PaneEvent) => events.push(e);
    onpaneresized(resizeHandler);

    // Start drag
    muntin!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: startX, clientY: startY }));
    // Move horizontally by 30px (for vertical muntin)
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: startX + 30, clientY: startY }));
    // End drag
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Wait for debounce window
    await new Promise((r) => setTimeout(r, 200));
    offPaneEvent('onpaneresized', resizeHandler);

    expect(events.length).toBeGreaterThanOrEqual(1);
    // Should include pane payloads with ids
    expect(events[0].pane.id).toBeTruthy();
  });
});
