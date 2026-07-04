import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionResponse, RoleResponse } from '../auth/auth.service';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export interface ApiPage<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface SecurityProfile {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface AdminUser {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  jobTitle?: string;
  userType: string;
  organizationId: string;
  organizationName?: string;
  plantSiteId?: string;
  plantSiteName?: string;
  departmentId?: string;
  departmentName?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string;
  roles?: RoleResponse[];
  securityProfiles?: SecurityProfile[];
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
}

export interface PlantSite {
  id: string;
  organization?: Organization;
  organizationId?: string;
  organizationName?: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  country?: string;
  siteType?: string;
  fdaRegistration?: string;
  isActive?: boolean;
}

export interface Department {
  id: string;
  plantSite?: PlantSite;
  plantSiteId?: string;
  plantSiteName?: string;
  name: string;
  code: string;
  description?: string;
  parentDepartment?: Department;
  isActive?: boolean;
}

export interface SystemConfiguration {
  id: string;
  configKey: string;
  configValue: string;
  configType: string;
  module: string;
  plantSiteId?: string;
  plantSiteName?: string;
  description?: string;
  isEncrypted?: boolean;
  updatedAt?: string;
  updatedById?: string;
  updatedByName?: string;
}

export interface CreateUserPayload {
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  organizationId: string;
  plantSiteId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  phone?: string;
  jobTitle?: string;
  roleIds?: string[];
  securityProfileIds?: string[];
}

export interface CreateRolePayload {
  name: string;
  code: string;
  description?: string;
  roleLevel: string;
  permissionIds: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private http: HttpClient) {}

  listUsers(options: { search?: string; userType?: string; departmentId?: string; page?: number; size?: number } = {}): Observable<ApiPage<AdminUser>> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 0))
      .set('size', String(options.size ?? 100))
      .set('sort', 'displayName,asc');

    if (options.search) params = params.set('search', options.search);
    if (options.userType) params = params.set('userType', options.userType);
    if (options.departmentId) params = params.set('departmentId', options.departmentId);

    return this.http.get<ApiPage<AdminUser>>(`${API_BASE_URL}/users`, { params });
  }

  createUser(payload: CreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${API_BASE_URL}/users`, payload);
  }

  updateUser(id: string, payload: Partial<CreateUserPayload>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${API_BASE_URL}/users/${id}`, payload);
  }

  updateUserStatus(id: string, payload: { isActive?: boolean; isLocked?: boolean; reason?: string }): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/users/${id}/status`, payload);
  }

  assignRoles(userId: string, roleIds: string[], plantSiteId?: string | null): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/users/${userId}/roles`, { roleIds, plantSiteId });
  }

  removeRole(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/users/${userId}/roles/${roleId}`);
  }

  listRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(`${API_BASE_URL}/roles`);
  }

  createRole(payload: CreateRolePayload): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(`${API_BASE_URL}/roles`, payload);
  }

  updateRole(id: string, payload: CreateRolePayload): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${API_BASE_URL}/roles/${id}`, payload);
  }

  listPermissions(module?: string): Observable<PermissionResponse[]> {
    const params = module ? new HttpParams().set('module', module) : undefined;
    return this.http.get<PermissionResponse[]>(`${API_BASE_URL}/permissions`, { params });
  }

  listSecurityProfiles(): Observable<SecurityProfile[]> {
    return this.http.get<SecurityProfile[]>(`${API_BASE_URL}/security-profiles`);
  }

  listOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${API_BASE_URL}/admin/organizations`);
  }

  listPlantSites(organizationId?: string): Observable<PlantSite[]> {
    const params = organizationId ? new HttpParams().set('organizationId', organizationId) : undefined;
    return this.http.get<PlantSite[]>(`${API_BASE_URL}/admin/plant-sites`, { params });
  }

  listDepartments(plantSiteId?: string): Observable<Department[]> {
    const params = plantSiteId ? new HttpParams().set('plantSiteId', plantSiteId) : undefined;
    return this.http.get<Department[]>(`${API_BASE_URL}/admin/departments`, { params });
  }

  createDepartment(payload: { plantSiteId: string; name: string; code: string; description?: string; parentDepartmentId?: string | null }): Observable<Department> {
    return this.http.post<Department>(`${API_BASE_URL}/admin/departments`, payload);
  }

  listConfigurations(): Observable<SystemConfiguration[]> {
    return this.http.get<SystemConfiguration[]>(`${API_BASE_URL}/admin/configurations`);
  }

  updateConfiguration(configKey: string, payload: { configValue: string; configType?: string; description?: string }): Observable<SystemConfiguration> {
    return this.http.put<SystemConfiguration>(`${API_BASE_URL}/admin/configurations/${encodeURIComponent(configKey)}`, payload);
  }
}
