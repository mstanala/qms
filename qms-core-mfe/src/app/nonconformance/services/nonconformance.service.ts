import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../shared/core-lookup.service';

export interface WorkflowStep {
  id: string;
  stepName: string;
  status: string;
  assignedTo: { id: string; displayName: string } | null;
  performedBy: { id: string; displayName: string } | null;
  startedAt: string | null;
  completedAt: string | null;
  comments: string | null;
  stepOrder: number;
  createdAt: string;
}

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
  productCode: string | null;
  batchNumber: string | null;
  batchSize: string | null;
  quantityAffected: string | null;
  unitOfMeasure: string | null;
  detectedLocation: string | null;
  stageDetected: string | null;
  dispositionDecision: string | null;
  dispositionJustification: string | null;
  dispositionApprovedBy: { id: string; displayName: string } | null;
  dispositionDate: string | null;
  holdStatus: string;
  holdLocation: string | null;
  holdInitiatedDate: string | null;
  holdReleasedDate: string | null;
  holdReleasedBy: { id: string; displayName: string } | null;
  capaRequired: boolean;
  capaId: string | null;
  deviationId: string | null;
  supplierId: string | null;
  owner: { id: string; displayName: string } | null;
  department: { id: string; name: string } | null;
  plantSite: { id: string; name: string } | null;
  currentWorkflowStep: string | null;
  flowableProcessId: string | null;
  closedDate: string | null;
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

  transitionStatus(id: string, status: string, params?: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.patch<Nonconformance>(`${this.baseUrl}/${id}/status`, { status, ...params });
  }

  submitDisposition(id: string, request: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.patch<Nonconformance>(`${this.baseUrl}/${id}/disposition`, request);
  }

  toggleHold(id: string, request: Record<string, unknown>): Observable<Nonconformance> {
    return this.http.patch<Nonconformance>(`${this.baseUrl}/${id}/hold`, request);
  }

  getWorkflowHistory(id: string): Observable<WorkflowStep[]> {
    return this.http.get<WorkflowStep[]>(`${this.baseUrl}/${id}/workflow-history`);
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
