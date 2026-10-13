import { AREA_BY_ID } from './areas';
import { GROUND, buildExterior, restPoint } from './exterior';

describe('exterior', () => {
  const ext = buildExterior();
  const insideOffice = (b: { x: number; y: number; w: number; d: number }) => b.x < 29.7 && b.x + b.w > 0.3 && b.y < 21.7 && b.y + b.d > 0.3;

  it('keeps every outdoor object off the office floor', () => {
    for (const layer of [ext.back, ext.road, ext.far]) {
      for (const o of layer) expect(insideOffice(o.bounds), JSON.stringify(o.bounds)).toBe(false);
    }
  });

  it('keeps tall objects in front of the building clear of the rooms', () => {
    // Near the open sides, anything wide and tall (umbrellas, trees) stands at
    // least 3 units out, so it never covers a room. Slim posts and lamps may be closer.
    const wideAndTall = ext.inner.filter((o) => o.bounds.z + o.bounds.h > 1.2 && o.bounds.w * o.bounds.d > 1.5);
    for (const o of wideAndTall) {
      const cx = o.bounds.x + o.bounds.w / 2;
      const cy = o.bounds.y + o.bounds.d / 2;
      expect(cx >= 33 || cy >= 25, JSON.stringify(o.bounds)).toBe(true);
    }
  });

  it('puts the entrance at the reception, facing the street', () => {
    const [x0, , x1, y1] = AREA_BY_ID.reception.floor;
    const arrive = ext.nearWalkers.find((w) => w.id === 'arrive')!;
    expect(arrive.route.length).toBeGreaterThan(2);
    expect(ext.entrance.split(' ').length).toBe(4);
    expect(x0).toBeLessThan(2.5);
    expect(x1).toBeGreaterThan(2.5);
    expect(y1).toBe(22);
  });

  it('draws walkers at a resting point on their route', () => {
    for (const w of [...ext.nearWalkers, ...ext.farWalkers]) {
      const p = restPoint(w);
      expect(Number.isFinite(p.x) && Number.isFinite(p.y), w.id).toBe(true);
    }
    expect(GROUND).toBeLessThan(0);
  });
});
