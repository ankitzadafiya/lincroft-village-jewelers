import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSession, AuthUser, GoogleLoginRequest, LoginRequest, RegisterRequest } from '../models';
import { FavoriteService } from './favorite.service';
import { loginPayload, registerPayload } from '../utils/auth-validation';

const TOKEN_KEY = 'lvj_customer_token';
const USER_KEY = 'lvj_customer_user';

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly favorites = inject(FavoriteService);
  private readonly api = environment.apiUrl;
  private readonly sessionUser = signal<AuthUser | null>(this.readUser());
  private readonly sessionToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this.sessionUser.asReadonly();
  readonly token = this.sessionToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this.sessionToken());

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.api}/customer/login`, loginPayload(payload.email, payload.password)).pipe(
      tap(session => this.persist(session))
    );
  }

  register(payload: RegisterRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.api}/customer/register`, registerPayload(payload)).pipe(
      tap(session => this.persist(session))
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthSession> {
    const body: GoogleLoginRequest = { idToken };
    return this.http.post<AuthSession>(`${this.api}/customer/login/google`, body).pipe(
      tap(session => this.persist(session))
    );
  }

  restore(): Observable<AuthUser | null> {
    if (!this.sessionToken()) return of(null);
    return this.http.get<AuthUser>(`${this.api}/customer/me`).pipe(
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.sessionUser.set(user);
        this.favorites.syncFromAccount(user.id);
      }),
      catchError(() => {
        this.logout(false);
        return of(null);
      })
    );
  }

  logout(notifyServer = true): void {
    if (notifyServer && this.sessionToken()) {
      this.http.post(`${this.api}/customer/logout`, {}).subscribe();
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.sessionToken.set(null);
    this.sessionUser.set(null);
  }

  private persist(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.sessionToken.set(session.token);
    this.sessionUser.set(session.user);
    this.favorites.syncFromAccount(session.user.id);
  }

  private readUser(): AuthUser | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AuthUser | null;
    } catch {
      return null;
    }
  }
}
