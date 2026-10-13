import { RenderMode, ServerRoute } from '@angular/ssr';
import { CONTENT } from '../content';
import { isProvided } from './core/content/placeholder';

/** Only projects with real content get a prerendered page. */
function projectParams(): Promise<Record<string, string>[]> {
  const slugs = CONTENT.en.projects.filter((p) => isProvided(p.name)).map((p) => ({ slug: p.slug }));
  return Promise.resolve(slugs);
}

export const serverRoutes: ServerRoute[] = [
  { path: 'projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: projectParams },
  { path: 'fr/projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: projectParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
