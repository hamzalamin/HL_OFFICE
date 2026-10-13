import { isWalkable, route } from './city-graph';
import { Crowd, SEATS, offsetPath } from './pedestrians';

describe('pedestrians', () => {
  it('finds routes along the walking graph', () => {
    expect(route('fW', 'door')).toEqual(['fW', 'fBack', 'fEnt', 'door']);
    expect(route('sN', 'ffCor')).toEqual(['sN', 'sBack', 'sBench', 'sCafe1', 'sCafe2', 'fCor', 'ffCor']);
  });

  it('keeps to the right of a path, with exact doors and seats', () => {
    const p = offsetPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      0.5,
      true,
      true,
    );
    expect(p[0]).toEqual({ x: 0, y: 0 });
    expect(p[2]).toEqual({ x: 10, y: 10 });
    expect(Math.hypot(p[1].x - 10, p[1].y)).toBeGreaterThan(0.5);
  });

  describe('ten minutes of street life', () => {
    const crowd = new Crowd();
    const views = new Set<string>();
    const paces = new Set<number>();
    const seatsUsed = new Set<string>();
    let offPath = '';
    let overlap = '';
    let entered = false;
    let left = false;
    const insideBefore = new Map<string, boolean>();

    for (let t = 0; t < 600; t += 0.1) {
      crowd.step(0.1);
      const shown = crowd.bodies.filter((b) => b.alpha > 0.6);
      for (const b of shown) {
        views.add(`${b.view}${b.flip ? '-left' : '-right'}`);
        if (b.swing > 0.3) paces.add(Math.round(b.swing * 10));
        if (!isWalkable(b.x, b.y, 0.6) && !offPath) offPath = `${b.id} at ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
        const inside = b.y < 22 && b.x > 0 && b.x < 30;
        if (inside && !insideBefore.get(b.id)) entered = true;
        insideBefore.set(b.id, inside);
      }
      for (const b of crowd.bodies) if (b.alpha > 0 && b.alpha < 0.5 && b.y > 21.5 && b.y < 23 && Math.abs(b.x - 2.5) < 1.5) left = true;
      for (const [id, taken] of crowd.seats) if (taken) seatsUsed.add(id);
      for (let i = 0; i < shown.length && !overlap; i++) {
        for (let j = i + 1; j < shown.length; j++) {
          const a = shown[i];
          const c = shown[j];
          if (a.id.split('-').slice(0, -1).join('-') === c.id.split('-').slice(0, -1).join('-')) continue; // same group
          if (Math.hypot(a.x - c.x, a.y - c.y) < 0.35) overlap = `${a.id} / ${c.id} at ${a.x.toFixed(1)},${a.y.toFixed(1)}`;
        }
      }
    }

    it('stays on sidewalks, crossings and paths', () => expect(offPath).toBe(''));
    it('never walks through other people', () => expect(overlap).toBe(''));
    it('walks in all four isometric directions', () => expect(views.size).toBe(4));
    it('goes in and out of the office', () => {
      expect(entered).toBe(true);
      expect(left).toBe(true);
    });
    it('sits down on benches and at the café', () => expect(seatsUsed.size).toBeGreaterThanOrEqual(Math.ceil(SEATS.length / 2)));
    it('does not move in lockstep', () => expect(paces.size).toBeGreaterThan(3));
  });
});
