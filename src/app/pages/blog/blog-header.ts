import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContentService } from '../../core/content/content.service';
import { LanguageService } from '../../core/i18n/language.service';

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

@Component({
  selector: 'app-blog-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = lang.t();
    <header class="bar">
      <a class="brand" [routerLink]="lang.path('/blog')">
        <span class="mark" aria-hidden="true">{{ initials() || 'B' }}</span>
        <span class="brand-text">
          <span class="brand-name">{{ name() || t.home.titleFallback }}</span>
          <span class="brand-sub">{{ t.areas.blog.name }}</span>
        </span>
      </a>
      <nav class="nav" [attr.aria-label]="t.areas.blog.name">
        <a [routerLink]="lang.path('/blog')" routerLinkActive="is-current" [routerLinkActiveOptions]="{ exact: true }">{{ t.blog.allPosts }}</a>
        <a [routerLink]="lang.path('/')">{{ t.blog.portfolio }}</a>
      </nav>
    </header>
  `,
  styles: `
    :host {
      position: sticky;
      z-index: 30;
      top: 0;
      display: block;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      min-height: 64px;
      padding: 0 calc(7.5rem + 1rem) 0 clamp(1rem, 4vw, 2.5rem);
      border-bottom: 1px solid var(--stone);
      background: color-mix(in oklab, var(--paper), transparent 8%);
      -webkit-backdrop-filter: var(--blur);
      backdrop-filter: var(--blur);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      color: var(--ink);
      text-decoration: none;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 6px;
      background: var(--ink);
      color: var(--on-ink);
      font-size: 0.75rem;
      font-weight: 800;
    }
    .brand-text {
      display: grid;
      line-height: 1.15;
    }
    .brand-name {
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .brand-sub {
      color: var(--terracotta);
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .nav {
      display: flex;
      gap: 1.25rem;
      margin-left: auto;
    }
    .nav a {
      color: var(--ink-muted);
      font-size: 0.9375rem;
      font-weight: 650;
      text-decoration: none;
    }
    .nav a:hover,
    .nav a.is-current {
      color: var(--ink);
    }
    @media (max-width: 640px) {
      .bar {
        padding-right: 7rem;
      }
      .nav {
        display: none;
      }
    }
  `,
})
export class BlogHeader {
  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  protected readonly name = computed(() => this.content.real(this.content.profile().name) ?? '');
  protected readonly initials = computed(() => initialsOf(this.name()));
}
