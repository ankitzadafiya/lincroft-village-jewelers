import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, ProductListItem } from '../models';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  search(q: string, pageSize = 8): Observable<PaginatedResponse<ProductListItem>> {
    const params = new HttpParams().set('q', q).set('pageSize', pageSize);
    return this.http.get<PaginatedResponse<ProductListItem>>(`${this.api}/search`, { params });
  }
}
