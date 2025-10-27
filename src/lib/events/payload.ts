import type { PanePayload, PaneState, Position, Size } from './types.js';

/**
 * Build a PanePayload from available inputs.
 * - `sash` refers to an internal data structure representing a leaf pane (best-effort typed as any)
 * - `paneEl` is an optional HTMLElement for DOM-derived size/position
 *
 * This function avoids DOM access unless `paneEl` is provided (SSR-safe by default).
 */
export function buildPanePayload(sash: any, paneEl?: HTMLElement | null): PanePayload {
  const id = pickString(
    sash?.id,
    sash?.pane?.id,
    sash?.store?.id,
    sash?.props?.id
  ) || 'unknown';

  const title = (pickString(
    sash?.title,
    sash?.pane?.title,
    sash?.store?.title,
    sash?.props?.title
  ) ?? null) as string | null;

  const state: PaneState = (pickString(
    sash?.state,
    sash?.pane?.state,
    sash?.store?.state
  ) as PaneState) || 'normal';

  const size: Size = paneEl
    ? fromRectSize(paneEl)
    : (normalizeSize(sash?.size || sash?.store?.size) ?? { width: 0, height: 0 });

  const position: Position = paneEl
    ? fromRectPosition(paneEl)
    : (normalizePosition(sash?.position || sash?.store?.position) ?? { x: 0, y: 0 });

  const groupId =
    pickString(sash?.groupId, sash?.parent?.id, sash?.store?.groupId) ?? null;

  const index = pickNumber(sash?.index, sash?.store?.index) ?? null;

  const config = (sash?.config ?? sash?.store?.config ?? {}) as Record<string, unknown>;
  const dynamic = (sash?.dynamic ?? {}) as Record<string, unknown>;

  return { id, title, size, position, state, groupId, index, config, dynamic };
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === 'string' && v.length) return v;
}
function pickNumber(...vals: unknown[]): number | undefined {
  for (const v of vals) if (typeof v === 'number' && Number.isFinite(v)) return v;
}

function normalizeSize(obj: any): Size | undefined {
  if (!obj) return undefined;
  const w = toInt(obj.width);
  const h = toInt(obj.height);
  if (w >= 0 && h >= 0) return { width: w, height: h };
}

function normalizePosition(obj: any): Position | undefined {
  if (!obj) return undefined;
  const x = toInt(obj.x);
  const y = toInt(obj.y);
  if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
}

function toInt(v: any): number {
  if (typeof v === 'number') return Math.round(v);
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function fromRectSize(el: HTMLElement): Size {
  const r = el.getBoundingClientRect();
  return { width: Math.round(r.width), height: Math.round(r.height) };
}
function fromRectPosition(el: HTMLElement): Position {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top) };
}
