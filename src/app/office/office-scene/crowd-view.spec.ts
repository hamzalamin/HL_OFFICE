import { screenRect } from '../engine/iso';
import { GROUND } from '../scene/city-graph';
import { OFFICE_MODEL } from '../scene/office-layout';
import { slotAmong } from './crowd-view';

describe('people among the scenery', () => {
  const withRects = (objects: typeof OFFICE_MODEL.exterior.back) => objects.map((o) => ({ bounds: o.bounds, rect: screenRect(o.bounds) }));
  const treeAt = (objects: typeof OFFICE_MODEL.exterior.back, x: number, y: number) =>
    objects.findIndex((o) => Math.abs(o.bounds.x + o.bounds.w / 2 - x) < 0.01 && Math.abs(o.bounds.y + o.bounds.d / 2 - y) < 0.01);

  it('hides someone walking behind a tree, behind that tree', () => {
    const back = OFFICE_MODEL.exterior.back;
    const tree = treeAt(back, 11.5, -3.8); // between the back path and the building
    expect(tree).toBeGreaterThanOrEqual(0);
    const walker = { x: 11.5, y: -6.5, z: GROUND };
    expect(slotAmong(walker, withRects(back))).toBeLessThanOrEqual(tree);
  });

  it('draws someone in front of a tree over it', () => {
    const outer = OFFICE_MODEL.exterior.outer;
    const tree = treeAt(outer, 26, 45.5); // park tree beside the park path
    expect(tree).toBeGreaterThanOrEqual(0);
    const walker = { x: 26, y: 47.8, z: GROUND };
    expect(slotAmong(walker, withRects(outer))).toBeGreaterThan(tree);
  });
});
