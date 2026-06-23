import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

interface PermissionRouteData {
  module: string;
  action?: string;
  resource?: string;
}

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const required = route.data?.['permission'] as PermissionRouteData | undefined;

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (!required) return true;

  return authService.ensureSessionContext().pipe(
    map(() => authService.hasPermission(required.module, required.action, required.resource)
      ? true
      : router.createUrlTree(['/dashboard']))
  );
};
