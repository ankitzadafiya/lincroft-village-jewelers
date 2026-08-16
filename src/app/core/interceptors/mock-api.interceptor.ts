import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { handleMockRequest } from '../mock/mock-api.handlers';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi) return next(req);
  const isApi = req.url.startsWith(environment.apiUrl) || req.url.includes(`${environment.apiUrl}/`);
  if (!isApi) return next(req);
  return handleMockRequest(req);
};
