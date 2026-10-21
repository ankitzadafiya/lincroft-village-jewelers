import { Component, ElementRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Category, ProductFilterFacets, ProductListItem, ProductListQuery } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../shared/components/product-filters/product-filters.component';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

interface FilterChip {
  key: 'subcategory' | 'metal' | 'gemstone' | 'diamondType' | 'designer' | 'price';
  group: string;
  label: string;
}

@Component({
  selector: 'app-catalog',
  imports: [
    RouterLink,
    PaginatorModule,
    ProductFiltersComponent,
    ProductCardComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    AppIconComponent
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly config = inject(ConfigurationService);
  private readonly seo = inject(SeoService);

  readonly title = signal('Shop');
  readonly eyebrow = signal('Collection');
  readonly description = signal('Browse the Lincroft Village Jewelers collection.');
  readonly products = signal<ProductListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly facets = signal<ProductFilterFacets | null>(null);
  readonly query = signal<ProductListQuery>({ page: 1, pageSize: 12, sort: 'newest' });
  readonly sortOpen = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly category = signal<Category | null>(null);
  readonly columns = signal(3);
  private facetKey = '';

  /** Removable chips for every active refinement. */
  readonly chips = computed<FilterChip[]>(() => {
    const q = this.query();
    const f = this.facets();
    const label = (list: { value: string; label: string }[] | undefined, value?: string) =>
      list?.find(item => item.value.toLowerCase() === String(value).toLowerCase())?.label ?? String(value);
    const out: FilterChip[] = [];
    if (q.subcategory) out.push({ key: 'subcategory', group: 'Style', label: this.humanize(q.subcategory, q.category) });
    if (q.metal) out.push({ key: 'metal', group: 'Metal', label: label(f?.metals, q.metal) });
    if (q.gemstone) out.push({ key: 'gemstone', group: 'Gemstone', label: label(f?.gemstones, q.gemstone) });
    if (q.diamondType) out.push({ key: 'diamondType', group: 'Diamond', label: label(f?.diamondTypes, q.diamondType) });
    if (q.designer && !this.router.url.startsWith('/designers/')) {
      out.push({ key: 'designer', group: 'Brand', label: label(f?.designers, q.designer) });
    }
    if (q.priceMin != null || q.priceMax != null) {
      const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
      const text = q.priceMin != null && q.priceMax != null
        ? `${usd(q.priceMin)} – ${usd(q.priceMax)}`
        : q.priceMin != null ? `From ${usd(q.priceMin)}` : `Up to ${usd(q.priceMax!)}`;
      out.push({ key: 'price', group: 'Price', label: text });
    }
    return out;
  });

  readonly sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Best selling', value: 'featured' },
    { label: 'Price · low to high', value: 'price_asc' },
    { label: 'Price · high to low', value: 'price_desc' }
  ];

  readonly densityOptions = [
    { cols: 2, icon: 'columns-2', label: 'Two columns' },
    { cols: 3, icon: 'layout-grid', label: 'Three columns' },
    { cols: 4, icon: 'columns-4', label: 'Four columns' }
  ];

  readonly sortLabel = computed(
    () => this.sortOptions.find(o => o.value === (this.query().sort || 'newest'))?.label ?? 'Newest'
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.sortOpen()) return;
    const wrap = this.host.nativeElement.querySelector('.sort-wrap');
    if (wrap && !wrap.contains(event.target as Node)) this.sortOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.sortOpen.set(false);
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['title']) this.title.set(data['title']);
    });
    this.route.paramMap.subscribe(params => {
      const designer = params.get('slug');
      if (this.router.url.startsWith('/designers/') && designer) {
        this.query.update(q => ({ ...q, designer, page: 1 }));
        this.eyebrow.set('Designer');
        this.title.set('Designer collection');
        this.loadFacets({ designer });
        this.load();
      }
    });
    this.route.queryParamMap.subscribe(() => this.syncFromRoute());
  }

  syncFromRoute(): void {
    const data = this.route.snapshot.data;
    const qp = this.route.snapshot.queryParamMap;
    const category = data['category'] as string | undefined;
    const designerSlug = this.router.url.startsWith('/designers/')
      ? this.route.snapshot.paramMap.get('slug') || undefined
      : this.config.showBrandFilter()
        ? qp.get('designer') || undefined
        : undefined;
    const next: ProductListQuery = {
      category,
      subcategory: qp.get('subcategory') || undefined,
      designer: designerSlug,
      metal: qp.get('metal') || undefined,
      karat: qp.get('karat') || undefined,
      gemstone: qp.get('gemstone') || undefined,
      diamondType: qp.get('diamondType') || undefined,
      priceMin: qp.get('priceMin') ? Number(qp.get('priceMin')) : undefined,
      priceMax: qp.get('priceMax') ? Number(qp.get('priceMax')) : undefined,
      q: qp.get('q') || undefined,
      sort: this.resolveSort(qp.get('sort')),
      page: Number(qp.get('page') || 1),
      pageSize: 12
    };
    this.query.set(next);
    this.loadFacets(next);
    if (category) {
      this.categoriesApi.bySlug(category).subscribe({
        next: cat => {
          this.category.set(cat);
          this.eyebrow.set('Collection');
          this.title.set(cat.name);
          this.description.set(
            cat.description || 'Selected for the floor — browse, save, and inquire from the atelier.'
          );
          this.seo.set({
            title: `${cat.name} Jewelry`,
            description:
              cat.description ||
              `Shop ${cat.name.toLowerCase()} jewelry at Lincroft Village Jewelers in Lincroft, NJ.`,
            path: `/${cat.slug}`,
            image: cat.imageUrl,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: cat.name,
              description: cat.description || undefined,
              url: this.seo.absoluteUrl(`/${cat.slug}`),
              breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: this.seo.absoluteUrl('/') },
                  { '@type': 'ListItem', position: 2, name: 'Shop', item: this.seo.absoluteUrl('/shop') },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: cat.name,
                    item: this.seo.absoluteUrl(`/${cat.slug}`)
                  }
                ]
              }
            }
          });
        },
        error: () =>
          this.seo.set({ title: this.title(), description: this.description(), path: this.router.url.split('?')[0] })
      });
    } else {
      this.eyebrow.set(this.router.url.startsWith('/designers/') ? 'Designer' : 'Shop');
      this.title.set(data['title'] || 'Shop');
      this.description.set('Browse the Lincroft Village Jewelers collection.');
      const path = this.router.url.split('?')[0] || '/shop';
      this.seo.set({
        title: this.title() === 'Shop' ? 'Shop Fine Jewelry' : this.title(),
        description: this.description(),
        path,
        noIndex: path.startsWith('/designers/') ? false : !!next.q
      });
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.productsApi.list(this.query()).subscribe({
      next: res => {
        this.products.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilter(query: ProductListQuery): void {
    this.query.set(query);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toParams(query)
    });
  }

  removeChip(key: FilterChip['key']): void {
    const next: ProductListQuery = { ...this.query(), page: 1 };
    if (key === 'price') {
      next.priceMin = undefined;
      next.priceMax = undefined;
    } else {
      next[key] = undefined;
    }
    this.onFilter(next);
  }

  clearAll(): void {
    const { category, q, sort, pageSize } = this.query();
    const designer = this.router.url.startsWith('/designers/') ? this.query().designer : undefined;
    this.onFilter({ category, q, sort, pageSize, designer, page: 1 });
  }

  /** "ring-lab-grown-engagement-ring" → "Lab-grown engagement ring". */
  private humanize(slug: string, category?: string): string {
    const trimmed = category && slug.startsWith(category + '-') ? slug.slice(category.length + 1) : slug;
    const text = trimmed.replace(/-/g, ' ').replace(/\blab grown\b/i, 'lab-grown');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onSort(sort: string): void {
    this.onFilter({ ...this.query(), sort: this.resolveSort(sort), page: 1 });
  }

  private resolveSort(sort: string | null | undefined): ProductListQuery['sort'] {
    const allowed = new Set(this.sortOptions.map(option => option.value));
    return sort && allowed.has(sort) ? (sort as ProductListQuery['sort']) : 'newest';
  }

  onPage(event: PaginatorState): void {
    this.onFilter({ ...this.query(), page: (event.page ?? 0) + 1, pageSize: event.rows ?? 12 });
  }

  private loadFacets(query: ProductListQuery): void {
    const onDesigner = this.router.url.startsWith('/designers/');
    const key = `${query.category ?? ''}|${query.subcategory ?? ''}|${onDesigner ? query.designer ?? '' : ''}`;
    if (key === this.facetKey && this.facets()) return;
    this.facetKey = key;
    this.productsApi.facetsWithAccurateCounts({
      category: query.category,
      subcategory: query.subcategory,
      designer: onDesigner ? query.designer : undefined
    }).subscribe(f => this.facets.set(f));
  }

  private toParams(query: ProductListQuery): Record<string, string | null> {
    const keys: (keyof ProductListQuery)[] = [
      'subcategory',
      'designer',
      'metal',
      'karat',
      'gemstone',
      'diamondType',
      'priceMin',
      'priceMax',
      'q',
      'sort',
      'page'
    ];
    const params: Record<string, string | null> = {};
    keys.forEach(key => {
      const value = query[key];
      params[key] = value == null || value === '' ? null : String(value);
    });
    if (this.router.url.startsWith('/designers/') || !this.config.showBrandFilter()) {
      params['designer'] = null;
    }
    params['availability'] = null;
    return params;
  }
}
