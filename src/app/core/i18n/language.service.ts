import { DOCUMENT, Injectable, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Lang } from '../../../content';
import { UI, UiStrings } from './ui-strings';

export const LANGS: readonly Lang[] = ['en', 'fr'];
export const DEFAULT_LANG: Lang = 'en';

/** Language comes from the URL: English at the root, French under /fr. */
export function langFromUrl(url: string): Lang {
  return /^\/fr(\/|\?|#|$)/.test(url) ? 'fr' : 'en';
}

/** Strips the language prefix: "/fr/projects" → "/projects". */
export function stripLang(url: string): string {
  const path = url.replace(/^\/fr(?=\/|\?|#|$)/, '');
  return path === '' || path.startsWith('?') || path.startsWith('#') ? '/' + path : path;
}

export function localizePath(path: string, lang: Lang): string {
  const q = path.indexOf('?');
  const base = q === -1 ? path : path.slice(0, q);
  const query = q === -1 ? '' : path.slice(q);
  const clean = base.startsWith('/') ? base : '/' + base;
  if (lang === DEFAULT_LANG) return clean + query;
  return (clean === '/' ? '/fr' : '/fr' + clean) + query;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly lang = computed<Lang>(() => langFromUrl(this.url()));
  readonly t = computed<UiStrings>(() => UI[this.lang()]);

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.lang();
    });
  }

  /** Path in the current language. */
  path(path: string): string {
    return localizePath(path, this.lang());
  }

  /** The current page in another language. */
  switchUrl(target: Lang): string {
    return localizePath(stripLang(this.url().split('#')[0]), target);
  }
}
