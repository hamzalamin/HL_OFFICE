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
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { AreaPanel } from '../../office/area-panel/area-panel';
import { OfficeFocus, PANEL_DELAY_FRAMES, focusItem, readOfficeFocus, sameFocus } from '../../office/office-focus';
import { OfficeDirectory } from '../../office/office-directory/office-directory';
import { Insets, NO_INSETS } from '../../office/office-scene/camera';
import { OfficeScene } from '../../office/office-scene/office-scene';
import { AREA_BY_ID, AreaId } from '../../office/scene/areas';
import { WelcomeMemory } from './welcome-memory';

/** Breakpoint where the office becomes the full-screen centrepiece. */
const WIDE_QUERY = '(min-width: 900px)';

/**
 * The office: the persistent interface of the whole portfolio. It stays
 * mounted while visitors move between areas and projects (child routes);
 * only the camera and the panel change.
 */
@Component({
  selector: 'app-home',
  imports: [OfficeScene, AreaPanel, OfficeDirectory, RouterLink, Icon, ContentText],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class Home {
  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly panel = viewChild(AreaPanel);
  private readonly welcomeDialog = viewChild.required<ElementRef<HTMLDialogElement>>('welcome');
  private readonly welcomeButton = viewChild<ElementRef<HTMLButtonElement>>('welcomeButton');
  private readonly memory = inject(WelcomeMemory);

  /** The focus is part of the URL so it is shareable and works with back/forward. */
  protected readonly focus = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => readOfficeFocus(this.route.snapshot)),
    ),
    { requireSync: true, equal: sameFocus },
  );
  /**
   * What the panel and the room highlighting show: the focus, a couple of
   * frames later. The camera follows `focus` at once, so it is already
   * gliding (on the GPU) while the page does the heavier update.
   */
  protected readonly shown = signal<OfficeFocus>(this.focus());
  private readonly delayFrames = inject(PANEL_DELAY_FRAMES);
  private delayFrame = 0;

  protected readonly activeArea = computed(() => this.shown().area);
  /** The opened project, if its slug matches one on the wall. */
  protected readonly project = computed(() => this.findProject(this.shown().project));
  protected readonly projectMissing = computed(() => !!this.shown().project && !this.project());
  /** The opened experience, if its id matches one in the presentation. */
  protected readonly experience = computed(() => {
    const id = this.shown().experience;
    return id ? (this.content.content().experience.find((e) => e.id === id) ?? null) : null;
  });
  protected readonly experienceMissing = computed(() => !!this.shown().experience && !this.experience());

  /**
   * The welcome popup opens by itself on the first visit only. Once closed it
   * collapses into a small button that can reopen it.
   */
  protected readonly welcomeOpen = signal(false);
  /** Briefly shows the exploration hint next to the button after closing. */
  protected readonly hintExpanded = signal(false);
  private hintTimer: ReturnType<typeof setTimeout> | undefined;
  /** Where focus goes after the popup closes. */
  private focusAfterClose: 'button' | 'area' | 'none' = 'button';

  protected readonly wide = signal(true);

  private readonly windowSize = signal({ w: 0, h: 0 });

  /** Desktop panel width: a case study gets more room; the career timeline a little. */
  protected readonly panelWidth = computed(() => {
    // From the new focus at once, so the camera frames the final layout.
    const f = this.focus();
    if (this.findProject(f.project)) return Math.round(Math.min(620, Math.max(440, 0.44 * this.windowSize().w)));
    return f.area === 'meeting' ? 440 : 400;
  });

  /**
   * Space hidden by the panel, so the camera frames the focus beside it.
   * Desktop: the side panel. Mobile: a bottom sheet over the lower part of
   * the scene (sizes mirror home.scss).
   */
  protected readonly sceneInsets = computed<Insets>(() => {
    if (this.wide()) return { ...NO_INSETS, right: this.panelWidth() + 32 };
    const { w, h } = this.windowSize();
    const sceneH = Math.min(0.75 * w, 0.5 * h);
    const sheetH = Math.min(0.62 * h, 560) + 8;
    return { ...NO_INSETS, bottom: Math.max(0, sceneH - (h - sheetH)) };
  });

  constructor() {
    // The panel and highlighting follow the focus a few frames later (at
    // once on the server, which has no frames).
    const frames = typeof requestAnimationFrame === 'function';
    effect(() => {
      const f = this.focus();
      untracked(() => {
        if (!this.delayFrames || !frames) return this.shown.set(f);
        cancelAnimationFrame(this.delayFrame);
        let left = this.delayFrames;
        const tick = () => (--left > 0 ? (this.delayFrame = requestAnimationFrame(tick)) : this.shown.set(f));
        this.delayFrame = requestAnimationFrame(tick);
      });
    });
    this.destroyRef.onDestroy(() => frames && cancelAnimationFrame(this.delayFrame));

    afterNextRender(() => {
      // A shared link to a specific area should not be covered by the popup.
      if (!this.memory.hasSeen() && !this.activeArea()) this.openWelcome();

      const mq = typeof window.matchMedia === 'function' ? window.matchMedia(WIDE_QUERY) : null;
      const update = () => {
        this.wide.set(mq?.matches ?? true);
        this.windowSize.set({ w: window.innerWidth, h: window.innerHeight });
      };
      update();
      window.addEventListener('resize', update, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', update));
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.hintTimer));

    // Title and description follow the focus (also in the prerendered pages).
    const title = inject(Title);
    const meta = inject(Meta);
    effect(() => {
      const t = this.lang.t();
      const p = this.content.profile();
      const name = this.content.real(p.name) ?? t.home.titleFallback;
      const area = this.activeArea();
      const project = this.project();
      const experience = this.experience();
      if (experience) {
        const where = experience.role.toLowerCase().includes(experience.organization.toLowerCase()) ? '' : ` · ${experience.organization}`;
        title.setTitle(`${experience.role}${where} · ${name}`);
        meta.updateTag({ name: 'description', content: experience.overview });
      } else if (project) {
        title.setTitle(`${this.content.real(project.name) ?? t.areas.projects.name} · ${name}`);
        meta.updateTag({ name: 'description', content: this.content.real(project.summary) ?? t.areas.projects.blurb });
      } else if (area) {
        title.setTitle(`${t.areas[area].section} · ${name}`);
        meta.updateTag({ name: 'description', content: t.areas[area].blurb });
      } else {
        const role = this.content.real(p.title);
        title.setTitle(role ? `${name} · ${role}` : name);
        meta.updateTag({ name: 'description', content: this.content.real(p.introduction) ?? t.home.introFallback });
      }
    });

    // Keep keyboard focus with the interaction: into the panel when it opens or
    // changes, back to where the visitor came from when going up a level.
    let previous: OfficeFocus | null = null;
    effect(() => {
      const current = this.shown();
      untracked(() => {
        const prev = previous;
        previous = current;
        if (!prev) return; // First render: nothing to move from.
        afterNextRender(() => this.moveFocus(prev, current), { injector: this.injector });
      });
    });
  }

  private moveFocus(prev: OfficeFocus, current: OfficeFocus): void {
    if (current.area) {
      // On small screens the scene sits at the top of the page; bring it into view.
      if (!this.wide()) window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      // Back from a case study or an experience: return to it in the list.
      const prevItem = focusItem(prev);
      const backFromItem = prevItem && !focusItem(current) && current.area === prev.area;
      if (backFromItem && this.panel()?.focusItem(prevItem)) return;
      this.panel()?.focusHeading();
    } else if (prev.area) {
      this.host.nativeElement.querySelector<HTMLElement>(`[data-area-link="${prev.area}"]`)?.focus({ preventScroll: true });
    }
  }

  private findProject(slug: string | null) {
    return slug ? (this.content.projects().find((p) => p.slug === slug) ?? null) : null;
  }

  protected openWelcome(): void {
    const dialog = this.welcomeDialog().nativeElement;
    if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
    this.welcomeOpen.set(true);
    this.hintExpanded.set(false);
  }

  /** "Explore the office": close the popup and put the visitor on the first area. */
  protected explore(): void {
    this.closeWelcome('area');
  }

  protected closeWelcome(focus: 'button' | 'area' | 'none' = 'button'): void {
    this.focusAfterClose = focus;
    const dialog = this.welcomeDialog().nativeElement;
    if (dialog.open) dialog.close(); // fires (close) → onWelcomeClosed()
    else this.onWelcomeClosed();
  }

  /** Runs for every way of closing: buttons, Escape, or a click on the backdrop. */
  protected onWelcomeClosed(): void {
    if (!this.welcomeOpen()) return;
    this.welcomeOpen.set(false);
    this.memory.markSeen();

    this.hintExpanded.set(true);
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.hintExpanded.set(false), 4500);

    const target = this.focusAfterClose;
    this.focusAfterClose = 'button';
    if (target === 'none') return; // A link inside the popup moves focus itself.
    afterNextRender(
      () => {
        const el =
          target === 'area'
            ? this.host.nativeElement.querySelector<HTMLElement>('[data-area-link]')
            : this.welcomeButton()?.nativeElement;
        el?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  /** Clicks on the dialog element itself land on the backdrop area. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.welcomeDialog().nativeElement) this.closeWelcome();
  }

  protected areaPath(id: AreaId): string {
    return this.lang.path(AREA_BY_ID[id].route);
  }

  /** Escape goes up one level: case study or experience → its room → office overview. */
  protected onEscape(event: Event): void {
    if (event.defaultPrevented || this.welcomeOpen()) return;
    const area = this.activeArea();
    if (!area) return;
    this.router.navigateByUrl(focusItem(this.focus()) ? this.areaPath(area) : this.lang.path('/'));
  }
}
