import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Category,
  PaginatedResponse,
  Product,
  ProductFilterFacets,
  ProductListItem,
  ProductListQuery
} from '../models';

type FacetScope = Pick<ProductListQuery, 'category' | 'subcategory' | 'designer' | 'q'>;

type FacetGroupKey =
  | 'metals'
  | 'karats'
  | 'gemstones'
  | 'diamondTypes'
  | 'diamondShapes'
  | 'designers'
  | 'availability';

const FACET_GROUPS: { key: FacetGroupKey; param: keyof ProductListQuery }[] = [
  { key: 'metals', param: 'metal' },
  { key: 'karats', param: 'karat' },
  { key: 'gemstones', param: 'gemstone' },
  { key: 'diamondTypes', param: 'diamondType' },
  { key: 'diamondShapes', param: 'diamondShape' },
  { key: 'designers', param: 'designer' },
  { key: 'availability', param: 'availability' }
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(query: ProductListQuery = {}): Observable<PaginatedResponse<ProductListItem>> {
    return this.http.get<PaginatedResponse<ProductListItem>>(`${this.api}/products`, {
      params: this.toParams(query)
    });
  }

  facets(query: FacetScope = {}): Observable<ProductFilterFacets> {
    return this.http.get<ProductFilterFacets>(`${this.api}/products/facets`, {
      params: this.toParams(query)
    });
  }

  /** Facets with counts verified against `GET /products` totals when the API counts look unscoped. */
  facetsWithAccurateCounts(scope: FacetScope = {}): Observable<ProductFilterFacets> {
    return this.facets(scope).pipe(switchMap(facets => this.reconcileFacetCounts(scope, facets)));
  }

  /** Replace stale `productCount` on top-level categories using live product totals. */
  enrichCategoryCounts(categories: Category[]): Observable<Category[]> {
    const targets = categories.filter(c => !c.parentId);
    if (!targets.length) return of(categories);

    return forkJoin(
      targets.map(category =>
        this.countProducts({ category: category.slug, page: 1, pageSize: 1 }).pipe(
          map(total => ({ id: category.id, total }))
        )
      )
    ).pipe(
      map(rows => {
        const totals = new Map(rows.map(row => [row.id, row.total]));
        return categories.map(category =>
          totals.has(category.id) ? { ...category, productCount: totals.get(category.id)! } : category
        );
      })
    );
  }

  bySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.api}/products/${slug}`);
  }

  related(slug: string): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.api}/products/${slug}/related`);
  }

  private reconcileFacetCounts(
    scope: FacetScope,
    facets: ProductFilterFacets
  ): Observable<ProductFilterFacets> {
    return this.countProducts(scope).pipe(
      switchMap(scopeTotal => {
        if (!this.facetsLookWrong(facets, scopeTotal)) {
          return of(facets);
        }
        return this.fetchAccurateFacetCounts(scope, facets);
      })
    );
  }

  private facetsLookWrong(facets: ProductFilterFacets, scopeTotal: number): boolean {
    if (scopeTotal <= 0) return false;
    const counts = FACET_GROUPS.flatMap(({ key }) => facets[key].map(item => item.count));
    if (!counts.length) return false;
    return Math.max(...counts) > scopeTotal;
  }

  private fetchAccurateFacetCounts(
    scope: FacetScope,
    facets: ProductFilterFacets
  ): Observable<ProductFilterFacets> {
    const jobs: Observable<{ key: FacetGroupKey; value: string; count: number }>[] = [];

    for (const { key, param } of FACET_GROUPS) {
      for (const item of facets[key]) {
        jobs.push(
          this.countProducts({ ...scope, [param]: item.value, page: 1, pageSize: 1 }).pipe(
            map(count => ({ key, value: item.value, count }))
          )
        );
      }
    }

    if (!jobs.length) return of(facets);

    return forkJoin(jobs).pipe(map(results => this.applyFacetCounts(facets, results)));
  }

  private applyFacetCounts(
    facets: ProductFilterFacets,
    results: { key: FacetGroupKey; value: string; count: number }[]
  ): ProductFilterFacets {
    const next: ProductFilterFacets = {
      metals: facets.metals.map(item => ({ ...item })),
      karats: facets.karats.map(item => ({ ...item })),
      gemstones: facets.gemstones.map(item => ({ ...item })),
      diamondTypes: facets.diamondTypes.map(item => ({ ...item })),
      diamondShapes: facets.diamondShapes.map(item => ({ ...item })),
      designers: facets.designers.map(item => ({ ...item })),
      availability: facets.availability.map(item => ({ ...item })),
      priceRange: { ...facets.priceRange }
    };

    for (const result of results) {
      const item = next[result.key].find(entry => entry.value === result.value);
      if (item) item.count = result.count;
    }

    for (const { key } of FACET_GROUPS) {
      next[key] = next[key].filter(item => item.count > 0);
    }

    return next;
  }

  private countProducts(query: ProductListQuery): Observable<number> {
    return this.list({ ...query, page: 1, pageSize: 1 }).pipe(map(response => response.total));
  }

  private toParams(query: ProductListQuery): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
