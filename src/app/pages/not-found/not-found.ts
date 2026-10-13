import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf">
      <h1>{{ lang.t().notFound.title }}</h1>
      <p>{{ lang.t().notFound.text }}</p>
      <a class="btn btn-primary" [routerLink]="lang.path('/')">{{ lang.t().notFound.back }}</a>
    </section>
  `,
  styles: `
    .nf { max-width: 640px; margin: 0 auto; padding: clamp(3rem, 10vw, 7rem) 1.5rem; display: grid; gap: 1rem; justify-items: start; }
    h1 { font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 800; }
    p { color: var(--color-text-muted); }
  `,
})
export class NotFound {
  protected readonly lang = inject(LanguageService);
}
