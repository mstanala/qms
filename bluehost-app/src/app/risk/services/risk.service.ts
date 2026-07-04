import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RiskRegister {
  id: string;
  registerNumber: string;
  title: string;
  description: string;
  riskType: string;
  methodology: string;
  scope: string;
  status: string;
  priority: string;
  reviewFrequencyMonths: number;
  currentWorkflowStep: string;
  approvedDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAssessment {
  id: string;
  assessmentNumber: string;
  hazardDescription: string;
  harmDescription: string;
  riskCategory: string;
  processStep: string;
  initialSeverity: number;
  initialOccurrence: number;
  initialDetectability: number;
  initialRiskLevel: string;
  residualSeverity: number | null;
  residualOccurrence: number | null;
  residualDetectability: number | null;
  residualRiskLevel: string | null;
  riskAcceptance: string | null;
  justification: string | null;
  status: string;
  createdAt: string;
}

export interface RiskControl {
  id: string;
  controlNumber: string;
  controlType: string;
  description: string;
  status: string;
  effectivenessRating: string | null;
  evidence: string | null;
  implementationDate: string | null;
  verificationDate: string | null;
}

export interface WorkflowStep {
  id: string;
  stepName: string;
  status: string;
  assignedTo: { id: string; displayName: string; email: string } | null;
  startedAt: string | null;
  completedAt: string | null;
  comments: string | null;
  stepOrder: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class RiskService {
  private readonly baseUrl = 'http://localhost:8082/api/v1/risks';

  constructor(private http: HttpClient) {}

  // Registers
  listRegisters(params?: Record<string, string>): Observable<Page<RiskRegister>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<Page<RiskRegister>>(`${this.baseUrl}/registers`, { params: httpParams });
  }

  getRegister(id: string): Observable<RiskRegister> {
    return this.http.get<RiskRegister>(`${this.baseUrl}/registers/${id}`);
  }

  createRegister(request: Partial<RiskRegister> & { ownerId: string; departmentId: string; plantSiteId: string }): Observable<RiskRegister> {
    return this.http.post<RiskRegister>(`${this.baseUrl}/registers`, request);
  }

  updateRegister(id: string, request: Partial<RiskRegister>): Observable<RiskRegister> {
    return this.http.put<RiskRegister>(`${this.baseUrl}/registers/${id}`, request);
  }

  transitionStatus(id: string, status: string, params?: Record<string, unknown>): Observable<RiskRegister> {
    return this.http.patch<RiskRegister>(`${this.baseUrl}/registers/${id}/status`, { status, ...params });
  }

  // Assessments
  listAssessments(registerId: string): Observable<RiskAssessment[]> {
    return this.http.get<RiskAssessment[]>(`${this.baseUrl}/registers/${registerId}/assessments`);
  }

  listAllAssessments(params?: Record<string, string>): Observable<Page<RiskAssessment>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<Page<RiskAssessment>>(`${this.baseUrl}/assessments`, { params: httpParams });
  }

  createAssessment(registerId: string, request: Partial<RiskAssessment>): Observable<RiskAssessment> {
    return this.http.post<RiskAssessment>(`${this.baseUrl}/registers/${registerId}/assessments`, request);
  }

  updateAssessment(id: string, request: Record<string, unknown>): Observable<RiskAssessment> {
    return this.http.put<RiskAssessment>(`${this.baseUrl}/assessments/${id}`, request);
  }

  updateResidualRisk(id: string, request: Record<string, unknown>): Observable<RiskAssessment> {
    return this.http.patch<RiskAssessment>(`${this.baseUrl}/assessments/${id}/residual-risk`, request);
  }

  // Controls
  listControls(assessmentId: string): Observable<RiskControl[]> {
    return this.http.get<RiskControl[]>(`${this.baseUrl}/assessments/${assessmentId}/controls`);
  }

  addControl(assessmentId: string, request: Partial<RiskControl>): Observable<RiskControl> {
    return this.http.post<RiskControl>(`${this.baseUrl}/assessments/${assessmentId}/controls`, request);
  }

  updateControl(id: string, request: Record<string, unknown>): Observable<RiskControl> {
    return this.http.put<RiskControl>(`${this.baseUrl}/controls/${id}`, request);
  }

  // Workflow
  getWorkflowHistory(id: string): Observable<WorkflowStep[]> {
    return this.http.get<WorkflowStep[]>(`${this.baseUrl}/registers/${id}/workflow-history`);
  }

  // Dashboard
  getDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/dashboard`);
  }
}
