import { ActivatedRouteSnapshot } from '@angular/router';
import { AreaId, isAreaId } from './scene/areas';

/** What the office is looking at: the overview, an area, or one project in it. */
export interface OfficeFocus {
  area: AreaId | null;
  /** Project slug, only within the project area. */
  project: string | null;
}

export const OVERVIEW: OfficeFocus = { area: null, project: null };

/** Reads the focus from the office route's (componentless) child route. */
export function readOfficeFocus(office: ActivatedRouteSnapshot): OfficeFocus {
  const child = office.firstChild;
  const area = child?.data['area'];
  if (!isAreaId(area)) return OVERVIEW;
  return { area, project: child?.paramMap.get('slug') ?? null };
}

export function sameFocus(a: OfficeFocus, b: OfficeFocus): boolean {
  return a.area === b.area && a.project === b.project;
}
