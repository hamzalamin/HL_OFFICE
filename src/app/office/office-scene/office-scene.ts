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
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { AREAS, AREA_BY_ID, AreaId, VIEWBOX } from '../scene/areas';
import { OFFICE_MODEL } from '../scene/office-layout';
import { IDENTITY, Insets, NO_INSETS, frameTarget, grow } from './camera';
import { obj } from '../engine/iso';
import { Crowd } from '../scene/pedestrians';
import { LOOKS, personShapes } from '../scene/people';
import { CrowdView, Layer, bodyTransform, layerOf } from './crowd-view';
import { SceneShapes } from './scene-shapes';

/** Seconds simulated before the first frame, so the street starts mid-life. */
const WARM_UP = 75;

/** Each look drawn walking toward and away from the viewer (mirrored for left). */
const FIGURES = LOOKS.map((_, i) => ({
  front: [obj({ x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 }, personShapes(i, 'front', 'stand'))],
  back: [obj({ x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 }, personShapes(i, 'back', 'stand'))],
}));

/** The street as it is on the first frame (also the still picture for reduced motion). */
function crowdAt(layer: Layer) {
  return START.bodies
    .filter((b) => layerOf(b.x, b.y) === layer)
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .map((b) => ({ id: b.id, look: b.look, view: b.view, flip: b.flip, alpha: b.alpha, transform: bodyTransform(b) }));
}
const START = new Crowd().warmUp(WARM_UP);
const CROWD_START = { back: crowdAt('back'), near: crowdAt('near'), far: crowdAt('far') };

/**
 * The interactive isometric office. The focus (area, project) lives in the
 * URL, so this component only reflects state and navigates.
 *
 * Accessibility: the SVG drawing is decorative (aria-hidden). Every area and
 * every project board is reachable through floating labels, which are real
 * links: area labels in the overview, board labels inside the project area.
 */
@Component({
  selector: 'app-office-scene',
  imports: [SceneShapes, RouterLink, ContentText],
  templateUrl: './office-scene.html',
  styleUrl: './office-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeScene {
  /** Area currently opened (from the URL). */
  readonly active = input<AreaId | null>(null);
  /** Project currently opened (slug), framed on its board. */
  readonly project = input<string | null>(null);
  /** Space covered by overlaying panels, so the camera frames around them. */
  readonly insets = input<Insets>(NO_INSETS);

  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private readonly crowdLayers = viewChildren('crowdLayer', { read: ElementRef<SVGGElement> });

  protected readonly model = OFFICE_MODEL;
  protected readonly ext = OFFICE_MODEL.exterior;
  protected readonly crowd = CROWD_START;
  protected readonly figures = FIGURES;
  protected readonly areas = AREAS;
  protected readonly viewBox = `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`;
  protected readonly hovered = signal<AreaId | null>(null);
  protected readonly hoveredBoard = signal<string | null>(null);
  protected readonly size = signal({ w: 0, h: 0 });
  protected readonly ready = signal(false);

  protected readonly emphasis = computed(() => this.hovered() ?? this.active());

  /** Projects shown on the wall, one per board, in content order. */
  protected readonly boards = computed(() =>
    this.content
      .projects()
      .slice(0, this.model.projectSlots.length)
      .map((p, i) => ({ slug: p.slug, name: p.name, n: i + 1, slot: this.model.projectSlots[i] })),
  );

  private readonly activeBoard = computed(() => this.boards().find((b) => b.slug === this.project()) ?? null);

  protected readonly camera = computed(() => {
    const size = this.size();
    if (size.w === 0) return IDENTITY;
    const id = this.active();
    if (!id) return frameTarget(size, this.model.overview, NO_INSETS, { min: 0.4, max: 1.8 }, 0);
    const board = this.activeBoard();
    // A board is framed a little closer than its area, keeping its neighbours in view.
    if (board) return frameTarget(size, grow(board.slot.frame, 40), this.insets(), { min: 0.5, max: 2.2 });
    return frameTarget(size, grow(this.model.areas[id].frame, 28), this.insets(), { min: 0.5, max: 2.4 });
  });

  protected readonly cameraStyle = computed(() => {
    const c = this.camera();
    return `transform: translate(${c.x}px, ${c.y}px) scale(${c.k}); --k: ${c.k}`;
  });

  protected left(p: { x: number }): number {
    return (p.x / VIEWBOX.w) * 100;
  }
  protected top(p: { y: number }): number {
    return (p.y / VIEWBOX.h) * 100;
  }

  protected areaPath(id: AreaId): string {
    return this.lang.path(AREA_BY_ID[id].route);
  }

  protected projectPath(slug: string): string {
    return this.lang.path('/projects/' + slug);
  }

  constructor() {
    afterNextRender(() => {
      const el = this.viewport().nativeElement;
      const measure = () => this.size.set({ w: el.clientWidth, h: el.clientHeight });
      measure();
      if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        this.destroyRef.onDestroy(() => ro.disconnect());
      }
      // Enable camera transitions only after the first framing, so the page
      // does not animate on load.
      requestAnimationFrame(() => requestAnimationFrame(() => this.ready.set(true)));
      this.startCrowd();
    });
  }

  /**
   * People walk only when motion is welcome, and stand still while an area
   * is open so nothing competes with the content.
   */
  private startCrowd(): void {
    const [back, near, far] = this.crowdLayers().map((e) => e.nativeElement);
    const view = new CrowdView(new Crowd().warmUp(WARM_UP), { back, near, far }, this.svg().nativeElement, {
      back: this.ext.back,
      near: this.ext.inner,
      far: this.ext.outer,
    });
    view.render();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const running = effect(
      () => {
        if (this.active()) view.stop();
        else view.start();
      },
      { injector: this.injector },
    );
    this.destroyRef.onDestroy(() => {
      running.destroy();
      view.stop();
    });
  }

  protected open(id: AreaId): void {
    if (this.active() === id && !this.project()) return;
    this.router.navigateByUrl(this.areaPath(id));
  }

  /** The way in from the street: the plaza leads to the reception. */
  protected enter(): void {
    this.open('reception');
  }

  /** A board is a shortcut to its project, from anywhere in the office. */
  protected openProject(slug: string): void {
    if (this.project() !== slug) this.router.navigateByUrl(this.projectPath(slug));
  }

  /** Clicking the empty floor or the background returns to the overview. */
  protected onSceneClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (target?.closest('.area, .board, .entrance')) return;
    if (this.active()) this.router.navigateByUrl(this.lang.path('/'));
  }
}
