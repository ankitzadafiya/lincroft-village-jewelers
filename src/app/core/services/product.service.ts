import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, Product, ProductFilterFacets, ProductListItem, ProductListQuery } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(query: ProductListQuery = {}): Observable<PaginatedResponse<ProductListItem>> {
    return this.http.get<PaginatedResponse<ProductListItem>>(`${this.api}/products`, {
      params: this.toParams(query)
    });
  }

  facets(query: Pick<ProductListQuery, 'category' | 'subcategory' | 'designer' | 'q'> = {}): Observable<ProductFilterFacets> {
    return this.http.get<ProductFilterFacets>(`${this.api}/products/facets`, {
      params: this.toParams(query)
    });
  }

  bySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.api}/products/${slug}`);
  }

  related(slug: string): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>(`${this.api}/products/${slug}/related`);
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
