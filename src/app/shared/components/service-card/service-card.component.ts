import { Component, input } from '@angular/core';
import { ServiceOffering } from '../../../core/models';

@Component({
  selector: 'app-service-card',
  template: `
    <article class="svc">
      <div class="num">{{ padded() }}</div>
      <h3>{{ service().title }}</h3>
      <p>{{ service().summary }}</p>
    </article>
  `,
  styles: [`
    .svc {
      padding: 1.6rem 0;
      border-top: 1px solid var(--lvj-line);
    }
    .num {
      font-family: var(--font-body);
      color: var(--lvj-muted);
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    h3 {
      font-family: var(--font-body);
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    p { color: var(--lvj-muted); font-size: 0.92rem; }
  `]
})
export class ServiceCardComponent {
  readonly service = input.required<ServiceOffering>();
  readonly index = input(0);
  padded(): string {
    return String(this.index() + 1).padStart(2, '0');
  }
}
