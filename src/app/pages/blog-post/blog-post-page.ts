import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  PendingTasks,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { BlogPostMeta } from '../../../content';
import { BlogService } from '../../core/content/blog.service';
import { ContentService } from '../../core/content/content.service';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { BlogHeader, initialsOf } from '../blog/blog-header';

@Component({
  selector: 'app-blog-post-page',
  imports: [RouterLink, Icon, BlogHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'article-page' },
  templateUrl: './blog-post-page.html',
  styleUrl: './blog-post-page.scss',
})
export class BlogPostPage {
  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly blog = inject(BlogService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly slug = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('post'))), { initialValue: null });

  protected readonly post = computed(() => this.blog.find(this.slug()));
  protected readonly missing = computed(() => !this.post() && this.blog.settled());

  protected readonly more = computed<BlogPostMeta[]>(() => this.blog.posts().filter((p) => p.slug !== this.slug()).slice(0, 3));

  protected readonly author = computed(() => {
    const p = this.content.profile();
    const name = this.content.real(p.name) ?? '';
    const initials = initialsOf(name);
    return { name, title: this.content.real(p.title) ?? '', initials, portrait: p.portrait && this.content.real(p.portrait.src) ? p.portrait : null };
  });

  protected readonly writtenIn = computed(() => {
    const t = this.lang.t();
    const p = this.post();
    return !p || p.lang === this.lang.lang() ? null : t.blog.writtenIn.replace('{language}', t.blog.languageNames[p.lang]);
  });

  protected readonly html = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly progress = signal(0);
  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => clearTimeout(this.copiedTimer));
    void this.blog.refresh();

    const pending = inject(PendingTasks);
    let current = '';
    effect(() => {
      const p = this.post();
      untracked(() => {
        const key = p ? `${p.lang}/${p.slug}/${p.updated}` : '';
        if (key === current) return;
        current = key;
        this.html.set(null);
        this.failed.set(false);
        if (!p) return;
        if (this.isBrowser) this.document.defaultView?.scrollTo({ top: 0 });
        const done = pending.add();
        this.blog
          .body(p)
          .then((html) => current === key && this.html.set(html))
          .catch(() => current === key && this.failed.set(true))
          .finally(done);
      });
    });

    const title = inject(Title);
    const meta = inject(Meta);
    effect(() => {
      const t = this.lang.t();
      const p = this.post();
      const name = this.author().name || t.home.titleFallback;
      const heading = p ? p.title : t.areas.blog.name;
      const description = p?.summary || t.areas.blog.blurb;
      title.setTitle(`${heading} · ${name}`);
      meta.updateTag({ name: 'description', content: description });
      meta.updateTag({ property: 'og:title', content: heading });
      meta.updateTag({ property: 'og:description', content: description });
      meta.updateTag({ property: 'og:type', content: p ? 'article' : 'website' });
    });
    destroyRef.onDestroy(() => {
      meta.removeTag("property='og:title'");
      meta.removeTag("property='og:description'");
      meta.removeTag("property='og:type'");
    });

    if (this.isBrowser) {
      const win = this.document.defaultView!;
      let frame = 0;
      const measure = () => {
        frame = 0;
        const el = this.document.documentElement;
        const max = el.scrollHeight - win.innerHeight;
        this.progress.set(max > 0 ? Math.min(1, win.scrollY / max) : 0);
      };
      const onScroll = () => (frame ||= win.requestAnimationFrame(measure));
      win.addEventListener('scroll', onScroll, { passive: true });
      win.addEventListener('resize', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        win.removeEventListener('scroll', onScroll);
        win.removeEventListener('resize', onScroll);
        if (frame) win.cancelAnimationFrame(frame);
      });
    }
  }

  protected path(p: string): string {
    return this.lang.path(p);
  }

  protected dateOf(iso: string): string {
    return this.blog.date(iso, this.lang.lang());
  }

  protected minutesOf(n: number): string {
    return this.lang.t().blog.minutes.replace('{n}', String(n));
  }

  protected async share(): Promise<void> {
    const p = this.post();
    if (!this.isBrowser || !p) return;
    const url = this.document.location.origin + this.lang.path('/blog/' + p.slug);
    const nav = this.document.defaultView?.navigator;
    try {
      if (nav?.share) {
        await nav.share({ title: p.title, text: p.summary || undefined, url });
        return;
      }
      await nav?.clipboard?.writeText(url);
      this.copied.set(true);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      return;
    }
  }
}
