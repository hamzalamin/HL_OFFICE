import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { isPlaceholder } from './placeholder';
import { ContentService } from './content.service';

/**
 * Renders a content string. Placeholders (`YOUR_*`) appear as a dashed badge
 * while previewing and are replaced by `fallback` (or nothing) in production.
 */
@Component({
  selector: 'app-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (placeholder()) {
      @if (preview && value()) {
        <span class="placeholder-badge" [attr.title]="'Placeholder: ' + value()">{{ value() }}</span>
      } @else if (fallback()) {
        {{ fallback() }}
      }
    } @else {
      {{ value() }}
    }
  `,
})
export class ContentText {
  readonly value = input<string | undefined>();
  readonly fallback = input<string>('');
  protected readonly preview = inject(ContentService).showPlaceholders;
  protected readonly placeholder = computed(() => {
    const v = this.value();
    return v === undefined || v === '' || isPlaceholder(v);
  });
}
