import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { IMG } from '../../core/mock/image-catalog';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <p class="eyebrow">About</p>
      <h1>A village jeweler, still.</h1>
      <p class="lede">A considered collection on the floor. The rest, built with you — one appointment at a time in Lincroft.</p>
    </section>
    <section class="container story">
      <div class="media">
        <img [src]="store" alt="Lincroft Village Jewelers atelier" />
      </div>
      <div class="copy">
        <p>Lincroft Village Jewelers is a local fine jewelry studio. We keep a considered collection on the floor and build the rest with you — one appointment at a time.</p>
        <p>The website exists so you can browse, save, and inquire. The important work still happens across the counter: looking at stones in mixed light, talking through budget without theater, and making something that will be worn.</p>
        <a routerLink="/contact" class="btn btn-gold">Visit the atelier</a>
      </div>
    </section>
  `,
  styles: [`
    .story {
      display: grid;
      gap: 2.25rem;
      padding: 0.5rem 0 5rem;
      align-items: center;
    }
    .media {
      overflow: hidden;
      border-radius: 18px;
      background: var(--lvj-soft);
      min-height: 320px;
    }
    img {
      width: 100%;
      height: 100%;
      min-height: 360px;
      object-fit: cover;
    }
    .copy p {
      color: var(--lvj-muted);
      margin-bottom: 1.05rem;
      font-size: 1.05rem;
      line-height: 1.7;
      max-width: 42ch;
    }
    @media (min-width: 900px) {
      .story {
        grid-template-columns: 1.05fr 0.95fr;
        gap: 4rem;
      }
    }
  `]
})
export class AboutComponent {
  readonly store = IMG.store;
  constructor() {
    inject(SeoService).set({
      title: 'About',
      description: 'Lincroft Village Jewelers is a local fine jewelry atelier in Lincroft, New Jersey — engagement, custom design, and lasting service.'
    });
  }
}
