import { Bounds, screenRect } from './iso';

/**
 * Painter's-algorithm ordering for non-intersecting axis-aligned boxes.
 *
 * Two boxes only need an ordering constraint when their screen rectangles
 * overlap. In that case the box that lies entirely on the "far" side along
 * some axis is drawn first. The constraints are resolved with a stable
 * topological sort; cycles (which only appear with intersecting boxes) fall
 * back to the original order.
 */
export function depthSort<T extends { bounds: Bounds }>(items: readonly T[]): T[] {
  const n = items.length;
  const rects = items.map((i) => screenRect(i.bounds));
  const after: number[][] = items.map(() => []);
  const indegree = new Array<number>(n).fill(0);

  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      if (!overlaps(rects[a], rects[b])) continue;
      const order = compare(items[a].bounds, items[b].bounds);
      if (order === 0) continue;
      const [first, second] = order < 0 ? [a, b] : [b, a];
      after[first].push(second);
      indegree[second]++;
    }
  }

  const result: T[] = [];
  const done = new Array<boolean>(n).fill(false);
  while (result.length < n) {
    let next = -1;
    for (let i = 0; i < n; i++) {
      if (!done[i] && indegree[i] === 0) {
        next = i;
        break;
      }
    }
    if (next === -1) {
      // Cycle: take the first remaining item to keep going deterministically.
      next = done.indexOf(false);
    }
    done[next] = true;
    result.push(items[next]);
    for (const m of after[next]) indegree[m]--;
  }
  return result;
}

const EPS = 1e-6;

/** Negative when `a` must be painted before `b`, positive for the reverse, 0 when unconstrained. */
export function compare(a: Bounds, b: Bounds): number {
  if (a.x + a.w <= b.x + EPS || a.y + a.d <= b.y + EPS || a.z + a.h <= b.z + EPS) return -1;
  if (b.x + b.w <= a.x + EPS || b.y + b.d <= a.y + EPS || b.z + b.h <= a.z + EPS) return 1;
  // Intersecting boxes: approximate with centre depth.
  const da = a.x + a.w / 2 + a.y + a.d / 2 + a.z;
  const db = b.x + b.w / 2 + b.y + b.d / 2 + b.z;
  return da - db;
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
