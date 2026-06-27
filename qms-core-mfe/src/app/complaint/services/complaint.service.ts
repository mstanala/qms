import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../../shared/core-lookup.service';

export interface WorkflowStep {
  id: string;
  stepName: string;
  status: string;
  performedBy: { id: string; displayName: string } | null;
  comments: string | null;
  stepOrder: number;
  createdAt: string;
}

export interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  complaintType: string;
  source: string;
  classification: string | null;
  status: string;
  priority: string;
  reporterName: string | null;
  reporterContact: string | null;
  reporterType: string | null;
  receivedDate: string;
  productName: string | null;
  productCode: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  quantityAffected: string | null;
  investigationRequired: boolean;
  investigator: { id: string; displayName: string } | null;
  investigationStart: string | null;
  investigationComplete: string | null;
  rootCause: string | null;
  conclusion: string | null;
  isAdverseEvent: boolean;
  adverseEventReported: boolean;
  reportingDeadline: string | null;
  regulatoryReportable: boolean;
  fieldAlertRequired: boolean;
  recallAssessment: string | null;
  capaRequired: boolean;
  capaId: string | null;
  deviationId: string | null;
  responseDueDate: string | null;
  responseSentDate: string | null;
  responseText: string | null;
  owner: { id: string; displayName: string } | null;
  department: { id: string; name: string } | null;
  plantSite: { id: string; name: string } | null;
  currentWorkflowStep: string;
  flowableProcessId: string | null;
  closedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/complaints';

  constructor(private http: HttpClient) {}

  list(params?: Record<string, string>): Observable<Page<Complaint>> {
    return this.http.get<Page<Complaint>>(this.baseUrl, { params: this.toParams(params) });
  }

  getById(id: string): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.baseUrl}/${id}`);
  }

  create(request: Record<string, unknown>): Observable<Complaint> {
    return this.http.post<Complaint>(this.baseUrl, request);
  }

  update(id: string, request: Record<string, unknown>): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.baseUrl}/${id}`, request);
  }

  transitionStatus(id: string, status: string, params?: Record<string, unknown>): Observable<Complaint> {
    return this.http.patch<Complaint>(`${this.baseUrl}/${id}/status`, { status, ...params });
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
