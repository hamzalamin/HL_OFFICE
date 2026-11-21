import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

interface StoredPost {
  slug: string;
  lang: 'en' | 'fr';
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body: string;
  draft: boolean;
}

interface Draft extends StoredPost {

  tagText: string;

  existing: boolean;
}

const API = '/api/blog';
const PASSWORD_KEY = 'blog.write.password';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(text: string, partial = false): string {
  const s = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 80);
  return partial ? s : s.replace(/-+$/, '');
}

function blank(): Draft {
  return { slug: '', lang: 'en', title: '', date: today(), summary: '', tags: [], tagText: '', body: '', draft: true, existing: false };
}

@Component({
  selector: 'app-write',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './write.html',
  styleUrl: './write.scss',
})
export class Write {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly password = signal('');
  protected readonly unlocked = signal(false);
  protected readonly posts = signal<StoredPost[]>([]);
  protected readonly post = signal<Draft>(blank());

  private slugTouched = false;

  protected readonly busy = signal(false);
  protected readonly message = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);
  protected readonly tab = signal<'write' | 'preview'>('write');
  protected readonly preview = signal('');

  protected readonly canSave = computed(() => {
    const p = this.post();
    return !this.busy() && !!p.title.trim() && !!p.slug && !!p.body.trim() && /^\d{4}-\d{2}-\d{2}$/.test(p.date);
  });

  constructor() {
    inject(Title).setTitle('Write');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });

    if (this.isBrowser) {
      try {
        const saved = sessionStorage.getItem(PASSWORD_KEY);
        if (saved) {
          this.password.set(saved);
          void this.unlock();
        }
      } catch {

      }
    }

    effect(() => {
      if (this.tab() !== 'preview') return;
      const body = this.post().body;
      void this.render(body).then((html) => this.preview.set(html));
    });
  }

  private async render(body: string): Promise<string> {
    const { Marked } = await import('marked');
    const marked = new Marked({
      renderer: {
        heading({ tokens, depth }) {
          const level = Math.min(depth + 1, 6);
          return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>`;
        },
      },
    });
    return marked.parse(body, { async: false });
  }

  private async call(method: 'GET' | 'POST' | 'DELETE', query = '', body?: unknown): Promise<{ posts?: StoredPost[]; rebuilding?: boolean }> {
    const res = await fetch(API + query, {
      method,
      headers: { authorization: `Bearer ${this.password()}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      this.lock();
      throw new Error('Wrong password.');
    }
    if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
    return data;
  }

  protected async unlock(): Promise<void> {
    if (!this.password()) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const data = await this.call('GET');
      this.posts.set(data.posts ?? []);
      this.unlocked.set(true);
      try {
        sessionStorage.setItem(PASSWORD_KEY, this.password());
      } catch {

      }
    } catch (e) {
      this.message.set({ kind: 'error', text: (e as Error).message });
    } finally {
      this.busy.set(false);
    }
  }

  protected lock(): void {
    this.unlocked.set(false);
    this.password.set('');
    try {
      sessionStorage.removeItem(PASSWORD_KEY);
    } catch {

    }
  }

  protected val(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected newPost(): void {
    this.post.set(blank());
    this.slugTouched = false;
    this.tab.set('write');
    this.message.set(null);
  }

  protected edit(p: StoredPost): void {
    this.post.set({ ...p, tagText: p.tags.join(', '), existing: true });
    this.slugTouched = true;
    this.tab.set('write');
    this.message.set(null);
  }

  protected update<K extends keyof Draft>(key: K, value: Draft[K]): void {
    this.post.update((p) => {
      const next = { ...p, [key]: value };
      if (key === 'title' && !p.existing && !this.slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  protected updateSlug(value: string): void {
    this.slugTouched = true;
    this.post.update((p) => ({ ...p, slug: slugify(value, true) }));
  }

  protected async save(publish: boolean): Promise<void> {
    if (!this.canSave()) return;
    const p = this.post();
    const payload: StoredPost = {
      slug: slugify(p.slug),
      lang: p.lang,
      title: p.title.trim(),
      date: p.date,
      summary: p.summary.trim(),
      tags: p.tagText
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      body: p.body,
      draft: !publish,
    };
    const replacing = !p.existing && this.posts().some((x) => x.slug === payload.slug && x.lang === payload.lang);
    if (replacing && !confirm(`A post "${payload.lang}/${payload.slug}" already exists. Replace it?`)) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const res = await this.call('POST', '', { post: payload });
      this.posts.set((await this.call('GET')).posts ?? []);
      this.post.set({ ...payload, tagText: payload.tags.join(', '), existing: true });
      this.message.set({ kind: 'ok', text: this.savedText(publish, !!res.rebuilding) });
    } catch (e) {
      this.message.set({ kind: 'error', text: (e as Error).message });
    } finally {
      this.busy.set(false);
    }
  }

  private savedText(published: boolean, rebuilding: boolean): string {
    if (!published) return 'Draft saved. It is not visible on the site.';
    return rebuilding
      ? 'Published: it is on the blog now. The site is also rebuilding to give it its own prerendered page.'
      : 'Published: it is on the blog now (within about 10 seconds).';
  }

  protected async remove(): Promise<void> {
    const p = this.post();
    if (!p.existing || !confirm(`Delete "${p.title}" (${p.lang})? This cannot be undone.`)) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      await this.call('DELETE', `?slug=${encodeURIComponent(p.slug)}&lang=${p.lang}`);
      this.posts.set((await this.call('GET')).posts ?? []);
      this.newPost();
      this.message.set({ kind: 'ok', text: 'Deleted: it is gone from the blog (within about 10 seconds).' });
    } catch (e) {
      this.message.set({ kind: 'error', text: (e as Error).message });
    } finally {
      this.busy.set(false);
    }
  }

  protected liveUrl(p: Pick<StoredPost, 'slug' | 'lang'>): string {
    return (p.lang === 'fr' ? '/fr' : '') + '/blog/' + p.slug;
  }
}
