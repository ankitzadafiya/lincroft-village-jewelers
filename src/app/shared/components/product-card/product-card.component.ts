import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../core/models';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, FavoriteButtonComponent, PricePipe],
  template: `
    <article class="card">
      <a [routerLink]="['/product', product().slug]" class="media">
        @if (primarySrc()) {
          <img
            class="img primary"
            [class.has-hover]="!!hoverSrc()"
            [src]="primarySrc()"
            [alt]="product().name"
            loading="lazy" />
          @if (hoverSrc(); as hover) {
            <img class="img hover" [src]="hover" [alt]="product().name" loading="lazy" />
          }
        } @else {
          <div class="placeholder">Image forthcoming</div>
        }
        <div class="actions">
          <app-favorite-button [id]="product().id" />
        </div>
      </a>
      <div class="body">
        @if (product().designerName) {
          <p class="brand">{{ product().designerName }}</p>
        } @else {
          <p class="brand">{{ product().categoryName }}</p>
        }
        <h3><a [routerLink]="['/product', product().slug]">{{ product().name }}</a></h3>
        <div class="meta">
          <span class="price">{{ product().price | lvjPrice: product().showPrice }}</span>
          @if (config.isPriceVisible(product()) && product().compareAtPrice) {
            <span class="price-compare">{{ product().compareAtPrice | lvjPrice: true }}</span>
          }
        </div>
      </div>
    </article>
  `,
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  readonly product = input.required<ProductListItem>();
  readonly config = inject(ConfigurationService);

  primarySrc(): string {
    const img = this.product().primaryImage;
    return img?.thumbnailUrl || img?.url || '';
  }

  hoverSrc(): string {
    const img = this.product().hoverImage;
    return img?.thumbnailUrl || img?.url || '';
  }
}
