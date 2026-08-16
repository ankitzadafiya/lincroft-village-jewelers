import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../core/models';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, ProductGridComponent, EmptyStateComponent],
  template: `
    <section class="page-hero">
      <p class="eyebrow">Saved</p>
      <h1>Favorites</h1>
      @if (!customer.isAuthenticated()) {
        <p class="muted save-note">
          Saving on this device only.
          <a routerLink="/account">Sign in</a> to keep favorites across visits.
        </p>
      } @else {
        <p class="muted save-note">Synced to {{ customer.user()?.email }}</p>
      }
    </section>
    <section class="container section">
      @if (!products().length) {
        <app-empty-state title="No favorites yet." message="Tap the heart on any piece to save it. Sign in anytime to sync across devices.">
          <div class="empty-actions">
            <a routerLink="/shop" class="btn btn-gold">View jewelry</a>
            <a routerLink="/account" class="btn btn-ghost">Sign in</a>
          </div>
        </app-empty-state>
      } @else {
        <app-product-grid [products]="products()" />
      }
    </section>
  `,
  styles: [`
    .save-note { margin-top: 0.75rem; }
    .save-note a { text-decoration: underline; text-underline-offset: 3px; color: #111; }
    .empty-actions { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; margin-top: 1.2rem; }
  `]
})
export class FavoritesComponent implements OnInit {
  private readonly favorites = inject(FavoriteService);
  private readonly productsApi = inject(ProductService);
  private readonly seo = inject(SeoService);
  readonly customer = inject(CustomerAuthService);
  readonly products = signal<ProductListItem[]>([]);

  ngOnInit(): void {
    this.seo.set({ title: 'Favorites', description: 'Pieces you have saved at Lincroft Village Jewelers.' });
    const ids = this.favorites.favoriteIds();
    if (!ids.length) return;
    this.productsApi.list({ pageSize: 100 }).subscribe(res => {
      this.products.set(res.data.filter(p => ids.includes(p.id)));
    });
  }
}
