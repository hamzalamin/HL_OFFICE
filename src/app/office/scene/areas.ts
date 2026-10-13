/**
 * The interactive areas of the office. This is the single place that maps a
 * physical space in the scene to a portfolio section and its URL.
 */

export const AREA_IDS = ['reception', 'workstation', 'projects', 'engineering', 'library', 'lounge'] as const;
export type AreaId = (typeof AREA_IDS)[number];

export interface AreaDef {
  id: AreaId;
  /** Floor rectangle in world units: [x0, y0, x1, y1]. */
  floor: readonly [number, number, number, number];
  /** Height used for the camera framing and the hit area. */
  height: number;
  /** World point the floating label is attached to. */
  label: readonly [number, number, number];
  /** Path of the area in the office (without language prefix). */
  route: string;
}

export const AREAS: readonly AreaDef[] = [
  { id: 'reception', floor: [0, 16, 10, 22], height: 3.5, label: [6.8, 19.2, 2.4], route: '/about' },
  { id: 'workstation', floor: [12, 10.5, 21, 17.5], height: 3.5, label: [16, 12.5, 4.2], route: '/experience' },
  { id: 'projects', floor: [11.2, 0, 30, 8], height: 5, label: [20, 2, 5.6], route: '/projects' },
  { id: 'engineering', floor: [0, 0, 11, 9], height: 5, label: [5.5, 3, 5.8], route: '/engineering' },
  { id: 'library', floor: [0, 9.5, 9, 16], height: 4.5, label: [1.6, 13.2, 4.9], route: '/cv' },
  { id: 'lounge', floor: [22, 11, 30, 22], height: 3, label: [26, 15.5, 3.6], route: '/contact' },
];

export const AREA_BY_ID: Record<AreaId, AreaDef> = Object.fromEntries(AREAS.map((a) => [a.id, a])) as Record<AreaId, AreaDef>;

export function isAreaId(value: unknown): value is AreaId {
  return typeof value === 'string' && (AREA_IDS as readonly string[]).includes(value);
}

/** World dimensions of the office floor. */
export const OFFICE = { w: 30, d: 22, wallH: 6 } as const;

/** Scene viewBox (screen units). */
export const VIEWBOX = { w: 960, h: 720 } as const;
