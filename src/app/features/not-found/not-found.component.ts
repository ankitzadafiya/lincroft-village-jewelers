import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <p class="eyebrow">404</p>
      <h1>Page not found</h1>
      <p class="muted">
        That page isn’t in our collection. Try shopping jewelry, custom design, or contact us.
      </p>
      <div class="actions">
        <a routerLink="/" class="btn btn-gold">Home</a>
        <a routerLink="/shop" class="btn btn-ghost">Shop jewelry</a>
        <a routerLink="/contact" class="btn btn-ghost">Contact</a>
      </div>
    </section>
  `,
  styles: [`
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      justify-content: center;
      margin-top: 1.25rem;
    }
  `]
})
export class NotFoundComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Page not found',
      description: 'The page you requested could not be found at Lincroft Village Jewelers.',
      path: '/404',
      noIndex: true
    });
  }
}
