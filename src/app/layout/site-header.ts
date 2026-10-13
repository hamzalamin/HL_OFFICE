import { ChangeDetectionStrategy, Component, DOCUMENT, computed, effect, inject, signal } from '@angular/core';
import { IsActiveMatchOptions, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../core/content/content.service';
import { LanguageService } from '../core/i18n/language.service';
import { Icon } from './icon';
import { NAV_ITEMS, NavItem } from './nav-items';

const EXACT: IsActiveMatchOptions = { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' };
const SUBSET: IsActiveMatchOptions = { ...EXACT, paths: 'subset' };

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' },
})
export class SiteHeader {
  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly document = inject(DOCUMENT);

  protected readonly items = NAV_ITEMS;
  protected readonly menuOpen = signal(false);

  /** Brand shows the real name once provided, otherwise a neutral label. */
  protected readonly brand = computed(() => this.content.real(this.content.profile().name) ?? this.lang.t().site.brandFallback);
  protected readonly initials = computed(() => {
    const name = this.content.real(this.content.profile().name);
    if (!name) return '';
    return name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  protected activeOptions(item: NavItem): IsActiveMatchOptions {
    return item.exact ? EXACT : SUBSET;
  }

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));

    // Prevent background scrolling while the mobile menu is open.
    effect(() => {
      this.document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    });
  }
}
