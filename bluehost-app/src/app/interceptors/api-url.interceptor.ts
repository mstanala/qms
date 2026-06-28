import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const DEV_API_BASE = 'http://localhost:8082';

/**
 * Rewrites hardcoded localhost API URLs to the configured backend URL.
 * Also adds ngrok-skip-browser-warning header for ngrok tunnels.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url.startsWith(DEV_API_BASE)) {
    const rewrittenUrl = request.url.replace(DEV_API_BASE, environment.apiBaseUrl);
    return next(request.clone({
      url: rewrittenUrl,
      setHeaders: { 'ngrok-skip-browser-warning': 'true' },
    }));
  }
  // Also handle requests already using the prod URL (e.g. from authInterceptor)
  if (environment.apiBaseUrl && request.url.startsWith(environment.apiBaseUrl)) {
    return next(request.clone({
      setHeaders: { 'ngrok-skip-browser-warning': 'true' },
    }));
  }
  return next(request);
};