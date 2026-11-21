import { InjectionToken } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { AreaId, isAreaId } from './scene/areas';

export interface OfficeFocus {
  area: AreaId | null;

  project: string | null;

  experience: string | null;

  post: string | null;
}

export const OVERVIEW: OfficeFocus = { area: null, project: null, experience: null, post: null };

export const PANEL_DELAY_FRAMES = new InjectionToken<number>('PANEL_DELAY_FRAMES', { providedIn: 'root', factory: () => 2 });

export function readOfficeFocus(office: ActivatedRouteSnapshot): OfficeFocus {
  const child = office.firstChild;
  const area = child?.data['area'];
  if (!isAreaId(area)) return OVERVIEW;
  const param = (name: string) => child?.paramMap.get(name) ?? null;
  return { area, project: param('slug'), experience: param('experience'), post: param('post') };
}

export function sameFocus(a: OfficeFocus, b: OfficeFocus): boolean {
  return a.area === b.area && a.project === b.project && a.experience === b.experience && a.post === b.post;
}

export function focusItem(f: OfficeFocus): string | null {
  return f.project ?? f.experience ?? f.post;
}
