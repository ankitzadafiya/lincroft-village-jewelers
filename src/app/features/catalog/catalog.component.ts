import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Category, ProductFilterFacets, ProductListItem, ProductListQuery } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { ProductFiltersComponent } from '../../shared/components/product-filters/product-filters.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, PaginatorModule, ProductFiltersComponent, ProductCardComponent, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly seo = inject(SeoService);

  readonly title = signal('Shop');
  readonly eyebrow = signal('Collection');
  readonly description = signal('Browse the Lincroft Village Jewelers collection.');
  readonly products = signal<ProductListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly facets = signal<ProductFilterFacets | null>(null);
  readonly query = signal<ProductListQuery>({ page: 1, pageSize: 12, sort: 'newest' });
  readonly mobileFilters = signal(false);
  readonly category = signal<Category | null>(null);
  readonly columns = signal(3);

  ngOnInit(): void {
    this.productsApi.facets().subscribe(f => this.facets.set(f));
    this.route.data.subscribe(data => {
      if (data['title']) this.title.set(data['title']);
    });
    this.route.paramMap.subscribe(params => {
      const designer = params.get('slug');
      if (this.router.url.startsWith('/designers/') && designer) {
        this.query.update(q => ({ ...q, designer, page: 1 }));
        this.eyebrow.set('Designer');
        this.title.set('Designer collection');
        this.load();
      }
    });
    this.route.queryParamMap.subscribe(() => this.syncFromRoute());
  }

  syncFromRoute(): void {
    const data = this.route.snapshot.data;
    const qp = this.route.snapshot.queryParamMap;
    const category = data['category'] as string | undefined;
    const designerSlug = this.router.url.startsWith('/designers/') ? this.route.snapshot.paramMap.get('slug') || undefined : qp.get('designer') || undefined;
    const next: ProductListQuery = {
      category,
      subcategory: qp.get('subcategory') || undefined,
      designer: designerSlug,
      metal: qp.get('metal') || undefined,
      karat: qp.get('karat') || undefined,
      gemstone: qp.get('gemstone') || undefined,
      diamondType: qp.get('diamondType') || undefined,
      availability: qp.get('availability') || undefined,
      priceMin: qp.get('priceMin') ? Number(qp.get('priceMin')) : undefined,
      priceMax: qp.get('priceMax') ? Number(qp.get('priceMax')) : undefined,
      q: qp.get('q') || undefined,
      sort: (qp.get('sort') as ProductListQuery['sort']) || 'newest',
      page: Number(qp.get('page') || 1),
      pageSize: 12
    };
    this.query.set(next);
    if (category) {
      this.categoriesApi.bySlug(category).subscribe({
        next: cat => {
          this.category.set(cat);
          this.eyebrow.set('Collection');
          this.title.set(cat.name);
          this.description.set(
            cat.description || 'Selected for the floor — browse, save, and inquire from the atelier.'
          );
          this.seo.set({ title: cat.name, description: cat.description ?? cat.name, image: cat.imageUrl });
        },
        error: () => this.seo.set({ title: this.title(), description: this.description() })
      });
    } else {
      this.eyebrow.set('Shop');
      this.title.set(data['title'] || 'Shop');
      this.description.set('Browse the Lincroft Village Jewelers collection.');
      this.seo.set({ title: this.title(), description: this.description() });
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
    void this.router.navigate([], { relativeTo: this.route, queryParams: this.toParams(query), queryParamsHandling: 'merge' });
  }

  onSort(sort: string): void {
    this.onFilter({ ...this.query(), sort: sort as ProductListQuery['sort'], page: 1 });
  }

  onPage(event: PaginatorState): void {
    this.onFilter({ ...this.query(), page: (event.page ?? 0) + 1, pageSize: event.rows ?? 12 });
  }

  private toParams(query: ProductListQuery): Record<string, string | null> {
    const keys: (keyof ProductListQuery)[] = [
      'subcategory',
      'designer',
      'metal',
      'karat',
      'gemstone',
      'diamondType',
      'availability',
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
    return params;
  }
}
