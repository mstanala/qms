import { HttpInterceptorFn } from '@angular/common/http';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
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
  );
};
