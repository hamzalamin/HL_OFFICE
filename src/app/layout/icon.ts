import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName = 'menu' | 'close' | 'arrow-right' | 'arrow-left' | 'compass' | 'play' | 'file' | 'globe' | 'external' | 'mail' | 'pause' | 'info' | 'download' | 'check' | 'phone';

/** Small inline stroke icons (24×24 grid). Decorative: always aria-hidden. */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display: contents' },
  template: `
    <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      @switch (name()) {
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6L6 18" />
        }
        @case ('arrow-right') {
          <path d="M5 12h14M13 6l6 6-6 6" />
        }
        @case ('arrow-left') {
          <path d="M19 12H5M11 6l-6 6 6 6" />
        }
        @case ('compass') {
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        }
        @case ('play') {
          <path d="M8 5.5v13l10-6.5z" />
        }
        @case ('pause') {
          <path d="M9 5v14M15 5v14" />
        }
        @case ('file') {
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        }
        @case ('globe') {
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        }
        @case ('external') {
          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5v.01" />
        }
        @case ('download') {
          <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
        }
        @case ('check') {
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        }
        @case ('phone') {
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
        }
        @case ('mail') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
