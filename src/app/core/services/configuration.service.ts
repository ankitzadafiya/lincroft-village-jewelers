import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfiguration, PriceVisibilityInput } from '../models';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  readonly config = signal<AppConfiguration | null>(null);

  load(): Observable<AppConfiguration> {
    return this.http.get<AppConfiguration>(`${this.api}/config`).pipe(
      tap(config => this.config.set(config))
    );
  }

  update(payload: AppConfiguration): Observable<AppConfiguration> {
    return this.http.put<AppConfiguration>(`${this.api}/admin/config`, payload).pipe(
      tap(config => this.config.set(config))
    );
  }

  whatsAppNumber(): string {
    return this.config()?.whatsApp ?? '';
  }

  /**
   * Price visibility precedence:
   * - Product hide always wins when global prices are shown.
   * - When global prices are hidden, product-level show is ignored unless
   *   `allowProductPriceOverride` is enabled by the backend configuration.
   */
  isPriceVisible(product: PriceVisibilityInput): boolean {
    const global = this.config();
    if (!global) return false;
    if (!global.showPricesGlobally) {
      return global.allowProductPriceOverride && product.showPrice;
    }
    return product.showPrice;
  }
}
