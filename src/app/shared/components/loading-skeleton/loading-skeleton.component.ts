import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="sk-grid" [style.--cols]="columns()">
      @for (item of items; track item) {
        <div class="sk-card">
          <div class="sk-img"></div>
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sk-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    @media (min-width: 768px) {
      .sk-grid { grid-template-columns: repeat(var(--cols), 1fr); }
    }
    .sk-card { display: grid; gap: 0.7rem; }
    .sk-img, .sk-line {
      background: linear-gradient(90deg, #f0f0f0, #fafafa, #f0f0f0);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .sk-img { aspect-ratio: 1 / 1.15; }
    .sk-line { height: 12px; }
    .sk-line.short { width: 40%; }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `]
})
export class LoadingSkeletonComponent {
  readonly count = input(8);
  readonly columns = input(4);
  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
