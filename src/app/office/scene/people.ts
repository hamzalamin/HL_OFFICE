import { Shape } from '../engine/iso';

/**
 * People, drawn as small SVG figures in the same flat style as the office.
 *
 * Isometric characters only need two drawings: a 3/4 view walking toward the
 * viewer (`front`, facing the lower right) and one walking away (`back`,
 * facing the upper right). Mirroring each gives the four isometric
 * directions. Coordinates are screen units around the feet (standing) or the
 * seat (sitting); a standing person is about 1.6 m tall at office scale.
 */

export type View = 'front' | 'back';
export type Pose = 'stand' | 'sit';

interface Look {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  long?: boolean;
  bag?: boolean;
}

export const LOOKS: readonly Look[] = [
  { skin: 'a', hair: 'a', top: 'a', bottom: 'a' },
  { skin: 'b', hair: 'b', top: 'b', bottom: 'b', long: true },
  { skin: 'c', hair: 'a', top: 'c', bottom: 'a', bag: true },
  { skin: 'a', hair: 'c', top: 'd', bottom: 'c', long: true },
  { skin: 'b', hair: 'a', top: 'e', bottom: 'a' },
  { skin: 'c', hair: 'b', top: 'f', bottom: 'b', long: true, bag: true },
  { skin: 'a', hair: 'b', top: 'b', bottom: 'a', bag: true },
  { skin: 'b', hair: 'c', top: 'a', bottom: 'c' },
];

/** Hip line of a standing figure. */
const STAND_HIP = -17.5;

/** Pivots (local units) used to swing limbs: legs at the hip, arms at the shoulder. */
export const PIVOTS = {
  near: { x: -1.3, y: STAND_HIP },
  far: { x: 1.6, y: STAND_HIP },
  arm: { x: -4.4, y: STAND_HIP - 13.8 },
} as const;

class Pen {
  readonly shapes: Shape[] = [];
  constructor(
    private readonly ox: number,
    private readonly oy: number,
    private readonly mirror: boolean,
  ) {}

  poly(points: number[][], cls: string): void {
    const m = this.mirror ? -1 : 1;
    this.shapes.push({ kind: 'poly', points: points.map(([x, y]) => `${r(this.ox + m * x)},${r(this.oy + y)}`).join(' '), cls });
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, cls: string): void {
    this.shapes.push({ kind: 'ellipse', cx: r(this.ox + (this.mirror ? -cx : cx)), cy: r(this.oy + cy), rx, ry, cls });
  }
}

/**
 * Draws one person. `front` faces the lower right, `back` the upper right;
 * `mirror` flips to the left. Limbs carry `limb-*` classes so a walker's
 * legs and arms can swing around `PIVOTS`.
 */
export function personShapes(lookIndex: number, view: View, pose: Pose, ox = 0, oy = 0, mirror = false): Shape[] {
  const l = LOOKS[lookIndex % LOOKS.length];
  const skin = `p m-skin-${l.skin}`;
  const top = `p m-top-${l.top}`;
  const bottom = `p m-bottom-${l.bottom}`;
  const hair = `p m-hair-${l.hair}`;
  const p = new Pen(ox, oy, mirror);
  const front = view === 'front';
  const H = pose === 'stand' ? STAND_HIP : -1;

  // Legs. Facing the viewer, the figure's right side (screen left) is nearer.
  if (pose === 'stand') {
    p.ellipse(1.5, 0.6, 6, 2.4, 'shadow');
    const nearX = front ? -1.3 : 1.6;
    const farX = front ? 1.6 : -1.3;
    leg(p, farX, `${bottom} shade limb-far`);
    leg(p, nearX, `${bottom} limb-near`);
  } else if (front) {
    p.poly([[-1.0, -1.8], [3.0, -2.8], [8.0, 0.2], [4.6, 1.8]], `${bottom} shade`);
    p.poly([[-2.4, -0.5], [1.4, -1.8], [6.6, 1.2], [3.0, 3.0]], bottom);
    p.poly([[3.6, 1.8], [6.4, 0.8], [6.8, 11.6], [4.2, 12.2]], bottom);
    p.poly([[3.8, 11.4], [7.8, 11.0], [8.0, 12.8], [3.8, 13.4]], 'p m-dark');
  } else {
    p.poly([[-2.6, 0.2], [2.8, -0.4], [4.4, -2.6], [-0.8, -2.4]], bottom);
  }

  // Far arm, behind the body.
  if (front) arm(p, 3.4, 5.4, H, `${top} shade ${pose === 'stand' ? 'limb-arm-far' : ''}`);
  else arm(p, -5.6, -3.6, H, `${top} shade ${pose === 'stand' ? 'limb-arm-far' : ''}`);

  // Torso, shaded on the far side.
  p.poly([[-4.6, H + 0.5], [4.4, H + 0.5], [4.8, H - 12.5], [3.0, H - 16], [-3.2, H - 16], [-5.0, H - 12.5]], top);
  if (front) p.poly([[2.2, H + 0.5], [4.4, H + 0.5], [4.8, H - 12.5], [3.0, H - 16], [2.4, H - 15.9]], `${top} shade`);
  else p.poly([[-4.6, H + 0.5], [-2.3, H + 0.5], [-2.5, H - 15.9], [-3.2, H - 16], [-5.0, H - 12.5]], `${top} shade`);

  if (l.bag) {
    if (front) p.poly([[-2.6, H - 15.6], [-1.4, H - 15.8], [3.2, H - 2.2], [2.0, H - 2.0]], 'p m-bag-strap');
    else {
      p.poly([[-3.2, H - 14.2], [2.6, H - 14.2], [2.8, H - 3.4], [-3.2, H - 3.2]], 'p m-bag');
      p.poly([[-3.2, H - 14.2], [2.6, H - 14.2], [2.6, H - 11.4], [-3.2, H - 11.2]], 'p m-bag shade');
    }
  }

  // Near arm, in front of the body, with the hand.
  if (front) {
    arm(p, -5.6, -3.6, H, `${top} ${pose === 'stand' ? 'limb-arm' : ''}`);
    p.ellipse(-4.6, H - 0.8, 1.3, 1.3, `${skin} ${pose === 'stand' ? 'limb-arm' : ''}`);
  } else {
    arm(p, 3.4, 5.4, H, `${top} ${pose === 'stand' ? 'limb-arm' : ''}`);
    p.ellipse(4.6, H - 0.8, 1.3, 1.3, `${skin} ${pose === 'stand' ? 'limb-arm' : ''}`);
  }

  // Neck and head.
  p.poly([[-1.2, H - 16], [1.4, H - 16], [1.4, H - 18], [-1.2, H - 18]], skin);
  if (l.long && !front) p.poly([[-4.0, H - 22], [3.6, H - 22], [3.4, H - 14.8], [-3.8, H - 14.6]], hair);
  p.ellipse(0.4, H - 22.1, 4.2, 4.6, skin);
  if (front) {
    p.ellipse(-1.0, H - 24.1, 4.0, 3.3, hair);
    p.poly([[-3.9, H - 23.5], [-1.4, H - 23.8], [-1.2, l.long ? H - 15.6 : H - 20], [-3.7, l.long ? H - 15.4 : H - 19.7]], hair);
    p.ellipse(2.8, H - 22.4, 0.45, 0.6, 'p m-dark');
  } else {
    p.ellipse(-0.3, H - 22.5, 4.3, 4.7, hair);
  }
  return p.shapes;
}

function leg(p: Pen, cx: number, cls: string): void {
  p.poly([[cx - 1.3, -0.3], [cx + 1.3, -0.3], [cx + 1.2, STAND_HIP], [cx - 1.3, STAND_HIP]], cls);
  p.poly([[cx - 1.6, 0.4], [cx + 2.0, 0.4], [cx + 2.0, -1.4], [cx - 1.4, -1.6]], `p m-dark ${cls.split(' ').filter((c) => c.startsWith('limb')).join(' ')}`);
}

function arm(p: Pen, x0: number, x1: number, H: number, cls: string): void {
  p.poly([[x0, H - 13], [x1, H - 14.6], [x1 + 0.2, H - 2], [x0 + 0.3, H - 1.4]], cls);
}

function r(n: number): number {
  return Math.round(n * 10) / 10;
}
