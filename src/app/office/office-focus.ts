import { ActivatedRouteSnapshot } from '@angular/router';
import { AreaId, isAreaId } from './scene/areas';

/** What the office is looking at: the overview, an area, or one item in it. */
export interface OfficeFocus {
  area: AreaId | null;
  /** Project slug, only within the project area. */
  project: string | null;
  /** Experience id, only within the meeting room. */
  experience: string | null;
}

export const OVERVIEW: OfficeFocus = { area: null, project: null, experience: null };

/** Reads the focus from the office route's (componentless) child route. */
export function readOfficeFocus(office: ActivatedRouteSnapshot): OfficeFocus {
  const child = office.firstChild;
  const area = child?.data['area'];
  if (!isAreaId(area)) return OVERVIEW;
  return { area, project: child?.paramMap.get('slug') ?? null, experience: child?.paramMap.get('experience') ?? null };
}

export function sameFocus(a: OfficeFocus, b: OfficeFocus): boolean {
  return a.area === b.area && a.project === b.project && a.experience === b.experience;
}

/** The opened item (project or experience), if any. */
export function focusItem(f: OfficeFocus): string | null {
  return f.project ?? f.experience;
}
