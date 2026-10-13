import { depthSort } from './depth-sort';
import { Bounds } from './iso';

const item = (name: string, b: Bounds) => ({ name, bounds: b });

describe('depthSort', () => {
  it('paints far objects before near ones', () => {
    const back = item('back', { x: 0, y: 0, z: 0, w: 2, d: 1, h: 2 });
    const front = item('front', { x: 0, y: 1.5, z: 0, w: 2, d: 1, h: 1 });
    expect(depthSort([front, back]).map((i) => i.name)).toEqual(['back', 'front']);
  });

  it('paints a rug before furniture standing on it', () => {
    const rug = item('rug', { x: 0, y: 0, z: -0.03, w: 6, d: 6, h: 0.03 });
    const chair = item('chair', { x: 2, y: 2, z: 0, w: 1, d: 1, h: 2 });
    expect(depthSort([chair, rug]).map((i) => i.name)).toEqual(['rug', 'chair']);
  });

  it('paints objects resting on a surface after the surface', () => {
    const desk = item('desk', { x: 0, y: 0, z: 0, w: 4, d: 2, h: 1.25 });
    const monitor = item('monitor', { x: 1, y: 0.2, z: 1.25, w: 1.3, d: 0.5, h: 1 });
    expect(depthSort([monitor, desk]).map((i) => i.name)).toEqual(['desk', 'monitor']);
  });
});
