import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { UiStrings } from '../../core/i18n/ui-strings';
import { Icon } from '../../layout/icon';
import { AREAS, AreaId } from '../scene/areas';

interface AreaLink {
  key: keyof UiStrings['nav'];
  path: string;
}

/** Sections each area leads to. The first link is the primary action. */
const AREA_LINKS: Record<AreaId, AreaLink[]> = {
  reception: [
    { key: 'about', path: '/about' },
    { key: 'cv', path: '/cv' },
  ],
  workstation: [
    { key: 'skills', path: '/skills' },
    { key: 'experience', path: '/experience' },
  ],
  projects: [{ key: 'projects', path: '/projects' }],
  engineering: [{ key: 'engineering', path: '/engineering' }],
  library: [{ key: 'education', path: '/education' }],
  lounge: [{ key: 'contact', path: '/contact' }],
};

/**
 * Side panel (desktop) / bottom sheet (mobile) describing the selected area,
 * with a short preview and links to the full sections.
 */
@Component({
  selector: 'app-area-panel',
  imports: [RouterLink, Icon, ContentText],
  templateUrl: './area-panel.html',
  styleUrl: './area-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaPanel {
  readonly area = input.required<AreaId>();

  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly index = computed(() => AREAS.findIndex((a) => a.id === this.area()));
  protected readonly prev = computed(() => AREAS[(this.index() - 1 + AREAS.length) % AREAS.length].id);
  protected readonly next = computed(() => AREAS[(this.index() + 1) % AREAS.length].id);
  protected readonly strings = computed(() => this.lang.t().areas[this.area()]);
  protected readonly links = computed(() => AREA_LINKS[this.area()]);
  protected readonly position = computed(() =>
    this.lang
      .t()
      .office.areaOf.replace('{n}', String(this.index() + 1))
      .replace('{total}', String(AREAS.length)),
  );

  focusHeading(): void {
    this.heading().nativeElement.focus({ preventScroll: true });
  }
}
