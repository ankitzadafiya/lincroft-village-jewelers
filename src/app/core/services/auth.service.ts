import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSession, AuthUser, GoogleLoginRequest, LoginRequest, StaffPermission } from '../models';
import { loginPayload } from '../utils/auth-validation';

const TOKEN_KEY = 'lvj_admin_token';
const USER_KEY = 'lvj_admin_user';

/** Route order used after login and when a permission guard rejects access. */
const ADMIN_ROUTE_PERMISSIONS: Array<{ path: string; permission: StaffPermission | null }> = [
  { path: '/admin/dashboard', permission: null },
  { path: '/admin/products', permission: 'products.manage' },
  { path: '/admin/categories', permission: 'categories.manage' },
  { path: '/admin/designers', permission: 'designers.manage' },
  { path: '/admin/import', permission: 'import' },
  { path: '/admin/inquiries', permission: 'inquiries' },
  { path: '/admin/content', permission: 'content.manage' },
  { path: '/admin/settings', permission: 'settings' },
  { path: '/admin/users', permission: 'users.manage' }
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  private readonly sessionUser = signal<AuthUser | null>(this.readUser());
  private readonly sessionToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this.sessionUser.asReadonly();
  readonly token = this.sessionToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this.sessionToken());
  readonly canManageUsers = computed(() => this.canAccess('users.manage'));

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.api}/auth/login`, loginPayload(payload.email, payload.password)).pipe(
      tap(session => this.persist(session))
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthSession> {
    const body: GoogleLoginRequest = { idToken };
    return this.http.post<AuthSession>(`${this.api}/auth/login/google`, body).pipe(
      tap(session => this.persist(session))
    );
  }

  /** Validates a stored admin token against GET /api/auth/me. */
  restore(): Observable<AuthUser | null> {
    if (!this.sessionToken()) return of(null);
    return this.http.get<AuthUser>(`${this.api}/auth/me`).pipe(
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.sessionUser.set(user);
      }),
      catchError(() => {
        this.logout(false);
        return of(null);
      })
    );
  }

  logout(notifyServer = true): void {
    if (notifyServer && this.sessionToken()) {
      this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.sessionToken.set(null);
    this.sessionUser.set(null);
  }

  /**
   * Admin role always has full access.
   * Staff must have the exact permission key on the session user.
   */
  canAccess(permission: string): boolean {
    const user = this.sessionUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  }

  /** @deprecated Prefer canAccess — kept for older call sites. */
  hasPermission(permission: string): boolean {
    return this.canAccess(permission);
  }

  /** First admin console path the current user is allowed to open. */
  firstAllowedPath(): string {
    for (const item of ADMIN_ROUTE_PERMISSIONS) {
      if (!item.permission || this.canAccess(item.permission)) return item.path;
    }
    return '/admin/dashboard';
  }

  private persist(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.sessionToken.set(session.token);
    this.sessionUser.set(session.user);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
