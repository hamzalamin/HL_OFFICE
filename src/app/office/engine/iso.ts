export const UNIT = 20;
const COS30 = 0.8660254;
const SX = COS30 * UNIT;
const SY = 0.5 * UNIT;
const SZ = 0.92 * UNIT;

export const ORIGIN = { x: 412, y: 168 };

export type Point = readonly [number, number];

export function project(x: number, y: number, z = 0): Point {
  return [ORIGIN.x + (x - y) * SX, ORIGIN.y + (x + y) * SY - z * SZ];
}

export type Material = string;

export type Shape =
  | { kind: 'poly'; points: string; cls: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; cls: string }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; cls: string };

export interface Bounds {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export interface SceneObject {
  bounds: Bounds;
  shapes: Shape[];
}

function pts(points: Point[]): string {
  return points.map(([a, b]) => `${round(a)},${round(b)}`).join(' ');
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function poly(points: Point[], cls: string): Shape {
  return { kind: 'poly', points: pts(points), cls };
}

export interface BoxOptions {

  noTop?: boolean;
  noLeft?: boolean;
  noRight?: boolean;

  extra?: string;
}

export function box(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  mat: Material,
  opts: BoxOptions = {},
): Shape[] {
  const x1 = x + w;
  const y1 = y + d;
  const z1 = z + h;
  const m = `m-${mat}${opts.extra ? ' ' + opts.extra : ''}`;
  const out: Shape[] = [];
  if (!opts.noLeft) {
    out.push(
      poly([project(x, y1, z), project(x1, y1, z), project(x1, y1, z1), project(x, y1, z1)], `f-l ${m}`),
    );
  }
  if (!opts.noRight) {
    out.push(
      poly([project(x1, y, z), project(x1, y1, z), project(x1, y1, z1), project(x1, y, z1)], `f-r ${m}`),
    );
  }
  if (!opts.noTop) {
    out.push(
      poly([project(x, y, z1), project(x1, y, z1), project(x1, y1, z1), project(x, y1, z1)], `f-t ${m}`),
    );
  }
  return out;
}

export function flat(x0: number, y0: number, x1: number, y1: number, z: number, cls: string): Shape {
  return poly([project(x0, y0, z), project(x1, y0, z), project(x1, y1, z), project(x0, y1, z)], cls);
}

export function wallY(y: number, x0: number, x1: number, z0: number, z1: number, cls: string): Shape {
  return poly([project(x0, y, z0), project(x1, y, z0), project(x1, y, z1), project(x0, y, z1)], cls);
}

export function wallX(x: number, y0: number, y1: number, z0: number, z1: number, cls: string): Shape {
  return poly([project(x, y0, z0), project(x, y1, z0), project(x, y1, z1), project(x, y0, z1)], cls);
}

export function line(a: Point, b: Point, cls: string): Shape {
  return { kind: 'line', x1: round(a[0]), y1: round(a[1]), x2: round(b[0]), y2: round(b[1]), cls };
}

export function blob(x: number, y: number, z: number, rx: number, ry: number, cls: string): Shape {
  const [cx, cy] = project(x, y, z);
  return { kind: 'ellipse', cx: round(cx), cy: round(cy), rx, ry, cls };
}

export type ShapeTree = Shape | readonly ShapeTree[];

export function obj(bounds: Bounds, ...shapes: ShapeTree[]): SceneObject {
  const out: Shape[] = [];
  const walk = (t: ShapeTree): void => {
    if (Array.isArray(t)) (t as readonly ShapeTree[]).forEach(walk);
    else out.push(t as Shape);
  };
  shapes.forEach(walk);
  return { bounds, shapes: out };
}

export function screenRect(b: Bounds): { x: number; y: number; w: number; h: number } {
  const corners: Point[] = [];
  for (const dx of [0, b.w]) {
    for (const dy of [0, b.d]) {
      for (const dz of [0, b.h]) {
        corners.push(project(b.x + dx, b.y + dy, b.z + dz));
      }
    }
  }
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

export function footprint(x0: number, y0: number, x1: number, y1: number, z = 0.02): string {
  return pts([project(x0, y0, z), project(x1, y0, z), project(x1, y1, z), project(x0, y1, z)]);
}

export function prismHull(x0: number, y0: number, x1: number, y1: number, h: number): string {
  return pts([
    project(x0, y0, h),
    project(x1, y0, h),
    project(x1, y0, 0),
    project(x1, y1, 0),
    project(x0, y1, 0),
    project(x0, y1, h),
  ]);
}
