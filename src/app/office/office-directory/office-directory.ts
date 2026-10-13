import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { AREAS } from '../scene/areas';

/**
 * Compact list of the office areas: the conventional alternative to
 * exploring the drawing. Links lead to the same in-office views.
 */
@Component({
  selector: 'app-office-directory',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="list">
      @for (area of areas; track area.id; let i = $index) {
        <li>
          <a [routerLink]="lang.path(area.route)" routerLinkActive="is-active" ariaCurrentWhenActive="location">
            <span class="index" aria-hidden="true">{{ i + 1 }}</span>
            <span class="name">{{ lang.t().areas[area.id].name }}</span>
            <span class="section">{{ lang.t().areas[area.id].section }}</span>
          </a>
        </li>
      }
    </ol>
  `,
  styles: `
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.125rem;
    }
    a {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: 0.75rem;
      align-items: center;
      min-height: 48px;
      padding: 0.375rem 0.75rem 0.375rem 0.5rem;
      border-radius: var(--radius-sm);
      color: var(--color-text);
      text-decoration: none;
      transition: background 150ms ease;
    }
    a:hover {
      background: var(--color-surface-2);
    }
    a.is-active {
      background: var(--color-accent-soft);
    }
    .index {
      grid-row: span 2;
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: var(--color-accent-soft);
      color: var(--color-accent-strong);
      font-size: 0.75rem;
      font-weight: 750;
    }
    a.is-active .index {
      background: var(--color-accent);
      color: var(--color-on-accent);
    }
    .name {
      font-weight: 700;
      font-size: 0.9375rem;
      line-height: 1.25;
    }
    .section {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      line-height: 1.25;
    }
  `,
})
export class OfficeDirectory {
  protected readonly lang = inject(LanguageService);
  protected readonly areas = AREAS;
}
