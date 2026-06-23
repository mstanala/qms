import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

interface PermissionRouteData {
  module: string;
  action?: string;
  resource?: string;
}

interface PermissionResponse {
  id: string;
  module: string;
  action: string;
  resource: string;
}

interface RoleResponse {
  code?: string;
  permissions?: PermissionResponse[];
}

interface AuthUser {
  userType?: string;
  roles?: RoleResponse[] | string[];
  permissions?: PermissionResponse[];
}

export const permissionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const required = route.data?.['permission'] as PermissionRouteData | undefined;
  const user = getStoredUser();

  if (!user) return router.parseUrl('/login');
  if (!required || hasPermission(user, required.module, required.action, required.resource)) return true;
  return router.parseUrl('/dashboard');
};

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (!raw) return null;

  try {
    return JSON.parse(raw).user || null;
  } catch {
    return null;
  }
}

export function hasStoredPermission(module: string, action?: string, resource?: string): boolean {
  const user = getStoredUser();
  return !!user && hasPermission(user, module, action, resource);
}

function hasPermission(user: AuthUser, module: string, action?: string, resource?: string): boolean {
  if (user.userType === 'SYSTEM_ADMIN' || getRoleCodes(user).includes('VAULT_ADMIN')) return true;
  return collectPermissions(user).some((permission) =>
    permission.module === module &&
    (!action || permission.action === action) &&
    (!resource || permission.resource === resource)
  );
}

function getRoleCodes(user: AuthUser): string[] {
  return (user.roles || [])
    .map((role) => typeof role === 'string' ? role : role.code)
    .filter((code): code is string => !!code);
}

function collectPermissions(user: AuthUser): PermissionResponse[] {
  const permissions = new Map<string, PermissionResponse>();
  (user.permissions || []).forEach((permission) => permissions.set(permission.id, permission));
  (user.roles || []).forEach((role) => {
    if (typeof role === 'string') return;
    (role.permissions || []).forEach((permission) => permissions.set(permission.id, permission));
  });
  return Array.from(permissions.values());
}
