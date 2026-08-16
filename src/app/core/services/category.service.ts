import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryWritePayload, Designer } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }

  bySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.api}/categories/${slug}`);
  }

  designers(): Observable<Designer[]> {
    return this.http.get<Designer[]>(`${this.api}/content/designers`);
  }

  adminList(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.api}/admin/categories`);
  }

  create(payload: CategoryWritePayload): Observable<Category> {
    return this.http.post<Category>(`${this.api}/admin/categories`, payload);
  }

  update(id: string, payload: CategoryWritePayload): Observable<Category> {
    return this.http.put<Category>(`${this.api}/admin/categories/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/admin/categories/${id}`);
  }
}
