import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem, productDisplayBrand } from '../../../core/models';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { InquiryService } from '../../../core/services/inquiry.service';
import { ToastService } from '../../../core/services/toast.service';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';
import { AppIconComponent } from '../../icons/lvj-icons';
import { PricePipe } from '../../pipes/price.pipe';

interface CardBadge {
  label: string;
  tone: 'sale' | 'new' | 'sold';
}

/**
 * Storefront product card (used by every product grid).
 * Hover: second photo cross-fades in, action rail (wishlist / inquiry bag /
 * view) slides in from the right. Badges are derived from real product data
 * only — sold, % off (when prices are visible), or new arrival.
 */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, FavoriteButtonComponent, AppIconComponent, PricePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  readonly product = input.required<ProductListItem>();
  /** 'dark' = white text, for cards placed on a navy panel. */
  readonly tone = input<'light' | 'dark'>('light');
  readonly config = inject(ConfigurationService);
  private readonly inquiry = inject(InquiryService);
  private readonly toast = inject(ToastService);

  readonly primarySrc = computed(() => {
    const img = this.product().primaryImage;
    return img?.thumbnailUrl || img?.url || '';
  });

  readonly hoverSrc = computed(() => {
    const img = this.product().hoverImage;
    const src = img?.thumbnailUrl || img?.url || '';
    return src && src !== this.primarySrc() ? src : '';
  });

  readonly displayBrand = computed(() => productDisplayBrand(this.product()));

  readonly priceVisible = computed(() => this.config.isPriceVisible(this.product()));

  /** Whole-number discount, only when both prices are visible and genuinely lower. */
  readonly discountPct = computed(() => {
    const p = this.product();
    if (!this.priceVisible() || p.price == null || p.compareAtPrice == null) return 0;
    if (p.price <= 0 || p.compareAtPrice <= p.price) return 0;
    return Math.round((1 - p.price / p.compareAtPrice) * 100);
  });

  readonly badge = computed<CardBadge | null>(() => {
    const p = this.product();
    if (p.availability === 'sold') return { label: 'Sold', tone: 'sold' };
    if (this.discountPct() >= 1) return { label: `${this.discountPct()}% off`, tone: 'sale' };
    if (p.newArrival) return { label: 'New in', tone: 'new' };
    return null;
  });

  addToBag(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.inquiry.add(this.product());
    this.toast.success(`${this.product().name} added to your inquiry bag.`, 'Inquiry bag');
  }
}
