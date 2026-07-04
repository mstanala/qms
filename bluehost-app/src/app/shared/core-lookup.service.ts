import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UserOption {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
}

export interface PlantSiteOption {
  id: string;
  name: string;
  code?: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class CoreLookupService {
  private readonly apiUrl = 'http://localhost:8082/api/v1';

  constructor(private http: HttpClient) {}

  users(search = ''): Observable<Page<UserOption>> {
    let params = new HttpParams().set('size', '100').set('sort', 'displayName,asc');
    if (search) params = params.set('search', search);
    return this.http.get<Page<UserOption>>(`${this.apiUrl}/users`, { params });
  }

  plantSites(): Observable<PlantSiteOption[]> {
    return this.http.get<PlantSiteOption[]>(`${this.apiUrl}/admin/plant-sites`);
  }

  departments(plantSiteId?: string): Observable<DepartmentOption[]> {
    let params = new HttpParams();
    if (plantSiteId) params = params.set('plantSiteId', plantSiteId);
    return this.http.get<DepartmentOption[]>(`${this.apiUrl}/admin/departments`, { params });
  }
}