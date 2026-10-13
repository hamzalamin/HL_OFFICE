import { frameTarget } from './camera';

describe('frameTarget', () => {
  const viewport = { w: 1200, h: 900 }; // same 4:3 ratio as the scene: base scale 1.25

  it('centres a target inside the uncovered part of the viewport', () => {
    const t = frameTarget(viewport, { x: 380, y: 260, w: 200, h: 200 }, { top: 0, right: 400, bottom: 0, left: 0 });
    // Target centre (480, 360) in scene units → (600, 450) px at base scale.
    const cx = t.x + t.k * 600;
    const cy = t.y + t.k * 450;
    expect(cx).toBeCloseTo((1200 - 400) / 2, 0);
    expect(cy).toBeCloseTo(450, 0);
  });

  it('respects zoom limits', () => {
    const tiny = frameTarget(viewport, { x: 0, y: 0, w: 1, h: 1 }, undefined, { min: 0.5, max: 2 });
    expect(tiny.k).toBe(2);
  });

  it('returns identity before the viewport is measured', () => {
    expect(frameTarget({ w: 0, h: 0 }, { x: 0, y: 0, w: 10, h: 10 })).toEqual({ x: 0, y: 0, k: 1 });
  });
});
