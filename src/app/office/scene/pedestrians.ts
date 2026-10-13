import { seeded } from './furniture';
import { EDGE_NODES, NodeId, PAUSE_NODES, groundHeight, nodePoint, route } from './city-graph';
import { View } from './people';

/**
 * A small pedestrian simulation for the street around the office.
 *
 * People choose a destination (pass through, enter or leave the office, sit
 * at the café or on a bench, stroll in the park), follow the walking graph,
 * keep to the right, turn smoothly, slow down or step aside for others, and
 * sometimes stop to talk. Pure state: `step()` advances it, the scene reads
 * `bodies` and `seats`. Seeded, so every run (and the prerender) starts from
 * the same moment.
 */

type Dir = '+x' | '-x' | '+y' | '-y';

export interface Seat {
  id: string;
  x: number;
  y: number;
  /** Seat height above the street. */
  z: number;
  facing: Dir;
  access: NodeId;
}

/** Seats people can take. The sitter is drawn by the scene and shown when taken. */
export const SEATS: readonly Seat[] = [
  { id: 'garden', x: 31.45, y: 7.4, z: 0.55, facing: '+x', access: 'gardenSeat' },
  { id: 'cafe-1', x: 34.2, y: 14, z: 0.71, facing: '-x', access: 'cafe1' },
  { id: 'cafe-2', x: 34.2, y: 18.6, z: 0.71, facing: '-x', access: 'cafe2' },
  { id: 'park-a', x: 13.75, y: 38.5, z: 0.55, facing: '-y', access: 'parkSeatA' },
  { id: 'park-b', x: 14.75, y: 38.5, z: 0.55, facing: '-y', access: 'parkSeatB' },
  { id: 'side-a', x: 46.45, y: 16.15, z: 0.55, facing: '-x', access: 'sideSeatA' },
  { id: 'side-b', x: 46.45, y: 17.25, z: 0.55, facing: '-x', access: 'sideSeatB' },
];

export function facingView(dir: Dir): { view: View; flip: boolean } {
  return { '+x': { view: 'front', flip: false }, '+y': { view: 'front', flip: true }, '-x': { view: 'back', flip: true }, '-y': { view: 'back', flip: false } }[dir] as {
    view: View;
    flip: boolean;
  };
}

export interface Body {
  id: string;
  look: number;
  x: number;
  y: number;
  z: number;
  alpha: number;
  view: View;
  flip: boolean;
  /** Walk cycle phase (radians) and how strongly limbs swing (0–1). */
  phase: number;
  swing: number;
}

interface Pt {
  x: number;
  y: number;
}

type Mode = 'off' | 'walk' | 'pause' | 'sit-down' | 'sit' | 'stand-up' | 'leave';
type End = { kind: 'edge' } | { kind: 'door' } | { kind: 'seat'; seat: Seat };

interface Agent {
  id: string;
  bodies: Body[];
  rng: () => number;
  pace: number;
  mode: Mode;
  timer: number;
  pos: Pt;
  heading: number;
  speed: number;
  side: number;
  /** Pairs: 0 side by side, 1 single file (to let others pass). */
  file: number;
  path: Pt[];
  idx: number;
  pauseIdx: number;
  pauseFor: number;
  end: End;
  seat: Seat | null;
  inside: boolean;
  /** Seat transition progress. */
  t: number;
}

const LANE = 0.55;
const PAIR = 0.42;
const TURN_RATE = 4.5;
const ACCEL = 1.6;
const DECEL = 4;
const STRIDE = 0.95;

export class Crowd {
  readonly bodies: Body[] = [];
  /** Seat id → taken. */
  readonly seats = new Map<string, boolean>(SEATS.map((s) => [s.id, false]));
  /** Seat id → look of the person sitting there. */
  readonly seatLook = new Map<string, number>();
  /** Seats someone is walking to. */
  private readonly reserved = new Set<string>();
  private readonly agents: Agent[] = [];

  constructor(cast: readonly { id: string; looks: number[]; pace: number; seed: number }[] = CAST) {
    for (const c of cast) {
      const bodies = c.looks.map((look, i) => ({ id: `${c.id}-${i}`, look, x: 0, y: 0, z: 0, alpha: 0, view: 'front' as View, flip: false, phase: i * 1.7, swing: 0 }));
      this.bodies.push(...bodies);
      const rng = seeded(c.seed);
      this.agents.push({
        id: c.id,
        bodies,
        rng,
        pace: c.pace,
        mode: 'off',
        timer: rng() * 6,
        pos: { x: 0, y: 0 },
        heading: 0,
        speed: 0,
        side: 0,
        file: 0,
        path: [],
        idx: 0,
        pauseIdx: -1,
        pauseFor: 0,
        end: { kind: 'edge' },
        seat: null,
        inside: false,
        t: 0,
      });
    }
  }

  /** Advances the simulation by `dt` seconds (call with small steps). */
  step(dt: number): void {
    for (const a of this.agents) this.update(a, dt);
  }

  /** Runs the simulation forward in fixed steps, e.g. to start mid-scene. */
  warmUp(seconds: number, dt = 0.1): this {
    for (let t = 0; t < seconds; t += dt) this.step(dt);
    return this;
  }

  // -------------------------------------------------------------------------

  private update(a: Agent, dt: number): void {
    switch (a.mode) {
      case 'off':
        a.timer -= dt;
        if (a.timer <= 0) this.plan(a);
        break;
      case 'walk':
        this.walk(a, dt);
        break;
      case 'pause':
        a.speed = Math.max(0, a.speed - DECEL * dt);
        a.timer -= dt;
        this.place(a, dt);
        if (a.timer <= 0) {
          a.mode = 'walk';
          a.pauseIdx = -1;
        }
        break;
      case 'sit-down': {
        const seat = a.seat!;
        if (a.t === 0) {
          this.seats.set(seat.id, true);
          this.seatLook.set(seat.id, a.bodies[0].look);
        }
        a.t = Math.min(1, a.t + dt / 0.7);
        const from = nodePoint(seat.access);
        a.pos = lerp(from, seat, ease(a.t));
        this.faceDir(a, seat.facing);
        this.place(a, dt, 1 - a.t);
        if (a.t >= 1) {
          a.mode = 'sit';
          a.timer = 14 + a.rng() * 26;
        }
        break;
      }
      case 'sit':
        a.timer -= dt;
        if (a.timer <= 0) {
          a.mode = 'stand-up';
          a.t = 0;
          this.seats.set(a.seat!.id, false);
        }
        break;
      case 'stand-up': {
        const seat = a.seat!;
        a.t = Math.min(1, a.t + dt / 0.7);
        a.pos = lerp(seat, nodePoint(seat.access), ease(a.t));
        this.place(a, dt, a.t);
        if (a.t >= 1) {
          a.seat = null;
          this.reserved.delete(seat.id);
          this.plan(a, seat.access);
        }
        break;
      }
      case 'leave': {
        // Keep drifting the way they were going while fading out.
        a.speed = Math.max(0.4, a.speed - DECEL * 0.3 * dt);
        a.pos = { x: a.pos.x + Math.cos(a.heading) * a.speed * dt, y: a.pos.y + Math.sin(a.heading) * a.speed * dt };
        const alpha = Math.max(0, a.bodies[0].alpha - dt / 0.6);
        this.place(a, dt, alpha);
        if (alpha <= 0) {
          a.mode = 'off';
          a.timer = a.inside ? 12 + a.rng() * 25 : 1 + a.rng() * 5;
        }
        break;
      }
    }
  }

  /** Chooses the next outing: where from, where to, and whether to stop on the way. */
  private plan(a: Agent, from?: NodeId): void {
    const r = a.rng;
    const pair = a.bodies.length > 1;
    let start: NodeId = from ?? (a.inside ? 'door' : pick(r, BUSY_EDGES));
    a.inside = false;

    // Destination.
    // One newcomer per bench at a time (seats `park-a`/`park-b` share a bench).
    const bench = (id: string) => id.replace(/-[ab]$/, '');
    const busy = new Set([...this.reserved].map(bench));
    const freeSeats = SEATS.filter((s) => !busy.has(bench(s.id)) && s.access !== start);
    const roll = r();
    let end: End;
    let to: NodeId;
    if (!pair && freeSeats.length && roll < 0.3) {
      const seat = freeSeats[Math.floor(r() * freeSeats.length)];
      end = { kind: 'seat', seat };
      to = seat.access;
    } else if (start !== 'door' && roll < 0.52) {
      end = { kind: 'door' };
      to = 'door';
    } else {
      end = { kind: 'edge' };
      do to = pick(r, BUSY_EDGES);
      while (to === start);
    }

    const nodes = route(start, to);
    if (nodes.length < 2) {
      a.mode = 'off';
      a.timer = 1;
      return;
    }
    const points = nodes.map(nodePoint);
    const startsAtPlace = start === 'door' || from !== undefined;
    const path = offsetPath(points, LANE, startsAtPlace, end.kind !== 'edge');

    // Do not appear on top of someone.
    if (!from && this.crowded(path[0], a)) {
      a.mode = 'off';
      a.timer = 1.5;
      return;
    }

    a.path = path;
    a.idx = 1;
    a.end = end;
    a.pos = { ...path[0] };
    a.heading = Math.atan2(path[1].y - path[0].y, path[1].x - path[0].x);
    a.speed = from ? 0 : a.pace * 0.8;
    a.side = 0;
    a.mode = 'walk';
    if (end.kind === 'seat') this.reserved.add(end.seat.id);

    // A short stop on the way: to check something, or to talk.
    a.pauseIdx = -1;
    const stops = nodes.map((n, i) => (i > 0 && i < nodes.length - 1 && PAUSE_NODES.has(n) ? i : -1)).filter((i) => i > 0);
    if (stops.length && r() < (pair ? 0.6 : 0.3)) {
      a.pauseIdx = stops[Math.floor(r() * stops.length)];
      a.pauseFor = pair ? 4 + r() * 5 : 2 + r() * 3.5;
    }
    if (start === 'door' || !from) for (const b of a.bodies) b.alpha = 0;
    this.place(a, 0);
  }

  private walk(a: Agent, dt: number): void {
    const target = a.path[a.idx];
    const last = a.idx === a.path.length - 1;
    const dx = target.x - a.pos.x;
    const dy = target.y - a.pos.y;
    const dist = Math.hypot(dx, dy);

    // Arrived at a waypoint.
    if (dist < (last ? 0.12 : 0.4)) {
      // Stop only where nobody else is standing.
      if (a.idx === a.pauseIdx && !this.crowded(a.pos, a)) {
        a.mode = 'pause';
        a.timer = a.pauseFor;
        a.pauseIdx = -1;
      }
      if (!last) a.idx++;
      else this.arrive(a);
      return;
    }

    // Turn smoothly toward the waypoint.
    const want = Math.atan2(dy, dx);
    let diff = want - a.heading;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    a.heading += clamp(diff, -TURN_RATE * dt, TURN_RATE * dt);

    // Speed: slow for sharp turns and before stopping, follow or avoid others.
    let target_ = a.pace * (1 - 0.45 * Math.min(1, Math.abs(diff) / 1.6));
    const stopAhead = last && a.end.kind !== 'edge' ? dist : a.idx === a.pauseIdx ? dist : Infinity;
    target_ = Math.min(target_, Math.max(0.35, stopAhead * 1.1));
    const hx = Math.cos(a.heading);
    const hy = Math.sin(a.heading);
    let sideWant = 0;
    let fileWant = 0;
    const vax = hx * a.speed;
    const vay = hy * a.speed;
    for (const o of this.agents) {
      if (o === a || o.mode === 'off' || o.mode === 'sit') continue;
      const rx = o.pos.x - a.pos.x;
      const ry = o.pos.y - a.pos.y;
      const dist = Math.hypot(rx, ry);
      if (dist > 6) continue;
      const ohx = Math.cos(o.heading);
      const ohy = Math.sin(o.heading);
      const still = o.mode !== 'walk' || o.speed < 0.2;
      const cos = ohx * hx + ohy * hy;
      const ahead = rx * hx + ry * hy;
      const lat = -rx * hy + ry * hx;
      // Pairs fall into single file when someone comes the other way.
      if (cos < 0.5 && ahead > 0 && ahead < 4 && Math.abs(lat) < 2) fileWant = 1;

      // Where will the two be closest, in the next few seconds?
      const vx = (still ? 0 : ohx * o.speed) - vax;
      const vy = (still ? 0 : ohy * o.speed) - vay;
      const vv = vx * vx + vy * vy;
      const tca = vv > 1e-6 ? clamp(-(rx * vx + ry * vy) / vv, 0, 2.5) : 0;
      const closest = Math.hypot(rx + vx * tca, ry + vy * tca);
      const room = 0.6 + (width(a) + width(o)) / 2 + 0.45 * (a.file + o.file);
      if (closest > room || ahead < -0.3) continue;

      if (!still && cos > 0.5) {
        // Same way: follow at their pace.
        target_ = Math.min(target_, ahead < 1.1 ? o.speed * 0.8 : o.speed);
      } else if (still) {
        // Someone standing: walk around them.
        const step = Math.min(1.1, room - Math.abs(lat) + Math.abs(a.side) + 0.1);
        sideWant = lat >= 0 ? -step : step;
        if (dist < 1.4) target_ = Math.min(target_, 0.6);
      } else if (cos < -0.5) {
        // Coming the other way: both keep right a little more.
        sideWant = lat >= 0 ? -0.5 : 0.5;
      } else {
        // Crossing paths: whoever would get there later gives way.
        const mine = ahead;
        const theirs = -(rx * ohx + ry * ohy);
        if (mine > theirs || (Math.abs(mine - theirs) < 0.2 && a.id > o.id)) target_ = Math.min(target_, Math.max(0, (dist - 1.0) * 1.3));
      }
    }
    a.file += clamp(fileWant - a.file, -1.5 * dt, 1.5 * dt);
    a.side += clamp(sideWant - a.side, -1.2 * dt, 1.2 * dt);
    a.speed += clamp(target_ - a.speed, -DECEL * dt, ACCEL * dt);

    a.pos = { x: a.pos.x + hx * a.speed * dt, y: a.pos.y + hy * a.speed * dt };
    this.place(a, dt, Math.min(1, a.bodies[0].alpha + dt / 0.6));
  }

  private arrive(a: Agent): void {
    if (a.end.kind === 'seat') {
      a.seat = a.end.seat;
      a.mode = 'sit-down';
      a.t = 0;
    } else {
      if (a.end.kind === 'door') {
        a.inside = true;
        a.heading = -Math.PI / 2; // into the building
      }
      a.mode = 'leave';
    }
  }

  /** Positions, facing and limb swing of the agent's people. */
  private place(a: Agent, dt: number, alpha = a.bodies[0].alpha): void {
    const hx = Math.cos(a.heading);
    const hy = Math.sin(a.heading);
    const nx = -hy;
    const ny = hx;
    const cx = a.pos.x + nx * a.side;
    const cy = a.pos.y + ny * a.side;
    const pair = a.bodies.length > 1;
    const talking = a.mode === 'pause' && pair && a.speed < 0.3;
    a.bodies.forEach((b, i) => {
      const sign = i === 0 ? 1 : -1;
      const off = pair ? sign * PAIR * (1 - a.file) : 0;
      const along = pair ? sign * 0.45 * a.file : 0;
      b.x = cx + nx * off + hx * along;
      b.y = cy + ny * off + hy * along;
      b.z = groundHeight(b.x, b.y);
      b.alpha = alpha;
      b.phase += (a.speed * dt * Math.PI) / STRIDE;
      b.swing = Math.min(1, a.speed / 1.3);
      if (a.mode === 'sit-down' || a.mode === 'stand-up') return;
      // Face the way they walk; when talking, face each other.
      const fx = talking ? -nx * Math.sign(off) : hx;
      const fy = talking ? -ny * Math.sign(off) : hy;
      setFacing(b, fx, fy);
    });
  }

  private faceDir(a: Agent, dir: Dir): void {
    const { view, flip } = facingView(dir);
    for (const b of a.bodies) {
      b.view = view;
      b.flip = flip;
    }
  }

  private crowded(p: Pt, self: Agent): boolean {
    return this.agents.some((o) => o !== self && o.mode !== 'off' && Math.hypot(o.pos.x - p.x, o.pos.y - p.y) < 2);
  }
}

/**
 * Screen direction of a world heading: toward the viewer = `front`, to the
 * left = `flip`. Small components keep the previous value, so people do not
 * flicker between views when walking almost straight up or down the screen.
 */
function setFacing(b: Body, dx: number, dy: number): void {
  const sx = dx - dy;
  const sy = dx + dy;
  if (Math.abs(sy) > 0.2) b.view = sy > 0 ? 'front' : 'back';
  if (Math.abs(sx) > 0.2) b.flip = sx < 0;
}

/** Shifts a route sideways so people keep to the right; endpoints at a door or seat stay exact. */
export function offsetPath(points: Pt[], lane: number, keepStart: boolean, keepEnd: boolean): Pt[] {
  const n = points.length;
  const normals = points.slice(1).map((p, i) => {
    const dx = p.x - points[i].x;
    const dy = p.y - points[i].y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  });
  return points.map((p, i) => {
    if ((i === 0 && keepStart) || (i === n - 1 && keepEnd)) return { ...p };
    const a = normals[Math.max(0, i - 1)];
    const c = normals[Math.min(normals.length - 1, i)];
    let mx = a.x + c.x;
    let my = a.y + c.y;
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const scale = lane / Math.max(0.5, mx * c.x + my * c.y);
    return { x: p.x + mx * scale, y: p.y + my * scale };
  });
}

/**
 * Edges weighted toward the streets in view: the front and side sidewalks
 * and the park crossing are used more than the paths behind the building.
 */
const BUSY_EDGES: readonly NodeId[] = [...EDGE_NODES, 'fW', 'fW', 'fE', 'fE', 'sN', 'sN', 'ffW', 'ffE', 'pS', 'sfS'];

function pick<T>(r: () => number, list: readonly T[]): T {
  return list[Math.floor(r() * list.length)];
}

/** Sideways space an agent takes up. */
function width(a: Agent): number {
  return a.bodies.length > 1 ? 2 * PAIR * (1 - a.file) : 0;
}

function lerp(a: Pt, c: Pt, t: number): Pt {
  return { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t };
}

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** The neighbourhood: people walking alone and in pairs, at their own pace (world units/s). */
export const CAST: readonly { id: string; looks: number[]; pace: number; seed: number }[] = [
  { id: 'ana', looks: [0], pace: 2.1, seed: 11 },
  { id: 'ben', looks: [4], pace: 1.75, seed: 23 },
  { id: 'chloe', looks: [1], pace: 1.95, seed: 37 },
  { id: 'dev', looks: [2], pace: 2.3, seed: 41 },
  { id: 'eli', looks: [7], pace: 1.6, seed: 59 },
  { id: 'fay', looks: [3], pace: 2.0, seed: 67 },
  { id: 'gus', looks: [6], pace: 1.85, seed: 73 },
  { id: 'hana', looks: [5], pace: 2.2, seed: 89 },
  { id: 'ivy', looks: [7], pace: 1.9, seed: 131 },
  { id: 'jon', looks: [0], pace: 2.15, seed: 149 },
  { id: 'pair-1', looks: [3, 4], pace: 1.5, seed: 97 },
  { id: 'pair-2', looks: [1, 2], pace: 1.65, seed: 101 },
  { id: 'pair-3', looks: [5, 6], pace: 1.45, seed: 113 },
];
