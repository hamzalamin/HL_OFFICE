import { VIEWBOX } from '../scene/areas';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CameraTransform {
  x: number;
  y: number;
  k: number;
}

export const IDENTITY: CameraTransform = { x: 0, y: 0, k: 1 };
export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Computes the CSS transform (translate + scale, origin top-left) that frames
 * `target` (in viewBox units) inside the part of the viewport not covered by
 * panels. The scene itself is letterboxed into the viewport at base scale.
 */
export function frameTarget(
  viewport: { w: number; h: number },
  target: Rect,
  insets: Insets = NO_INSETS,
  limits: { min: number; max: number } = { min: 0.5, max: 2.6 },
  padding = 16,
): CameraTransform {
  if (viewport.w <= 0 || viewport.h <= 0) return IDENTITY;
  const s0 = Math.min(viewport.w / VIEWBOX.w, viewport.h / VIEWBOX.h);
  const ox = (viewport.w - VIEWBOX.w * s0) / 2;
  const oy = (viewport.h - VIEWBOX.h * s0) / 2;

  const safe = {
    x: insets.left + padding,
    y: insets.top + padding,
    w: Math.max(80, viewport.w - insets.left - insets.right - 2 * padding),
    h: Math.max(80, viewport.h - insets.top - insets.bottom - 2 * padding),
  };

  const k = clamp(Math.min(safe.w / (target.w * s0), safe.h / (target.h * s0)), limits.min, limits.max);
  const px = ox + (target.x + target.w / 2) * s0;
  const py = oy + (target.y + target.h / 2) * s0;
  return {
    x: round(safe.x + safe.w / 2 - k * px),
    y: round(safe.y + safe.h / 2 - k * py),
    k: Math.round(k * 1000) / 1000,
  };
}

export function grow(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, w: r.w + 2 * by, h: r.h + 2 * by };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
