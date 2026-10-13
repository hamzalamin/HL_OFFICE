import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Lang } from '../../content';
import { ContentService } from '../core/content/content.service';
import { LANGS, LanguageService } from '../core/i18n/language.service';
import { Icon } from './icon';

/**
 * The only global controls: language and, once the file exists, the CV.
 * Small floating icons in the top-right corner; the office is the navigation.
 */
@Component({
  selector: 'app-global-actions',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    @let t = lang.t().site;
    <div class="actions">
      <div class="lang">
        <button
          #langButton
          type="button"
          class="action"
          [attr.aria-label]="t.language + ': ' + t.languages[lang.lang()]"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="language-menu"
          (click)="menuOpen.set(!menuOpen())"
        >
          <app-icon name="globe" />
        </button>
        <span class="tooltip" aria-hidden="true">{{ t.language }}</span>
        <ul id="language-menu" class="menu" [class.is-open]="menuOpen()" [attr.inert]="menuOpen() ? null : ''" [attr.aria-label]="t.language">
          @for (l of langs; track l) {
            <li>
              <a
                [routerLink]="lang.switchUrl(l)"
                [attr.hreflang]="l"
                [attr.lang]="l"
                [attr.aria-current]="l === lang.lang() ? 'true' : null"
                [class.is-current]="l === lang.lang()"
              >
                <span>{{ t.languages[l] }}</span>
                @if (l === lang.lang()) {
                  <app-icon name="check" />
                }
              </a>
            </li>
          }
        </ul>
      </div>

      @if (cvFile(); as file) {
        <div class="cv">
          <a class="action" [href]="'/' + file" download [attr.aria-label]="t.downloadCv">
            <app-icon name="download" />
          </a>
          <span class="tooltip" aria-hidden="true">{{ t.downloadCv }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 60;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .lang,
    .cv {
      position: relative;
    }
    .action {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid var(--color-border);
      background: color-mix(in oklab, var(--color-surface), transparent 6%);
      backdrop-filter: blur(6px);
      color: var(--color-text);
      box-shadow: var(--shadow-pin);
      cursor: pointer;
      transition:
        background 150ms ease,
        color 150ms ease,
        transform 180ms var(--ease-out);
    }
    .action svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .action:hover,
    .action[aria-expanded='true'] {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-on-accent);
    }
    .action:hover {
      transform: translateY(-1px);
    }
    .action:focus-visible {
      outline: 3px solid var(--color-focus);
      outline-offset: 3px;
    }
    .tooltip {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      padding: 0.3rem 0.625rem;
      border-radius: var(--radius-sm);
      background: var(--color-text);
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(-3px);
      pointer-events: none;
      transition:
        opacity 140ms ease,
        transform 140ms ease;
    }
    .action:hover + .tooltip,
    .action:focus-visible + .tooltip {
      opacity: 1;
      transform: none;
    }
    .action[aria-expanded='true'] + .tooltip {
      opacity: 0;
    }
    .menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 10rem;
      margin: 0;
      padding: 0.375rem;
      list-style: none;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-panel);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-4px);
      transition:
        opacity 140ms ease,
        transform 160ms var(--ease-out),
        visibility 0s linear 160ms;
    }
    .menu.is-open {
      opacity: 1;
      visibility: visible;
      transform: none;
      transition:
        opacity 140ms ease,
        transform 160ms var(--ease-out);
    }
    .menu a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      min-height: 44px;
      padding: 0 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--color-text);
      font-weight: 600;
      text-decoration: none;
    }
    .menu a:hover {
      background: var(--color-surface-2);
    }
    .menu a.is-current {
      color: var(--color-accent-strong);
    }
    .menu svg {
      width: 1rem;
      height: 1rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .action,
      .tooltip,
      .menu,
      .menu.is-open {
        transition: none;
      }
    }
  `,
})
export class GlobalActions {
  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly langButton = viewChild.required<ElementRef<HTMLButtonElement>>('langButton');

  protected readonly langs: readonly Lang[] = LANGS;
  protected readonly menuOpen = signal(false);
  /** Only offered once a real CV file is configured. */
  protected readonly cvFile = computed(() => this.content.real(this.content.content().cv.file));

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  /** Escape closes the menu first (and nothing else). */
  protected onEscape(event: Event): void {
    if (!this.menuOpen()) return;
    event.preventDefault();
    this.menuOpen.set(false);
    this.langButton().nativeElement.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }
}
