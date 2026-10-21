import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/** Skip noisy or background calls that should not flash the global loader. */
const SKIP = /\/(assets\/|favicon|i\.etsystatic)/i;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Skip-Loader')) {
    // Internal flag only — strip it so the API never sees an unexpected header (CORS preflight).
    return next(req.clone({ headers: req.headers.delete('X-Skip-Loader') }));
  }
  if (SKIP.test(req.url)) {
    return next(req);
  }

  const loading = inject(LoadingService);
  loading.startHttp();
  return next(req).pipe(finalize(() => loading.stopHttp()));
};
