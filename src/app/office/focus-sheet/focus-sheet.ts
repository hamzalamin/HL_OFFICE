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

    let shown: string | null = null;
    afterRenderEffect(() => {
      const view = this.view();
      if (shown !== null && shown !== view) requestAnimationFrame(() => (this.body().nativeElement.scrollTop = 0));
      shown = view;
    });
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
  }

  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.router.navigateByUrl(this.roomPath());
  }

  focusHeading(): void {
    this.heading()?.nativeElement.focus({ preventScroll: true });
  }
}
