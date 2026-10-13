import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Project } from '../../../content';
import { ContentService } from '../../core/content/content.service';
import { ContentText } from '../../core/content/content-text';
import { LanguageService } from '../../core/i18n/language.service';
import { Icon } from '../../layout/icon';

/** Full case study of one project, shown in the panel next to its board. */
@Component({
  selector: 'app-project-case-study',
  imports: [ContentText, Icon],
  templateUrl: './project-case-study.html',
  styleUrl: './project-case-study.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCaseStudy {
  readonly project = input.required<Project>();
  protected readonly lang = inject(LanguageService);
  protected readonly content = inject(ContentService);
}
