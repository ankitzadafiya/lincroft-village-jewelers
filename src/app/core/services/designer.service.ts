import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Designer, DesignerWriteRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class DesignerService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(): Observable<Designer[]> {
    return this.http.get<Designer[]>(`${this.api}/content/designers`);
  }

  adminList(): Observable<Designer[]> {
    return this.http.get<Designer[]>(`${this.api}/admin/designers`);
  }

  create(payload: DesignerWriteRequest): Observable<Designer> {
    return this.http.post<Designer>(`${this.api}/admin/designers`, payload);
  }

  update(id: string, payload: DesignerWriteRequest): Observable<Designer> {
    return this.http.put<Designer>(`${this.api}/admin/designers/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/admin/designers/${id}`);
  }
}
