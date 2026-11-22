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
import { Experience } from '../../../content';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { cvOptions, downloadAll } from '../../core/content/cv';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { journey, periodText } from '../career';
import { AREAS, AREA_BY_ID, AreaId } from '../scene/areas';

@Component({
  selector: 'app-area-panel',
  imports: [RouterLink, Icon, ContentText],
  templateUrl: './area-panel.html',
  styleUrl: './area-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaPanel {
  readonly area = input.required<AreaId>();

  readonly projectMissing = input(false);

  readonly experienceMissing = input(false);

  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  protected readonly index = computed(() => AREAS.findIndex((a) => a.id === this.area()));
  protected readonly strings = computed(() => this.lang.t().areas[this.area()]);
  protected readonly position = computed(() =>
    this.lang
      .t()
      .office.areaOf.replace('{n}', String(this.index() + 1).padStart(2, '0'))
      .replace('{total}', String(AREAS.length).padStart(2, '0')),
  );

  private readonly view = computed(() => this.area());

  private readonly c = computed(() => this.content.content());
  protected readonly profile = computed(() => this.c().profile);
  protected readonly journeyRows = computed(() => journey(this.c().experience.filter((e) => this.content.visible(e.role))));
  protected readonly skills = computed(() => this.c().skills.filter((g) => this.content.visible(g.skills)));
  protected readonly education = computed(() => this.c().education.filter((e) => this.content.visible(e.degree)));
  protected readonly certifications = computed(() => this.c().certifications.filter((e) => this.content.visible(e.name)));
  protected readonly cv = computed(() => this.c().cv);
  protected readonly cvFiles = computed(() => cvOptions(this.cv()));
  protected readonly contact = computed(() => this.c().contact);
  protected readonly links = computed(() => this.contact().links.filter((l) => this.content.visible(l.url)));

  protected readonly githubProfile = computed(() => this.content.real(this.contact().links.find((l) => l.kind === 'github')?.url));

  protected readonly isEmpty = computed(() => {
    const v = (x: unknown) => this.content.visible(x);
    switch (this.area()) {
      case 'reception':
        return !v(this.profile().name) && !v(this.profile().introduction) && !v(this.profile().about);
      case 'workstation':
        return !this.skills().length;
      case 'projects':
        return !this.content.projects().length;
      case 'meeting':
        return !this.journeyRows().rows.length && !this.journeyRows().parallel.length;
      case 'library':
        return false;
      case 'blog':
        return false;
      case 'lounge':
        return !v(this.contact().email) && !this.links().length && !v(this.contact().message);
    }
  });

  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => clearTimeout(this.copiedTimer));

    let shown: string | null = null;
    afterRenderEffect(() => {
      const view = this.view();
      const el = this.body().nativeElement;
      if (shown !== null && shown !== view) {

        requestAnimationFrame(() => {
          el.scrollTop = 0;
          const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          if (!still && el.animate) {
            el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], {
              duration: 260,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            });
          }
        });
      }
      shown = view;
    });
  }

  protected areaPath(id: AreaId): string {
    return this.lang.path(AREA_BY_ID[id].route);
  }

  protected downloadBothCvs(): void {
    if (this.isBrowser) downloadAll(this.cvFiles(), document);
  }

  protected telHref(phone: string): string {
    return 'tel:' + phone.replace(/[^\d+]/g, '');
  }

  protected experiencePath(id: string): string {
    return this.lang.path('/experience/' + id);
  }

  protected periodOf(e: Experience): string {
    return periodText(e, this.lang.t());
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

    }
  }

  focusHeading(): void {
    this.heading()?.nativeElement.focus({ preventScroll: true });
  }

  focusItem(id: string): boolean {
    const link = this.host.nativeElement.querySelector<HTMLElement>(`[data-item-link="${id}"]`);
    link?.focus({ preventScroll: true });
    return !!link;
  }
}
