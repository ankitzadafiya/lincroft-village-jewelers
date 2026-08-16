import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, PaginatedResponse, Product, ProductListQuery, ProductStatus, ProductWritePayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  dashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.api}/admin/dashboard`);
  }

  list(query: ProductListQuery = {}): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<PaginatedResponse<Product>>(`${this.api}/admin/products`, { params });
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.api}/admin/products/${id}`);
  }

  create(payload: ProductWritePayload): Observable<Product> {
    return this.http.post<Product>(`${this.api}/admin/products`, payload);
  }

  update(id: string, payload: ProductWritePayload): Observable<Product> {
    return this.http.put<Product>(`${this.api}/admin/products/${id}`, payload);
  }

  archive(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/admin/products/${id}`);
  }

  setStatus(id: string, status: ProductStatus): Observable<Product> {
    return this.http.patch<Product>(`${this.api}/admin/products/${id}/status`, { status });
  }
}
