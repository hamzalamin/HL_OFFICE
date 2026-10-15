import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, linkedSignal, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Experience } from '../../../content';
import { ContentService } from '../../core/content/content.service';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';
import { periodText } from '../career';

type Level = 'overview' | 'details';

/**
 * One experience, as presented in the meeting room: a concise overview, or
 * the detailed responsibilities and technologies (a tab switch, so visitors
 * choose the depth).
 */
@Component({
  selector: 'app-experience-detail',
  imports: [RouterLink, Icon],
  templateUrl: './experience-detail.html',
  styleUrl: './experience-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetail {
  readonly experience = input.required<Experience>();

  protected readonly lang = inject(LanguageService);
  private readonly content = inject(ContentService);
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  /** Back to the overview whenever another experience is opened. */
  protected readonly level = linkedSignal<Experience, Level>({ source: this.experience, computation: () => 'overview' });
  protected readonly levels: readonly Level[] = ['overview', 'details'];

  protected readonly period = computed(() => periodText(this.experience(), this.lang.t()));
  /** Other roles with the same employer, e.g. the internship before a permanent position. */
  protected readonly siblings = computed(() =>
    this.content
      .content()
      .experience.filter((e) => e.organization === this.experience().organization && e.id !== this.experience().id && e.track === 'timeline'),
  );
  protected readonly projects = computed(() => this.experience().projects ?? []);

  protected periodOf(e: Experience): string {
    return periodText(e, this.lang.t());
  }

  protected path(id: string): string {
    return this.lang.path('/experience/' + id);
  }

  /** Arrow keys move between the two tabs (WAI-ARIA tabs pattern). */
  protected onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next: Level = event.key === 'Home' ? 'overview' : event.key === 'End' ? 'details' : this.level() === 'overview' ? 'details' : 'overview';
    this.level.set(next);
    this.tabs()[this.levels.indexOf(next)]?.nativeElement.focus();
  }
}
