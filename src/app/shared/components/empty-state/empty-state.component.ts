import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <p class="eyebrow">{{ eyebrow() }}</p>
      <h3>{{ title() }}</h3>
      <p class="muted">{{ message() }}</p>
      <ng-content />
    </div>
  `,
  styles: [`
    .empty {
      text-align: center;
      padding: 4rem 1rem;
    }
    h3 {
      font-family: var(--font-body);
      font-size: 1.55rem;
      font-style: normal;
      font-weight: 550;
      letter-spacing: -0.02em;
      margin-bottom: 0.6rem;
    }
  `]
})
export class EmptyStateComponent {
  readonly eyebrow = input('Collection');
  readonly title = input('Nothing here just yet');
  readonly message = input('Try another search or browse the atelier collection.');
}
