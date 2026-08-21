import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * True when the request targets our own backend, whichever host the URL carries.
 *
 * This deliberately matches on the path rather than on a hardcoded origin. In
 * the unified Bluehost build an apiUrlInterceptor runs *before* this one and has
 * already rewritten http://localhost:8082 to the deployed API origin, so the
 * previous check -- url.startsWith('http://localhost:8082/api/v1') -- was false
 * for every request in production and the Authorization header was silently
 * dropped. It passed in dev only because there the rewrite is localhost to
 * localhost.
 *
 * The path form keeps this file correct in both places, which matters because
 * bluehost-app/build.sh rsyncs shell-app/src/app/auth over the unified app's
 * copy: anything origin-specific here would reintroduce that bug on the next
 * build. Safe because the only non-backend hosts this app talks to serve images,
 * not /api/ paths.
 */
function isBackendApiUrl(url: string): boolean {
  try {
    return new URL(url, window.location.origin).pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const isBackendApi = isBackendApiUrl(request.url);
  const isLoginRequest = request.url.endsWith('/auth/login') || request.url.endsWith('/auth/refresh');
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  if (!isBackendApi || isLoginRequest || !token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    })
  ).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        const returnUrl = router.url && !router.url.startsWith('/login') ? router.url : '/dashboard';
        authService.logout();
        router.navigate(['/login'], {
          queryParams: {
            returnUrl,
            message: 'sessionExpired',
          },
        });
      }

      return throwError(() => error);
    })
  );
};
