import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Lang } from '../../content';
import { ContentService } from '../core/content/content.service';
import { cvOptions, downloadAll } from '../core/content/cv';
import { LANGS, LanguageService } from '../core/i18n/language.service';
import { Icon } from './icon';

/**
 * The only global controls: language and, once the files exist, the CV.
 * Small floating icons in the top-right corner; the office is the navigation.
 * Each opens a compact menu: the language to read in, or the CV version
 * (English, French or both) to download.
 */
type Menu = 'lang' | 'cv';

@Component({
  selector: 'app-global-actions',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    // pointerdown, not click: iOS sends no click for taps on plain content.
    '(document:pointerdown)': 'onOutside($event)',
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
          [attr.aria-expanded]="open() === 'lang'"
          aria-controls="language-menu"
          (click)="toggle('lang')"
        >
          <app-icon name="globe" />
        </button>
        <span class="tooltip" aria-hidden="true">{{ t.language }}</span>
        <ul id="language-menu" class="menu" [class.is-open]="open() === 'lang'" [attr.inert]="open() === 'lang' ? null : ''" [attr.aria-label]="t.language">
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

      @if (cv().length) {
        <div class="cv">
          <button
            #cvButton
            type="button"
            class="action"
            [attr.aria-label]="t.downloadCv"
            [attr.aria-expanded]="open() === 'cv'"
            aria-controls="cv-menu"
            (click)="toggle('cv')"
          >
            <app-icon name="download" />
          </button>
          <span class="tooltip" aria-hidden="true">{{ t.downloadCv }}</span>
          <div id="cv-menu" class="menu" [class.is-open]="open() === 'cv'" [attr.inert]="open() === 'cv' ? null : ''">
            <p class="menu-title">{{ t.cvChoice }}</p>
            <ul>
              @for (o of cv(); track o.lang) {
                <li>
                  <a [href]="o.href" [attr.download]="o.name" [attr.hreflang]="o.lang" (click)="close()">
                    <span>{{ t.languages[o.lang] }}</span>
                    <span class="kind">PDF</span>
                  </a>
                </li>
              }
              @if (cv().length > 1) {
                <li>
                  <button type="button" (click)="downloadBoth()">
                    <span>{{ t.cvBoth }}</span>
                    <app-icon name="download" />
                  </button>
                </li>
              }
            </ul>
          </div>
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
      border-radius: var(--radius-sm);
      border: 1px solid var(--stone-strong);
      background: var(--glass-strong);
      -webkit-backdrop-filter: var(--blur);
      backdrop-filter: var(--blur);
      color: var(--ink);
      box-shadow: var(--shadow-pin);
      cursor: pointer;
      transition:
        background-color var(--dur) var(--ease-out),
        color var(--dur) var(--ease-out),
        border-color var(--dur) var(--ease-out),
        transform var(--dur) var(--ease-out);
    }
    .action:hover {
      background: var(--paper);
      border-color: color-mix(in oklab, var(--ink), transparent 60%);
      transform: translateY(-1px);
    }
    .action[aria-expanded='true'] {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--on-ink);
    }
    .action:active {
      transform: translateY(1px) scale(0.97);
      transition-duration: 80ms;
    }
    .action svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .action:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 3px;
    }
    .tooltip {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      padding: 0.3rem 0.625rem;
      border-radius: var(--radius-xs);
      background: var(--ink);
      color: var(--on-ink);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
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
    .action[aria-expanded='true'] + .tooltip,
    .action[aria-expanded='true']:hover + .tooltip {
      opacity: 0;
    }
    .menu,
    .menu ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 10rem;
      padding: 0.375rem;
      background: var(--glass-strong);
      -webkit-backdrop-filter: var(--blur);
      backdrop-filter: var(--blur);
      border: 1px solid var(--stone);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-panel);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-4px);
      transition:
        opacity 180ms var(--ease-out),
        transform 200ms var(--ease-out),
        visibility 0s linear 200ms;
    }
    .menu.is-open {
      opacity: 1;
      visibility: visible;
      transform: none;
      transition:
        opacity 180ms var(--ease-out),
        transform 200ms var(--ease-out);
    }
    .menu-title {
      padding: 0.375rem 0.75rem 0.25rem;
      font-size: 0.8125rem;
      font-weight: 650;
      color: var(--color-text-muted);
      white-space: nowrap;
    }
    .menu button {
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      cursor: pointer;
    }
    .menu .kind {
      padding: 0 0.3125rem;
      border: 1px solid var(--stone-strong);
      border-radius: 2px;
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--ink-muted);
    }
    .menu a,
    .menu button {
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
    .menu a,
    .menu button {
      transition: background-color var(--dur) var(--ease-out);
    }
    .menu a:hover,
    .menu button:hover {
      background: var(--paper-2);
    }
    .menu a.is-current {
      color: var(--teal-strong);
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
  private readonly document = inject(DOCUMENT);
  private readonly langButton = viewChild.required<ElementRef<HTMLButtonElement>>('langButton');
  private readonly cvButton = viewChild<ElementRef<HTMLButtonElement>>('cvButton');

  protected readonly langs: readonly Lang[] = LANGS;
  protected readonly open = signal<Menu | null>(null);
  /** The CV versions that exist; the icon only appears when there is at least one. */
  protected readonly cv = computed(() => cvOptions(this.content.content().cv));

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(null));
  }

  protected toggle(menu: Menu): void {
    this.open.set(this.open() === menu ? null : menu);
  }

  protected close(): void {
    this.open.set(null);
  }

  protected downloadBoth(): void {
    downloadAll(this.cv(), this.document);
    this.close();
  }

  /** Escape closes the menu first (and nothing else). */
  protected onEscape(event: Event): void {
    const menu = this.open();
    if (!menu) return;
    event.preventDefault();
    this.close();
    (menu === 'lang' ? this.langButton() : this.cvButton())?.nativeElement.focus();
  }

  protected onOutside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
