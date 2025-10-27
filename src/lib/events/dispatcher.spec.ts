import { describe, it, expect, vi } from 'vitest';
import {
  onPaneEvent,
  offPaneEvent,
  emitPaneEvent,
  type PaneEventType,
  type PanePayload
} from '../index.js';

const samplePane = (): PanePayload => ({
  id: 'pane-1',
  title: 'Pane 1',
  size: { width: 100, height: 80 },
  position: { x: 10, y: 20 },
  state: 'normal',
  groupId: null,
  index: 0,
  config: {},
  dynamic: {}
});

function isIso8601(str: string) {
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(str);
}

describe('pane event dispatcher', () => {
  it('subscribes and receives emitted events', () => {
    const handler = vi.fn();
    onPaneEvent('onpaneadded', handler);

    emitPaneEvent('onpaneadded', samplePane());

    expect(handler).toHaveBeenCalledTimes(1);
    const evt = handler.mock.calls[0][0];
    expect(evt.type).toBe('onpaneadded');
    expect(isIso8601(evt.timestamp)).toBe(true);
    expect(evt.pane.id).toBe('pane-1');

    offPaneEvent('onpaneadded', handler);
  });

  it('does not leak across event types', () => {
    const addHandler = vi.fn();
    const removeHandler = vi.fn();
    onPaneEvent('onpaneadded', addHandler);
    onPaneEvent('onpaneremoved', removeHandler);

    emitPaneEvent('onpaneadded', samplePane());

    expect(addHandler).toHaveBeenCalledTimes(1);
    expect(removeHandler).not.toHaveBeenCalled();

    offPaneEvent('onpaneadded', addHandler);
    offPaneEvent('onpaneremoved', removeHandler);
  });

  it('unsubscribes correctly', () => {
    const handler = vi.fn();
    onPaneEvent('onpanemaximized', handler);
    offPaneEvent('onpanemaximized', handler);

    emitPaneEvent('onpanemaximized', samplePane());

    expect(handler).not.toHaveBeenCalled();
  });
});
