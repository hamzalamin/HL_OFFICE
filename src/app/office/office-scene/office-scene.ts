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
import { OfficeFocus } from '../office-focus';
import { Crowd } from '../scene/pedestrians';
import { LOOKS, personShapes } from '../scene/people';
import { CrowdView, Layer, bodyTransform, layerOf } from './crowd-view';
import { periodText } from '../career';
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
  /** Experience currently opened (id), presented on the meeting room screen. */
  readonly experience = input<string | null>(null);
  /**
   * What the camera frames, when it should move ahead of the highlighting
   * (the page passes the new focus here first). Defaults to the inputs above.
   */
  readonly framed = input<OfficeFocus | null>(null);
  /** Space covered by overlaying panels, so the camera frames around them. */
  readonly insets = input<Insets>(NO_INSETS);

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
  /** True while the camera travels (see the .is-moving styles). */
  protected readonly moving = signal(false);
  /** Small viewports: compact, finger-sized markers. */
  protected readonly compact = computed(() => this.size().w > 0 && this.size().w < 560);
  /** The 4:3 stage letterboxed into the measured viewport. */
  protected readonly stageWidth = computed(() => {
    const { w, h } = this.size();
    return w > 0 ? Math.round(Math.min(w, (h * 4) / 3)) : null;
  });

  protected readonly emphasis = computed(() => this.hovered() ?? this.active());

  /** Projects shown on the wall, one per board, in content order. */
  protected readonly boards = computed(() =>
    this.content
      .projects()
      .slice(0, this.model.projectSlots.length)
      .map((p, i) => ({ slug: p.slug, name: p.name, n: i + 1, slot: this.model.projectSlots[i] })),
  );


  /** Experiences on the meeting table, one folder each, in content order. */
  protected readonly folders = computed(() =>
    this.content
      .content()
      .experience.slice(0, this.model.meeting.folders.length)
      .map((e, i) => ({ id: e.id, label: e.label, n: i + 1, slot: this.model.meeting.folders[i] })),
  );

  private readonly activeExperience = computed(() => this.content.content().experience.find((e) => e.id === this.experience()) ?? null);

  /** The slide on the meeting room screen: the journey, or the selected experience. */
  protected readonly slide = computed(() => {
    const t = this.lang.t();
    const e = this.activeExperience();
    const p = this.content.profile();
    const s = e
      ? { kicker: e.organization, title: e.role, sub: e.employment ?? '', meta: periodText(e, t), selected: e.id as string | null }
      : { kicker: t.career.journey, title: this.content.real(p.name) ?? '', sub: this.content.real(p.title) ?? '', meta: '', selected: null };
    // Fit each line on the screen: about 0.56 em per character over 72 slide units.
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
    // Small screens: a little room at the top so the finger-sized markers are not cut off.
    if (!id) return frameTarget(size, this.model.overview, this.compact() ? { ...NO_INSETS, top: 22 } : NO_INSETS, { min: 0.4, max: 1.8 }, 0);
    // Inside the office every view shares one zoom level, so moving between
    // rooms, projects and experiences only slides the camera: the browser
    // reuses what it has drawn instead of redrawing the scene at a new size.
    const k = this.roomZoom();
    if (id === 'meeting' && this.content.content().experience.some((e) => e.id === experience))
      return frameTarget(size, this.model.meeting.frame, this.insets(), undefined, 16, k);
    const board = this.boards().find((b) => b.slug === project) ?? null;
    if (board) return frameTarget(size, board.slot.frame, this.insets(), undefined, 16, k);
    return frameTarget(size, this.model.areas[id].frame, this.insets(), undefined, 16, k);
  });

  /**
   * The zoom used inside the office: what fits the meeting room beside a
   * standard panel. It depends on the screen only, not on which panel is
   * open, so it stays the same from room to room.
   */
  private readonly roomZoom = computed(() => {
    const insets = this.insets();
    const reference = insets.right > 0 ? { ...NO_INSETS, right: 472 } : insets;
    return frameTarget(this.size(), grow(this.model.areas.meeting.frame, 28), reference, { min: 0.5, max: 2.4 }).k;
  });

  protected readonly cameraStyle = computed(() => {
    const c = this.camera();
    // The zoom (--k) is set on the label layers only (see the template): set
    // here, every shape in the scene would inherit it and be restyled.
    return `transform: translate(${c.x}px, ${c.y}px) scale(${c.k})`;
  });

  /** Hover feedback is for mouse pointers only: on touch it would stick after a tap. */
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

  /** A folder on the meeting table opens that experience, from anywhere in the office. */
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
      // Enable camera transitions only after the first framing, so the page
      // does not animate on load.
      requestAnimationFrame(() => requestAnimationFrame(() => this.ready.set(true)));
      this.trackCameraMoves();
      this.startCrowd();
    });
  }

  /** Marks the camera as moving from each new framing until its transition ends. */
  private trackCameraMoves(): void {
    const el = this.cameraEl().nativeElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = () => {
      clearTimeout(timer);
      this.moving.set(false);
    };
    const onEnd = (e: TransitionEvent) => e.target === el && e.propertyName === 'transform' && done();
    el.addEventListener('transitionend', onEnd);
    // Read once, from the setting (0 with reduced motion): getComputedStyle at
    // every move would restyle the whole scene right when the camera starts.
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
        if (!ms) return; // Reduced motion: the camera jumps.
        this.moving.set(true);
        clearTimeout(timer);
        timer = setTimeout(done, ms + 120); // In case transitionend never comes.
      },
      { injector: this.injector },
    );
    this.destroyRef.onDestroy(() => {
      watch.destroy();
      clearTimeout(timer);
      el.removeEventListener('transitionend', onEnd);
    });
  }

  /**
   * People walk only on larger screens with a mouse, when motion is welcome;
   * they stand still while an area is open or the camera moves, so nothing
   * competes with the content. Phones keep a still, light scene.
   */
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
    if (target?.closest('.area, .board, .folder-hit, .entrance')) return;
    if (this.active()) this.router.navigateByUrl(this.lang.path('/'));
  }
}
