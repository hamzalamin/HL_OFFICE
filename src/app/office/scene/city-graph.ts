export const GROUND = -0.7;

export type NodeId = string;

const NODES: Record<NodeId, readonly [number, number]> = {

  fW: [-30, 28.2],
  fBack: [-6.5, 28.2],
  fEnt: [2.5, 28.2],
  fMid: [18, 28.2],
  fCor: [36.2, 28.2],

  sN: [36.2, -30],
  sBack: [36.2, -6.5],
  sBench: [36.2, 7.4],
  sCafe1: [36.2, 14],
  sCafe2: [36.2, 18.6],

  ffW: [-30, 36.2],
  ffPark: [2.6, 36.2],
  ffBench: [14.2, 36.2],
  ffMid: [25, 36.2],
  ffCor: [36.2, 36.2],
  ffCorE: [44.2, 36.2],
  ffE: [70, 36.2],
  sPark: [36.2, 47.8],
  sS: [36.2, 50],
  pJ: [2.6, 47.8],
  pW: [-30, 47.8],
  pS: [2.6, 50],

  sfN: [44.2, -30],
  sfPark: [44.2, 14.35],
  sfBench: [44.2, 16.7],
  sfCor: [44.2, 28.2],
  sfS: [44.2, 50],
  fE: [70, 28.2],
  rpE: [70, 14.35],

  bJ: [-6.5, -6.5],
  bN: [-6.5, -30],
  bW: [-30, -6.5],

  door: [2.5, 21.9],
  gardenSeat: [32.6, 7.4],
  cafe1: [35.1, 14],
  cafe2: [35.1, 18.6],
  parkSeatA: [13.75, 37.4],
  parkSeatB: [14.75, 37.4],
  sideSeatA: [45.3, 16.15],
  sideSeatB: [45.3, 17.25],
};

const EDGES: readonly [NodeId, NodeId][] = [
  ['fW', 'fBack'],
  ['fBack', 'fEnt'],
  ['fEnt', 'fMid'],
  ['fMid', 'fCor'],
  ['fCor', 'sfCor'],
  ['sfCor', 'fE'],
  ['sN', 'sBack'],
  ['sBack', 'sBench'],
  ['sBench', 'sCafe1'],
  ['sCafe1', 'sCafe2'],
  ['sCafe2', 'fCor'],
  ['fCor', 'ffCor'],
  ['fEnt', 'ffPark'],
  ['ffW', 'ffPark'],
  ['ffPark', 'ffBench'],
  ['ffBench', 'ffMid'],
  ['ffMid', 'ffCor'],
  ['ffCor', 'ffCorE'],
  ['ffCorE', 'ffE'],
  ['ffCor', 'sPark'],
  ['sPark', 'sS'],
  ['ffPark', 'pJ'],
  ['pJ', 'pW'],
  ['pJ', 'pS'],
  ['pJ', 'sPark'],
  ['sfN', 'sfPark'],
  ['sfPark', 'sfBench'],
  ['sfBench', 'sfCor'],
  ['sfCor', 'ffCorE'],
  ['ffCorE', 'sfS'],
  ['sfPark', 'rpE'],
  ['fBack', 'bJ'],
  ['bJ', 'bN'],
  ['bJ', 'bW'],
  ['bJ', 'sBack'],
  ['fEnt', 'door'],
  ['sBench', 'gardenSeat'],
  ['sCafe1', 'cafe1'],
  ['sCafe2', 'cafe2'],
  ['ffBench', 'parkSeatA'],
  ['ffBench', 'parkSeatB'],
  ['sfBench', 'sideSeatA'],
  ['sfBench', 'sideSeatB'],
];

export const EDGE_NODES: readonly NodeId[] = ['fW', 'fE', 'sN', 'ffW', 'ffE', 'sfN', 'sfS', 'rpE', 'pW', 'pS', 'sS', 'bW', 'bN'];

export const PAUSE_NODES: ReadonlySet<NodeId> = new Set(['fMid', 'ffMid', 'fBack']);

export function nodePoint(id: NodeId): { x: number; y: number } {
  const [x, y] = NODES[id];
  return { x, y };
}

const ADJ = new Map<NodeId, NodeId[]>();
for (const [a, c] of EDGES) {
  ADJ.set(a, [...(ADJ.get(a) ?? []), c]);
  ADJ.set(c, [...(ADJ.get(c) ?? []), a]);
}

export function route(from: NodeId, to: NodeId): NodeId[] {
  const dist = new Map<NodeId, number>([[from, 0]]);
  const prev = new Map<NodeId, NodeId>();
  const open = new Set<NodeId>([from]);
  while (open.size) {
    let cur: NodeId | null = null;
    for (const n of open) if (cur === null || dist.get(n)! < dist.get(cur)!) cur = n;
    open.delete(cur!);
    if (cur === to) break;
    for (const n of ADJ.get(cur!) ?? []) {
      const a = NODES[cur!];
      const c = NODES[n];
      const d = dist.get(cur!)! + Math.hypot(a[0] - c[0], a[1] - c[1]);
      if (d < (dist.get(n) ?? Infinity)) {
        dist.set(n, d);
        prev.set(n, cur!);
        open.add(n);
      }
    }
  }
  const path = [to];
  while (path[0] !== from) {
    const p = prev.get(path[0]);
    if (!p) return [from];
    path.unshift(p);
  }
  return path;
}

type Rect = readonly [number, number, number, number];

const SIDEWALKS: Rect[] = [
  [-30, 26.5, 38, 30],
  [43, 26.5, 70, 30],
  [34.5, -30, 38, 30],
  [43, -30, 45.5, 30],
  [-30, 35, 38, 37.5],
  [43, 35, 70, 37.5],
  [34.5, 35, 38, 50],
  [43, 35, 45.5, 50],
];

const PATHS: Rect[] = [
  [1.1, 30, 3.9, 35],
  [34.6, 30, 37.8, 35],
  [43.1, 30, 45.6, 35],
  [38, 26.6, 43, 29.8],
  [38, 35, 43, 37.6],
  [-30, -7.5, 34.5, -5.5],
  [-7.5, -30, -5.5, 26.5],
  [1.4, 37.5, 4.1, 50],
  [-30, 47, 34.5, 48.6],
  [45.5, 13.5, 70, 15.2],
  [-0.6, 21.5, 6.6, 26.5],
  [32.2, 6.8, 34.5, 8.0],
  [13.2, 37.4, 15.4, 38.4],
  [45.4, 15.6, 46.3, 17.8],
];

const inside = ([x0, y0, x1, y1]: Rect, x: number, y: number, m: number) => x >= x0 - m && x <= x1 + m && y >= y0 - m && y <= y1 + m;

export function isWalkable(x: number, y: number, margin = 0): boolean {
  return SIDEWALKS.some((r) => inside(r, x, y, margin)) || PATHS.some((r) => inside(r, x, y, margin));
}

export function groundHeight(x: number, y: number): number {
  if (y <= 22 && x > 0.5 && x < 4.5) return 0;
  if (y < 23.35 && x > 1 && x < 4 && y > 22) return GROUND + ((23.35 - y) / 1.35) * 0.7;
  if (SIDEWALKS.some((r) => inside(r, x, y, 0)) && !PATHS.slice(0, 5).some((r) => inside(r, x, y, 0))) return GROUND + 0.12;
  return GROUND;
}
