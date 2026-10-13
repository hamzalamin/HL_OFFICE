import { Bounds, Point, SceneObject, footprint, project, screenRect } from '../engine/iso';
import { depthSort } from '../engine/depth-sort';
import { AREAS, AreaDef, AreaId, OFFICE } from './areas';
import * as F from './furniture';

/**
 * The composition of the office: which furniture stands where. The result is
 * computed once at module load and is pure data, so it renders identically on
 * the server (prerender) and in the browser.
 */

/** Boards on the back wall of the project area, one per project: [x0, x1]. */
const PROJECT_BOARDS = [
  [13, 17],
  [18, 22],
  [23, 27],
] as const;
const BOARD_Z = [2.2, 4.8] as const;

function furnish(id: AreaId): SceneObject[] {
  switch (id) {
    case 'engineering':
      return [
        F.rug(0.3, 0.3, 10.8, 8.8, 'carpet-eng', false),
        F.whiteboardOnY(1.6, 7.2, 1.9, 4.5),
        F.displayOnX(2.2, 6.6, 2, 4.6, 'slides'),
        F.cabinet(7.8, 0.15, 2.6, 0.9, 1.3, 'white', 's'),
        F.plant(9.6, 0.2, 'bush', 1.3),
        F.chair(3.6, 2, 's', 'fabric-blue'),
        F.chair(5.4, 2, 's', 'fabric-blue'),
        F.chair(7.2, 2, 's', 'fabric-blue'),
        F.meetingTable(3, 3, 5.6, 2.6),
        F.laptop(4.1, 3.4, 1.25),
        F.notebook(6.3, 3.9, 1.25),
        F.mug(7.6, 4.2, 1.25),
        F.chair(8.9, 3.9, 'w', 'fabric-blue'),
        F.chair(3.6, 5.85, 'n', 'fabric-blue'),
        F.chair(5.4, 5.85, 'n', 'fabric-blue'),
        F.chair(7.2, 5.85, 'n', 'fabric-blue'),
        F.plant(0.4, 7.6, 'tall'),
        F.glassWall('y', 11, 0, 8.92, 4.2),
        F.glassWall('x', 8.92, 0, 7.4, 4.2),
        F.glassWall('x', 8.92, 9.6, 11.08, 4.2),
      ];
    case 'projects':
      return [
        ...PROJECT_BOARDS.map(([x0, x1], i) => F.projectBoardOnY(x0, x1, BOARD_Z[0], BOARD_Z[1], i)),
        F.cabinet(13, 0.1, 14, 0.9, 1.3, 'wood', 's'),
        F.plant(14, 0.25, 'bush', 1.3),
        F.plant(25.4, 0.25, 'bush', 1.3),
        F.papers(19.6, 0.25, 1.3, 0.5, 0.6, 4),
        F.plant(28.5, 0.5, 'tall'),
        F.plant(12, 0.5, 'snake'),
        F.desk(14, 3.6, 12, 2.2, { modesty: true }),
        F.monitor(15.3, 3.7, 1.25, 's', 'board'),
        F.monitor(19.3, 3.7, 1.25, 's', 'app'),
        F.monitor(23.3, 3.7, 1.25, 's', 'docs'),
        F.notebook(17.4, 4.4, 1.25),
        F.mug(21.6, 4.6, 1.25, 'mug-accent'),
        F.chair(15.6, 6.1, 'n'),
        F.chair(19.6, 6.1, 'n'),
        F.chair(23.6, 6.1, 'n'),
      ];
    case 'library':
      return [
        F.rug(1.4, 10.6, 7.6, 15.4, 'rug-library'),
        F.bookshelfOnLeftWall(9.8, 4.2, 4.4, 4, 7),
        F.frameOnX(14.5, 15.6, 2.6, 4),
        F.frameOnX(14.5, 15.6, 0.9, 2.3),
        F.sofa(3.2, 11.3, 1.5, 1.5, 'w', 'fabric-terracotta'),
        F.floorLamp(3.4, 13.3),
        F.table(5.4, 11.5, 1, 1, 1, 'wood'),
        F.bookStack(5.55, 11.7, 1),
        F.plant(0.5, 15.2, 'snake'),
      ];
    case 'workstation':
      return [
        F.rug(12.6, 11.2, 20.4, 17.2, 'rug-desk'),
        F.partition('x', 10.6, 12.4, 20.6, 2.4, 'fabric-teal'),
        F.pinboardOnPartition(10.78, 17.2, 20.2, 1.5, 2.3),
        F.desk(13.4, 11.4, 5.6, 2.2, { modesty: true }),
        F.deskLamp(13.6, 11.6, 1.25),
        F.monitor(14.4, 11.5, 1.25, 's', 'app'),
        F.monitor(15.9, 11.5, 1.25, 's', 'docs'),
        F.laptop(17.6, 12.2, 1.25),
        F.headphones(14.2, 12.8, 1.25),
        F.mug(17.2, 13, 1.25, 'mug-accent'),
        F.cabinet(19.2, 11.5, 1, 1.9, 1.2, 'white', 'e'),
        F.plant(19.4, 11.8, 'bush', 1.2),
        F.chair(15.3, 14.2, 'n', 'fabric-dark'),
        F.plant(12.6, 15.9, 'tall'),
      ];
    case 'lounge':
      return [
        F.rug(23, 14, 29.4, 20.4, 'rug-lounge'),
        ...F.kitchenette(23.2, 11.3, 5.6, 1.2),
        F.sofa(23.3, 14.6, 1.7, 4.6, 'e', 'fabric-sand'),
        F.table(25.6, 15.8, 1.8, 2.2, 0.75, 'wood'),
        F.mug(26, 16.3, 0.75),
        F.mug(26.6, 17.2, 0.75, 'mug-accent'),
        F.sofa(28, 15.4, 1.5, 1.5, 'w', 'fabric-teal'),
        F.sofa(28, 17.4, 1.5, 1.5, 'w', 'fabric-teal'),
        F.plant(29.1, 11.4, 'tall'),
        F.plant(23.2, 20.6, 'snake'),
      ];
    case 'reception':
      return [
        F.rug(0.1, 17.8, 2, 20.9, 'mat', false),
        F.doorOnX(18, 20.7, 4),
        F.plant(4.3, 16.4, 'bush'),
        F.monitor(6.4, 17.22, 1.26, 'n', 'standby', 1.1),
        ...F.receptionCounter(4.2, 17.2, 4.6, 1.4),
        F.papers(4.8, 17.85, 1.85, 0.55, 0.45, 3),
        F.plant(9.1, 16.6, 'tall'),
        F.sofa(4.3, 20.4, 3.4, 1.3, 'n', 'fabric-blue'),
        F.plant(0.4, 21.1, 'tall'),
      ];
  }
}

/** Decorative pieces outside the interactive areas. */
function decor(): SceneObject[] {
  return [
    F.windowOnX(16.6, 17.6, 1.3, 4.6, 1),
    F.windowOnY(28.6, 29.8, 1.3, 4.6, 1),
    F.plant(10.2, 9.2, 'bush'),
    F.plant(21.2, 9.3, 'snake'),
  ];
}

export interface RenderGroup {
  key: string;
  area?: AreaDef;
  objects: SceneObject[];
  /** Floor footprint polygon (areas only): highlight and pointer target. */
  footprint?: string;
}

export interface AreaGeometry {
  id: AreaId;
  /** Screen-space rectangle framing the area, used by the camera. */
  frame: { x: number; y: number; w: number; h: number };
  /** Label anchor in screen units. */
  label: { x: number; y: number };
}

/** A project board: the camera frames it and it can be selected directly. */
export interface ProjectSlot {
  /** Screen-space rectangle framing the board and the monitor below it. */
  frame: { x: number; y: number; w: number; h: number };
  /** Board face polygon, used as the pointer target and highlight. */
  hit: string;
  /** Label anchor above the board, in screen units. */
  pin: { x: number; y: number };
}

export interface OfficeModel {
  shell: SceneObject[];
  groups: RenderGroup[];
  areas: Record<AreaId, AreaGeometry>;
  /** Screen-space rectangle framing the whole office for the overview. */
  overview: { x: number; y: number; w: number; h: number };
  /** Project boards, in content order: project N is shown on board N. */
  projectSlots: ProjectSlot[];
}

function polygon(points: Point[]): string {
  return points.map(([a, b]) => `${Math.round(a * 10) / 10},${Math.round(b * 10) / 10}`).join(' ');
}

function projectSlot([x0, x1]: readonly [number, number]): ProjectSlot {
  const [z0, z1] = BOARD_Z;
  const [px, py] = project((x0 + x1) / 2, 0, z1);
  return {
    frame: screenRect({ x: x0, y: 0, z: 1.2, w: x1 - x0, d: 3.8, h: z1 - 1.2 }),
    hit: polygon([project(x0, 0.06, z0), project(x1, 0.06, z0), project(x1, 0.06, z1), project(x0, 0.06, z1)]),
    pin: { x: px, y: py },
  };
}

function areaBounds(a: AreaDef): Bounds {
  const [x0, y0, x1, y1] = a.floor;
  return { x: x0, y: y0, z: 0, w: x1 - x0, d: y1 - y0, h: a.height };
}

function unionBounds(list: Bounds[]): Bounds {
  const x = Math.min(...list.map((b) => b.x));
  const y = Math.min(...list.map((b) => b.y));
  const z = Math.min(...list.map((b) => b.z));
  return {
    x,
    y,
    z,
    w: Math.max(...list.map((b) => b.x + b.w)) - x,
    d: Math.max(...list.map((b) => b.y + b.d)) - y,
    h: Math.max(...list.map((b) => b.z + b.h)) - z,
  };
}

export function buildOffice(): OfficeModel {
  const shell = [F.floorSlab(OFFICE.w, OFFICE.d), ...F.backWalls(OFFICE.w, OFFICE.d, OFFICE.wallH)];

  const groups: (RenderGroup & { bounds: Bounds })[] = [];
  for (const area of AREAS) {
    const [x0, y0, x1, y1] = area.floor;
    const objects = depthSort(furnish(area.id));
    groups.push({ key: area.id, area, objects, footprint: footprint(x0, y0, x1, y1), bounds: areaBounds(area) });
  }
  decor().forEach((o, i) => groups.push({ key: `decor-${i}`, objects: [o], bounds: o.bounds }));

  const areas = {} as Record<AreaId, AreaGeometry>;
  for (const g of groups) {
    if (!g.area) continue;
    const frame = screenRect(unionBounds([g.bounds, ...g.objects.map((o) => o.bounds)]));
    const [lx, ly, lz] = g.area.label;
    const [sx, sy] = project(lx, ly, lz);
    areas[g.area.id] = { id: g.area.id, frame, label: { x: sx, y: sy } };
  }

  // The overview frames the floor and everything on it. The empty top of the
  // back walls and the front tip of the slab may run off-screen, so the
  // office itself gets as much of the screen as possible.
  const overview = screenRect({ x: -0.45, y: -0.45, z: -0.2, w: OFFICE.w + 0.45, d: OFFICE.d + 0.45, h: 5.2 });

  return { shell, groups: depthSort(groups), areas, overview, projectSlots: PROJECT_BOARDS.map(projectSlot) };
}

export const OFFICE_MODEL: OfficeModel = buildOffice();
