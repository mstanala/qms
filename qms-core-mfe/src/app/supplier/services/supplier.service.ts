import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Supplier {
  id: string;
  supplierNumber: string;
  name: string;
  legalName: string;
  supplierType: string;
  category: string;
  status: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  gmpCertification: string;
  isoCertification: string;
  fdaRegistration: string;
  qualificationDate: string | null;
  nextRequalificationDate: string | null;
  overallScore: number | null;
  qualityScore: number | null;
  deliveryScore: number | null;
  complianceScore: number | null;
  owner: { id: string; displayName: string } | null;
  plantSite: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/suppliers';

  constructor(private http: HttpClient) {}

  list(params?: Record<string, string>): Observable<Page<Supplier>> {
    return this.http.get<Page<Supplier>>(this.baseUrl, { params: this.toParams(params) });
  }

  getById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }

  create(request: Record<string, unknown>): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, request);
  }

  update(id: string, request: Record<string, unknown>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/${id}`, request);
  }

  transitionStatus(id: string, status: string): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.baseUrl}/${id}/status`, { status });
  }

  getDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/dashboard`);
  }

  private toParams(params?: Record<string, string>): HttpParams {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return p;
  }
}
