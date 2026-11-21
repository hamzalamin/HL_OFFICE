import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BlogPostMeta, Experience, Project } from '../../../content';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { BlogPostView } from '../blog-post/blog-post';
import { ExperienceDetail } from '../experience-detail/experience-detail';
import { ProjectCaseStudy } from '../project-case-study/project-case-study';
import { AREA_BY_ID } from '../scene/areas';

/**
 * Deep content (a project's case study, an experience) opens as an airy,
 * centred editorial sheet over the dimmed office, instead of being squeezed
 * beside a room. A modal <dialog>: the office behind is inert while it is
 * open, and Escape or the backdrop go back to the room (the page handles
 * Escape, so the URL stays the source of truth).
 */
@Component({
  selector: 'app-focus-sheet',
  imports: [RouterLink, Icon, ContentText, ProjectCaseStudy, ExperienceDetail, BlogPostView],
  templateUrl: './focus-sheet.html',
  styleUrl: './focus-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusSheet {
  readonly project = input<Project | null>(null);
  readonly experience = input<Experience | null>(null);
  readonly post = input<BlogPostMeta | null>(null);

  protected readonly lang = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  /** The room this item belongs to: the back link and the backdrop lead there. */
  private readonly room = computed(() => (this.project() ? 'projects' : this.post() ? 'blog' : 'meeting'));
  protected readonly roomPath = computed(() => this.lang.path(AREA_BY_ID[this.room()].route));
  protected readonly backLabel = computed(() => {
    const t = this.lang.t();
    if (this.project()) return t.office.backTo.replace('{place}', t.areas.projects.name);
    return this.post() ? t.blog.back : t.career.backToJourney;
  });
  protected readonly kicker = computed(() => this.lang.t().areas[this.room()].section);
  private readonly view = computed(() => this.project()?.slug ?? this.experience()?.id ?? this.post()?.slug ?? '');

  constructor() {
    afterNextRender(() => {
      const d = this.dialog().nativeElement;
      if (!d.open && typeof d.showModal === 'function') d.showModal();
      else if (!d.open) d.setAttribute('open', '');
      this.focusHeading();
    });

    // Another item in the same sheet: start again at the top.
    let shown: string | null = null;
    afterRenderEffect(() => {
      const view = this.view();
      if (shown !== null && shown !== view) requestAnimationFrame(() => (this.body().nativeElement.scrollTop = 0));
      shown = view;
    });
  }

  /** Escape is handled by the page (one level up); keep the dialog from closing itself. */
  protected onCancel(event: Event): void {
    event.preventDefault();
  }

  /** A click on the dialog element itself is a click on the backdrop: back to the room. */
  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.router.navigateByUrl(this.roomPath());
  }

  focusHeading(): void {
    this.heading()?.nativeElement.focus({ preventScroll: true });
  }
}
