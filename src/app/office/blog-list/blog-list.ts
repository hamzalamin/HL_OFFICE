import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../core/content/blog.service';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';

/** The blog's posts in the room's folio, newest first; each opens in the reading sheet. */
@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
})
export class BlogList {
  protected readonly lang = inject(LanguageService);
  private readonly blog = inject(BlogService);
  protected readonly posts = this.blog.posts;

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
