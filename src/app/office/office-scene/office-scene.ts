import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { AREAS, AreaId, VIEWBOX } from '../scene/areas';
import { OFFICE_MODEL } from '../scene/office-layout';
import { IDENTITY, Insets, NO_INSETS, frameTarget, grow } from './camera';
import { SceneShapes } from './scene-shapes';

/**
 * The interactive isometric office. The selected area lives in the URL
 * (`?area=<id>`), so this component only reflects state and navigates.
 *
 * Accessibility: the SVG drawing is decorative (aria-hidden). Every area is
 * reachable through the floating labels, which are real links in a list.
 */
@Component({
  selector: 'app-office-scene',
  imports: [SceneShapes, RouterLink],
  templateUrl: './office-scene.html',
  styleUrl: './office-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeScene {
  /** Area currently opened (from the URL). */
  readonly active = input<AreaId | null>(null);
  /** Area emphasised without being opened (e.g. by the guided tour). */
  readonly spotlight = input<AreaId | null>(null);
  /** Space covered by overlaying panels, so the camera frames around them. */
  readonly insets = input<Insets>(NO_INSETS);
  /** Overview insets, used when no area is focused. */
  readonly overviewInsets = input<Insets>(NO_INSETS);

  protected readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  protected readonly model = OFFICE_MODEL;
  protected readonly areas = AREAS;
  protected readonly viewBox = `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`;
  protected readonly hovered = signal<AreaId | null>(null);
  protected readonly size = signal({ w: 0, h: 0 });
  protected readonly ready = signal(false);

  protected readonly focusArea = computed(() => this.active() ?? this.spotlight());
  protected readonly emphasis = computed(() => this.hovered() ?? this.focusArea());

  protected readonly camera = computed(() => {
    const size = this.size();
    if (size.w === 0) return IDENTITY;
    const id = this.focusArea();
    if (!id) return frameTarget(size, grow(this.model.overview, 6), this.overviewInsets(), { min: 0.4, max: 1.5 }, 12);
    return frameTarget(size, grow(this.model.areas[id].frame, 28), this.insets(), { min: 0.5, max: 2.4 });
  });

  protected readonly cameraStyle = computed(() => {
    const c = this.camera();
    return `transform: translate(${c.x}px, ${c.y}px) scale(${c.k}); --k: ${c.k}`;
  });

  protected labelLeft(id: AreaId): number {
    return (this.model.areas[id].label.x / VIEWBOX.w) * 100;
  }
  protected labelTop(id: AreaId): number {
    return (this.model.areas[id].label.y / VIEWBOX.h) * 100;
  }

  constructor() {
    afterNextRender(() => {
      const el = this.viewport().nativeElement;
      const measure = () => this.size.set({ w: el.clientWidth, h: el.clientHeight });
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      this.destroyRef.onDestroy(() => ro.disconnect());
      // Enable camera transitions only after the first framing, so the page
      // does not animate on load.
      requestAnimationFrame(() => requestAnimationFrame(() => this.ready.set(true)));
    });
  }

  protected open(id: AreaId): void {
    this.router.navigate([this.lang.path('/')], { queryParams: { area: id } });
  }

  /** Clicking the empty floor or the background returns to the overview. */
  protected onSceneClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (target?.closest('.area')) return;
    if (this.active()) this.router.navigate([this.lang.path('/')]);
  }
}
