import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl) || url.includes(`${environment.apiUrl}/`);
}

function isNgrok(url: string): boolean {
  return /ngrok(-free)?\.(dev|app|io)(:|\/|$)/i.test(url);
}

/**
 * Adds backend-required headers (currently ngrok's free-tier interstitial skip)
 * on every request that goes to `environment.apiUrl`.
 */
export const apiHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) return next(req);

  const headers: Record<string, string> = { ...environment.extraHeaders };
  if (isNgrok(req.url) && !headers['ngrok-skip-browser-warning']) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (Object.keys(headers).length === 0) return next(req);
  return next(req.clone({ setHeaders: headers }));
};
