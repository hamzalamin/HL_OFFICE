import { Injectable, InjectionToken, PLATFORM_ID, PendingTasks, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BlogPostMeta, Lang } from '../../../content';
import { BLOG_BODIES, BLOG_POSTS } from '../../../content/blog/generated';
import { LanguageService } from '../i18n/language.service';
import { SHOW_PLACEHOLDERS } from './placeholder';

export interface BlogLiveApi {
  list(): Promise<BlogPostMeta[]>;
  body(slug: string, lang: Lang): Promise<string>;
}

export interface BlogSource {
  posts: BlogPostMeta[];
  bodies: Record<string, () => Promise<string>>;
  live: BlogLiveApi;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

const LIVE_API: BlogLiveApi = {
  list: () => getJson<{ posts: BlogPostMeta[] }>('/api/posts').then((d) => d.posts),
  body: (slug, lang) => getJson<{ html: string }>(`/api/posts?slug=${encodeURIComponent(slug)}&lang=${lang}`).then((d) => d.html),
};

export const BLOG_SOURCE = new InjectionToken<BlogSource>('BLOG_SOURCE', {
  providedIn: 'root',
  factory: () => ({ posts: BLOG_POSTS, bodies: BLOG_BODIES, live: LIVE_API }),
});

const REFRESH_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly language = inject(LanguageService);

  private readonly showDrafts = inject(SHOW_PLACEHOLDERS);
  private readonly source = inject(BLOG_SOURCE);
  private readonly pending = inject(PendingTasks);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly live = signal<BlogPostMeta[] | null>(null);

  private readonly answered = signal(!this.isBrowser);
  readonly settled = this.answered.asReadonly();
  private lastRefresh = 0;
  private inFlight: Promise<void> | null = null;

  private readonly all = computed<BlogPostMeta[]>(() => {
    const live = this.live();
    const files = this.source.posts.filter((p) => p.source === 'file');
    if (!live) return this.source.posts;

    const drafts = this.source.posts.filter((p) => p.source === 'db' && p.draft);
    return [...files, ...drafts, ...live];
  });

  readonly posts = computed<BlogPostMeta[]>(() => {
    const lang = this.language.lang();
    const bySlug = new Map<string, BlogPostMeta>();
    for (const p of this.all()) {
      if (p.draft && !this.showDrafts) continue;
      const seen = bySlug.get(p.slug);
      if (!seen || (seen.lang !== lang && p.lang === lang)) bySlug.set(p.slug, p);
    }
    return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  });

  find(slug: string | null): BlogPostMeta | null {
    return slug ? (this.posts().find((p) => p.slug === slug) ?? null) : null;
  }

  refresh(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    if (this.answered() && Date.now() - this.lastRefresh < REFRESH_MS) return Promise.resolve();
    const done = this.pending.add();
    this.inFlight = this.source.live
      .list()
      .then((posts) => this.live.set(posts))
      .catch(() => {

      })
      .finally(() => {
        this.lastRefresh = Date.now();
        this.inFlight = null;
        this.answered.set(true);
        done();
      });
    return this.inFlight;
  }

  body(post: Pick<BlogPostMeta, 'lang' | 'slug' | 'source' | 'updated'>): Promise<string> {
    const key = `${post.lang}/${post.slug}`;
    const built = this.source.posts.find((p) => p.lang === post.lang && p.slug === post.slug);
    const load = this.source.bodies[key];
    if (load && built && (post.source === 'file' || built.updated === post.updated)) return load();
    if (post.source === 'db' && this.isBrowser) return this.source.live.body(post.slug, post.lang);
    return load ? load() : Promise.reject(new Error(`No body for ${key}`));
  }

  date(iso: string, lang: Lang): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }
}
