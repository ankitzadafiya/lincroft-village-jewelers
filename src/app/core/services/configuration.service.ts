import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfiguration, PriceVisibilityInput } from '../models';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly theme = inject(ThemeService);
  private readonly api = environment.apiUrl;
  readonly config = signal<AppConfiguration | null>(null);
  readonly showBrandFilter = computed(() => this.config()?.showBrandFilter === true);
  readonly darkModeEnabled = computed(() => this.config()?.darkModeEnabled === true);

  load(): Observable<AppConfiguration> {
    return this.http.get<AppConfiguration>(`${this.api}/config`).pipe(
      tap(config => this.config.set(this.normalize(config)))
    );
  }

  update(payload: AppConfiguration): Observable<AppConfiguration> {
    return this.http.put<AppConfiguration>(`${this.api}/admin/config`, payload).pipe(
      tap(config => this.config.set(this.normalize({
        ...config,
        showBrandFilter: payload.showBrandFilter ?? config.showBrandFilter,
        darkModeEnabled: payload.darkModeEnabled ?? config.darkModeEnabled
      })))
    );
  }

  private normalize(config: AppConfiguration): AppConfiguration {
    const normalized: AppConfiguration = {
      ...config,
      showBrandFilter: config.showBrandFilter === true,
      darkModeEnabled: config.darkModeEnabled === true
    };
    this.theme.applyFromConfig(normalized.darkModeEnabled === true);
    return normalized;
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
