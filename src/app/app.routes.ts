import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { AREAS } from './office/scene/areas';

/**
 * Every section of the portfolio is a place in the office. The office (Home)
 * is a single parent route whose children carry no component: moving between
 * areas only changes the camera and the panel, so the office is never torn
 * down. Each area and each project still has its own URL for sharing,
 * history and prerendering. See `readOfficeFocus` for how they are read.
 */
const officeRoutes: Routes = [
  { path: '', pathMatch: 'full', children: [] },
  ...AREAS.map((a) => ({ path: a.route.slice(1), data: { area: a.id }, children: [] })),
  { path: 'projects/:slug', data: { area: 'projects' }, children: [] },
];

/** English at the root, French under /fr (see LanguageService). */
const languageRoutes: Routes = [{ path: '', component: Home, children: officeRoutes }];

export const routes: Routes = [
  { path: 'fr', children: languageRoutes },
  { path: '', children: languageRoutes },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
