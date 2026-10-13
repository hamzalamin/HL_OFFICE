import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentService } from '../core/content/content.service';
import { LanguageService } from '../core/i18n/language.service';
import { OfficeDirectory } from '../office/office-directory/office-directory';
import { AREA_BY_ID } from '../office/scene/areas';
import { Icon } from './icon';

/**
 * Discreet global actions only: the office itself is the navigation. The
 * brand returns to the office overview; the directory is the conventional
 * alternative to exploring the drawing.
 */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Icon, OfficeDirectory],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SiteHeader {
  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toggle = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');

  protected readonly cvPath = AREA_BY_ID.library.route;
  protected readonly directoryOpen = signal(false);

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

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.directoryOpen.set(false));
  }

  /** Escape closes the directory first (and nothing else). */
  protected onEscape(event: Event): void {
    if (!this.directoryOpen()) return;
    event.preventDefault();
    this.directoryOpen.set(false);
    this.toggle().nativeElement.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.directoryOpen() && !this.host.nativeElement.contains(event.target as Node)) this.directoryOpen.set(false);
  }
}
