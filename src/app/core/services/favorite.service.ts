import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

const LEGACY_GUEST_KEY = 'lvj_favorites';
const ACCOUNT_KEY = 'lvj_account_favorites';
const PENDING_KEY = 'lvj_pending_favorite';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private accountId: string | null = null;
  private readonly ids = signal<string[]>([]);

  readonly favoriteIds = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);
  readonly isSynced = computed(() => !!this.accountId);

  isFavorite(id: string): boolean {
    return this.ids().includes(id);
  }

  /** Returns false when the visitor is not signed in (caller should prompt to sign in). */
  toggle(id: string): boolean {
    if (!this.accountId) return false;

    const current = this.ids();
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    this.ids.set(next);
    this.persist(next);

    this.http.put<{ productIds: string[] }>(`${this.api}/customer/favorites`, { productIds: next }).subscribe({
      next: res => {
        this.ids.set(res.productIds);
        this.persist(res.productIds);
      },
      error: () => {
        this.ids.set(current);
        this.persist(current);
      }
    });
    return true;
  }

  /** Remember a product to add after successful sign-in. */
  setPending(id: string): void {
    try {
      sessionStorage.setItem(PENDING_KEY, id);
    } catch {
      /* ignore */
    }
  }

  /** Load account favorites after login/register/restore. */
  syncFromAccount(userId: string): void {
    this.accountId = userId;
    this.http.get<{ productIds: string[] }>(`${this.api}/customer/favorites`).subscribe({
      next: res => {
        const legacyGuest = this.readLegacyGuest();
        const pending = this.consumePending();
        const merged = [...new Set([...res.productIds, ...legacyGuest, ...(pending ? [pending] : [])])];
        this.clearLegacyGuest();

        if (merged.length !== res.productIds.length || pending) {
          this.http.put<{ productIds: string[] }>(`${this.api}/customer/favorites`, { productIds: merged }).subscribe({
            next: stored => {
              this.ids.set(stored.productIds);
              this.persist(stored.productIds);
            },
            error: () => {
              this.ids.set(merged);
              this.persist(merged);
            }
          });
          return;
        }

        this.ids.set(res.productIds);
        this.persist(res.productIds);
      },
      error: () => {
        const pending = this.consumePending();
        const legacyGuest = this.readLegacyGuest();
        const seed = [...new Set([...legacyGuest, ...(pending ? [pending] : [])])];
        this.clearLegacyGuest();
        this.ids.set(seed);
        if (!seed.length) return;
        this.http.put<{ productIds: string[] }>(`${this.api}/customer/favorites`, { productIds: seed }).subscribe({
          next: stored => {
            this.ids.set(stored.productIds);
            this.persist(stored.productIds);
          }
        });
      }
    });
  }

  /** Clear in-memory wishlist on sign-out (server copy stays with the account). */
  clearSession(): void {
    this.accountId = null;
    this.ids.set([]);
    try {
      localStorage.removeItem(ACCOUNT_KEY);
    } catch {
      /* ignore */
    }
  }

  private persist(ids: string[]): void {
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }

  private consumePending(): string | null {
    try {
      const id = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
      return id;
    } catch {
      return null;
    }
  }

  private readLegacyGuest(): string[] {
    try {
      return JSON.parse(localStorage.getItem(LEGACY_GUEST_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  private clearLegacyGuest(): void {
    try {
      localStorage.removeItem(LEGACY_GUEST_KEY);
    } catch {
      /* ignore */
    }
  }
}
