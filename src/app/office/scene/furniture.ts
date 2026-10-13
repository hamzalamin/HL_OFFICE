import { Bounds, Material, SceneObject, Shape, ShapeTree, blob, box, flat, obj, project, wallX, wallY } from '../engine/iso';

/**
 * Furniture builders. Every function returns one or more SceneObjects whose
 * bounds are used for depth sorting. Shapes inside an object are already in
 * back-to-front order. Dimensions are in world units (1 unit ≈ 60 cm).
 */

type Facing = 'n' | 's' | 'e' | 'w'; // n = toward -y, s = toward +y, e = toward +x, w = toward -x

/** Deterministic pseudo-random generator so server and browser render identical markup. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const b = (x: number, y: number, z: number, w: number, d: number, h: number): Bounds => ({ x, y, z, w, d, h });

// ---------------------------------------------------------------------------
// Surfaces on vertical planes
// ---------------------------------------------------------------------------

/** Maps fractional (u: left→right, v: top→bottom) coordinates onto a vertical rectangle. */
type Facet = (u0: number, u1: number, v0: number, v1: number, cls: string) => Shape;

function facetY(y: number, x0: number, x1: number, z0: number, z1: number): Facet {
  return (u0, u1, v0, v1, cls) =>
    wallY(y, x0 + (x1 - x0) * u0, x0 + (x1 - x0) * u1, z1 - (z1 - z0) * v1, z1 - (z1 - z0) * v0, cls);
}

function facetX(x: number, y0: number, y1: number, z0: number, z1: number): Facet {
  // On an x-plane, screen-left is the high-y end.
  return (u0, u1, v0, v1, cls) =>
    wallX(x, y1 - (y1 - y0) * u1, y1 - (y1 - y0) * u0, z1 - (z1 - z0) * v1, z1 - (z1 - z0) * v0, cls);
}

export type ScreenContent = 'app' | 'board' | 'slides' | 'standby' | 'docs';

/** Calm, abstract screen layouts. No fake code or numbers: just interface structure. */
function screenContent(f: Facet, kind: ScreenContent): Shape[] {
  const s: Shape[] = [f(0, 1, 0, 1, 'p m-screen')];
  switch (kind) {
    case 'app':
      s.push(f(0, 1, 0, 0.12, 'p m-screen-bar'));
      s.push(f(0.05, 0.28, 0.2, 0.92, 'p m-screen-soft'));
      s.push(f(0.34, 0.95, 0.2, 0.52, 'p m-screen-hi'));
      s.push(f(0.34, 0.62, 0.6, 0.92, 'p m-screen-soft'));
      s.push(f(0.67, 0.95, 0.6, 0.92, 'p m-screen-soft'));
      break;
    case 'docs':
      s.push(f(0, 1, 0, 0.12, 'p m-screen-bar'));
      s.push(f(0.18, 0.82, 0.22, 0.3, 'p m-screen-hi'));
      for (let i = 0; i < 4; i++) s.push(f(0.18, i % 2 ? 0.66 : 0.82, 0.4 + i * 0.13, 0.46 + i * 0.13, 'p m-screen-soft'));
      break;
    case 'board':
      for (let c = 0; c < 3; c++) {
        const u0 = 0.05 + c * 0.315;
        s.push(f(u0, u0 + 0.28, 0.08, 0.92, 'p m-screen-soft'));
        const cards = 3 - (c % 2);
        for (let k = 0; k < cards; k++) {
          s.push(f(u0 + 0.03, u0 + 0.25, 0.16 + k * 0.22, 0.32 + k * 0.22, c === 1 && k === 0 ? 'p m-screen-hi' : 'p m-screen-card'));
        }
      }
      break;
    case 'slides':
      s.push(f(0.08, 0.5, 0.14, 0.24, 'p m-screen-hi'));
      s.push(f(0.08, 0.44, 0.34, 0.4, 'p m-screen-soft'));
      s.push(f(0.08, 0.38, 0.48, 0.54, 'p m-screen-soft'));
      s.push(f(0.56, 0.92, 0.14, 0.86, 'p m-screen-card'));
      break;
    case 'standby':
      s.push(f(0.42, 0.58, 0.4, 0.6, 'p m-screen-soft'));
      break;
  }
  return s;
}

// ---------------------------------------------------------------------------
// Building shell
// ---------------------------------------------------------------------------

export function floorSlab(w: number, d: number): SceneObject {
  const shapes: ShapeTree[] = [...box(0, 0, -0.7, w, d, 0.7, 'slab', { noTop: true }), flat(0, 0, w, d, 0, 'p m-floor')];
  // Subtle large-format tile seams.
  for (let x = 3; x < w; x += 3) shapes.push(lineOnFloor(x, 0, x, d));
  for (let y = 3; y < d; y += 3) shapes.push(lineOnFloor(0, y, w, y));
  return obj(b(0, 0, -0.7, w, d, 0.7), shapes);
}

function lineOnFloor(x0: number, y0: number, x1: number, y1: number): Shape {
  const a = project(x0, y0, 0);
  const c = project(x1, y1, 0);
  return { kind: 'line', x1: a[0], y1: a[1], x2: c[0], y2: c[1], cls: 'seam' };
}

/** The two back walls: along the x axis at y=0, and along the y axis at x=0. */
export function backWalls(w: number, d: number, h: number): SceneObject[] {
  const t = 0.45;
  return [
    obj(b(-t, -t, 0, t, d + t, h), box(-t, -t, 0, t, d + t, h, 'wall', { noRight: true }), wallX(0, 0, d, 0, h, 'p m-wall-in-x'), skirtingX(d)),
    obj(b(0, -t, 0, w, t, h), box(0, -t, 0, w, t, h, 'wall', { noLeft: true }), wallY(0, 0, w, 0, h, 'p m-wall-in-y'), skirtingY(w)),
  ];
}

function skirtingX(d: number): Shape {
  return wallX(0.001, 0, d, 0, 0.22, 'p m-skirting-x');
}
function skirtingY(w: number): Shape {
  return wallY(0.001, 0, w, 0, 0.22, 'p m-skirting-y');
}

export function windowOnX(y0: number, y1: number, z0: number, z1: number, panes = 2): SceneObject {
  const f = facetX(0.01, y0, y1, z0, z1);
  const shapes: ShapeTree[] = [f(0, 1, 0, 1, 'p m-window-frame'), f(0.04, 0.96, 0.05, 0.95, 'p m-sky')];
  shapes.push(f(0.04, 0.96, 0.62, 0.95, 'p m-sky-low'));
  for (let i = 1; i < panes; i++) shapes.push(f(i / panes - 0.012, i / panes + 0.012, 0.05, 0.95, 'p m-window-frame'));
  shapes.push(f(0.04, 0.96, 0.6, 0.63, 'p m-window-frame'));
  return obj(b(0, y0, z0, 0.02, y1 - y0, z1 - z0), shapes);
}

export function windowOnY(x0: number, x1: number, z0: number, z1: number, panes = 2): SceneObject {
  const f = facetY(0.01, x0, x1, z0, z1);
  const shapes: ShapeTree[] = [f(0, 1, 0, 1, 'p m-window-frame'), f(0.04, 0.96, 0.05, 0.95, 'p m-sky')];
  shapes.push(f(0.04, 0.96, 0.62, 0.95, 'p m-sky-low'));
  for (let i = 1; i < panes; i++) shapes.push(f(i / panes - 0.012, i / panes + 0.012, 0.05, 0.95, 'p m-window-frame'));
  shapes.push(f(0.04, 0.96, 0.6, 0.63, 'p m-window-frame'));
  return obj(b(x0, 0, z0, x1 - x0, 0.02, z1 - z0), shapes);
}

/** Glazed entrance door in the left wall. */
export function doorOnX(y0: number, y1: number, h: number): SceneObject {
  const f = facetX(0.01, y0, y1, 0, h);
  return obj(b(0, y0, 0, 0.05, y1 - y0, h), [
    f(0, 1, 0, 1, 'p m-door-frame'),
    f(0.06, 0.48, 0.05, 1, 'p m-door-glass'),
    f(0.52, 0.94, 0.05, 1, 'p m-door-glass'),
    f(0.4, 0.44, 0.45, 0.62, 'p m-metal'),
    f(0.56, 0.6, 0.45, 0.62, 'p m-metal'),
  ]);
}

export function rug(x0: number, y0: number, x1: number, y1: number, mat: Material, border = true): SceneObject {
  const shapes: ShapeTree[] = [flat(x0, y0, x1, y1, 0.01, `p m-${mat}`)];
  if (border) shapes.push(flat(x0 + 0.25, y0 + 0.25, x1 - 0.25, y1 - 0.25, 0.015, `p m-${mat}-inner`));
  return obj(b(x0, y0, -0.03, x1 - x0, y1 - y0, 0.03), shapes);
}

/** A glass partition running along x (plane y = const) or along y (plane x = const). */
export function glassWall(axis: 'x' | 'y', at: number, from: number, to: number, h: number): SceneObject {
  const t = 0.08;
  const shapes: ShapeTree[] = [];
  if (axis === 'x') {
    shapes.push(...box(from, at, 0, to - from, t, h, 'glass', { extra: 'glass' }));
    shapes.push(...box(from, at, 0, to - from, t, 0.18, 'frame'));
    shapes.push(...box(from, at, h - 0.12, to - from, t, 0.12, 'frame'));
    for (let x = from; x <= to + 1e-6; x += (to - from) / Math.max(1, Math.round((to - from) / 2.4))) {
      shapes.push(...box(Math.min(x, to - 0.08), at, 0, 0.08, t, h, 'frame'));
    }
    return obj(b(from, at, 0, to - from, t, h), shapes);
  }
  shapes.push(...box(at, from, 0, t, to - from, h, 'glass', { extra: 'glass' }));
  shapes.push(...box(at, from, 0, t, to - from, 0.18, 'frame'));
  shapes.push(...box(at, from, h - 0.12, t, to - from, 0.12, 'frame'));
  for (let y = from; y <= to + 1e-6; y += (to - from) / Math.max(1, Math.round((to - from) / 2.4))) {
    shapes.push(...box(at, Math.min(y, to - 0.08), 0, t, 0.08, h, 'frame'));
  }
  return obj(b(at, from, 0, t, to - from, h), shapes);
}

/** Low acoustic partition, fabric covered. */
export function partition(axis: 'x' | 'y', at: number, from: number, to: number, h: number, mat: Material): SceneObject {
  const t = 0.18;
  if (axis === 'x') {
    return obj(b(from, at, 0, to - from, t, h), box(from, at, 0, to - from, t, h, mat), box(from, at, h, to - from, t, 0.05, 'frame'));
  }
  return obj(b(at, from, 0, t, to - from, h), box(at, from, 0, t, to - from, h, mat), box(at, from, h, t, to - from, 0.05, 'frame'));
}

// ---------------------------------------------------------------------------
// Furniture
// ---------------------------------------------------------------------------

export function desk(
  x: number,
  y: number,
  w: number,
  d: number,
  o: { h?: number; top?: Material; legs?: Material; modesty?: boolean } = {},
): SceneObject {
  const h = o.h ?? 1.25;
  const legs = o.legs ?? 'metal';
  const shapes: ShapeTree[] = [];
  if (o.modesty) shapes.push(...box(x + 0.2, y + 0.15, 0.35, w - 0.4, 0.06, h - 0.45, legs));
  shapes.push(...box(x + 0.12, y + 0.12, 0, 0.12, d - 0.24, h - 0.08, legs));
  shapes.push(...box(x + w - 0.24, y + 0.12, 0, 0.12, d - 0.24, h - 0.08, legs));
  shapes.push(...box(x, y, h - 0.08, w, d, 0.08, o.top ?? 'desk'));
  return obj(b(x, y, 0, w, d, h), shapes);
}

/** Monitor on a stand. `dir` is the direction the screen faces. */
export function monitor(x: number, y: number, z: number, dir: 's' | 'e' | 'n', content: ScreenContent, size = 1.3): SceneObject {
  const sh = size * 0.6;
  if (dir === 's') {
    const f = facetY(y + 0.281, x + 0.05, x + size - 0.05, z + 0.36, z + 0.3 + sh - 0.04);
    return obj(b(x, y, z, size, 0.5, 0.3 + sh), [
      box(x + size / 2 - 0.25, y + 0.05, z, 0.5, 0.36, 0.04, 'dark'),
      box(x + size / 2 - 0.05, y + 0.12, z + 0.04, 0.1, 0.08, 0.4, 'dark'),
      box(x, y + 0.2, z + 0.3, size, 0.08, sh, 'dark'),
      screenContent(f, content),
    ]);
  }
  if (dir === 'n') {
    // Seen from behind: just the housing.
    return obj(b(x, y, z, size, 0.5, 0.3 + sh), [
      box(x + size / 2 - 0.05, y + 0.3, z + 0.04, 0.1, 0.08, 0.4, 'dark'),
      box(x, y + 0.2, z + 0.3, size, 0.1, sh, 'dark'),
      box(x + size / 2 - 0.25, y + 0.1, z, 0.5, 0.36, 0.04, 'dark'),
    ]);
  }
  const f = facetX(x + 0.281, y + 0.05, y + size - 0.05, z + 0.36, z + 0.3 + sh - 0.04);
  return obj(b(x, y, z, 0.5, size, 0.3 + sh), [
    box(x + 0.05, y + size / 2 - 0.25, z, 0.36, 0.5, 0.04, 'dark'),
    box(x + 0.12, y + size / 2 - 0.05, z + 0.04, 0.08, 0.1, 0.4, 'dark'),
    box(x + 0.2, y, z + 0.3, 0.08, size, sh, 'dark'),
    screenContent(f, content),
  ]);
}

export function laptop(x: number, y: number, z: number): SceneObject {
  const f = facetY(y + 0.091, x + 0.06, x + 0.84, z + 0.08, z + 0.52);
  return obj(b(x, y, z, 0.9, 0.7, 0.56), [
    box(x, y + 0.05, z + 0.04, 0.9, 0.05, 0.52, 'metal'),
    screenContent(f, 'docs'),
    box(x, y + 0.05, z, 0.9, 0.62, 0.04, 'metal'),
    flat(x + 0.12, y + 0.17, x + 0.78, y + 0.42, z + 0.041, 'p m-metal-dark'),
  ]);
}

export function chair(x: number, y: number, facing: Facing, mat: Material = 'fabric-dark'): SceneObject {
  const s = 0.8;
  const shapes: ShapeTree[] = [
    box(x + 0.12, y + 0.12, 0, s - 0.24, s - 0.24, 0.06, 'dark'),
    box(x + 0.35, y + 0.35, 0.06, 0.1, 0.1, 0.5, 'metal'),
    box(x, y, 0.56, s, s, 0.16, mat),
  ];
  const bh = 0.95;
  switch (facing) {
    case 'n':
      shapes.push(box(x + 0.04, y + s - 0.16, 0.72, s - 0.08, 0.16, bh, mat));
      break;
    case 's':
      shapes.push(box(x + 0.04, y, 0.72, s - 0.08, 0.16, bh, mat));
      break;
    case 'e':
      shapes.push(box(x, y + 0.04, 0.72, 0.16, s - 0.08, bh, mat));
      break;
    case 'w':
      shapes.push(box(x + s - 0.16, y + 0.04, 0.72, 0.16, s - 0.08, bh, mat));
      break;
  }
  return obj(b(x, y, 0, s, s, 0.72 + bh), shapes);
}

/** Upholstered lounge chair or sofa. `facing` is the direction someone sitting would look. */
export function sofa(x: number, y: number, w: number, d: number, facing: Facing, mat: Material): SceneObject {
  const seatH = 0.75;
  const backT = 0.42;
  const backH = 0.75;
  const arm = 0.38;
  const shapes: ShapeTree[] = [];
  const legs = (lx: number, ly: number) => box(lx, ly, 0, 0.1, 0.1, 0.2, 'wood-dark');
  shapes.push(legs(x + 0.15, y + 0.15), legs(x + w - 0.25, y + 0.15), legs(x + 0.15, y + d - 0.25), legs(x + w - 0.25, y + d - 0.25));
  const base = () => box(x, y, 0.2, w, d, seatH - 0.2, mat);
  if (facing === 'e' || facing === 'w') {
    const bx = facing === 'e' ? x : x + w - backT;
    const back = box(bx, y, seatH, backT, d, backH, mat);
    const armA = box(x, y, seatH, w, arm, 0.38, mat);
    const armB = box(x, y + d - arm, seatH, w, arm, 0.38, mat);
    shapes.push(base());
    if (facing === 'e') shapes.push(back, armA, cushionsY(x + backT, y + arm, w - backT, d - 2 * arm, seatH, mat), armB);
    else shapes.push(armA, cushionsY(x, y + arm, w - backT, d - 2 * arm, seatH, mat), back, armB);
  } else {
    const by = facing === 's' ? y : y + d - backT;
    const back = box(x, by, seatH, w, backT, backH, mat);
    const armA = box(x, y, seatH, arm, d, 0.38, mat);
    const armB = box(x + w - arm, y, seatH, arm, d, 0.38, mat);
    shapes.push(base());
    if (facing === 's') shapes.push(back, armA, cushionsX(x + arm, y + backT, w - 2 * arm, d - backT, seatH, mat), armB);
    else shapes.push(armA, cushionsX(x + arm, y, w - 2 * arm, d - backT, seatH, mat), back, armB);
  }
  return obj(b(x, y, 0, w, d, seatH + backH), shapes);
}

function cushionsY(x: number, y: number, w: number, d: number, z: number, mat: Material): Shape[] {
  const n = Math.max(1, Math.round(d / 1.4));
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) out.push(...box(x, y + (d / n) * i + 0.03, z, w, d / n - 0.06, 0.14, mat));
  return out;
}
function cushionsX(x: number, y: number, w: number, d: number, z: number, mat: Material): Shape[] {
  const n = Math.max(1, Math.round(w / 1.4));
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) out.push(...box(x + (w / n) * i + 0.03, y, z, w / n - 0.06, d, 0.14, mat));
  return out;
}

export function table(x: number, y: number, w: number, d: number, h: number, top: Material, base: Material = 'dark'): SceneObject {
  return obj(b(x, y, 0, w, d, h), [
    box(x + w / 2 - 0.5, y + d / 2 - 0.5, 0, 1, 1, 0.06, base),
    box(x + w / 2 - 0.12, y + d / 2 - 0.12, 0.06, 0.24, 0.24, h - 0.14, base),
    box(x, y, h - 0.08, w, d, 0.08, top),
  ]);
}

/** Meeting table on two pedestal legs. */
export function meetingTable(x: number, y: number, w: number, d: number): SceneObject {
  const h = 1.25;
  return obj(b(x, y, 0, w, d, h), [
    box(x + 0.6, y + d / 2 - 0.3, 0, 0.3, 0.6, h - 0.08, 'dark'),
    box(x + w - 0.9, y + d / 2 - 0.3, 0, 0.3, 0.6, h - 0.08, 'dark'),
    box(x, y, h - 0.1, w, d, 0.1, 'wood'),
  ]);
}

export type PlantKind = 'bush' | 'tall' | 'snake';

export function plant(x: number, y: number, kind: PlantKind, z = 0, potMat: Material = 'pot'): SceneObject {
  const s = kind === 'bush' ? 0.55 : 0.85;
  const ph = kind === 'bush' ? 0.45 : 0.85;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const shapes: ShapeTree[] = [box(x, y, z, s, s, ph, potMat), flat(x + 0.06, y + 0.06, x + s - 0.06, y + s - 0.06, z + ph + 0.001, 'p m-soil')];
  let top = ph;
  if (kind === 'bush') {
    shapes.push(blob(cx, cy, z + ph + 0.35, 13, 10, 'p m-leaf-dark'));
    shapes.push(blob(cx - 0.1, cy + 0.1, z + ph + 0.6, 10, 8, 'p m-leaf'));
    shapes.push(blob(cx + 0.15, cy - 0.05, z + ph + 0.5, 8, 6, 'p m-leaf-light'));
    top = ph + 1.1;
  } else if (kind === 'tall') {
    const [px, py] = project(cx, cy, z + ph);
    shapes.push({ kind: 'line', x1: px, y1: py, x2: px, y2: py - 30, cls: 'stem' });
    const r = seeded(Math.round(x * 31 + y * 17));
    const layers: [number, number, number, string][] = [];
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      const rad = 4 + r() * 11;
      layers.push([px + Math.cos(a) * rad, py - 26 - r() * 34 + i * 1.5, 7 + r() * 5, i < 4 ? 'p m-leaf-dark' : i < 7 ? 'p m-leaf' : 'p m-leaf-light']);
    }
    for (const [ex, ey, er, cls] of layers) shapes.push({ kind: 'ellipse', cx: ex, cy: ey, rx: er + 2, ry: er, cls });
    top = ph + 4;
  } else {
    const [px, py] = project(cx, cy, z + ph);
    const r = seeded(Math.round(x * 13 + y * 7));
    for (let i = 0; i < 9; i++) {
      const lean = (i - 4) * 2.3 + (r() - 0.5) * 3;
      const height = 24 + r() * 22;
      const base = px + (i - 4) * 1.6;
      const cls = i % 3 === 0 ? 'p m-leaf-dark' : i % 3 === 1 ? 'p m-leaf' : 'p m-leaf-light';
      shapes.push({
        kind: 'poly',
        points: `${(base - 2.4).toFixed(1)},${py.toFixed(1)} ${(base + lean).toFixed(1)},${(py - height).toFixed(1)} ${(base + 2.4).toFixed(1)},${py.toFixed(1)}`,
        cls,
      });
    }
    top = ph + 2.6;
  }
  return obj(b(x, y, z, s, s, top), shapes);
}

/** Bookshelf standing against the left wall (front faces +x). */
export function bookshelfOnLeftWall(y0: number, len: number, h: number, rows: number, seed: number): SceneObject {
  const depth = 0.95;
  const x = 0.02;
  const r = seeded(seed);
  const shapes: ShapeTree[] = [];
  shapes.push(...box(x, y0, 0, 0.12, len, h, 'wood', { noRight: false }));
  shapes.push(...box(x, y0, 0, depth, 0.1, h, 'wood'));
  const rowH = (h - 0.1) / rows;
  const bookColors = ['book-1', 'book-2', 'book-3', 'book-4', 'book-5', 'book-6'];
  for (let k = 0; k < rows; k++) {
    const z = k * rowH;
    shapes.push(...box(x, y0 + 0.1, z, depth, len - 0.2, 0.1, 'wood'));
    let yb = y0 + 0.2 + r() * 0.2;
    while (yb < y0 + len - 0.45) {
      if (r() < 0.12) {
        yb += 0.3 + r() * 0.3;
        continue;
      }
      const bw = 0.11 + r() * 0.1;
      const bh = rowH * (0.55 + r() * 0.3);
      const bd = depth * (0.62 + r() * 0.2);
      shapes.push(...box(x + 0.15, yb, z + 0.1, bd, bw, bh, bookColors[Math.floor(r() * bookColors.length)], { noLeft: true }));
      yb += bw + 0.01;
    }
  }
  shapes.push(...box(x, y0 + 0.1, h - 0.1, depth, len - 0.2, 0.1, 'wood'));
  shapes.push(...box(x, y0 + len - 0.1, 0, depth, 0.1, h, 'wood'));
  return obj(b(x, y0, 0, depth, len, h), shapes);
}

/** Low cabinet with doors, used as a sideboard. */
export function cabinet(x: number, y: number, w: number, d: number, h: number, mat: Material, front: 's' | 'e'): SceneObject {
  const shapes: ShapeTree[] = [...box(x + 0.08, y + 0.08, 0, w - 0.16, d - 0.16, 0.08, 'dark'), ...box(x, y, 0.08, w, d, h - 0.08, mat)];
  if (front === 's') {
    const f = facetY(y + d + 0.002, x, x + w, 0.08, h);
    const n = Math.max(1, Math.round(w / 1.4));
    for (let i = 0; i < n; i++) shapes.push(f(i / n + 0.02, (i + 1) / n - 0.02, 0.08, 0.92, 'p m-cabinet-door'));
  } else {
    const f = facetX(x + w + 0.002, y, y + d, 0.08, h);
    const n = Math.max(1, Math.round(d / 1.4));
    for (let i = 0; i < n; i++) shapes.push(f(i / n + 0.02, (i + 1) / n - 0.02, 0.08, 0.92, 'p m-cabinet-door-x'));
  }
  return obj(b(x, y, 0, w, d, h), shapes);
}

/** Wall-mounted whiteboard on the back wall with a simple architecture sketch. */
export function whiteboardOnY(x0: number, x1: number, z0: number, z1: number): SceneObject {
  const f = facetY(0.03, x0, x1, z0, z1);
  return obj(b(x0, 0, z0, x1 - x0, 0.05, z1 - z0), [
    f(0, 1, 0, 1, 'p m-frame'),
    f(0.015, 0.985, 0.03, 0.97, 'p m-whiteboard'),
    // Three components and connectors: an abstract system sketch.
    f(0.08, 0.28, 0.18, 0.4, 'p m-ink-blue'),
    f(0.4, 0.6, 0.18, 0.4, 'p m-ink-dark'),
    f(0.72, 0.92, 0.18, 0.4, 'p m-ink-blue'),
    f(0.28, 0.4, 0.285, 0.305, 'p m-ink-line'),
    f(0.6, 0.72, 0.285, 0.305, 'p m-ink-line'),
    f(0.49, 0.51, 0.4, 0.58, 'p m-ink-line'),
    f(0.36, 0.64, 0.58, 0.78, 'p m-ink-accent'),
    f(0.0, 1, 0.97, 1, 'p m-frame'),
  ]);
}

/** Wall-mounted display on the left wall. */
export function displayOnX(y0: number, y1: number, z0: number, z1: number, content: ScreenContent): SceneObject {
  const f = facetX(0.06, y0, y1, z0, z1);
  const inner = facetX(0.061, y0 + 0.08, y1 - 0.08, z0 + 0.08, z1 - 0.08);
  return obj(b(0, y0, z0, 0.08, y1 - y0, z1 - z0), [box(0, y0, z0, 0.06, y1 - y0, z1 - z0, 'dark', { noLeft: false }), f(0, 1, 0, 1, 'p m-dark'), screenContent(inner, content)]);
}

/** Framed project board on the back wall: an image area and caption bars. */
export function projectBoardOnY(x0: number, x1: number, z0: number, z1: number, variant: number): SceneObject {
  const f = facetY(0.05, x0, x1, z0, z1);
  const tint = ['p m-board-a', 'p m-board-b', 'p m-board-c'][variant % 3];
  return obj(b(x0, 0, z0, x1 - x0, 0.06, z1 - z0), [
    box(x0, 0, z0, x1 - x0, 0.05, z1 - z0, 'dark', { noLeft: true }),
    f(0, 1, 0, 1, 'p m-dark'),
    f(0.04, 0.96, 0.06, 0.94, 'p m-board-bg'),
    f(0.08, 0.92, 0.12, 0.62, tint),
    f(0.08, 0.6, 0.7, 0.77, 'p m-board-title'),
    f(0.08, 0.42, 0.82, 0.87, 'p m-board-text'),
    f(0.7, 0.92, 0.7, 0.87, 'p m-board-chip'),
  ]);
}

/** Framed certificate on the left wall. */
export function frameOnX(y0: number, y1: number, z0: number, z1: number): SceneObject {
  const f = facetX(0.04, y0, y1, z0, z1);
  return obj(b(0, y0, z0, 0.05, y1 - y0, z1 - z0), [
    box(0, y0, z0, 0.05, y1 - y0, z1 - z0, 'wood-dark'),
    f(0.08, 0.92, 0.1, 0.9, 'p m-paper'),
    f(0.25, 0.75, 0.25, 0.33, 'p m-ink-dark'),
    f(0.2, 0.8, 0.45, 0.5, 'p m-ink-soft'),
    f(0.3, 0.7, 0.56, 0.6, 'p m-ink-soft'),
    f(0.42, 0.58, 0.68, 0.8, 'p m-ink-accent'),
  ]);
}

/**
 * Reception counter, front facing +y. Two objects: the receptionist's work
 * surface behind, and the raised front with its ledge, so items on the work
 * surface sort correctly between them.
 */
export function receptionCounter(x: number, y: number, w: number, d: number): SceneObject[] {
  const h = 1.75;
  const back = d * 0.45;
  const f = facetY(y + d + 0.002, x, x + w, 0, h - 0.1);
  return [
    obj(b(x, y, 0, w, back, 1.26), box(x, y, 1.2, w, back, 0.06, 'desk')),
    obj(b(x - 0.08, y + back, 0, w + 0.16, d - back + 0.08, h + 0.04), [
      box(x, y + back, 0, w, d - back, h - 0.08, 'counter'),
      f(0, 1, 0.62, 0.7, 'p m-accent-band'),
      box(x - 0.08, y + back - 0.05, h - 0.08, w + 0.16, d - back + 0.13, 0.12, 'wood'),
    ]),
  ];
}

/** Kitchenette counter with a coffee machine. Front faces +y. */
export function kitchenette(x: number, y: number, w: number, d: number): SceneObject[] {
  const h = 1.5;
  const f = facetY(y + d + 0.002, x, x + w, 0.1, h - 0.1);
  const counter = obj(b(x, y, 0, w, d, h), [
    box(x, y, 0, w, d, h - 0.08, 'white'),
    f(0.02, 0.32, 0.06, 0.94, 'p m-cabinet-door'),
    f(0.35, 0.65, 0.06, 0.94, 'p m-cabinet-door'),
    f(0.68, 0.98, 0.06, 0.94, 'p m-cabinet-door'),
    box(x - 0.05, y, h - 0.08, w + 0.1, d + 0.05, 0.08, 'stone'),
  ]);
  const mx = x + 0.4;
  const machine = obj(b(mx, y + 0.15, h, 0.7, 0.65, 1.05), [
    box(mx, y + 0.15, h, 0.7, 0.6, 0.12, 'dark'),
    box(mx, y + 0.15, h + 0.12, 0.7, 0.25, 0.8, 'dark'),
    box(mx, y + 0.15, h + 0.92, 0.7, 0.6, 0.18, 'dark'),
    box(mx + 0.25, y + 0.45, h + 0.12, 0.2, 0.2, 0.22, 'mug'),
    blob(mx + 0.5, y + 0.42, h + 0.98, 2, 1.6, 'p m-indicator'),
  ]);
  const mugs = obj(b(x + w - 1.1, y + 0.3, h, 0.7, 0.3, 0.26), [box(x + w - 1.1, y + 0.3, h, 0.24, 0.24, 0.26, 'mug'), box(x + w - 0.7, y + 0.35, h, 0.24, 0.24, 0.26, 'mug-accent')]);
  return [counter, machine, mugs];
}

export function floorLamp(x: number, y: number): SceneObject {
  return obj(b(x, y, 0, 0.6, 0.6, 3), [
    box(x + 0.1, y + 0.1, 0, 0.4, 0.4, 0.05, 'dark'),
    box(x + 0.27, y + 0.27, 0.05, 0.06, 0.06, 2.4, 'dark'),
    box(x, y, 2.4, 0.6, 0.6, 0.55, 'shade'),
  ]);
}

export function deskLamp(x: number, y: number, z: number): SceneObject {
  return obj(b(x, y, z, 0.4, 0.4, 1), [
    box(x + 0.05, y + 0.05, z, 0.3, 0.3, 0.04, 'dark'),
    box(x + 0.16, y + 0.16, z + 0.04, 0.06, 0.06, 0.75, 'dark'),
    box(x, y + 0.08, z + 0.74, 0.4, 0.24, 0.18, 'accent'),
  ]);
}

export function mug(x: number, y: number, z: number, mat: Material = 'mug'): SceneObject {
  return obj(b(x, y, z, 0.22, 0.22, 0.25), box(x, y, z, 0.22, 0.22, 0.25, mat));
}

/** Stack of paper or a document tray. */
export function papers(x: number, y: number, z: number, w = 0.6, d = 0.8, n = 3): SceneObject {
  const shapes: ShapeTree[] = [];
  for (let i = 0; i < n; i++) shapes.push(...box(x + (i % 2) * 0.03, y + (i % 2) * 0.02, z + i * 0.03, w, d, 0.03, 'paper'));
  return obj(b(x, y, z, w + 0.03, d + 0.02, n * 0.03), shapes);
}

export function bookStack(x: number, y: number, z: number): SceneObject {
  return obj(b(x, y, z, 0.7, 0.5, 0.3), [box(x, y, z, 0.7, 0.5, 0.1, 'book-2'), box(x + 0.04, y + 0.02, z + 0.1, 0.62, 0.46, 0.1, 'book-3'), box(x, y + 0.03, z + 0.2, 0.66, 0.44, 0.09, 'book-1')]);
}

export function notebook(x: number, y: number, z: number): SceneObject {
  return obj(b(x, y, z, 0.6, 0.8, 0.04), [box(x, y, z, 0.6, 0.8, 0.04, 'book-4'), flat(x + 0.06, y + 0.06, x + 0.54, y + 0.74, z + 0.041, 'p m-paper')]);
}

export function headphones(x: number, y: number, z: number): SceneObject {
  const [cx, cy] = project(x + 0.25, y + 0.25, z + 0.06);
  return obj(b(x, y, z, 0.5, 0.5, 0.12), [
    { kind: 'ellipse', cx, cy, rx: 7, ry: 3.6, cls: 'p m-dark' },
    { kind: 'ellipse', cx: cx - 5, cy: cy + 0.5, rx: 3, ry: 2.2, cls: 'p m-accent' },
    { kind: 'ellipse', cx: cx + 5, cy: cy - 0.5, rx: 3, ry: 2.2, cls: 'p m-accent' },
  ]);
}

/** Sticky notes on the front (+y) face of a partition: a personal planning board. */
export function pinboardOnPartition(y: number, x0: number, x1: number, z0: number, z1: number): SceneObject {
  const f = facetY(y + 0.002, x0, x1, z0, z1);
  const notes: Shape[] = [f(0, 1, 0, 1, 'p m-cork')];
  const cols = ['p m-note-a', 'p m-note-b', 'p m-note-c'];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 2 + (c % 2); r++) {
      const u = 0.06 + c * 0.235;
      const v = 0.1 + r * 0.29;
      notes.push(f(u, u + 0.16, v, v + 0.22, cols[(c + r) % 3]));
    }
  }
  return obj(b(x0, y, z0, x1 - x0, 0.01, z1 - z0), notes);
}
