import { RenderMode, ServerRoute } from '@angular/ssr';
import { CONTENT } from '../content';
import { isProvided } from './core/content/placeholder';

/** Only projects with real content get a prerendered page. */
function projectParams(): Promise<Record<string, string>[]> {
  const slugs = CONTENT.en.projects.filter((p) => isProvided(p.name)).map((p) => ({ slug: p.slug }));
  return Promise.resolve(slugs);
}

/** Every experience gets a prerendered page in the meeting room. */
function experienceParams(): Promise<Record<string, string>[]> {
  return Promise.resolve(CONTENT.en.experience.filter((e) => isProvided(e.role)).map((e) => ({ experience: e.id })));
}

export const serverRoutes: ServerRoute[] = [
  { path: 'projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: projectParams },
  { path: 'fr/projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: projectParams },
  { path: 'experience/:experience', renderMode: RenderMode.Prerender, getPrerenderParams: experienceParams },
  { path: 'fr/experience/:experience', renderMode: RenderMode.Prerender, getPrerenderParams: experienceParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
