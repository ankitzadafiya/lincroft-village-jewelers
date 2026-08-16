import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink],
  template: `
    <a class="cat" [routerLink]="'/' + category().slug">
      <div class="media">
        <img [src]="category().imageUrl" [alt]="category().name" loading="lazy" />
      </div>
      <div class="copy">
        <h3>{{ category().name }}</h3>
        @if (category().productCount != null) {
          <p>{{ category().productCount }} items</p>
        }
      </div>
    </a>
  `,
  styles: [`
    .cat {
      display: block;
      background: #fff;
    }
    .media {
      aspect-ratio: 1 / 1.15;
      overflow: hidden;
      background: #f5f5f5;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.55s var(--lvj-ease);
    }
    .cat:hover img { transform: scale(1.04); }
    .copy {
      padding: 0.85rem 0 0;
      text-align: center;
    }
    h3 {
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 600;
      font-style: normal;
      letter-spacing: 0;
    }
    p {
      margin-top: 0.2rem;
      color: var(--lvj-muted);
      font-size: 0.75rem;
    }
  `]
})
export class CategoryCardComponent {
  readonly category = input.required<Category>();
}
