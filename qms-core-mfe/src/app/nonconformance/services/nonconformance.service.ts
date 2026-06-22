import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../shared/core-lookup.service';

export interface Nonconformance {
  id: string;
  ncNumber: string;
  title: string;
  description: string;
  ncType: string;
  classification: string | null;
  status: string;
  priority: string;
  productName: string | null;
  batchNumber: string | null;
  quantityAffected: string | null;
  stageDetected: string | null;
  dispositionDecision: string | null;
  dispositionJustification: string | null;
  dispositionDate: string | null;
  holdStatus: string;
  holdLocation: string | null;
  holdInitiatedDate: string | null;
  holdReleasedDate: string | null;
  capaRequired: boolean;
  owner: { id: string; displayName: string } | null;
  department: { id: string; name: string } | null;
  plantSite: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NonconformanceService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/nonconformances';

  constructor(private http: HttpClient) {}

  list(params?: Record<string, string>): Observable<Page<Nonconformance>> {
    return this.http.get<Page<Nonconformance>>(this.baseUrl, { params: this.toParams(params) });
  }

  getById(id: string): Observable<Nonconformance> {
    return this.http.get<Nonconformance>(`${this.baseUrl}/${id}`);
  }

  create(request: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.post<Nonconformance>(this.baseUrl, request);
  }

  update(id: string, request: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.put<Nonconformance>(`${this.baseUrl}/${id}`, request);
  }

  transitionStatus(id: string, status: string): Observable<Nonconformance> {
    return this.http.patch<Nonconformance>(`${this.baseUrl}/${id}/status`, { status });
  }

  submitDisposition(id: string, request: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.patch<Nonconformance>(`${this.baseUrl}/${id}/disposition`, request);
  }

  toggleHold(id: string, request: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.patch<Nonconformance>(`${this.baseUrl}/${id}/hold`, request);
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
