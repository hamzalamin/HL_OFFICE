import { Injectable, computed, inject } from '@angular/core';
import { CONTENT, PortfolioContent, Project } from '../../../content';
import { LanguageService } from '../i18n/language.service';
import { SHOW_PLACEHOLDERS, isProvided } from './placeholder';

/** Read access to portfolio content in the current language. */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly language = inject(LanguageService);
  readonly showPlaceholders = inject(SHOW_PLACEHOLDERS);

  readonly content = computed<PortfolioContent>(() => CONTENT[this.language.lang()]);
  readonly profile = computed(() => this.content().profile);

  /** Projects that can be shown: named ones, or all of them in placeholder preview. */
  readonly projects = computed<Project[]>(() => this.content().projects.filter((p) => this.visible(p.name)));

  /** Whether a value should be rendered (real content, or a placeholder while previewing). */
  visible(value: unknown): boolean {
    if (isProvided(value)) return true;
    return this.showPlaceholders && value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0);
  }

  /** The value when it is real content, otherwise undefined. */
  real<T>(value: T): T | undefined {
    return isProvided(value) ? value : undefined;
  }
}
