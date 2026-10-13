import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

/**
 * The same section routes are mounted twice: English at the root and French
 * under /fr. The language is derived from the URL (see LanguageService).
 */
const sectionRoutes: Routes = [
  { path: '', component: Home },
  { path: 'about', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'about' } },
  { path: 'skills', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'skills' } },
  { path: 'experience', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'experience' } },
  { path: 'projects', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'projects' } },
  { path: 'projects/:slug', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'projects' } },
  { path: 'engineering', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'engineering' } },
  { path: 'education', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'education' } },
  { path: 'contact', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'contact' } },
  { path: 'cv', loadComponent: () => import('./pages/section-page/section-page').then((m) => m.SectionPage), data: { section: 'cv' } },
];

export const routes: Routes = [
  { path: 'fr', children: sectionRoutes },
  { path: '', children: sectionRoutes },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
