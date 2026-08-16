import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE, DEV_API_BASE } from '../core/api-base';

/**
 * Rewrites the hardcoded localhost API URLs the services are written against to
 * the configured backend (environment.apiBaseUrl): localhost in dev, the
 * Cloudflare-fronted tunnel host in production.
 *
 * Registered before authInterceptor, so anything downstream sees the rewritten
 * URL -- see isBackendApiUrl in ../core/api-base.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url.startsWith(DEV_API_BASE)) {
    const rewrittenUrl = request.url.replace(DEV_API_BASE, API_BASE);
    return next(request.clone({ url: rewrittenUrl }));
  }
  return next(request);
};
