import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const GUEST_KEY = 'lvj_favorites';
const ACCOUNT_KEY = 'lvj_account_favorites';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private accountId: string | null = null;
  private readonly ids = signal<string[]>(this.readGuest());

  readonly favoriteIds = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);

  isFavorite(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(id: string): void {
    const current = this.ids();
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    this.ids.set(next);
    this.persist(next);
    if (this.accountId) {
      this.http.put<{ productIds: string[] }>(`${this.api}/customer/favorites`, { productIds: next }).subscribe({
        next: res => {
          this.ids.set(res.productIds);
          this.persist(res.productIds);
        }
      });
    }
  }

  /** Merge guest favorites into the account after login/register. */
  syncFromAccount(userId: string): void {
    this.accountId = userId;
    this.http.get<{ productIds: string[] }>(`${this.api}/customer/favorites`).subscribe({
      next: res => {
        const guest = this.readGuest();
        const merged = [...new Set([...res.productIds, ...guest])];
        this.ids.set(merged);
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(merged));
        localStorage.setItem(GUEST_KEY, JSON.stringify(merged));
        this.http.put<{ productIds: string[] }>(`${this.api}/customer/favorites`, { productIds: merged }).subscribe({
          next: stored => {
            this.ids.set(stored.productIds);
            this.persist(stored.productIds);
          }
        });
      },
      error: () => {
        const guest = this.readGuest();
        this.ids.set(guest);
        this.http.put<{ productIds: string[] }>(`${this.api}/customer/favorites`, { productIds: guest }).subscribe({
          next: stored => {
            this.ids.set(stored.productIds);
            this.persist(stored.productIds);
          }
        });
      }
    });
  }

  loadForGuest(): Observable<string[]> {
    return of(this.ids());
  }

  private persist(ids: string[]): void {
    localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
    if (this.accountId) {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(ids));
    }
  }

  private readGuest(): string[] {
    try {
      return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  }
}
