import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ServiceSceneKind = 'repair' | 'gold' | 'watch' | 'appraisal' | 'battery' | 'estate';

/**
 * Small animated illustration for each service (pure SVG + CSS, ~4s loop).
 * Cartoon / soft-3D style in the site palette (navy, gold, silver).
 * Decorative only (aria-hidden); the step text carries the meaning.
 * Re-create the component to restart the loop from the beginning.
 */
@Component({
  selector: 'app-service-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-scene.component.html',
  styleUrl: './service-scene.component.scss'
})
export class ServiceSceneComponent {
  readonly kind = input.required<ServiceSceneKind>();
  /** Seconds for one full loop (matches the step duration). */
  readonly duration = input(4);
}
