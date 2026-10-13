import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { AreaPanel } from '../../office/area-panel/area-panel';
import { Insets, NO_INSETS } from '../../office/office-scene/camera';
import { OfficeScene } from '../../office/office-scene/office-scene';
import { AREAS, AreaId, isAreaId } from '../../office/scene/areas';

/** Breakpoint where the office becomes the full-screen centrepiece. */
const WIDE_QUERY = '(min-width: 900px)';

@Component({
  selector: 'app-home',
  imports: [OfficeScene, AreaPanel, RouterLink, Icon, ContentText],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class Home {
  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly areas = AREAS;
  private readonly panel = viewChild(AreaPanel);
  private readonly introCard = viewChild<ElementRef<HTMLElement>>('intro');

  /** The open area is part of the URL so it is shareable and works with back/forward. */
  protected readonly activeArea = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((q) => (isAreaId(q.get('area')) ? (q.get('area') as AreaId) : null))),
    { initialValue: null },
  );

  /** Visitors can tuck the introduction away to see the whole office. */
  protected readonly introOpen = signal(true);
  protected readonly wide = signal(true);
  private readonly introWidth = signal(0);

  private readonly windowSize = signal({ w: 0, h: 0 });

  /**
   * Space hidden by the panel. Desktop: a 400px side panel. Mobile: a bottom
   * sheet over the lower part of the scene (sizes mirror home.scss).
   */
  protected readonly sceneInsets = computed<Insets>(() => {
    if (this.wide()) return { ...NO_INSETS, right: 440 };
    const { w, h } = this.windowSize();
    const header = 64;
    const sceneH = Math.max(280, Math.min(0.62 * h, 0.84 * w));
    const sheetH = Math.min(0.58 * h, 520) + 8;
    return { ...NO_INSETS, bottom: Math.max(0, header + sceneH - (h - sheetH)) };
  });
  protected readonly overviewInsets = computed<Insets>(() =>
    this.wide() && this.introOpen() ? { ...NO_INSETS, left: this.introWidth() + 24 } : NO_INSETS,
  );

  constructor() {
    afterNextRender(() => {
      const mq = window.matchMedia(WIDE_QUERY);
      const update = () => {
        this.wide.set(mq.matches);
        this.windowSize.set({ w: window.innerWidth, h: window.innerHeight });
      };
      update();
      window.addEventListener('resize', update, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', update));

      const card = this.introCard()?.nativeElement;
      if (card) {
        const ro = new ResizeObserver(() => this.introWidth.set(card.offsetWidth));
        ro.observe(card);
        this.destroyRef.onDestroy(() => ro.disconnect());
      }
    });

    // Move focus into the panel when an area opens, and back to its label when it closes.
    let previous: AreaId | null = null;
    let first = true;
    effect(() => {
      const current = this.activeArea();
      untracked(() => {
        const prev = previous;
        previous = current;
        if (first) {
          first = false;
          return;
        }
        afterNextRender(
          () => {
            if (current) {
              // On small screens the scene sits at the top of the page; bring it into view.
              if (!this.wide()) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
              this.panel()?.focusHeading();
            }
            else if (prev) this.host.nativeElement.querySelector<HTMLElement>(`[data-area-link="${prev}"]`)?.focus({ preventScroll: true });
          },
          { injector: this.injector },
        );
      });
    });
  }

  protected explore(): void {
    this.introOpen.set(false);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[data-area-link]')?.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }

  protected onEscape(): void {
    if (this.activeArea()) this.router.navigate([this.lang.path('/')]);
  }
}
