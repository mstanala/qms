import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  if (authService.hasExpiredSession()) {
    authService.logout();
    return router.createUrlTree(['/login'], {
      queryParams: {
        returnUrl: state.url,
        message: 'sessionExpired',
      },
    });
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
