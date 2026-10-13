import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/i18n/language.service';
import { GlobalActions } from './layout/global-actions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">{{ lang.t().site.skipToContent }}</a>
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <app-global-actions />
  `,
  styles: `
    main:focus {
      outline: none;
    }
    .skip-link {
      position: absolute;
      left: 1rem;
      top: -100px;
      z-index: 100;
      padding: 0.6rem 1rem;
      border-radius: var(--radius-sm);
      background: var(--color-text);
      color: #fff;
      font-weight: 600;
    }
    .skip-link:focus {
      top: 0.75rem;
    }
  `,
})
export class App {
  protected readonly lang = inject(LanguageService);
}
