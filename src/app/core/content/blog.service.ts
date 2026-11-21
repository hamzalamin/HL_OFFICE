import { Injectable, InjectionToken, computed, inject } from '@angular/core';
import { BlogPostMeta, Lang } from '../../../content';
import { BLOG_BODIES, BLOG_POSTS } from '../../../content/blog/generated';
import { LanguageService } from '../i18n/language.service';
import { SHOW_PLACEHOLDERS } from './placeholder';

/** Where the posts come from: the generated data, replaceable in tests. */
export interface BlogSource {
  posts: BlogPostMeta[];
  bodies: Record<string, () => Promise<string>>;
}

export const BLOG_SOURCE = new InjectionToken<BlogSource>('BLOG_SOURCE', {
  providedIn: 'root',
  factory: () => ({ posts: BLOG_POSTS, bodies: BLOG_BODIES }),
});

/**
 * The blog, in the current language. Posts are written in Markdown
 * (src/content/blog/<lang>/<slug>.md) and turned into data by
 * scripts/blog.mjs. A post written in one language only is shown to
 * visitors of the other language too, in its own language.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly language = inject(LanguageService);
  /** Drafts are shown with the placeholders: on the dev server, never to visitors. */
  private readonly showDrafts = inject(SHOW_PLACEHOLDERS);
  private readonly source = inject(BLOG_SOURCE);

  /** One entry per post, newest first: the current language's version, or the other one. */
  readonly posts = computed<BlogPostMeta[]>(() => {
    const lang = this.language.lang();
    const bySlug = new Map<string, BlogPostMeta>();
    for (const p of this.source.posts) {
      if (p.draft && !this.showDrafts) continue;
      const seen = bySlug.get(p.slug);
      if (!seen || (seen.lang !== lang && p.lang === lang)) bySlug.set(p.slug, p);
    }
    return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  });

  find(slug: string | null): BlogPostMeta | null {
    return slug ? (this.posts().find((p) => p.slug === slug) ?? null) : null;
  }

  /** The post's HTML (converted from Markdown at build time), loaded on demand. */
  body(post: Pick<BlogPostMeta, 'lang' | 'slug'>): Promise<string> {
    const load = this.source.bodies[`${post.lang}/${post.slug}`];
    return load ? load() : Promise.reject(new Error(`No body for ${post.lang}/${post.slug}`));
  }

  /** e.g. "21 November 2026", the same on the server and in every time zone. */
  date(iso: string, lang: Lang): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }
}
