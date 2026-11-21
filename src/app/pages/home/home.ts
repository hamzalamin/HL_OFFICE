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
import { BlogService } from '../../core/content/blog.service';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { AreaPanel } from '../../office/area-panel/area-panel';
import { OfficeFocus, PANEL_DELAY_FRAMES, focusItem, readOfficeFocus, sameFocus } from '../../office/office-focus';
import { FocusSheet } from '../../office/focus-sheet/focus-sheet';
import { Insets, NO_INSETS } from '../../office/office-scene/camera';
import { OfficeScene } from '../../office/office-scene/office-scene';
import { RoomDock } from '../../office/room-dock/room-dock';
import { AREA_BY_ID, AreaId } from '../../office/scene/areas';
import { WelcomeMemory } from './welcome-memory';

/** Breakpoint between the centred folio (wide) and the bottom sheet (phones). */
const WIDE_QUERY = '(min-width: 900px)';

// Layout of the floating pieces, in px. Mirrored in home.scss.
/** Space kept clear at the top for the language and CV controls. */
const TOP = 68;
const TOP_PHONE = 60;
/** Space kept clear at the bottom for the room dock. */
const DOCK = 84;
const DOCK_PHONE = 72;
/** The phone bottom sheet's maximum height (mirrors home.scss). */
function phoneSheetHeight(h: number): number {
  return Math.min(0.5 * h, 460);
}

/**
 * The office: the persistent interface of the whole portfolio. It stays
 * mounted while visitors move between areas and projects (child routes);
 * only the camera and the panel change.
 */
@Component({
  selector: 'app-home',
  imports: [OfficeScene, AreaPanel, FocusSheet, RoomDock, RouterLink, Icon, ContentText],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class Home {
  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly blog = inject(BlogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly panel = viewChild(AreaPanel);
  private readonly sheet = viewChild(FocusSheet);
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
  /** The opened blog post, if its slug matches a published one. */
  protected readonly post = computed(() => this.blog.find(this.shown().post));
  /** Unknown only once the live list has answered: a post published since the build may still come. */
  protected readonly postMissing = computed(() => !!this.shown().post && !this.post() && this.blog.settled());
  /** A case study, an experience or a post is open: it gets the editorial sheet, the folio steps aside. */
  protected readonly deep = computed(() => !!this.project() || !!this.experience() || !!this.post());

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

  /**
   * Space the camera keeps clear: the top controls, the dock and, while a
   * room is open, the bottom sheet (phones). A
   * case study or experience frames its board or slide in the middle, behind
   * the sheet.
   */
  protected readonly sceneInsets = computed<Insets>(() => {
    // From the new focus at once, so the camera frames the final layout.
    const f = this.focus();
    const item =
      !!this.findProject(f.project) ||
      (!!f.experience && this.content.content().experience.some((e) => e.id === f.experience)) ||
      !!this.blog.find(f.post);
    if (this.wide()) {
      if (!f.area) return { ...NO_INSETS, bottom: DOCK };
      return item ? { ...NO_INSETS, top: TOP, bottom: DOCK } : this.roomInsets();
    }
    if (!f.area || item) return { ...NO_INSETS, top: f.area ? TOP_PHONE : 0, bottom: DOCK_PHONE };
    return this.roomInsets();
  });

  /** What the zoom inside the office is fitted to. Wide screens: the folio is centred over the room, so the room keeps the whole canvas. */
  protected readonly roomInsets = computed<Insets>(() =>
    this.wide()
      ? { ...NO_INSETS, top: TOP, bottom: DOCK }
      : { ...NO_INSETS, top: TOP_PHONE, bottom: phoneSheetHeight(this.windowSize().h) + DOCK_PHONE },
  );

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

    // Entering the blog (or opening a post): fetch what is published right now.
    effect(() => {
      if (this.focus().area === 'blog') untracked(() => void this.blog.refresh());
    });

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
      const post = this.post();
      if (post) {
        title.setTitle(`${post.title} · ${name}`);
        meta.updateTag({ name: 'description', content: post.summary || t.areas.blog.blurb });
      } else if (experience) {
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
      // A case study or experience: the sheet takes focus (it does so itself when it opens).
      if (focusItem(current)) return this.sheet()?.focusHeading();
      // Back from one: return to it in the room's folio.
      const prevItem = focusItem(prev);
      if (prevItem && current.area === prev.area && this.panel()?.focusItem(prevItem)) return;
      // Gliding through the rooms with the dock: stay on the dock.
      if (document.activeElement?.closest('app-room-dock')) return;
      this.panel()?.focusHeading();
    } else if (prev.area) {
      if (document.activeElement?.closest('app-room-dock')) return;
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
