import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductListItem } from '../../core/models';
import { ProductService } from '../../core/services/product.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { InquiryService } from '../../core/services/inquiry.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { buildMailto, buildWhatsAppUrl } from '../../core/utils/slug';
import { FavoriteButtonComponent } from '../../shared/components/favorite-button/favorite-button.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ProductGalleryComponent } from '../../shared/components/product-gallery/product-gallery.component';
import { ProductSpecificationsComponent } from '../../shared/components/product-specifications/product-specifications.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { PricePipe } from '../../shared/pipes/price.pipe';

@Component({
  selector: 'app-product',
  imports: [
    RouterLink,
    FavoriteButtonComponent,
    LoadingSkeletonComponent,
    ProductGalleryComponent,
    ProductSpecificationsComponent,
    ProductGridComponent,
    SectionHeaderComponent,
    PricePipe
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductService);
  private readonly inquiry = inject(InquiryService);
  private readonly toast = inject(ToastService);
  private readonly seo = inject(SeoService);
  readonly config = inject(ConfigurationService);

  readonly product = signal<Product | null>(null);
  readonly related = signal<ProductListItem[]>([]);
  readonly error = signal('');
  readonly loading = signal(true);
  readonly tab = signal<'desc' | 'details' | 'ship'>('desc');

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.error.set('');
      this.product.set(null);
      this.related.set([]);
      this.productsApi.bySlug(slug).subscribe({
        next: product => {
          this.product.set(product);
          this.loading.set(false);
          this.seo.set({
            title: product.name,
            description: product.description || `${product.name} · ${product.sku}`,
            image: product.images[0]?.url
          });
        },
        error: () => {
          this.loading.set(false);
          this.error.set('This piece is no longer listed.');
        }
      });
      this.productsApi.related(slug).subscribe(list => this.related.set(list));
    });
  }

  addInquiry(): void {
    const product = this.product();
    if (!product) return;
    this.inquiry.add(product);
    this.toast.success('Added to your inquiry bag.');
  }

  whatsapp(): string {
    const product = this.product();
    const cfg = this.config.config();
    if (!product || !cfg) return '#';
    return buildWhatsAppUrl(this.config.whatsAppNumber(), `Hello Lincroft Village Jewelers, I would like information about ${product.name} (${product.sku}).`);
  }

  emailHref(): string {
    const product = this.product();
    const cfg = this.config.config();
    if (!product || !cfg?.email) return '#';
    return buildMailto(cfg.email, `Inquiry: ${product.name}`, `Hello,\n\nI would like information about ${product.name} (SKU ${product.sku}).\n`);
  }
}
