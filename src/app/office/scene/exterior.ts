import { Bounds, Point, SceneObject, Shape, ShapeTree, blob, box, flat, footprint, line, obj, project, wallX, wallY } from '../engine/iso';
import { depthSort } from '../engine/depth-sort';
import { GROUND } from './city-graph';
import { seeded } from './furniture';
import { personShapes } from './people';
import { SEATS, Seat, facingView } from './pedestrians';

/**
 * The city block around the office: streets, sidewalks, a park, the coffee
 * terrace and the people who use them. Same projection, builders and
 * materials as the interior, so inside and outside read as one place.
 *
 * World layout (office floor is x 0–30, y 0–22; +x runs to the lower right,
 * +y to the lower left of the screen):
 *
 *   - entrance plaza and front garden    y 22–26.5
 *   - front sidewalk / road / sidewalk   y 26.5–30 / 30–35 / 35–37.5, then the park
 *   - coffee terrace and side garden     x 30–34.5
 *   - side sidewalk / road / sidewalk    x 34.5–38 / 38–43 / 43–45.5, then more park
 *   - behind the back walls: trees, paths and two neighbouring buildings
 *
 * Everything outside stands on the street level, the bottom of the office plinth.
 */

export { GROUND };
const G = GROUND;
const WORLD = { x0: -30, y0: -30, x1: 70, y1: 50 } as const;

const b = (x: number, y: number, z: number, w: number, d: number, h: number): Bounds => ({ x, y, z, w, d, h });

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

function surface(x0: number, y0: number, x1: number, y1: number, mat: string, z = G): SceneObject {
  return obj(b(x0, y0, z - 0.01, x1 - x0, y1 - y0, 0.01), flat(x0, y0, x1, y1, z, `p m-${mat}`));
}

/** A slightly raised slab (sidewalk, curb, bed edge): its front faces read as a curb. */
function slab(x0: number, y0: number, x1: number, y1: number, h: number, mat: string): SceneObject {
  return obj(b(x0, y0, G, x1 - x0, y1 - y0, h), box(x0, y0, G, x1 - x0, y1 - y0, h, mat));
}

function dashes(axis: 'x' | 'y', at: number, from: number, to: number, skip: [number, number][]): SceneObject[] {
  const out: SceneObject[] = [];
  for (let s = from; s < to; s += 3) {
    if (skip.some(([a, c]) => s + 1.6 > a && s < c)) continue;
    out.push(axis === 'x' ? surface(s, at - 0.06, s + 1.6, at + 0.06, 'road-line', G + 0.004) : surface(at - 0.06, s, at + 0.06, s + 1.6, 'road-line', G + 0.004));
  }
  return out;
}

/** Zebra crossing: bars run in the walking direction, spaced across it. */
function crossing(walk: 'x' | 'y', across0: number, n: number, from: number, to: number): SceneObject[] {
  const out: SceneObject[] = [];
  for (let i = 0; i < n; i++) {
    const a = across0 + i * 0.6;
    out.push(walk === 'y' ? surface(a, from, a + 0.34, to, 'road-line', G + 0.004) : surface(from, a, to, a + 0.34, 'road-line', G + 0.004));
  }
  return out;
}

function groundLayer(): SceneObject[] {
  const { x0, y0, x1, y1 } = WORLD;
  return [
    surface(x0, y0, x1, y1, 'grass'),
    // Paths behind the building and around the neighbours.
    surface(x0, -7.5, 34.5, -5.5, 'path', G + 0.002),
    surface(-7.5, y0, -5.5, 26.5, 'path', G + 0.002),
    surface(-25.5, -5.5, -10.5, 13.5, 'paving', G + 0.002),
    surface(0.5, -25.5, 21.5, -10.5, 'paving', G + 0.002),
    // The block the office stands on, with the entrance plaza and the terrace deck.
    surface(-1.2, -1.2, 34.5, 26.5, 'paving', G + 0.003),
    surface(-0.6, 22, 6.6, 26.5, 'plaza', G + 0.004),
    surface(30.6, 11.6, 34.3, 21.6, 'deck', G + 0.004),
    // Park paths and a pond.
    surface(1.4, 37.5, 4.1, y1, 'path', G + 0.002),
    surface(x0, 47, 34.5, 48.6, 'path', G + 0.002),
    surface(45.5, 13.5, x1, 15.2, 'path', G + 0.002),
    slab(8.6, 39.8, 17.4, 45.4, 0.14, 'stone'),
    surface(9, 40.2, 17, 45, 'water', G + 0.142),
    // Roads.
    surface(38, y0, 43, y1, 'asphalt', G + 0.003),
    surface(x0, 30, x1, 35, 'asphalt', G + 0.0035),
    ...dashes('x', 32.5, x0, x1, [
      [0, 5],
      [33.5, 44.5],
    ]),
    ...dashes('y', 40.5, y0, y1, [[25.5, 38.5]]),
    ...crossing('y', 1.1, 5, 30.3, 34.7),
    ...crossing('y', 34.8, 5, 30.3, 34.7),
    ...crossing('y', 43.3, 4, 30.3, 34.7),
    ...crossing('x', 26.8, 5, 38.3, 42.7),
    ...crossing('x', 35.2, 4, 38.3, 42.7),
    // Sidewalks, raised by a curb.
    slab(x0, 26.5, 38, 30, 0.12, 'sidewalk'),
    slab(43, 26.5, x1, 30, 0.12, 'sidewalk'),
    slab(34.5, y0, 38, 30, 0.12, 'sidewalk'),
    slab(43, y0, 45.5, 30, 0.12, 'sidewalk'),
    slab(x0, 35, 38, 37.5, 0.12, 'sidewalk'),
    slab(43, 35, x1, 37.5, 0.12, 'sidewalk'),
    slab(34.5, 35, 38, y1, 0.12, 'sidewalk'),
    slab(43, 35, 45.5, y1, 0.12, 'sidewalk'),
  ];
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function groundShadow(x: number, y: number, rx: number, ry: number): Shape {
  // Light comes from the upper left: shadows fall toward the lower right.
  return blob(x, y, G + 0.13, rx, ry, 'shadow');
}

export function tree(x: number, y: number, size = 1, kind: 'round' | 'column' = 'round'): SceneObject {
  const r = seeded(Math.round(x * 53 + y * 29));
  const trunkH = (kind === 'round' ? 2.2 : 1.4) * size;
  const [px, py] = project(x + 0.6 * size, y - 0.6 * size, G);
  const shapes: ShapeTree[] = [{ kind: 'ellipse', cx: px + 10 * size, cy: py, rx: 30 * size, ry: 13 * size, cls: 'shadow' }];
  shapes.push(box(x - 0.16, y - 0.16, G, 0.32, 0.32, trunkH, 'trunk'));
  const [cx, cy] = project(x, y, G + trunkH);
  if (kind === 'round') {
    const tones = ['leaf-dark', 'leaf-dark', 'leaf-dark', 'leaf', 'leaf', 'leaf', 'leaf', 'leaf-light', 'leaf-light'];
    shapes.push(blob(x, y, G + trunkH + 1.2 * size, 24 * size, 21 * size, `p m-leaf-dark`));
    tones.forEach((tone, i) => {
      const a = r() * Math.PI * 2;
      const d = (6 + r() * 10) * size;
      const rad = (9 + r() * 7) * size;
      const ex = cx + Math.cos(a) * d * 1.3;
      const ey = cy - 26 * size + Math.sin(a) * d - i * 1.2 * size;
      shapes.push({ kind: 'ellipse', cx: round(ex), cy: round(ey), rx: round(rad + 2), ry: round(rad), cls: `p m-${tone}` });
    });
  } else {
    for (let i = 0; i < 6; i++) {
      const w = (11 - Math.abs(i - 2) * 1.6) * size;
      const tone = i < 2 ? 'conifer-dark' : i < 4 ? 'conifer' : 'conifer-light';
      shapes.push({ kind: 'ellipse', cx: round(cx + (r() - 0.5) * 3), cy: round(cy - 8 * size - i * 9 * size), rx: round(w), ry: round(w * 1.25), cls: `p m-${tone}` });
    }
  }
  return obj(b(x - 0.9 * size, y - 0.9 * size, G, 1.8 * size, 1.8 * size, 6 * size), shapes);
}

function hedge(x0: number, y0: number, x1: number, y1: number, h = 0.7): SceneObject {
  return obj(b(x0, y0, G, x1 - x0, y1 - y0, h), box(x0, y0, G, x1 - x0, y1 - y0, h, 'hedge'));
}

function flowerBed(x0: number, y0: number, x1: number, y1: number): SceneObject {
  const r = seeded(Math.round(x0 * 7 + y0 * 11));
  const shapes: ShapeTree[] = [box(x0, y0, G, x1 - x0, y1 - y0, 0.28, 'bed')];
  const n = Math.round((x1 - x0) * (y1 - y0) * 1.6);
  const top = G + 0.3;
  for (let i = 0; i < n; i++) {
    const fx = x0 + 0.3 + r() * (x1 - x0 - 0.6);
    const fy = y0 + 0.3 + r() * (y1 - y0 - 0.6);
    if (r() < 0.45) shapes.push(blob(fx, fy, top + 0.2, 5 + r() * 3, 4 + r() * 2, r() < 0.5 ? 'p m-leaf' : 'p m-leaf-dark'));
    else shapes.push(blob(fx, fy, top + 0.25, 2.2, 1.8, `p m-flower-${'abcd'[Math.floor(r() * 4)]}`));
  }
  return obj(b(x0, y0, G, x1 - x0, y1 - y0, 0.8), shapes);
}

function planter(x: number, y: number, w = 0.9): SceneObject {
  return obj(b(x, y, G, w, w, 1.6), [
    box(x, y, G, w, w, 0.7, 'planter'),
    blob(x + w / 2, y + w / 2, G + 1.05, 11 * w, 9 * w, 'p m-leaf-dark'),
    blob(x + w / 2 - 0.1, y + w / 2 + 0.1, G + 1.3, 8 * w, 6 * w, 'p m-leaf'),
    blob(x + w / 2 + 0.15, y + w / 2 - 0.1, G + 1.2, 5 * w, 4 * w, 'p m-leaf-light'),
  ]);
}

type Dir = '+x' | '-x' | '+y' | '-y';

function streetLamp(x: number, y: number, dir: Dir): SceneObject {
  const h = 4.4;
  const [dx, dy] = { '+x': [1, 0], '-x': [-1, 0], '+y': [0, 1], '-y': [0, -1] }[dir];
  const hx = x + dx * 0.8;
  const hy = y + dy * 0.8;
  return obj(b(Math.min(x, hx) - 0.3, Math.min(y, hy) - 0.3, G, Math.abs(hx - x) + 0.6, Math.abs(hy - y) + 0.6, h + 0.3), [
    box(x - 0.14, y - 0.14, G, 0.28, 0.28, 0.25, 'lamp'),
    box(x - 0.07, y - 0.07, G, 0.14, 0.14, h, 'lamp'),
    box(Math.min(x, hx) - 0.05, Math.min(y, hy) - 0.05, G + h - 0.1, Math.abs(hx - x) + 0.1, Math.abs(hy - y) + 0.1, 0.1, 'lamp'),
    box(hx - 0.28, hy - 0.2, G + h - 0.28, 0.56, 0.4, 0.2, 'lamp'),
    flat(hx - 0.22, hy - 0.15, hx + 0.22, hy + 0.15, G + h - 0.285, 'p m-lamp-light'),
  ]);
}

/** Bench; `facing` is the direction the sitter looks. */
function bench(x: number, y: number, facing: Dir, len = 2): SceneObject {
  const alongX = facing === '+y' || facing === '-y';
  const [w, d] = alongX ? [len, 0.6] : [0.6, len];
  const shapes: ShapeTree[] = [];
  const legs = alongX
    ? [
        [x + 0.15, y + 0.1],
        [x + len - 0.3, y + 0.1],
      ]
    : [
        [x + 0.1, y + 0.15],
        [x + 0.1, y + len - 0.3],
      ];
  for (const [lx, ly] of legs) shapes.push(box(lx, ly, G, alongX ? 0.15 : 0.4, alongX ? 0.4 : 0.15, 0.5, 'dark'));
  const back = (bx: number, by: number) => box(bx, by, G + 0.5, alongX ? len : 0.1, alongX ? 0.1 : len, 0.55, 'wood');
  if (facing === '+y') shapes.push(back(x, y));
  if (facing === '+x') shapes.push(back(x, y));
  shapes.push(box(x, y, G + 0.45, w, d, 0.1, 'wood'));
  if (facing === '-y') shapes.push(back(x, y + d - 0.1));
  if (facing === '-x') shapes.push(back(x + w - 0.1, y));
  return obj(b(x, y, G, w, d, 1.05), shapes);
}

const CAR_COLOURS = ['car-a', 'car-b', 'car-c', 'car-d', 'car-e'];

function car(x: number, y: number, axis: 'x' | 'y', colour: number): SceneObject {
  const mat = CAR_COLOURS[colour % CAR_COLOURS.length];
  const L = 4.2;
  const W = 1.85;
  const [w, d] = axis === 'x' ? [L, W] : [W, L];
  const zb = G + 0.3;
  const shapes: ShapeTree[] = [flat(x - 0.1, y - 0.1, x + w + 0.35, y + d + 0.35, G + 0.13, 'shadow')];
  shapes.push(box(x, y, zb, w, d, 0.72, mat));
  if (axis === 'x') {
    shapes.push(box(x + 0.95, y + 0.12, zb + 0.72, 2.3, d - 0.24, 0.58, mat));
    shapes.push(wallY(y + d - 0.12 + 0.002, x + 1.05, x + 3.15, zb + 0.78, zb + 1.24, 'p m-car-glass'));
    shapes.push(wallX(x + 3.25 + 0.002, y + 0.22, y + d - 0.22, zb + 0.78, zb + 1.24, 'p m-car-glass'));
    shapes.push(wallX(x + w + 0.002, y + 0.2, y + 0.55, zb + 0.4, zb + 0.6, 'p m-headlight'));
    shapes.push(wallX(x + w + 0.002, y + d - 0.55, y + d - 0.2, zb + 0.4, zb + 0.6, 'p m-headlight'));
    for (const wx of [x + 0.85, x + w - 0.85]) shapes.push(wheel(wx, y + d, zb));
  } else {
    shapes.push(box(x + 0.12, y + 0.95, zb + 0.72, w - 0.24, 2.3, 0.58, mat));
    shapes.push(wallX(x + w - 0.12 + 0.002, y + 1.05, y + 3.15, zb + 0.78, zb + 1.24, 'p m-car-glass'));
    shapes.push(wallY(y + 3.25 + 0.002, x + 0.22, x + w - 0.22, zb + 0.78, zb + 1.24, 'p m-car-glass'));
    shapes.push(wallY(y + d + 0.002, x + 0.2, x + 0.55, zb + 0.4, zb + 0.6, 'p m-headlight'));
    shapes.push(wallY(y + d + 0.002, x + w - 0.55, x + w - 0.2, zb + 0.4, zb + 0.6, 'p m-headlight'));
    for (const wy of [y + 0.85, y + d - 0.85]) shapes.push(wheel(x + w, wy, zb));
  }
  return obj(b(x, y, G, w, d, 1.65), shapes);
}

function wheel(x: number, y: number, z: number): Shape[] {
  return [blob(x, y, z, 5.2, 5.6, 'p m-tyre'), blob(x, y, z, 2.2, 2.4, 'p m-metal')];
}

/** Café table with a striped umbrella. */
function umbrellaTable(x: number, y: number): SceneObject {
  const shapes: ShapeTree[] = [
    box(x - 0.35, y - 0.35, G, 0.7, 0.7, 0.05, 'dark'),
    box(x - 0.05, y - 0.05, G, 0.1, 0.1, 1.1, 'dark'),
    box(x - 0.55, y - 0.55, G + 1.1, 1.1, 1.1, 0.06, 'white'),
    box(x - 0.04, y - 0.04, G + 1.16, 0.08, 0.08, 1.6, 'metal'),
  ];
  const ring: Point[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ring.push(project(x + Math.cos(a) * 1.25, y + Math.sin(a) * 1.25, G + 2.6));
  }
  const apex = project(x, y, G + 3.05);
  // Back panels first, then the front ones, alternating colours.
  const order = [5, 6, 4, 7, 3, 0, 2, 1];
  for (const i of order) {
    const p = ring[i];
    const q = ring[(i + 1) % 8];
    shapes.push({ kind: 'poly', points: pts([apex, p, q]), cls: `p m-${i % 2 ? 'umbrella' : 'umbrella-alt'}` });
  }
  return obj(b(x - 1.25, y - 1.25, G, 2.5, 2.5, 3.05), shapes);
}

function cafeChair(x: number, y: number, back: Dir): SceneObject {
  const s = 0.55;
  const shapes: ShapeTree[] = [box(x + 0.22, y + 0.22, G, 0.1, 0.1, 0.65, 'dark')];
  const backBox = () => {
    if (back === '-y') return box(x, y, G + 0.65, s, 0.06, 0.6, 'chair');
    if (back === '-x') return box(x, y, G + 0.65, 0.06, s, 0.6, 'chair');
    if (back === '+y') return box(x, y + s - 0.06, G + 0.65, s, 0.06, 0.6, 'chair');
    return box(x + s - 0.06, y, G + 0.65, 0.06, s, 0.6, 'chair');
  };
  if (back === '-y' || back === '-x') shapes.push(backBox());
  shapes.push(box(x, y, G + 0.65, s, s, 0.06, 'chair'));
  if (back === '+y' || back === '+x') shapes.push(backBox());
  return obj(b(x, y, G, s, s, 1.3), shapes);
}

function bikeRack(x: number, y: number, n: number): SceneObject {
  const shapes: ShapeTree[] = [box(x, y + 0.5, G, 0.12, 0.12 + (n - 1) * 0.9, 0.5, 'metal')];
  for (let i = 0; i < n; i++) {
    const by = y + 0.55 + i * 0.9;
    const rear = project(x - 0.9, by, G + 0.4);
    const front = project(x + 0.6, by, G + 0.4);
    const seat = project(x - 0.45, by, G + 1.15);
    const bar = project(x + 0.45, by, G + 1.25);
    const crank = project(x - 0.15, by, G + 0.4);
    shapes.push({ kind: 'ellipse', cx: round(rear[0]), cy: round(rear[1]), rx: 6, ry: 6.5, cls: 'wheel' });
    shapes.push({ kind: 'ellipse', cx: round(front[0]), cy: round(front[1]), rx: 6, ry: 6.5, cls: 'wheel' });
    shapes.push(line(rear, seat, `bike-frame bike-${i % 2 ? 'a' : 'b'}`));
    shapes.push(line(seat, crank, `bike-frame bike-${i % 2 ? 'a' : 'b'}`));
    shapes.push(line(crank, front, `bike-frame bike-${i % 2 ? 'a' : 'b'}`));
    shapes.push(line(seat, bar, `bike-frame bike-${i % 2 ? 'a' : 'b'}`));
    shapes.push(line(bar, front, `bike-frame bike-${i % 2 ? 'a' : 'b'}`));
  }
  return obj(b(x - 1.2, y, G, 2.1, n * 0.9 + 0.6, 1.3), shapes);
}

/** Monument sign by the entrance: the company mark, no text. */
function sign(x: number, y: number): SceneObject {
  const w = 1.5;
  return obj(b(x, y, G, w, 0.35, 1.3), [
    box(x, y, G, w, 0.35, 1.3, 'sign'),
    wallY(y + 0.352, x + 0.2, x + 0.62, G + 0.45, G + 1.0, 'p m-accent'),
    wallY(y + 0.352, x + 0.78, x + 1.3, G + 0.8, G + 0.9, 'p m-sign-text'),
    wallY(y + 0.352, x + 0.78, x + 1.15, G + 0.6, G + 0.68, 'p m-sign-text'),
  ]);
}

/** Neighbouring building: plain façade with a regular window grid. */
function neighbour(x0: number, y0: number, x1: number, y1: number, h: number, mat: string): SceneObject {
  const shapes: ShapeTree[] = [box(x0, y0, G, x1 - x0, y1 - y0, h, mat)];
  const floors = Math.floor((h - 1) / 2);
  // Ground floor: a glazed band. Upper floors: windows.
  shapes.push(wallX(x1 + 0.002, y0 + 0.6, y1 - 0.6, G + 0.3, G + 1.7, 'p m-facade-glass'));
  shapes.push(wallY(y1 + 0.002, x0 + 0.6, x1 - 0.6, G + 0.3, G + 1.7, 'p m-facade-glass'));
  for (let f = 1; f <= floors; f++) {
    const z = G + 0.6 + f * 2;
    for (let yy = y0 + 0.8; yy + 1.2 < y1 - 0.4; yy += 2) shapes.push(wallX(x1 + 0.002, yy, yy + 1.2, z, z + 1.2, 'p m-facade-glass'));
    for (let xx = x0 + 0.8; xx + 1.2 < x1 - 0.4; xx += 2) shapes.push(wallY(y1 + 0.002, xx, xx + 1.2, z, z + 1.2, 'p m-facade-glass'));
  }
  // Roof edge and a plant room.
  shapes.push(box(x0 + 2, y0 + 2, G + h, 3, 2.4, 0.9, 'facade-b'));
  return obj(b(x0, y0, G, x1 - x0, y1 - y0, h + 1), shapes);
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

type Facing = '+x' | '-x' | '+y' | '-y';

/** Someone standing still, facing a direction. */
function person(x: number, y: number, look: number, facing: Facing): SceneObject {
  const [px, py] = project(x, y, G);
  const { view, flip } = facingView(facing);
  return obj(b(x - 0.3, y - 0.3, G, 0.6, 0.6, 2.7), personShapes(look, view, 'stand', px, py, flip));
}

function sitter(x: number, y: number, seatZ: number, look: number, facing: Facing, cls = ''): SceneObject {
  const [px, py] = project(x, y, G + seatZ);
  const { view, flip } = facingView(facing);
  const shapes = personShapes(look, view, 'sit', px, py, flip).map((sh) => (cls ? { ...sh, cls: `${sh.cls} ${cls}` } : sh));
  return obj(b(x - 0.25, y - 0.25, G, 0.5, 0.5, seatZ + 2), shapes);
}

/**
 * A seat pedestrians can take: drawn with a sitter (depth-sorted with the
 * furniture) that the scene shows only while someone sits there.
 */
function seat(s: Seat, look: number): SceneObject {
  return sitter(s.x, s.y, s.z, look, s.facing, `seat seat-${s.id} seat-free`);
}

const seatById = (id: string) => SEATS.find((s) => s.id === id)!;

// ---------------------------------------------------------------------------
// The block
// ---------------------------------------------------------------------------

export interface Exterior {
  /** Flat ground: grass, paving, roads, sidewalks. */
  ground: SceneObject[];
  /** Behind the back walls (drawn before the building). */
  back: SceneObject[];
  /** Around the building, up to the near sidewalks: the cut walls, entrance, garden, terrace. */
  inner: SceneObject[];
  /** On and beyond the roads: cars, the far sidewalks and the park. */
  outer: SceneObject[];
  /** The entrance plaza: selecting it enters the office at the reception. */
  entrance: string;
}

/** Low cut-away walls on the open sides, and the entrance door frame. */
function frontage(): SceneObject[] {
  const h = 0.6;
  const t = 0.25;
  const doorX0 = 0.9;
  const doorX1 = 4.1;
  return [
    obj(b(0, 22 - t, 0, doorX0, t, h), box(0, 22 - t, 0, doorX0, t, h, 'wall')),
    obj(b(doorX1, 22 - t, 0, 30 - doorX1, t, h), box(doorX1, 22 - t, 0, 30 - doorX1, t, h, 'wall')),
    obj(b(30 - t, 0, 0, t, 22 - t, h), box(30 - t, 0, 0, t, 22 - t, h, 'wall')),
    obj(b(doorX0 - 0.1, 22 - t, 0, 0.1, t, 2.8), box(doorX0 - 0.1, 22 - t, 0, 0.1, t, 2.8, 'frame')),
    obj(b(doorX1, 22 - t, 0, 0.1, t, 2.8), box(doorX1, 22 - t, 0, 0.1, t, 2.8, 'frame')),
    obj(b(doorX0 - 0.1, 22 - t, 2.7, doorX1 - doorX0 + 0.2, t, 0.12), box(doorX0 - 0.1, 22 - t, 2.7, doorX1 - doorX0 + 0.2, t, 0.12, 'frame')),
    // Steps down from the floor to the plaza.
    obj(b(1.1, 22, G, 2.8, 0.45, 0.7), box(1.1, 22, G, 2.8, 0.45, 0.7, 'stone')),
    obj(b(1.1, 22.45, G, 2.8, 0.45, 0.47), box(1.1, 22.45, G, 2.8, 0.45, 0.47, 'stone')),
    obj(b(1.1, 22.9, G, 2.8, 0.45, 0.23), box(1.1, 22.9, G, 2.8, 0.45, 0.23, 'stone')),
  ];
}

export function buildExterior(): Exterior {
  const back: SceneObject[] = [
    neighbour(-24, -3, -12, 12, 9, 'facade'),
    neighbour(3, -24, 21, -12, 9, 'facade-b'),
    tree(-3.6, 2.5, 1.05),
    tree(-4.2, 9.5, 0.95),
    tree(-3.4, 16, 1.1),
    tree(-9.5, 19, 0.9, 'column'),
    tree(-3.3, 21.2, 0.9),
    tree(4.5, -3.4, 1),
    tree(11.5, -3.8, 1.1),
    tree(18.5, -3.4, 0.95),
    tree(25.5, -3.6, 1.05),
    tree(31.6, -3, 1),
    tree(-9, -9, 1.1),
    tree(24.5, -9.5, 0.9, 'column'),
    tree(-12, 15.5, 0.85, 'column'),
  ];

  const inner: SceneObject[] = [
    ...frontage(),
    // Entrance plaza.
    planter(-0.3, 23.4),
    planter(4.5, 23.4),
    sign(4.4, 25.4),
    streetLamp(-0.4, 26.1, '+y'),
    bikeRack(7.4, 23.6, 3),
    // Front garden: low planting only, so it never hides the rooms.
    flowerBed(10, 22.7, 20.3, 25.2),
    flowerBed(21.8, 22.7, 29.6, 25.2),
    hedge(10, 25.5, 20.3, 26.1),
    hedge(21.8, 25.5, 29.6, 26.1),
    streetLamp(21, 26.2, '+y'),
    // Side garden and coffee terrace by the lounge.
    flowerBed(30.8, 0.6, 33.8, 4.2),
    bench(31.1, 6.2, '+x', 2.4),
    seat(seatById('garden'), 6),
    streetLamp(34.1, 10.6, '+x'),
    umbrellaTable(33.3, 14),
    cafeChair(32.0, 13.7, '-x'),
    sitter(32.3, 14, 0.71, 2, '+x'),
    cafeChair(33.95, 13.72, '+x'),
    seat(seatById('cafe-1'), 7),
    umbrellaTable(33.3, 18.6),
    cafeChair(32.0, 18.3, '-x'),
    cafeChair(33.0, 19.75, '+y'),
    sitter(32.3, 18.6, 0.71, 4, '+x'),
    sitter(33.3, 20.05, 0.71, 5, '-y'),
    cafeChair(33.95, 18.32, '+x'),
    seat(seatById('cafe-2'), 0),
    planter(33.5, 21.9, 0.8),
    // Two colleagues talking at the corner.
    person(31.4, 24.1, 1, '+x'),
    person(32.3, 24.7, 3, '-x'),
    streetLamp(34.1, 25.9, '+x'),
  ];

  const road: SceneObject[] = [
    car(8.2, 30.25, 'x', 0),
    car(14.6, 30.25, 'x', 2),
    car(24.8, 30.25, 'x', 4),
    car(-12, 30.25, 'x', 1),
    car(20, 32.9, 'x', 3),
    car(38.25, 3, 'y', 1),
    car(38.25, 9.4, 'y', 3),
    car(38.25, 19.5, 'y', 0),
    car(40.9, -8, 'y', 2),
    car(40.9, 42, 'y', 4),
  ];

  const far: SceneObject[] = [
    streetLamp(9.5, 37.1, '-y'),
    streetLamp(26, 37.1, '-y'),
    streetLamp(-8, 37.1, '-y'),
    streetLamp(45.1, 8, '-x'),
    streetLamp(45.1, 22, '-x'),
    streetLamp(45.1, -6, '-x'),
    // Park beyond the front road.
    tree(9.5, 39.8, 1.1),
    tree(21, 40.3, 1.2),
    tree(29.5, 39.7, 1),
    tree(-4, 39.6, 1.05),
    tree(-12, 41, 1.1),
    tree(7, 49, 1),
    tree(26, 45.5, 1.1, 'column'),
    tree(-6.5, 46, 0.9, 'column'),
    bench(13.2, 38.2, '-y', 2.2),
    bench(23.6, 38.2, '-y', 2.2),
    seat(seatById('park-a'), 4),
    seat(seatById('park-b'), 2),
    sitter(24.3, 38.5, 0.55, 3, '-y'),
    sitter(25.1, 38.5, 0.55, 5, '-y'),
    flowerBed(5.2, 38.4, 7.6, 41.2),
    // Park beyond the side road.
    tree(48, 3.5, 1.1),
    tree(49.5, 11, 1),
    tree(47.6, 19, 1.15),
    tree(50.5, 26, 1),
    tree(48.5, -6, 1.05, 'column'),
    tree(55, 8, 1.1),
    tree(54, 20.5, 0.95, 'column'),
    bench(46.1, 15.6, '-x', 2.2),
    seat(seatById('side-a'), 1),
    seat(seatById('side-b'), 3),
  ];


  return {
    ground: groundLayer(),
    back: depthSort(back),
    inner: depthSort(inner),
    outer: depthSort([...road, ...far]),
    entrance: footprint(-0.6, 22, 6.6, 26.5, G + 0.01),
  };
}

function pts(points: Point[]): string {
  return points.map(([a, c]) => `${round(a)},${round(c)}`).join(' ');
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
