import { AREAS, AREA_IDS } from './areas';
import { OFFICE_MODEL } from './office-layout';

describe('office layout', () => {
  it('defines geometry for every interactive area', () => {
    for (const id of AREA_IDS) {
      const g = OFFICE_MODEL.areas[id];
      expect(g, id).toBeDefined();
      expect(g.frame.w).toBeGreaterThan(0);
      expect(g.frame.h).toBeGreaterThan(0);
    }
  });

  it('has non-overlapping area floors', () => {
    for (const a of AREAS) {
      for (const b of AREAS) {
        if (a === b) continue;
        const [ax0, ay0, ax1, ay1] = a.floor;
        const [bx0, by0, bx1, by1] = b.floor;
        const overlap = ax0 < bx1 && bx0 < ax1 && ay0 < by1 && by0 < ay1;
        expect(overlap, `${a.id} / ${b.id}`).toBe(false);
      }
    }
  });

  it('renders each area exactly once', () => {
    const keys = OFFICE_MODEL.groups.filter((g) => g.area).map((g) => g.key);
    expect(keys.sort()).toEqual([...AREA_IDS].sort());
  });
});
