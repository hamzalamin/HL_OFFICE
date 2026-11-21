import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { AREAS, AREA_BY_ID, AreaId } from '../scene/areas';

/**
 * The floating dock along the bottom of the office: the six rooms as small
 * index tabs, so visitors can glide from room to room without going back to
 * the overview. Plain links (each room has its own URL); the current room
 * carries aria-current.
 */
@Component({
  selector: 'app-room-dock',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = lang.t();
    <nav class="dock" [attr.aria-label]="t.office.dock">
      <a class="tab is-overview" [routerLink]="lang.path('/')" [attr.aria-current]="active() ? null : 'page'" [attr.title]="t.office.overview">
        <app-icon name="compass" />
        <span class="visually-hidden">{{ t.office.overview }}</span>
      </a>
      <span class="rule" aria-hidden="true"></span>
      <ol>
        @for (a of areas; track a.id; let i = $index) {
          <li>
            <a
              class="tab"
              [routerLink]="path(a.id)"
              [attr.data-dock-link]="a.id"
              [attr.aria-current]="active() === a.id ? 'page' : null"
              [attr.title]="t.areas[a.id].name"
            >
              <span class="no" aria-hidden="true">{{ i + 1 }}</span>
              <span class="name">{{ t.areas[a.id].name }}</span>
            </a>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
    .dock {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.375rem 0.3125rem;
      border: 1px solid var(--stone-strong);
      border-radius: var(--radius-md);
      background: var(--glass-strong);
      -webkit-backdrop-filter: var(--blur);
      backdrop-filter: var(--blur);
      box-shadow: var(--shadow-pin);
    }
    ol {
      display: flex;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .rule {
      width: 1px;
      height: 1.5rem;
      margin: 0 0.125rem;
      background: var(--stone-strong);
    }
    // Each room is a small key: flat at rest, picked up on hover, and the
    // current room stands raised on its front edge like the cards.
    .tab {
      --c: var(--o-white);
      --side: 0px;
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 44px;
      min-height: 40px;
      padding: 0 0.75rem 0 0.375rem;
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--ink-muted);
      font-size: 0.8125rem;
      font-weight: 650;
      white-space: nowrap;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      box-shadow:
        0 var(--side) 0 -1px color-mix(in oklab, var(--c), #000 10%),
        0 var(--side) 0 0 color-mix(in oklab, var(--c), #000 28%);
      transition:
        background-color 220ms var(--ease-out),
        border-color 220ms var(--ease-out),
        color 220ms var(--ease-out),
        transform 220ms var(--ease-out),
        --side 220ms var(--ease-out);
    }
    .tab:hover {
      --side: 2px;
      transform: translateY(-2px);
      border-color: color-mix(in oklab, var(--c), #000 20%);
      background-color: color-mix(in oklab, var(--c), #fff 14%);
      color: var(--ink);
    }
    .tab:active {
      --side: 0px;
      transform: none;
      transition-duration: 80ms;
    }
    .tab[aria-current='page'] {
      --side: 3px;
      transform: translateY(-3px);
      border-color: color-mix(in oklab, var(--c), #000 20%);
      background-color: color-mix(in oklab, var(--c), #fff 14%);
      color: var(--ink);
    }
    .tab[aria-current='page']:hover {
      --side: 4px;
      transform: translateY(-4px);
    }
    .is-overview[aria-current='page'] {
      color: var(--o-accent);
    }
    .is-overview {
      justify-content: center;
      padding: 0;
    }
    .is-overview svg {
      width: 1.125rem;
      height: 1.125rem;
    }
    .no {
      display: grid;
      place-items: center;
      width: 1.375rem;
      height: 1.375rem;
      border: 1px solid var(--stone-strong);
      border-radius: 2px;
      font-size: 0.6875rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--ink);
      transition:
        background-color var(--dur) var(--ease-out),
        border-color var(--dur) var(--ease-out),
        color var(--dur) var(--ease-out);
    }
    .tab:hover .no {
      border-color: color-mix(in oklab, var(--ink), transparent 55%);
    }
    .tab[aria-current='page'] .no {
      background: var(--o-accent);
      border-color: color-mix(in oklab, var(--o-accent), #000 20%);
      color: var(--on-ink);
    }
    .tab:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
    // Narrow screens: numbered markers only; the open folio names the room.
    @media (max-width: 1099px) {
      .tab:not(.is-overview) {
        justify-content: center;
        padding: 0;
      }
      .name {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .no {
        width: 1.625rem;
        height: 1.625rem;
        font-size: 0.75rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .tab,
      .no {
        transition: none;
      }
    }
  `,
})
export class RoomDock {
  readonly active = input<AreaId | null>(null);
  protected readonly lang = inject(LanguageService);
  protected readonly areas = AREAS;

  protected path(id: AreaId): string {
    return this.lang.path(AREA_BY_ID[id].route);
  }
}
