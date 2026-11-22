import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../core/content/blog.service';
import { ContentService } from '../../core/content/content.service';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { BlogHeader, initialsOf } from './blog-header';

@Component({
  selector: 'app-blog-index-page',
  imports: [RouterLink, Icon, BlogHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-index-page.html',
  styleUrl: './blog-index-page.scss',
})
export class BlogIndexPage {
  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly blog = inject(BlogService);

  protected readonly posts = this.blog.posts;
  protected readonly featured = computed(() => this.posts()[0] ?? null);
  protected readonly rest = computed(() => this.posts().slice(1));
  protected readonly loading = computed(() => !this.posts().length && !this.blog.settled());

  protected readonly author = computed(() => {
    const p = this.content.profile();
    const name = this.content.real(p.name) ?? '';
    return { name, title: this.content.real(p.title) ?? '', initials: initialsOf(name) };
  });

  constructor() {
    void this.blog.refresh();
    const title = inject(Title);
    const meta = inject(Meta);
    effect(() => {
      const t = this.lang.t();
      const name = this.author().name || t.home.titleFallback;
      title.setTitle(`${t.areas.blog.name} · ${name}`);
      meta.updateTag({ name: 'description', content: t.areas.blog.blurb });
      meta.updateTag({ property: 'og:title', content: `${t.areas.blog.name} · ${name}` });
      meta.updateTag({ property: 'og:description', content: t.areas.blog.blurb });
      meta.updateTag({ property: 'og:type', content: 'website' });
    });
    inject(DestroyRef).onDestroy(() => {
      meta.removeTag("property='og:title'");
      meta.removeTag("property='og:description'");
      meta.removeTag("property='og:type'");
    });
  }

  protected postPath(slug: string): string {
    return this.lang.path('/blog/' + slug);
  }

  protected dateOf(iso: string): string {
    return this.blog.date(iso, this.lang.lang());
  }

  protected minutesOf(n: number): string {
    return this.lang.t().blog.minutes.replace('{n}', String(n));
  }
}
