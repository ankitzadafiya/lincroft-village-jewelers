import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && req.url.includes('/admin')) {
        auth.logout(false);
        void router.navigate(['/admin/login']);
      }
      const message = error.error?.message || error.message || 'Something went wrong. Please try again.';
      if (error.status >= 500 || error.status === 0) {
        toast.error(message);
      }
      return throwError(() => error);
    })
  );
};
