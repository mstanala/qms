import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  employeeId?: string;
  username?: string;
  displayName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  roles?: RoleResponse[] | string[];
  permissions?: PermissionResponse[];
  organizationId?: string;
  organizationName?: string;
  plantSiteId?: string;
  plantSiteName?: string;
  departmentId?: string;
  departmentName?: string;
  isActive?: boolean;
  isLocked?: boolean;
  jobTitle?: string;
  phone?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: AuthUser;
}

export interface PermissionResponse {
  id: string;
  module: string;
  action: string;
  resource: string;
  description?: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  roleLevel?: string;
  isSystem?: boolean;
  isActive?: boolean;
  permissions?: PermissionResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';
  private readonly authKey = 'auth';
  private sessionContextLoaded = false;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials).pipe(
      tap((response) => this.storeSession(response)),
      switchMap((response) =>
        this.loadSessionContext().pipe(
          map(() => response)
        )
      )
    );
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.authKey);
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.authKey);
    this.sessionContextLoaded = false;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) || sessionStorage.getItem(this.accessTokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  hasExpiredSession(): boolean {
    const token = this.getAccessToken();
    return !!token && this.isTokenExpired(token);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.authKey) || sessionStorage.getItem(this.authKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw).user || null;
    } catch {
      return null;
    }
  }

  ensureSessionContext(): Observable<AuthUser | null> {
    if (!this.isAuthenticated()) return of(null);
    const user = this.getUser();
    if (this.sessionContextLoaded && user) return of(user);
    return this.loadSessionContext();
  }

  loadSessionContext(): Observable<AuthUser | null> {
    if (!this.isAuthenticated()) return of(null);

    return forkJoin({
      user: this.http.get<AuthUser>(`${API_BASE_URL}/auth/me`),
      roles: this.http.get<RoleResponse[]>(`${API_BASE_URL}/roles`).pipe(catchError(() => of([] as RoleResponse[]))),
    }).pipe(
      map(({ user, roles }) => this.withResolvedPermissions(user, roles)),
      tap((user) => {
        this.updateStoredUser(user);
        this.sessionContextLoaded = true;
      }),
      catchError(() => of(this.getUser()))
    );
  }

  getRoleCodes(): string[] {
    const roles = this.getUser()?.roles || [];
    return roles
      .map((role) => typeof role === 'string' ? role : role.code)
      .filter((code): code is string => !!code);
  }

  getPermissions(): PermissionResponse[] {
    return this.getUser()?.permissions || [];
  }

  hasRole(roleCode: string): boolean {
    return this.getRoleCodes().includes(roleCode);
  }

  hasPermission(module: string, action?: string, resource?: string): boolean {
    if (this.hasRole('VAULT_ADMIN')) return true;
    return this.getPermissions().some((permission) =>
      permission.module === module &&
      (!action || permission.action === action) &&
      (!resource || permission.resource === resource)
    );
  }

  hasAdminAccess(): boolean {
    return this.getUser()?.userType === 'SYSTEM_ADMIN' ||
      this.hasRole('VAULT_ADMIN') ||
      this.getPermissions().some((permission) => permission.module === 'ADMIN');
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(this.accessTokenKey, response.accessToken);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    localStorage.setItem(this.authKey, JSON.stringify(response));
  }

  private updateStoredUser(user: AuthUser): void {
    const raw = localStorage.getItem(this.authKey) || sessionStorage.getItem(this.authKey);
    const session = raw ? JSON.parse(raw) as AuthResponse : { accessToken: '', refreshToken: '', user };
    const updated = { ...session, user };
    localStorage.setItem(this.authKey, JSON.stringify(updated));
  }

  private withResolvedPermissions(user: AuthUser, allRoles: RoleResponse[]): AuthUser {
    const roleCodes = (user.roles || []).map((role) => typeof role === 'string' ? role : role.code);
    const resolvedRoles = allRoles.filter((role) => roleCodes.includes(role.code));
    const permissionMap = new Map<string, PermissionResponse>();

    resolvedRoles.forEach((role) => {
      (role.permissions || []).forEach((permission) => {
        permissionMap.set(permission.id, permission);
      });
    });

    return {
      ...user,
      roles: resolvedRoles.length ? resolvedRoles : user.roles,
      permissions: Array.from(permissionMap.values()),
    };
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  }

  private decodeTokenPayload(token: string): { exp?: number } | null {
    const rawToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const payload = rawToken.split('.')[1];
    if (!payload) return null;

    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
