import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-svelte';
import BinaryWindow from '../bwin/binary-window/BinaryWindow.svelte';
import { Position } from '../bwin/position.js';
import type { Sash } from '../bwin/sash.js';
import { onpaneadded, onpaneresized, offPaneEvent } from './dispatcher.js';
import type { PaneEvent, PanePayload } from './types.js';

interface BinaryWindowInstance {
  addPane: (targetPaneSashId: string, props: Record<string, unknown>) => Sash;
  getRootSash: () => Sash | undefined;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function validatePayloadShape(p: PanePayload) {
  expect(typeof p.id).toBe('string');
  expect(typeof p.title === 'string' || p.title === null).toBe(true);
  expect(isObject(p.size)).toBe(true);
  expect(typeof p.size.width).toBe('number');
  expect(typeof p.size.height).toBe('number');
  expect(isObject(p.position)).toBe(true);
  expect(typeof p.position.x).toBe('number');
  expect(typeof p.position.y).toBe('number');
  expect(['normal', 'minimized', 'maximized'].includes(p.state)).toBe(true);
  expect(typeof p.groupId === 'string' || p.groupId === null).toBe(true);
  expect(typeof p.index === 'number' || p.index === null).toBe(true);
  expect(isObject(p.config)).toBe(true);
  expect(isObject(p.dynamic)).toBe(true);
}

function waitForEventOnce(register: (h: (e: PaneEvent) => void) => void, timeoutMs = 1500) {
  return new Promise<PaneEvent>((resolve, reject) => {
    const handler = (e: PaneEvent) => {
      offPaneEvent(e.type, handler);
      resolve(e);
    };
    register(handler);
    const to = setTimeout(() => reject(new Error('Timed out waiting for event')), timeoutMs);
    (resolve as any).finally?.(() => clearTimeout(to));
  });
}

describe('PaneEvent payload contract', () => {
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

  it('validates shape on onpaneadded', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;

    const addedP = waitForEventOnce((h) => onpaneadded(h));
    const pane = bwin.addPane(root.id, { position: Position.Right, title: 'Contract' });
    void pane;

    const evt = await addedP;
    expect(typeof evt.timestamp).toBe('string');
    expect(evt.type).toBe('onpaneadded');
    validatePayloadShape(evt.pane);
  });

  it('validates shape on onpaneresized', async () => {
    const { component } = render(BinaryWindow, {
      target: container,
      props: {
        settings: { position: Position.Root, width: 800, height: 500 }
      }
    });
    const bwin = component as unknown as BinaryWindowInstance;
    const root = bwin.getRootSash()!;
    bwin.addPane(root.id, { position: Position.Right, title: 'Right' });

    // Subscribe before drag
    const resizedP = waitForEventOnce((h) => onpaneresized(h));

    // Find a muntin and simulate a drag
    const muntin = document.querySelector('.muntin') as HTMLElement | null;
    expect(muntin).toBeTruthy();
    const rect = muntin!.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    muntin!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: startX, clientY: startY }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: startX + 25, clientY: startY }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const evt = await resizedP;
    expect(evt.type).toBe('onpaneresized');
    validatePayloadShape(evt.pane);
  });
});
