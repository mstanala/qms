import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditPlan {
  id: string;
  planNumber: string;
  title: string;
  description: string;
  planYear: number;
  auditType: string;
  status: string;
  owner: { id: string; displayName: string } | null;
  plantSite: { id: string; name: string } | null;
  createdAt: string;
}

export interface Audit {
  id: string;
  auditNumber: string;
  title: string;
  description: string;
  auditType: string;
  auditScope: string;
  status: string;
  priority: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  reportDueDate: string | null;
  leadAuditor: { id: string; displayName: string } | null;
  plantSite: { id: string; name: string } | null;
  areaAudited: string;
  standardsReference: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFinding {
  id: string;
  findingNumber: string;
  title: string;
  description: string;
  classification: string;
  area: string;
  status: string;
  responseDueDate: string;
  auditeeResponse: string;
  capaRequired: boolean;
  capaId: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/audits';

  constructor(private http: HttpClient) {}

  // Plans
  listPlans(params?: Record<string, string>): Observable<Page<AuditPlan>> {
    return this.http.get<Page<AuditPlan>>(`${this.baseUrl}/plans`, { params: this.toParams(params) });
  }

  getPlan(id: string): Observable<AuditPlan> {
    return this.http.get<AuditPlan>(`${this.baseUrl}/plans/${id}`);
  }

  createPlan(request: Record<string, unknown>): Observable<AuditPlan> {
    return this.http.post<AuditPlan>(`${this.baseUrl}/plans`, request);
  }

  // Audits
  listAudits(params?: Record<string, string>): Observable<Page<Audit>> {
    return this.http.get<Page<Audit>>(`${this.baseUrl}`, { params: this.toParams(params) });
  }

  getAudit(id: string): Observable<Audit> {
    return this.http.get<Audit>(`${this.baseUrl}/${id}`);
  }

  createAudit(request: Record<string, unknown>): Observable<Audit> {
    return this.http.post<Audit>(`${this.baseUrl}`, request);
  }

  updateAudit(id: string, request: Record<string, unknown>): Observable<Audit> {
    return this.http.put<Audit>(`${this.baseUrl}/${id}`, request);
  }

  transitionStatus(id: string, status: string): Observable<Audit> {
    return this.http.patch<Audit>(`${this.baseUrl}/${id}/status`, { status });
  }

  // Findings
  listFindings(auditId: string): Observable<AuditFinding[]> {
    return this.http.get<AuditFinding[]>(`${this.baseUrl}/${auditId}/findings`);
  }

  createFinding(auditId: string, request: Record<string, unknown>): Observable<AuditFinding> {
    return this.http.post<AuditFinding>(`${this.baseUrl}/${auditId}/findings`, request);
  }

  updateFinding(id: string, request: Record<string, unknown>): Observable<AuditFinding> {
    return this.http.put<AuditFinding>(`${this.baseUrl}/findings/${id}`, request);
  }

  // Dashboard
  getDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/dashboard`);
  }

  private toParams(params?: Record<string, string>): HttpParams {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    return p;
  }
}
