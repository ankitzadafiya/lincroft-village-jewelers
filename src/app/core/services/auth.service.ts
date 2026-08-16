import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSession, AuthUser, GoogleLoginRequest, LoginRequest } from '../models';
import { loginPayload } from '../utils/auth-validation';

const TOKEN_KEY = 'lvj_admin_token';
const USER_KEY = 'lvj_admin_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  private readonly sessionUser = signal<AuthUser | null>(this.readUser());
  private readonly sessionToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this.sessionUser.asReadonly();
  readonly token = this.sessionToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this.sessionToken());
  readonly canManageUsers = computed(() => {
    const user = this.sessionUser();
    return user?.role === 'admin' || !!user?.permissions.includes('users.manage');
  });

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

  hasPermission(permission: string): boolean {
    return this.sessionUser()?.permissions.includes(permission) ?? false;
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
