import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
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
  }

  return authService.ensureSessionContext().pipe(
    map(() => authService.hasAdminAccess() ? true : router.createUrlTree(['/dashboard']))
  );
};
