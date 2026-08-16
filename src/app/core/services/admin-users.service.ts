import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminUserCreateRequest, AdminUserStatusUpdate, AdminUserUpdateRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}/admin/users`);
  }

  create(payload: AdminUserCreateRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.api}/admin/users`, payload);
  }

  /** Update name, phone, role, permissions; optional password reset. */
  update(id: string, payload: AdminUserUpdateRequest): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.api}/admin/users/${id}`, payload);
  }

  updateStatus(id: string, isActive: boolean): Observable<AdminUser> {
    const body: AdminUserStatusUpdate = { isActive };
    return this.http.patch<AdminUser>(`${this.api}/admin/users/${id}/status`, body);
  }
}
