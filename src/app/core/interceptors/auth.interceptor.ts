import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CustomerAuthService } from '../services/customer-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const admin = inject(AuthService);
  const customer = inject(CustomerAuthService);
  if (/\/(auth|customer)\/(login|register)/.test(req.url)) return next(req);
  const isAdminRoute = req.url.includes('/admin') || req.url.includes('/auth/');
  const isCustomerRoute = req.url.includes('/customer/');
  const token = isAdminRoute ? admin.token() : isCustomerRoute ? customer.token() : admin.token() || customer.token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
