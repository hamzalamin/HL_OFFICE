import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { AREAS } from './office/scene/areas';

const officeRoutes: Routes = [
  { path: '', pathMatch: 'full', children: [] },
  ...AREAS.filter((a) => a.id !== 'blog').map((a) => ({ path: a.route.slice(1), data: { area: a.id }, children: [] })),
  { path: 'projects/:slug', data: { area: 'projects' }, children: [] },
  { path: 'experience/:experience', data: { area: 'meeting' }, children: [] },
];

const languageRoutes: Routes = [
  { path: 'blog', loadComponent: () => import('./pages/blog/blog-index-page').then((m) => m.BlogIndexPage) },
  { path: 'blog/:post', loadComponent: () => import('./pages/blog-post/blog-post-page').then((m) => m.BlogPostPage) },
  { path: '', component: Home, children: officeRoutes },
];

export const routes: Routes = [

  { path: 'write', loadComponent: () => import('./pages/write/write').then((m) => m.Write) },
  { path: 'fr', children: languageRoutes },
  { path: '', children: languageRoutes },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
