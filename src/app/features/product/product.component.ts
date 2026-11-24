import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Category,
  DEFAULT_RING_SIZES,
  KARATS,
  Karat,
  KaratPrice,
  METAL_COLORS,
  MetalColor,
  Product,
  ProductListItem,
  ProductMedia,
  metalColorLabel,
  productDisplayBrand
} from '../../core/models';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { InquiryService } from '../../core/services/inquiry.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { FavoriteButtonComponent } from '../../shared/components/favorite-button/favorite-button.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ProductGalleryComponent } from '../../shared/components/product-gallery/product-gallery.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { ContactActionsComponent } from '../../shared/components/contact-actions/contact-actions.component';
import { ProductDescriptionComponent } from '../../shared/components/product-description/product-description.component';
import { descriptionLabels, normalizeLabel, parseDescription } from '../../shared/components/product-description/description-parser';
import { PricePipe } from '../../shared/pipes/price.pipe';

/** Shown under each swatch and used to paint it. */
const SWATCH: Record<MetalColor, string> = {
  yellow: 'linear-gradient(135deg, #fbecb5 0%, #e8c76a 45%, #c99a3a 100%)',
  white: 'linear-gradient(135deg, #ffffff 0%, #e6e9ee 50%, #c3c9d2 100%)',
  rose: 'linear-gradient(135deg, #f8dccd 0%, #e5ad93 50%, #c9846a 100%)'
};

/** "Not sure" is offered after the real sizes so nobody is blocked from inquiring. */
export const SIZE_NOT_SURE = 'Not sure';

const CUSTOM_MAX = 500;

const PICKUP_TEXT =
  'In-store pickup in Lincroft is free. Shipping options and returns are confirmed when you inquire, ' +
  'and every piece is handled personally by our team.';

@Component({
  selector: 'app-product',
  imports: [
    RouterLink,
    FavoriteButtonComponent,
    LoadingSkeletonComponent,
    ProductGalleryComponent,
    ProductGridComponent,
    ContactActionsComponent,
    ProductDescriptionComponent,
    PricePipe
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly inquiry = inject(InquiryService);
  private readonly toast = inject(ToastService);
  private readonly seo = inject(SeoService);
  readonly config = inject(ConfigurationService);

  readonly product = signal<Product | null>(null);
  readonly related = signal<ProductListItem[]>([]);
  readonly error = signal('');
  readonly loading = signal(true);
  private readonly categories = signal<Category[]>([]);

  // ── Customer choices ──────────────────────────────
  readonly metalColor = signal<MetalColor | null>(null);
  readonly karat = signal<Karat | null>(null);
  readonly ringSize = signal<string | null>(null);
  readonly customize = signal(false);
  readonly customNote = signal('');
  /** Set after a failed "add" so missing choices are highlighted. */
  readonly triedSubmit = signal(false);

  readonly sizeNotSure = SIZE_NOT_SURE;
  readonly customMax = CUSTOM_MAX;

  /** Rings get the 4–11 size picker by default, even before the backend sends sizes. */
  readonly isRing = computed(() => {
    const p = this.product();
    if (!p) return false;
    const cat = this.categories().find(c => c.id === p.categoryId);
    if (!cat) return false;
    return /^rings?$/i.test(cat.slug) || /^rings?$/i.test(cat.name);
  });

  /** Gold tones on offer — from options, or inferred from color-tagged photos. */
  readonly colorOptions = computed(() => {
    const p = this.product();
    if (!p) return [];
    const configured = p.options?.metalColors ?? [];
    const tagged = new Set((p.images ?? []).map(i => i.metalColor).filter(Boolean));
    const offered = configured.length ? configured : [...tagged];
    return METAL_COLORS
      .filter(c => offered.includes(c.value))
      .map(c => ({ ...c, swatch: SWATCH[c.value] }));
  });

  readonly karatOptions = computed<KaratPrice[]>(() => {
    const list = this.product()?.options?.karatPrices ?? [];
    return KARATS
      .map(k => list.find(x => x.karat === k))
      .filter((x): x is KaratPrice => !!x);
  });

  readonly sizeOptions = computed<string[]>(() => {
    const opts = this.product()?.options;
    const show = opts?.showRingSizes ?? this.isRing();
    if (!show) return [];
    return opts?.ringSizes?.length ? opts.ringSizes : DEFAULT_RING_SIZES;
  });

  readonly allowCustomization = computed(() => this.product()?.options?.allowCustomization !== false);

  private readonly selectedKaratPrice = computed(() =>
    this.karatOptions().find(k => k.karat === this.karat()) ?? null);

  /** Price for the picked karat, falling back to the product price. */
  readonly price = computed(() => this.selectedKaratPrice()?.price ?? this.product()?.price ?? null);

  readonly compareAtPrice = computed(() => {
    const p = this.product();
    if (!p) return null;
    const k = this.selectedKaratPrice();
    if (k?.compareAtPrice) return k.compareAtPrice;
    // The product-level compare price belongs to the default karat only.
    const isDefault = !k || k.karat === (p.options?.defaultKarat ?? this.karatOptions()[0]?.karat);
    return isDefault ? p.compareAtPrice ?? null : null;
  });

  readonly savePercent = computed(() => {
    const price = this.price();
    const compare = this.compareAtPrice();
    if (!price || !compare || compare <= price) return null;
    return Math.round((1 - price / compare) * 100);
  });

  /** Photos for the picked color, plus photos that suit every color. */
  readonly gallery = computed<ProductMedia[]>(() => {
    const images = this.product()?.images ?? [];
    const color = this.metalColor();
    if (!color || !images.some(i => i.metalColor)) return images;
    const forColor = images.filter(i => i.metalColor === color);
    const shared = images.filter(i => !i.metalColor);
    if (forColor.length) return [...forColor, ...shared];
    return shared.length ? shared : images;
  });

  readonly sizeMissing = computed(() => this.sizeOptions().length > 0 && !this.ringSize());
  readonly noteMissing = computed(() => this.customize() && !this.customNote().trim());

  /**
   * One description for the whole page: the client's text, then any specs it
   * does not already mention, then pickup info if shipping is not covered.
   * Material options are hidden when the pickers above already show them.
   */
  readonly descriptionText = computed(() => {
    const p = this.product();
    if (!p) return '';
    const base = p.description?.trim() || 'A carefully selected piece from the Lincroft Village Jewelers collection.';
    const parsed = parseDescription(base);
    const covered = descriptionLabels(parsed);
    const hasPickers = this.colorOptions().length > 0 || this.karatOptions().length > 0;
    const hidden = new Set<string>([
      ...(hasPickers ? ['metal', 'karat', 'metal type', 'metal karat', 'gold tone'] : []),
      ...(this.sizeOptions().length ? ['size', 'ring size'] : [])
    ]);

    const extra = (p.specs ?? []).filter(s => {
      if (!s.value?.trim()) return false;
      const names = [normalizeLabel(s.label), normalizeLabel(s.key.replace(/([a-z])([A-Z])/g, '$1 $2'))];
      if (names.some(n => hidden.has(n))) return false;
      return !names.some(n => [...covered].some(c => c === n || c.includes(n) || n.includes(c)));
    });

    const parts = [base];
    if (extra.length) {
      parts.push(['SPECIFICATIONS', ...extra.map(s => `${s.label}: ${s.value}`)].join('\n'));
    }
    if (!parsed.sections.some(s => /ship|deliver|pickup|return|packag/.test(s.key))) {
      parts.push(`PICKUP & RETURNS\n${PICKUP_TEXT}`);
    }
    return parts.join('\n\n');
  });

  /** Sections the pickers already cover. */
  readonly hiddenSections = computed(() =>
    this.colorOptions().length || this.karatOptions().length ? ['material options', 'metal options'] : []);

  availabilityLabel(p: Product): string {
    switch (p.availability) {
      case 'in_stock': return 'In stock';
      case 'sold': return 'Sold';
      default: return p.availability.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
    }
  }

  displayBrand(product: Product): string {
    return productDisplayBrand({
      brandName: product.brandName,
      designerName: product.designerName
    }) || 'Lincroft Village Jewelers';
  }

  colorLabel(color: MetalColor | null): string {
    return metalColorLabel(color);
  }

  ngOnInit(): void {
    this.categoriesApi.list().subscribe({ next: list => this.categories.set(list), error: () => {} });

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
          this.resetChoices(product);
          this.loading.set(false);
          this.seo.set({
            title: product.name,
            description:
              this.plainSummary(product) ||
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

  private resetChoices(p: Product): void {
    const colors = this.colorOptions().map(c => c.value);
    const wantColor = p.options?.defaultMetalColor;
    this.metalColor.set(wantColor && colors.includes(wantColor) ? wantColor : colors[0] ?? null);

    const karats = this.karatOptions().map(k => k.karat);
    const wantKarat = p.options?.defaultKarat;
    this.karat.set(wantKarat && karats.includes(wantKarat) ? wantKarat : karats[0] ?? null);

    this.ringSize.set(null);
    this.customize.set(false);
    this.customNote.set('');
    this.triedSubmit.set(false);
  }

  /** First intro paragraph, for meta descriptions. */
  private plainSummary(p: Product): string {
    return parseDescription(p.description).intro[0]?.slice(0, 300) ?? '';
  }

  pickColor(color: MetalColor): void {
    this.metalColor.set(color);
  }

  pickKarat(karat: Karat): void {
    this.karat.set(karat);
  }

  pickSize(size: string): void {
    this.ringSize.set(size);
  }

  toggleCustomize(on: boolean): void {
    this.customize.set(on);
  }

  onNote(event: Event): void {
    this.customNote.set((event.target as HTMLTextAreaElement).value.slice(0, CUSTOM_MAX));
  }

  addInquiry(): void {
    const product = this.product();
    if (!product) return;
    if (this.sizeMissing() || this.noteMissing()) {
      this.triedSubmit.set(true);
      this.toast.error(this.sizeMissing() ? 'Please choose a ring size.' : 'Please tell us how you would like it customized.');
      return;
    }
    const photo = this.gallery()[0];
    this.inquiry.add(product, {
      metalColor: this.metalColor(),
      karat: this.karat(),
      ringSize: this.ringSize(),
      customization: this.customize() ? this.customNote() : null,
      unitPrice: this.config.isPriceVisible(product) ? this.price() : null,
      imageUrl: photo ? photo.thumbnailUrl || photo.url : null
    });
    this.triedSubmit.set(false);
    this.toast.success('Added to your inquiry bag.');
  }

  /** "Rose Gold · 18K · Size 6.5" plus the custom request, for WhatsApp/email. */
  private choiceLines(): string {
    const lines = [
      this.metalColor() ? `Metal color: ${metalColorLabel(this.metalColor())}` : '',
      this.karat() ? `Metal type: ${this.karat()}` : '',
      this.ringSize() ? `Ring size: ${this.ringSize()}` : '',
      this.customize() && this.customNote().trim() ? `Customization: ${this.customNote().trim()}` : ''
    ].filter(Boolean);
    return lines.length ? `\n${lines.join('\n')}` : '';
  }

  whatsappMessage(): string {
    const product = this.product();
    if (!product) return '';
    return `Hello Lincroft Village Jewelers, I would like information about ${product.name} (${product.sku}).${this.choiceLines()}`;
  }

  emailSubject(): string {
    const product = this.product();
    return product ? `Inquiry: ${product.name}` : 'Inquiry';
  }

  emailBodyText(): string {
    const product = this.product();
    if (!product) return '';
    return `Hello,\n\nI would like information about ${product.name} (SKU ${product.sku}).${this.choiceLines()}\n`;
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
      description: this.plainSummary(product) || undefined,
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
}
