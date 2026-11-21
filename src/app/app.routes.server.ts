import { RenderMode, ServerRoute } from '@angular/ssr';
import { CONTENT } from '../content';
import { BLOG_POSTS } from '../content/blog/generated';
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

/** Every published post (drafts stay on the dev server), in both languages. */
function postParams(): Promise<Record<string, string>[]> {
  const slugs = new Set(BLOG_POSTS.filter((p) => !p.draft).map((p) => p.slug));
  return Promise.resolve([...slugs].map((post) => ({ post })));
}

export const serverRoutes: ServerRoute[] = [
  { path: 'projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: projectParams },
  { path: 'fr/projects/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: projectParams },
  { path: 'experience/:experience', renderMode: RenderMode.Prerender, getPrerenderParams: experienceParams },
  { path: 'fr/experience/:experience', renderMode: RenderMode.Prerender, getPrerenderParams: experienceParams },
  { path: 'blog/:post', renderMode: RenderMode.Prerender, getPrerenderParams: postParams },
  { path: 'fr/blog/:post', renderMode: RenderMode.Prerender, getPrerenderParams: postParams },
  { path: '**', renderMode: RenderMode.Prerender },
];
