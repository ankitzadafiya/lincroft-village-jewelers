import { Component, input } from '@angular/core';
import { ProductSpec } from '../../../core/models';

@Component({
  selector: 'app-product-specifications',
  template: `
    @if (visible().length) {
      <dl class="specs">
        @for (spec of visible(); track spec.key + spec.label) {
          <div>
            <dt>{{ spec.label }}</dt>
            <dd>{{ spec.value }}</dd>
          </div>
        }
      </dl>
    }
  `,
  styles: [`
    .specs {
      display: grid;
      gap: 0;
      margin: 1.5rem 0;
      border-top: 1px solid var(--lvj-line);
    }
    .specs > div {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--lvj-line);
    }
    dt {
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 0.7rem;
      color: var(--lvj-muted);
    }
    dd { margin: 0; }
  `]
})
export class ProductSpecificationsComponent {
  readonly specs = input<ProductSpec[]>([]);
  visible(): ProductSpec[] {
    return this.specs().filter(s => !!s.value?.trim());
  }
}
