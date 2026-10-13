import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { SceneObject } from '../engine/iso';

/**
 * Renders a list of scene objects as SVG primitives. Used as an attribute
 * component on an <svg:g> so the markup stays valid SVG. OnPush with static
 * inputs means the (large) static geometry is never re-checked.
 */
@Component({
  selector: 'g[appSceneShapes]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Materials target the SVG primitives rendered here, scoped under `.scene`.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './materials.scss',
  template: `
    @for (o of objects(); track $index) {
      @for (s of o.shapes; track $index) {
        @switch (s.kind) {
          @case ('poly') {
            <svg:polygon [attr.points]="s.points" [attr.class]="s.cls" />
          }
          @case ('ellipse') {
            <svg:ellipse [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.rx]="s.rx" [attr.ry]="s.ry" [attr.class]="s.cls" />
          }
          @case ('line') {
            <svg:line [attr.x1]="s.x1" [attr.y1]="s.y1" [attr.x2]="s.x2" [attr.y2]="s.y2" [attr.class]="s.cls" />
          }
        }
      }
    }
  `,
})
export class SceneShapes {
  readonly objects = input.required<readonly SceneObject[]>({ alias: 'appSceneShapes' });
}
