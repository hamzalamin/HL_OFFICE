import { compare } from '../engine/depth-sort';
import { Bounds, SceneObject, project, screenRect } from '../engine/iso';
import { Body, Crowd } from '../scene/pedestrians';
import { LOOKS, View } from '../scene/people';

export type Layer = 'back' | 'near' | 'far';

/**
 * Which drawing layer a person belongs to, from where they stand: behind the
 * building, on the near side of the roads, or on/beyond the roads. Each layer
 * sits between the scenery behind and in front of it.
 */
export function layerOf(x: number, y: number): Layer {
  if ((x < -0.6 && y < 22) || (y < -0.6 && x < 34.4)) return 'back';
  if (y > 30 || x > 38) return 'far';
  return 'near';
}

export function bodyTransform(b: Body): string {
  const [sx, sy] = project(b.x, b.y, b.z);
  const bob = Math.abs(Math.sin(b.phase)) * 0.8 * b.swing;
  return `translate(${r(sx)} ${r(sy - bob)})`;
}

type Rect = { x: number; y: number; w: number; h: number };

/** The space a person takes up, for depth ordering. */
function bodyBounds(b: { x: number; y: number; z: number }): Bounds {
  return { x: b.x - 0.25, y: b.y - 0.25, z: b.z, w: 0.5, d: 0.5, h: 2.7 };
}

function overlaps(a: Rect, c: Rect): boolean {
  return a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
}

/**
 * Where a person goes among a layer's scenery (already in painter's order):
 * right after the last object that overlaps them on screen and lies behind
 * them. So a tree between the viewer and a walker hides the walker, and one
 * behind them does not.
 */
export function slotAmong(b: { x: number; y: number; z: number }, objects: readonly { bounds: Bounds; rect: Rect }[]): number {
  const bb = bodyBounds(b);
  const br = screenRect(bb);
  let slot = 0;
  objects.forEach((o, i) => {
    if (overlaps(br, o.rect) && compare(o.bounds, bb) < 0) slot = i + 1;
  });
  return slot;
}

const HIP = -17.5;
const SHOULDER = HIP - 13.8;
/** Limb pivots per view: the figure's near side is on screen left facing the viewer, right facing away. */
const PIVOT: Record<View, { near: number; far: number; arm: number; armFar: number }> = {
  front: { near: -1.3, far: 1.6, arm: -4.6, armFar: 4.4 },
  back: { near: 1.6, far: -1.3, arm: 4.4, armFar: -4.6 },
};

interface Limbs {
  near: Element[];
  far: Element[];
  arm: Element[];
  armFar: Element[];
}

interface Person {
  root: SVGGElement;
  flip: SVGGElement;
  views: Record<View, { el: SVGGElement; limbs: Limbs }>;
  shown: { layer: Layer; view: View; flip: boolean; alpha: number; angle: number };
}

/**
 * Draws the crowd: one small `requestAnimationFrame` step that moves about a
 * dozen SVG groups, swings their limbs with the distance walked, moves them
 * between depth layers and keeps each layer sorted back to front.
 */
export class CrowdView {
  private readonly people = new Map<string, Person>();
  private readonly seatEls = new Map<string, Element[]>();
  private readonly seatShown = new Map<string, boolean>();
  /** Each layer's scenery, in drawing order, with its elements. */
  private readonly scenery: Record<Layer, { el: Element; bounds: Bounds; rect: Rect }[]>;
  private frame = 0;
  private last = 0;
  private running = false;

  constructor(
    private readonly crowd: Crowd,
    private readonly layers: Record<Layer, SVGGElement>,
    scene: SVGSVGElement,
    objects: Record<Layer, readonly SceneObject[]>,
  ) {
    const scenery = (layer: Layer) => {
      const els = layers[layer].querySelectorAll(':scope > .obj');
      return objects[layer].map((o, i) => ({ el: els[i], bounds: o.bounds, rect: screenRect(o.bounds) }));
    };
    this.scenery = { back: scenery('back'), near: scenery('near'), far: scenery('far') };
    for (const el of scene.querySelectorAll<SVGGElement>('[data-ped]')) {
      const limbs = (v: SVGGElement): Limbs => ({
        near: [...v.querySelectorAll('.limb-near')],
        far: [...v.querySelectorAll('.limb-far')],
        arm: [...v.querySelectorAll('.limb-arm')],
        armFar: [...v.querySelectorAll('.limb-arm-far')],
      });
      const front = el.querySelector<SVGGElement>('.ped-front')!;
      const back = el.querySelector<SVGGElement>('.ped-back')!;
      this.people.set(el.dataset['ped']!, {
        root: el,
        flip: el.querySelector<SVGGElement>('.ped-flip')!,
        views: { front: { el: front, limbs: limbs(front) }, back: { el: back, limbs: limbs(back) } },
        shown: { layer: el.parentNode === layers.back ? 'back' : el.parentNode === layers.far ? 'far' : 'near', view: front.style.display === 'none' ? 'back' : 'front', flip: false, alpha: -1, angle: 0 },
      });
    }
    for (const el of scene.querySelectorAll('.seat')) {
      const id = [...el.classList].find((c) => c.startsWith('seat-') && c !== 'seat-free')!.slice(5);
      this.seatEls.set(id, [...(this.seatEls.get(id) ?? []), el]);
    }
  }

  /** Shows the current state once (used without animation, too). */
  render(): void {
    for (const b of this.crowd.bodies) {
      const p = this.people.get(b.id);
      if (p) this.draw(p, b);
    }
    this.placeInLayers();
    this.drawSeats();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      // Long gaps (hidden tab) are skipped, not replayed.
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.crowd.step(dt);
      this.render();
      if (this.running) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private draw(p: Person, b: Body): void {
    const s = p.shown;
    const visible = b.alpha > 0.01;
    if (s.alpha !== b.alpha) {
      p.root.style.display = visible ? '' : 'none';
      p.root.setAttribute('opacity', String(Math.round(b.alpha * 100) / 100));
      s.alpha = b.alpha;
    }
    if (!visible) return;
    p.root.setAttribute('transform', bodyTransform(b));
    if (s.flip !== b.flip) {
      p.flip.setAttribute('transform', b.flip ? 'scale(-1 1)' : '');
      s.flip = b.flip;
    }
    if (s.view !== b.view) {
      p.views[s.view].el.style.display = 'none';
      p.views[b.view].el.style.display = '';
      s.view = b.view;
      s.angle = NaN; // Re-apply limbs on the newly shown view.
    }
    const layer = layerOf(b.x, b.y);
    if (layer !== s.layer) {
      this.layers[layer].appendChild(p.root);
      s.layer = layer;
    }
    // Legs swing at the hip, arms at the shoulder, in step with the distance walked.
    const a = Math.round(Math.sin(b.phase) * 20 * b.swing * 10) / 10;
    if (a !== s.angle) {
      const { limbs } = p.views[b.view];
      const pv = PIVOT[b.view];
      set(limbs.near, `rotate(${a} ${pv.near} ${HIP})`);
      set(limbs.far, `rotate(${-a} ${pv.far} ${HIP})`);
      set(limbs.arm, `rotate(${-a * 0.7} ${pv.arm} ${SHOULDER})`);
      set(limbs.armFar, `rotate(${a * 0.6} ${pv.armFar} ${SHOULDER})`);
      s.angle = a;
    }
  }

  /**
   * Slots every person between the scenery objects in front of and behind
   * them; people sharing a slot go back to front. The DOM is only touched
   * when someone's place actually changes.
   */
  private placeInLayers(): void {
    for (const layer of ['back', 'near', 'far'] as const) {
      const container = this.layers[layer];
      const objects = this.scenery[layer];
      const slots = new Map<number, { el: SVGGElement; depth: number }[]>();
      for (const b of this.crowd.bodies) {
        const p = this.people.get(b.id);
        if (!p || p.shown.layer !== layer || b.alpha <= 0.01) continue;
        const slot = slotAmong(b, objects);
        slots.set(slot, [...(slots.get(slot) ?? []), { el: p.root, depth: b.x + b.y }]);
      }
      for (const [slot, group] of slots) {
        group.sort((m, n) => m.depth - n.depth);
        let next: Element | null = objects[slot]?.el ?? null;
        for (let i = group.length - 1; i >= 0; i--) {
          const el = group[i].el;
          if (el.nextElementSibling !== next || el.parentNode !== container) container.insertBefore(el, next);
          next = el;
        }
      }
    }
  }

  /** Shows the seated person where someone sits, in their colours. */
  private drawSeats(): void {
    for (const [id, taken] of this.crowd.seats) {
      if (this.seatShown.get(id) === taken) continue;
      this.seatShown.set(id, taken);
      const look = LOOKS[(this.crowd.seatLook.get(id) ?? 0) % LOOKS.length];
      for (const el of this.seatEls.get(id) ?? []) {
        if (taken) {
          const cls = (el.getAttribute('class') ?? '').replace(/m-(skin|hair|top|bottom)-[a-z]/g, (_m, part: keyof typeof look) => `m-${part}-${look[part]}`);
          el.setAttribute('class', cls);
        }
        el.classList.toggle('seat-free', !taken);
      }
    }
  }
}

function set(els: Element[], transform: string): void {
  for (const el of els) el.setAttribute('transform', transform);
}

function r(n: number): number {
  return Math.round(n * 10) / 10;
}
