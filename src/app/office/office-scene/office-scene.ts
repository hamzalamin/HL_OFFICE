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
import { IDENTITY, Insets, NO_INSETS, Rect, frameTarget, grow, toScreen } from './camera';
import { obj } from '../engine/iso';
import { OfficeFocus } from '../office-focus';
import { Crowd } from '../scene/pedestrians';
import { LOOKS, personShapes } from '../scene/people';
import { CrowdView, Layer, bodyTransform, layerOf } from './crowd-view';
import { periodText } from '../career';
import { SceneShapes } from './scene-shapes';

const WARM_UP = 75;

const FIGURES = LOOKS.map((_, i) => ({
  front: [obj({ x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 }, personShapes(i, 'front', 'stand'))],
  back: [obj({ x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 }, personShapes(i, 'back', 'stand'))],
}));

function crowdAt(layer: Layer) {
  return START.bodies
    .filter((b) => layerOf(b.x, b.y) === layer)
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .map((b) => ({ id: b.id, look: b.look, view: b.view, flip: b.flip, alpha: b.alpha, transform: bodyTransform(b) }));
}
const START = new Crowd().warmUp(WARM_UP);
const CROWD_START = { back: crowdAt('back'), near: crowdAt('near'), far: crowdAt('far') };

@Component({
  selector: 'app-office-scene',
  imports: [SceneShapes, RouterLink, ContentText],
  templateUrl: './office-scene.html',
  styleUrl: './office-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeScene {

  readonly active = input<AreaId | null>(null);

  readonly project = input<string | null>(null);

  readonly experience = input<string | null>(null);

  readonly framed = input<OfficeFocus | null>(null);

  readonly insets = input<Insets>(NO_INSETS);

  readonly roomInsets = input<Insets | null>(null);

  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly cameraEl = viewChild.required<ElementRef<HTMLElement>>('cameraLayer');
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
  protected readonly hoveredFolder = signal<string | null>(null);
  protected readonly size = signal({ w: 0, h: 0 });
  protected readonly ready = signal(false);

  protected readonly moving = signal(false);

  protected readonly compact = computed(() => this.size().w > 0 && this.size().w < 560);

  protected readonly stageWidth = computed(() => {
    const { w, h } = this.size();
    return w > 0 ? Math.round(Math.min(w, (h * 4) / 3)) : null;
  });

  protected readonly emphasis = computed(() => this.hovered() ?? this.active());

  protected readonly boards = computed(() =>
    this.content
      .projects()
      .slice(0, this.model.projectSlots.length)
      .map((p, i) => ({ slug: p.slug, name: p.name, n: i + 1, slot: this.model.projectSlots[i] })),
  );

  protected readonly folders = computed(() =>
    this.content
      .content()
      .experience.slice(0, this.model.meeting.folders.length)
      .map((e, i) => ({ id: e.id, label: e.label, n: i + 1, slot: this.model.meeting.folders[i] })),
  );

  private readonly activeExperience = computed(() => this.content.content().experience.find((e) => e.id === this.experience()) ?? null);

  protected readonly slide = computed(() => {
    const t = this.lang.t();
    const e = this.activeExperience();
    const p = this.content.profile();
    const s = e
      ? { kicker: e.organization, title: e.role, sub: e.employment ?? '', meta: periodText(e, t), selected: e.id as string | null }
      : { kicker: t.career.journey, title: this.content.real(p.name) ?? '', sub: this.content.real(p.title) ?? '', meta: '', selected: null };

    const fit = (text: string, max: number) => Math.min(max, 72 / (Math.max(1, text.length) * 0.56));
    return { ...s, titleSize: fit(s.title, 5.6), subSize: fit(s.sub, 3.6), metaSize: fit(s.meta, 3.4) };
  });

  protected readonly camera = computed(() => {
    const size = this.size();
    if (size.w === 0) return IDENTITY;
    const f = this.framed();
    const id = f ? f.area : this.active();
    const project = f ? f.project : this.project();
    const experience = f ? f.experience : this.experience();

    if (!id) {
      const insets = this.insets();
      return frameTarget(size, this.model.overview, this.compact() ? { ...insets, top: insets.top + 22 } : insets, { min: 0.4, max: 1.8 }, 0);
    }

    const k = this.roomZoom();
    if (id === 'meeting' && this.content.content().experience.some((e) => e.id === experience))
      return frameTarget(size, this.model.meeting.frame, this.insets(), undefined, 16, k);
    const board = this.boards().find((b) => b.slug === project) ?? null;
    if (board) return frameTarget(size, board.slot.frame, this.insets(), undefined, 16, k);
    return frameTarget(size, this.model.areas[id].frame, this.insets(), undefined, 16, k);
  });

  private readonly roomZoom = computed(() => {
    const reference = this.roomInsets() ?? this.insets();
    return frameTarget(this.size(), grow(this.model.areas.meeting.frame, 64), reference, { min: 0.5, max: 2 }).k;
  });

  readonly focusRect = computed<Rect | null>(() => {
    const size = this.size();
    const f = this.framed();
    const id = f ? f.area : this.active();
    if (!id || size.w === 0) return null;
    return toScreen(size, this.camera(), this.model.areas[id].frame);
  });

  protected readonly cameraStyle = computed(() => {
    const c = this.camera();

    return `transform: translate(${c.x}px, ${c.y}px) scale(${c.k})`;
  });

  protected mouse(event: PointerEvent): boolean {
    return event.pointerType === 'mouse';
  }

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

  protected experiencePath(id: string): string {
    return this.lang.path('/experience/' + id);
  }

  protected openExperience(id: string): void {
    if (this.experience() !== id) this.router.navigateByUrl(this.experiencePath(id));
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

      requestAnimationFrame(() => requestAnimationFrame(() => this.ready.set(true)));
      this.trackCameraMoves();
      this.startCrowd();
    });
  }

  private trackCameraMoves(): void {
    const el = this.cameraEl().nativeElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = () => {
      clearTimeout(timer);
      this.moving.set(false);
    };
    const onEnd = (e: TransitionEvent) => e.target === el && e.propertyName === 'transform' && done();
    el.addEventListener('transitionend', onEnd);

    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--camera-duration')) || 0;
    let last = '';
    const watch = effect(
      () => {
        const style = this.cameraStyle();
        if (!this.ready() || style === last) {
          last = style;
          return;
        }
        last = style;
        if (!ms) return;
        this.moving.set(true);
        clearTimeout(timer);
        timer = setTimeout(done, ms + 120);
      },
      { injector: this.injector },
    );
    this.destroyRef.onDestroy(() => {
      watch.destroy();
      clearTimeout(timer);
      el.removeEventListener('transitionend', onEnd);
    });
  }

  private startCrowd(): void {
    const [back, near, far] = this.crowdLayers().map((e) => e.nativeElement);
    const view = new CrowdView(new Crowd().warmUp(WARM_UP), { back, near, far }, this.svg().nativeElement, {
      back: this.ext.back,
      near: this.ext.inner,
      far: this.ext.outer,
    });
    view.render();
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce), (hover: none), (max-width: 899px)').matches;
    if (still) return;
    const running = effect(
      () => {
        if (this.active() || this.moving()) view.stop();
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

  protected enter(): void {
    this.open('reception');
  }

  protected openProject(slug: string): void {
    if (this.project() !== slug) this.router.navigateByUrl(this.projectPath(slug));
  }

  protected onSceneClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (target?.closest('.area, .board, .folder-hit, .entrance')) return;
    if (this.active()) this.router.navigateByUrl(this.lang.path('/'));
  }
}
