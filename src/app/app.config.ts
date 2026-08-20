import { ApplicationConfig, provideAppInitializer, inject, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom, forkJoin } from 'rxjs';
import { routes } from './app.routes';
import { apiHeadersInterceptor } from './core/interceptors/api-headers.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { AuthService } from './core/services/auth.service';
import { ConfigurationService } from './core/services/configuration.service';
import { CustomerAuthService } from './core/services/customer-auth.service';
import { ThemeService } from './core/services/theme.service';
import { LincroftPreset } from './core/theme/lincroft.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideHttpClient(withInterceptors([
      loadingInterceptor,
      apiHeadersInterceptor,
      authInterceptor,
      mockApiInterceptor,
      errorInterceptor
    ])),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: LincroftPreset,
        options: { darkModeSelector: '[data-theme="dark"]' }
      }
    }),
    MessageService,
    ConfirmationService,
    provideAppInitializer(() => {
      inject(ThemeService);
      const config = inject(ConfigurationService);
      const auth = inject(AuthService);
      const customer = inject(CustomerAuthService);
      return firstValueFrom(forkJoin({
        config: config.load(),
        auth: auth.restore(),
        customer: customer.restore()
      }));
    })
  ]
};
