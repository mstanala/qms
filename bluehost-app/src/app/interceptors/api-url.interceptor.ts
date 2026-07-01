import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const DEV_API_BASE = 'http://localhost:8082';

/**
 * Rewrites hardcoded localhost API URLs to the configured backend URL.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url.startsWith(DEV_API_BASE)) {
    const rewrittenUrl = request.url.replace(DEV_API_BASE, environment.apiBaseUrl);
    return next(request.clone({ url: rewrittenUrl }));
  }
  return next(request);
};