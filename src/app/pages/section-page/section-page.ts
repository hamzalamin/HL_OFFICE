import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { UiStrings } from '../../core/i18n/ui-strings';
import { Icon } from '../../layout/icon';

/**
 * Temporary section page shell. Phase 4 replaces it with dedicated pages;
 * it already gives every navigation target a real, routable page.
 */
@Component({
  selector: 'app-section-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="page">
      <a class="back" [routerLink]="lang.path('/')"><app-icon name="arrow-left" />{{ lang.t().page.backToOffice }}</a>
      <h1>{{ title() }}</h1>
      <div class="empty">
        <p class="empty-title">{{ lang.t().page.emptyTitle }}</p>
        <p>{{ lang.t().page.emptyText }}</p>
      </div>
    </article>
  `,
  styles: `
    .page { max-width: 880px; margin: 0 auto; padding: clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem); display: grid; gap: 1.25rem; }
    .back { display: inline-flex; align-items: center; gap: .4rem; width: fit-content; font-weight: 650; text-decoration: none; }
    .back svg { width: 1rem; height: 1rem; }
    h1 { font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 800; }
    .empty { padding: 2rem; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); color: var(--color-text-muted); }
    .empty-title { font-weight: 700; color: var(--color-text); }
  `,
})
export class SectionPage {
  readonly section = input<keyof UiStrings['nav']>('home');
  protected readonly lang = inject(LanguageService);
  protected readonly title = computed(() => this.lang.t().nav[this.section()]);
}
