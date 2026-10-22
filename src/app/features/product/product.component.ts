import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductListItem, productDisplayBrand } from '../../core/models';
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

  displayBrand(product: Product): string {
    return productDisplayBrand({
      brandName: product.brandName,
      designerName: product.designerName
    }) || 'Lincroft Village Jewelers';
  }

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
            description:
              product.description ||
              `${product.name} available at Lincroft Village Jewelers in Lincroft, NJ.`,
            path: `/product/${product.slug}`,
            image: product.images[0]?.url,
            type: 'product',
            jsonLd: this.productJsonLd(product)
          });
        },
        error: () => {
          this.loading.set(false);
          this.error.set('This piece is no longer listed.');
          this.seo.set({
            title: 'Piece not found',
            description: 'This jewelry piece is no longer listed at Lincroft Village Jewelers.',
            path: `/product/${slug}`,
            noIndex: true
          });
        }
      });
      this.productsApi.related(slug).subscribe(list => this.related.set(list));
    });
  }

  private productJsonLd(product: Product): Record<string, unknown> {
    const url = this.seo.absoluteUrl(`/product/${product.slug}`);
    const images = (product.images || []).map(i => i.url).filter(Boolean);
    const brand = this.displayBrand(product);
    const availability =
      product.availability === 'in_stock'
        ? 'https://schema.org/InStock'
        : product.availability === 'sold'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/PreOrder';

    const productNode: Record<string, unknown> = {
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      sku: product.sku,
      url,
      image: images.length ? images : undefined,
      brand: brand ? { '@type': 'Brand', name: brand } : undefined
    };

    if (this.config.isPriceVisible(product) && product.price != null && product.price > 0) {
      productNode['offers'] = {
        '@type': 'Offer',
        url,
        priceCurrency: 'USD',
        price: product.price,
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': `${this.seo.siteUrl}/#store` }
      };
    }

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: this.seo.absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: this.seo.absoluteUrl('/shop') },
        { '@type': 'ListItem', position: 3, name: product.name, item: url }
      ]
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [this.stripUndefined(productNode), breadcrumb]
    };
  }

  private stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
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
