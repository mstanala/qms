import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const isBackendApi = request.url.startsWith(API_BASE_URL);
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
