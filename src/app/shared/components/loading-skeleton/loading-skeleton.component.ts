import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    @if (variant() === 'product') {
      <div class="sk-pdp container" aria-busy="true" aria-label="Loading product">
        <div class="sk-gallery"></div>
        <div class="sk-info">
          <div class="sk-line short"></div>
          <div class="sk-line title"></div>
          <div class="sk-line mid"></div>
          <div class="sk-line"></div>
          <div class="sk-line"></div>
          <div class="sk-cta"></div>
        </div>
      </div>
    } @else if (variant() === 'page') {
      <div class="sk-page container" aria-busy="true" aria-label="Loading">
        <div class="sk-line title"></div>
        <div class="sk-line mid"></div>
        <div class="sk-block"></div>
      </div>
    } @else {
      <div class="sk-grid" [style.--cols]="columns()" aria-busy="true" aria-label="Loading products">
        @for (item of items; track item) {
          <div class="sk-card">
            <div class="sk-img"></div>
            <div class="sk-line"></div>
            <div class="sk-line short"></div>
          </div>
        }
      </div>
    }
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
    .sk-img, .sk-line, .sk-gallery, .sk-cta, .sk-block {
      background: linear-gradient(90deg, var(--lvj-panel-alt), var(--lvj-panel), var(--lvj-panel-alt));
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 6px;
    }
    .sk-img { aspect-ratio: 1 / 1.15; border-radius: 12px; }
    .sk-line { height: 12px; }
    .sk-line.short { width: 40%; }
    .sk-line.mid { width: 68%; }
    .sk-line.title { height: 22px; width: 72%; border-radius: 8px; }

    .sk-pdp {
      display: grid;
      gap: 1.75rem;
      padding: 1.5rem 1rem 3rem;
    }
    @media (min-width: 900px) {
      .sk-pdp {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        gap: 2.5rem;
        align-items: start;
      }
    }
    .sk-gallery {
      aspect-ratio: 1;
      border-radius: 16px;
      min-height: 280px;
    }
    .sk-info {
      display: grid;
      gap: 0.85rem;
      padding-top: 0.4rem;
    }
    .sk-cta {
      height: 48px;
      border-radius: 999px;
      margin-top: 0.6rem;
      width: min(100%, 280px);
    }

    .sk-page {
      display: grid;
      gap: 0.9rem;
      padding: 2rem 1rem 4rem;
    }
    .sk-block {
      margin-top: 0.75rem;
      min-height: 220px;
      border-radius: 16px;
    }

    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `]
})
export class LoadingSkeletonComponent {
  readonly count = input(8);
  readonly columns = input(4);
  readonly variant = input<'grid' | 'product' | 'page'>('grid');
  get items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
