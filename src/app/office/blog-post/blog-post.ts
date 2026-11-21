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
  input,
  signal,
  untracked,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { BlogPostMeta } from '../../../content';
import { BlogService } from '../../core/content/blog.service';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';

@Component({
  selector: 'app-blog-post',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'blog-post' },
  template: `
    @let t = lang.t();
    @let p = post();
    <p class="blog-post-meta">
      <time [attr.datetime]="p.date">{{ date() }}</time>
      <span aria-hidden="true">·</span>
      <span>{{ t.blog.minutes.replace('{n}', '' + p.minutes) }}</span>
      @if (p.draft) {
        <span class="blog-post-draft">{{ t.blog.draft }}</span>
      }
    </p>
    @if (writtenIn(); as note) {
      <p class="blog-post-note">{{ note }}</p>
    }

    @if (html(); as body) {
      <div class="blog-post-prose" [attr.lang]="p.lang" [innerHTML]="body"></div>
    } @else if (failed()) {
      <p class="blog-post-note" role="alert">{{ t.blog.loadError }}</p>
    } @else {
      <div class="blog-post-loading" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    }

    <footer class="blog-post-foot">
      @if (p.tags.length) {
        <ul class="blog-post-tags">
          @for (tag of p.tags; track tag) {
            <li>#{{ tag }}</li>
          }
        </ul>
      }
      <button type="button" class="btn btn-secondary blog-post-share" (click)="share()">
        <app-icon [name]="copied() ? 'check' : 'share'" />
        {{ copied() ? t.blog.copied : t.blog.share }}
      </button>
    </footer>
  `,
  styles: `
    .blog-post {
      display: grid;
      gap: 1.25rem;
    }
    .blog-post-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-top: -0.25rem;
      font-size: 0.875rem;
      font-weight: 650;
      font-variant-numeric: tabular-nums;
      color: var(--ink-muted);
    }
    .blog-post-draft {
      padding: 0 0.4375rem;
      border: 1px dashed var(--stone-strong);
      border-radius: var(--radius-xs);
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .blog-post-note {
      padding: 0.625rem 0.875rem;
      border-left: 3px solid var(--ochre-soft);
      background: color-mix(in oklab, var(--ochre-soft), transparent 55%);
      font-size: 0.9375rem;
    }

    .blog-post-prose {
      display: grid;
      gap: 1rem;
      overflow-wrap: break-word;

      h2,
      h3,
      h4,
      h5,
      h6 {
        margin-top: 0.75rem;
        line-height: 1.25;
        letter-spacing: -0.02em;
      }
      h2 {
        font-size: 1.5rem;
        font-weight: 800;
      }
      h3 {
        font-size: 1.25rem;
        font-weight: 750;
      }
      h4,
      h5,
      h6 {
        font-size: 1.0625rem;
        font-weight: 750;
      }
      ul,
      ol {
        display: grid;
        gap: 0.375rem;
        margin: 0;
        padding-left: 1.375rem;
      }
      li::marker {
        color: var(--terracotta);
      }
      a {
        font-weight: 650;
        text-underline-offset: 3px;
      }
      blockquote {
        margin: 0;
        padding: 0.25rem 0 0.25rem 1.125rem;
        border-left: 3px solid var(--terracotta);
        color: var(--ink-muted);
        font-style: italic;
      }
      code {
        padding: 0.0625rem 0.3125rem;
        border-radius: var(--radius-xs);
        background: var(--paper-2);
        font-size: 0.875em;
      }
      pre {
        margin: 0;
        padding: 0.875rem 1rem;
        border: 1px solid var(--stone);
        border-radius: var(--radius-sm);
        background: var(--paper-2);
        overflow-x: auto;
        line-height: 1.5;

        code {
          padding: 0;
          background: none;
        }
      }
      img {
        display: block;
        max-width: 100%;
        height: auto;
        border-radius: var(--radius-sm);
      }
      hr {
        width: 100%;
        border: 0;
        border-top: 1px solid var(--stone);
      }
      table {
        border-collapse: collapse;
        font-size: 0.9375rem;
      }
      th,
      td {
        padding: 0.375rem 0.625rem;
        border: 1px solid var(--stone);
        text-align: left;
      }
    }

    .blog-post-loading {
      display: grid;
      gap: 0.75rem;

      i {
        display: block;
        height: 0.875rem;
        border-radius: 3px;
        background: var(--paper-2);
      }
      i:last-child {
        width: 60%;
      }
    }

    .blog-post-foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 0.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--stone);
    }
    .blog-post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 0.875rem;
      font-weight: 650;
      color: var(--terracotta);
    }
    .blog-post-share {
      margin-left: auto;
      min-height: 40px;
      padding: 0.5rem 0.875rem;
      font-size: 0.875rem;
    }
  `,
})
export class BlogPostView {
  readonly post = input.required<BlogPostMeta>();

  protected readonly lang = inject(LanguageService);
  private readonly blog = inject(BlogService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly html = signal<string | null>(null);
  protected readonly failed = signal(false);

  protected readonly date = computed(() => this.blog.date(this.post().date, this.lang.lang()));

  protected readonly writtenIn = computed(() => {
    const t = this.lang.t();
    const p = this.post();
    return p.lang === this.lang.lang() ? null : t.blog.writtenIn.replace('{language}', t.blog.languageNames[p.lang]);
  });

  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => clearTimeout(this.copiedTimer));

    const pending = inject(PendingTasks);
    let current = '';
    effect(() => {
      const p = this.post();
      untracked(() => {
        const key = `${p.lang}/${p.slug}/${p.updated}`;
        current = key;
        this.html.set(null);
        this.failed.set(false);
        const done = pending.add();
        this.blog
          .body(p)
          .then((html) => current === key && this.html.set(html))
          .catch(() => current === key && this.failed.set(true))
          .finally(done);
      });
    });
  }

  protected async share(): Promise<void> {
    if (!this.isBrowser) return;
    const url = this.document.location.origin + this.lang.path('/blog/' + this.post().slug);
    const nav = this.document.defaultView?.navigator;
    try {
      if (nav?.share) {
        await nav.share({ title: this.post().title, text: this.post().summary || undefined, url });
        return;
      }
      await nav?.clipboard?.writeText(url);
      this.copied.set(true);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
    } catch {

    }
  }
}
