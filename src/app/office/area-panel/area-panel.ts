import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project } from '../../../content';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { ProjectCaseStudy } from '../project-case-study/project-case-study';
import { AREAS, AREA_BY_ID, AreaId } from '../scene/areas';

/**
 * Side panel (desktop) / bottom sheet (mobile) that presents what the focused
 * part of the office holds. All content is shown here, in the office: the
 * panel never sends visitors to a separate page.
 */
@Component({
  selector: 'app-area-panel',
  imports: [RouterLink, Icon, ContentText, ProjectCaseStudy],
  templateUrl: './area-panel.html',
  styleUrl: './area-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaPanel {
  readonly area = input.required<AreaId>();
  /** Project opened on the project wall. */
  readonly project = input<Project | null>(null);
  /** A project URL that matches no project on the wall. */
  readonly projectMissing = input(false);

  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  protected readonly index = computed(() => AREAS.findIndex((a) => a.id === this.area()));
  protected readonly prev = computed(() => AREAS[(this.index() - 1 + AREAS.length) % AREAS.length].id);
  protected readonly next = computed(() => AREAS[(this.index() + 1) % AREAS.length].id);
  protected readonly strings = computed(() => this.lang.t().areas[this.area()]);
  protected readonly position = computed(() =>
    this.lang
      .t()
      .office.areaOf.replace('{n}', String(this.index() + 1))
      .replace('{total}', String(AREAS.length)),
  );
  protected readonly backToWall = computed(() => this.lang.t().office.backTo.replace('{place}', this.lang.t().areas.projects.name));
  /** Changes whenever the panel shows something else. */
  private readonly view = computed(() => `${this.area()}/${this.project()?.slug ?? ''}`);

  // Content of each area, limited to what can be shown.
  private readonly c = computed(() => this.content.content());
  protected readonly profile = computed(() => this.c().profile);
  protected readonly experience = computed(() => this.c().experience.filter((e) => this.content.visible(e.role)));
  protected readonly skills = computed(() => this.c().skills.filter((g) => this.content.visible(g.skills)));
  protected readonly discussions = computed(() =>
    this.content
      .projects()
      .map((project) => ({
        project,
        decisions: (project.decisions ?? []).filter((d) => this.content.visible(d.decision)),
        challenges: (project.challenges ?? []).filter((c) => this.content.visible(c.challenge)),
      }))
      .filter((d) => d.decisions.length || d.challenges.length),
  );
  protected readonly education = computed(() => this.c().education.filter((e) => this.content.visible(e.degree)));
  protected readonly certifications = computed(() => this.c().certifications.filter((e) => this.content.visible(e.name)));
  protected readonly cv = computed(() => this.c().cv);
  protected readonly contact = computed(() => this.c().contact);
  protected readonly links = computed(() => this.contact().links.filter((l) => this.content.visible(l.url)));
  /** The GitHub profile, for visitors who want to see more work. */
  protected readonly githubProfile = computed(() => this.content.real(this.contact().links.find((l) => l.kind === 'github')?.url));

  /** Whether the area has anything to show besides its description. */
  protected readonly isEmpty = computed(() => {
    const v = (x: unknown) => this.content.visible(x);
    switch (this.area()) {
      case 'reception':
        return !v(this.profile().name) && !v(this.profile().introduction) && !v(this.profile().about);
      case 'workstation':
        return !this.experience().length && !this.skills().length;
      case 'projects':
        return !this.content.projects().length;
      case 'engineering':
        return !this.discussions().length;
      case 'library':
        return false; // The CV is always on the shelf, even before its PDF exists.
      case 'lounge':
        return !v(this.contact().email) && !this.links().length && !v(this.contact().message);
    }
  });

  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.copiedTimer));

    // When the panel switches to another area or project, start at the top
    // and let the new content settle in (the panel itself stays in place).
    let shown: string | null = null;
    afterRenderEffect(() => {
      const view = this.view();
      const el = this.body().nativeElement;
      if (shown !== null && shown !== view) {
        el.scrollTop = 0;
        const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (!still && el.animate) {
          el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], {
            duration: 260,
            easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)',
          });
        }
      }
      shown = view;
    });
  }

  protected areaPath(id: AreaId): string {
    return this.lang.path(AREA_BY_ID[id].route);
  }

  protected telHref(phone: string): string {
    return 'tel:' + phone.replace(/[^\d+]/g, '');
  }

  protected projectPath(slug: string): string {
    return this.lang.path('/projects/' + slug);
  }

  protected async copyEmail(email: string): Promise<void> {
    if (!this.isBrowser || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(email);
      this.copied.set(true);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard refused: the address stays selectable as text.
    }
  }

  focusHeading(): void {
    this.heading()?.nativeElement.focus({ preventScroll: true });
  }

  /** Back from a case study: return focus to that project in the list. */
  focusProject(slug: string): boolean {
    const link = this.host.nativeElement.querySelector<HTMLElement>(`[data-project-link="${slug}"]`);
    link?.focus({ preventScroll: true });
    return !!link;
  }
}
