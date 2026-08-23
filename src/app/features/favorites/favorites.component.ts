import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../core/models';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, ProductGridComponent, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <section class="page-hero">
      <p class="eyebrow">Saved</p>
      <h1>Wishlist</h1>
      @if (customer.isAuthenticated()) {
        <p class="muted save-note">Synced to {{ customer.user()?.email }}</p>
      }
    </section>
    <section class="container section">
      @if (!customer.isAuthenticated()) {
        <app-empty-state
          title="Sign in to view your wishlist"
          message="Wishlist is saved to your account so your pieces stay with you on any device.">
          <div class="empty-actions">
            <a routerLink="/account" [queryParams]="{ returnUrl: '/favorites' }" class="btn btn-gold">Sign in</a>
            <a routerLink="/shop" class="btn btn-ghost">Browse jewelry</a>
          </div>
        </app-empty-state>
      } @else if (loading()) {
        <app-loading-skeleton [count]="4" [columns]="4" />
      } @else if (!products().length) {
        <app-empty-state
          title="No saved pieces yet"
          message="Tap the heart on any piece to save it to your wishlist.">
          <div class="empty-actions">
            <a routerLink="/shop" class="btn btn-gold">View jewelry</a>
          </div>
        </app-empty-state>
      } @else {
        <app-product-grid [products]="products()" />
      }
    </section>
  `,
  styles: [`
    .save-note { margin-top: 0.75rem; }
    .empty-actions { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; margin-top: 1.2rem; }
  `]
})
export class FavoritesComponent implements OnInit {
  private readonly favorites = inject(FavoriteService);
  private readonly productsApi = inject(ProductService);
  private readonly seo = inject(SeoService);
  readonly customer = inject(CustomerAuthService);
  readonly products = signal<ProductListItem[]>([]);
  readonly loading = signal(true);
  private lastIdsKey = '';

  constructor() {
    effect(() => {
      if (!this.customer.isAuthenticated()) {
        this.products.set([]);
        this.loading.set(false);
        this.lastIdsKey = '';
        return;
      }
      const ids = this.favorites.favoriteIds();
      const key = ids.slice().sort().join(',');
      if (key === this.lastIdsKey) return;
      this.lastIdsKey = key;
      this.loadProducts(ids);
    });
  }

  ngOnInit(): void {
    this.seo.set({ title: 'Wishlist', description: 'Pieces you have saved at Lincroft Village Jewelers.' });
  }

  private loadProducts(ids: string[]): void {
    if (!ids.length) {
      this.products.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.productsApi.list({ pageSize: 100 }).subscribe({
      next: res => {
        this.products.set(res.data.filter(p => ids.includes(p.id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
