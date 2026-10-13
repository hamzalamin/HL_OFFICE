import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './layout/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
  `,
  styles: `
    main:focus {
      outline: none;
    }
  `,
})
export class App {}
