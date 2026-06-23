import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
  ChangeRequest,
  ChangeStatus,
  ChangeClassification,
  ChangeType,
  ChangeCategory,
  ChangePriority,
  ImpactRating,
  FilingType,
  ChangeWorkflowStep,
  ChangeControlDashboardMetrics,
  ChangeControlListFilter,
} from '../models/change-control.model';

const API_BASE_URL = 'http://localhost:8082/api/v1';

type ApiPage<T> = {
  content?: T[];
};

type ApiChangeRequest = any;
type ApiWorkflowHistory = any;

const CHANGE_WORKFLOW_TEMPLATE = [
  'Draft',
  'Submit Change',
  'Impact Assessment',
  'QA Review',
  'RA Review',
  'Pending Approval',
  'Implementation',
  'Verification',
  'Effectiveness Check',
  'Closed',
];

/** Helper: returns a Date offset from today by the given number of days */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0);
  return d;
}

@Injectable({
  providedIn: 'root',
})
export class ChangeControlService {
  private readonly apiUrl = `${API_BASE_URL}/change-requests`;

  constructor(private http: HttpClient) {}

  getChangeRequests(filter?: ChangeControlListFilter): Observable<ChangeRequest[]> {
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '100')
      .set('sort', 'createdAt,desc');

    filter?.status?.forEach((status) => (params = params.append('status', status)));
    filter?.classification?.forEach((classification) => (params = params.append('classification', classification)));
    filter?.type?.forEach((type) => (params = params.append('type', type)));
    filter?.priority?.forEach((priority) => (params = params.append('priority', priority)));
    if (filter?.search) params = params.set('search', filter.search);

    return this.http
      .get<ApiPage<ApiChangeRequest>>(this.apiUrl, { headers: this.authHeaders(), params })
      .pipe(map((page) => (page.content || []).map((item) => this.toChangeRequest(item))));
  }

  getChangeRequestById(id: string): Observable<ChangeRequest | undefined> {
    return this.http
      .get<ApiChangeRequest>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(
        map((item) => this.toChangeRequest(item)),
        switchMap((changeRequest) =>
          this.getWorkflowHistory(id).pipe(
            map((history) => ({
              ...changeRequest,
              workflowHistory: this.toWorkflowSteps(history, CHANGE_WORKFLOW_TEMPLATE, changeRequest.currentWorkflowStep),
            })),
            catchError(() => of({
              ...changeRequest,
              workflowHistory: this.toWorkflowSteps([], CHANGE_WORKFLOW_TEMPLATE, changeRequest.currentWorkflowStep),
            }))
          )
        ),
        switchMap((changeRequest) =>
          this.getAuditTrail(id).pipe(
            map((trail) => ({
              ...changeRequest,
              auditTrail: (trail || []).map((item: any) => ({
                id: item.id,
                action: item.action,
                timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                userId: item.userId || '',
                userName: item.userName || '',
                field: item.fieldName,
                oldValue: item.oldValue,
                newValue: item.newValue,
                comments: item.comments || item.reasonForChange,
              })),
            })),
            catchError(() => of({ ...changeRequest, auditTrail: [] }))
          )
        )
      );
  }

  createChangeRequest(changeRequest: Partial<ChangeRequest>): Observable<ChangeRequest> {
    const payload = {
      title: changeRequest.title,
      description: changeRequest.description,
      justification: changeRequest.justification,
      type: changeRequest.type,
      category: changeRequest.category,
      classification: changeRequest.classification,
      priority: changeRequest.priority,
      departmentId: this.resolveDepartmentId((changeRequest as any).department),
      changeOwnerId: this.resolveUserId((changeRequest as any).changeOwnerName),
      plantSiteId: this.resolvePlantSiteId((changeRequest as any).plantSite),
      targetImplementationDate: this.toIso(changeRequest.targetImplementationDate),
      affectedAreas: changeRequest.affectedAreas || [],
      validationRequired: changeRequest.validationRequired ?? false,
      trainingRequired: changeRequest.trainingRequired ?? false,
      relatedDeviations: changeRequest.relatedDeviations || [],
      relatedCapas: changeRequest.relatedCapas || [],
    };

    return this.http
      .post<ApiChangeRequest>(this.apiUrl, payload, { headers: this.authHeaders() })
      .pipe(map((item) => this.toChangeRequest(item)));
  }

  updateChangeRequest(id: string, changeRequest: Partial<ChangeRequest>): Observable<ChangeRequest> {
    const payload = {
      title: changeRequest.title,
      description: changeRequest.description,
      justification: changeRequest.justification,
      type: changeRequest.type,
      category: changeRequest.category,
      classification: changeRequest.classification,
      priority: changeRequest.priority,
      changeOwnerId: this.resolveUserId((changeRequest as any).changeOwnerName),
      targetImplementationDate: this.toIso(changeRequest.targetImplementationDate),
      affectedAreas: changeRequest.affectedAreas || [],
      validationRequired: changeRequest.validationRequired ?? false,
      trainingRequired: changeRequest.trainingRequired ?? false,
    };

    return this.http
      .put<ApiChangeRequest>(`${this.apiUrl}/${id}`, payload, { headers: this.authHeaders() })
      .pipe(
        switchMap(() => this.getChangeRequestById(id)),
        map((item) => {
          if (!item) throw new Error('Change request was updated but could not be reloaded');
          return item;
        })
      );
  }

  updateStatus(id: string, status: ChangeStatus): Observable<ChangeRequest> {
    return this.http
      .patch<ApiChangeRequest>(
        `${this.apiUrl}/${id}/status`,
        { status, comments: `Status changed to ${status}` },
        { headers: this.authHeaders() }
      )
      .pipe(map((item) => this.toChangeRequest(item)));
  }

  getWorkflowHistory(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/workflow-history`, { headers: this.authHeaders() });
  }

  getAuditTrail(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/audit-trail`, { headers: this.authHeaders() });
  }

  transitionStatus(id: string, status: string, comments?: string): Observable<ChangeRequest> {
    return this.http
      .patch<any>(`${this.apiUrl}/${id}/status`, { status, comments: comments || `Status changed to ${status}` }, { headers: this.authHeaders() })
      .pipe(map((item) => this.toChangeRequest(item)));
  }

  getDashboardMetrics(): Observable<ChangeControlDashboardMetrics> {
    return this.http
      .get<Record<string, any>>(`${API_BASE_URL}/dashboard/change-control-metrics`, { headers: this.authHeaders() })
      .pipe(map((data) => this.toDashboardMetrics(data)));
  }

  private authHeaders(): HttpHeaders {
    const token = this.readAccessToken();
    return token ? new HttpHeaders({ Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }) : new HttpHeaders();
  }

  private readAccessToken(): string | null {
    const directKeys = ['accessToken', 'authToken', 'token', 'jwt', 'qmsAccessToken'];
    for (const key of directKeys) {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    }

    for (const key of ['auth', 'currentUser', 'user']) {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.accessToken) return parsed.accessToken;
        if (parsed?.token) return parsed.token;
      } catch {
        continue;
      }
    }
    return null;
  }

  private toChangeRequest(item: ApiChangeRequest): ChangeRequest {
    return {
      id: item.id,
      changeNumber: item.changeNumber,
      title: item.title,
      description: item.description,
      justification: item.justification,
      type: item.type as ChangeType,
      category: item.category as ChangeCategory,
      classification: item.classification as ChangeClassification,
      status: item.status as ChangeStatus,
      priority: item.priority as ChangePriority,
      requestedById: item.requestedBy?.id || '',
      requestedByName: item.requestedBy?.displayName || '',
      requestedDate: this.toDate(item.requestedDate),
      department: item.departmentName || '',
      changeOwnerId: item.changeOwner?.id || '',
      changeOwnerName: item.changeOwner?.displayName || '',
      qaReviewerId: item.qaReviewer?.id,
      qaReviewerName: item.qaReviewer?.displayName,
      raReviewerId: item.raReviewer?.id,
      raReviewerName: item.raReviewer?.displayName,
      plantSite: item.plantSiteName || '',
      affectedAreas: item.affectedAreas || [],
      targetImplementationDate: this.toDate(item.targetImplementationDate),
      actualImplementationDate: item.actualImplementationDate ? this.toDate(item.actualImplementationDate) : undefined,
      effectivenessCheckDate: item.effectivenessCheckDate ? this.toDate(item.effectivenessCheckDate) : undefined,
      closedDate: item.closedDate ? this.toDate(item.closedDate) : undefined,
      impactAssessment: item.impactAssessment ? {
        productQuality: item.impactAssessment.productQuality,
        patientSafety: item.impactAssessment.patientSafety,
        regulatoryCompliance: item.impactAssessment.regulatoryCompliance,
        validationStatus: item.impactAssessment.validationStatus,
        documentation: item.impactAssessment.documentation,
        training: item.impactAssessment.training,
        supplierQualification: item.impactAssessment.supplierQualification,
        stability: item.impactAssessment.stability,
        overallRiskLevel: item.impactAssessment.overallRiskLevel,
        assessmentSummary: item.impactAssessment.assessmentSummary || '',
        assessedBy: item.impactAssessment.assessedBy?.displayName,
        assessedDate: item.impactAssessment.assessedDate ? this.toDate(item.impactAssessment.assessedDate) : undefined,
      } : this.emptyImpactAssessment(),
      regulatoryFiling: item.regulatoryFiling ? {
        filingRequired: item.regulatoryFilingRequired ?? false,
        filingType: item.regulatoryFiling.filingType,
        markets: item.regulatoryFiling.markets || [],
        filingDetails: item.regulatoryFiling.filingDetails,
        targetFilingDate: item.regulatoryFiling.targetFilingDate ? this.toDate(item.regulatoryFiling.targetFilingDate) : undefined,
        filingStatus: item.regulatoryFiling.filingStatus,
      } : { filingRequired: item.regulatoryFilingRequired ?? false },
      validationRequired: item.validationRequired ?? false,
      validationDetails: item.validationDetails,
      affectedDocuments: (item.affectedDocuments || []).map((document: any) => ({
        documentId: document.id || '',
        documentNumber: document.documentNumber || '',
        documentTitle: document.documentTitle || '',
        documentType: document.documentType || '',
        currentVersion: document.currentVersion || '',
        action: document.action,
        newVersion: document.newVersion,
        status: document.status || 'PENDING',
      })),
      affectedProducts: item.affectedProducts || [],
      affectedEquipment: [],
      affectedProcesses: [],
      implementationPlan: (item.implementationTasks || []).map((task: any) => ({
        id: task.id,
        taskNumber: task.taskNumber,
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo?.displayName || '',
        department: task.departmentName || '',
        dueDate: this.toDate(task.dueDate),
        completedDate: task.completedDate ? this.toDate(task.completedDate) : undefined,
        status: task.status || 'NOT_STARTED',
        comments: task.comments,
      })),
      trainingRequired: item.trainingRequired ?? false,
      trainingPlan: (item.trainingRequirements || []).map((training: any) => ({
        id: training.id,
        trainingTitle: training.trainingTitle || '',
        targetAudience: training.targetAudience || '',
        department: training.departmentName || '',
        trainingType: training.trainingType,
        dueDate: this.toDate(training.dueDate),
        completionStatus: training.completionStatus || 'PENDING',
        completionPercentage: training.completionPercentage || 0,
      })),
      approvals: (item.approvals || []).map((approval: any) => ({
        id: approval.id,
        approverName: approval.approver?.displayName || '',
        approverId: approval.approver?.id || '',
        role: approval.role || '',
        department: approval.department || '',
        decision: approval.decision || 'PENDING',
        comments: approval.comments,
        decisionDate: approval.decisionDate ? this.toDate(approval.decisionDate) : undefined,
      })),
      effectivenessReview: item.effectivenessReviews?.[0] ? {
        reviewDate: this.toDate(item.effectivenessReviews[0].reviewDate),
        reviewerId: item.effectivenessReviews[0].reviewer?.id || '',
        reviewerName: item.effectivenessReviews[0].reviewer?.displayName || '',
        criteria: item.effectivenessReviews[0].criteria || [],
        overallEffective: item.effectivenessReviews[0].overallEffective ?? false,
        summary: item.effectivenessReviews[0].summary || '',
        followUpRequired: item.effectivenessReviews[0].followUpRequired ?? false,
        followUpActions: item.effectivenessReviews[0].followUpActions,
      } : undefined,
      relatedDeviations: item.relatedDeviations || [],
      relatedCapas: item.relatedCapas || [],
      relatedChanges: item.relatedChanges || [],
      auditTrail: [],
      currentWorkflowStep: item.currentWorkflowStep || '',
      workflowHistory: [],
      attachments: [],
      createdAt: this.toDate(item.createdAt),
      updatedAt: this.toDate(item.updatedAt),
    };
  }

  private toWorkflowSteps(history: ApiWorkflowHistory[], template: string[], currentStep?: string): ChangeWorkflowStep[] {
    const byName = new Map((history || []).map((step) => [this.normalizeStepName(step.stepName), step]));
    const known = template.map((stepName) => {
      const match = byName.get(this.normalizeStepName(stepName));
      return this.toWorkflowStep(match, stepName, currentStep);
    });

    const extras = (history || [])
      .filter((step) => !template.some((name) => this.normalizeStepName(name) === this.normalizeStepName(step.stepName)))
      .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
      .map((step) => this.toWorkflowStep(step, step.stepName, currentStep));

    return [...known, ...extras];
  }

  private toWorkflowStep(step: ApiWorkflowHistory | undefined, fallbackName: string, currentStep?: string): ChangeWorkflowStep {
    const status = (step?.status || (this.normalizeStepName(fallbackName) === this.normalizeStepName(currentStep || '') ? 'CURRENT' : 'PENDING')) as ChangeWorkflowStep['status'];
    return {
      stepName: step?.stepName || fallbackName,
      status,
      assignedTo: step?.assignedTo?.displayName,
      startedAt: step?.startedAt ? this.toDate(step.startedAt) : undefined,
      completedAt: step?.completedAt ? this.toDate(step.completedAt) : undefined,
      comments: step?.comments,
    };
  }

  private normalizeStepName(value: string): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private emptyImpactAssessment() {
    return {
      productQuality: ImpactRating.NO_IMPACT,
      patientSafety: ImpactRating.NO_IMPACT,
      regulatoryCompliance: ImpactRating.NO_IMPACT,
      validationStatus: ImpactRating.NO_IMPACT,
      documentation: ImpactRating.NO_IMPACT,
      training: ImpactRating.NO_IMPACT,
      supplierQualification: ImpactRating.NO_IMPACT,
      stability: ImpactRating.NO_IMPACT,
      overallRiskLevel: 'LOW' as const,
      assessmentSummary: '',
    };
  }

  private toDashboardMetrics(data: any): ChangeControlDashboardMetrics {
    return {
      totalOpen: data.openChangeRequests ?? 0,
      totalPendingApproval: data.byStatus?.PENDING_APPROVAL ?? 0,
      totalInImplementation: data.byStatus?.IMPLEMENTATION ?? 0,
      totalOverdue: data.overdueChangeRequests ?? 0,
      totalClosedThisMonth: data.closedChangeRequests ?? 0,
      totalSubmittedThisMonth: data.totalChangeRequests ?? 0,
      avgCycleTimeDays: 0,
      approvalRate: 0,
      byStatus: this.toCountArray<ChangeStatus>(data.byStatus, 'status'),
      byType: this.toCountArray<ChangeType>(data.byType, 'type'),
      byClassification: this.toCountArray<ChangeClassification>(data.byClassification, 'classification'),
      byPriority: [],
      byDepartment: Object.entries(data.byDepartment || {}).map(([department, count]) => ({ department, count: Number(count) })),
      trendData: [{ month: 'Current', submitted: data.totalChangeRequests ?? 0, closed: data.closedChangeRequests ?? 0, rejected: data.byStatus?.REJECTED ?? 0 }],
    };
  }

  private toCountArray<T extends string>(source: any, key: string): any[] {
    return Object.entries(source || {}).map(([name, count]) => ({ [key]: name as T, count: Number(count) }));
  }

  private toDate(value: unknown): Date {
    return value ? new Date(value as string) : new Date();
  }

  private toIso(value: unknown): string {
    return this.toDate(value).toISOString();
  }

  private resolvePlantSiteId(name?: string): string {
    const sites: Record<string, string> = {
      'Hyderabad Unit-1': 'b0000000-0000-0000-0000-000000000001',
      'Hyderabad Unit-2': 'b0000000-0000-0000-0000-000000000002',
      'Vizag Unit-1': 'b0000000-0000-0000-0000-000000000003',
      'Genome Valley Manufacturing Unit': 'b0000000-0000-0000-0000-000000000001',
    };
    return sites[name || ''] || sites['Hyderabad Unit-1'];
  }

  private resolveDepartmentId(name?: string): string {
    const departments: Record<string, string> = {
      Production: 'c0000000-0000-0000-0000-000000000001',
      'Quality Assurance': 'c0000000-0000-0000-0000-000000000002',
      'Quality Control': 'c0000000-0000-0000-0000-000000000003',
      Engineering: 'c0000000-0000-0000-0000-000000000004',
      'Engineering & Maintenance': 'c0000000-0000-0000-0000-000000000004',
      Warehouse: 'c0000000-0000-0000-0000-000000000005',
      'Warehouse & Stores': 'c0000000-0000-0000-0000-000000000005',
      'Regulatory Affairs': 'c0000000-0000-0000-0000-000000000006',
      'Supply Chain': 'c0000000-0000-0000-0000-000000000005',
      'R&D': 'c0000000-0000-0000-0000-000000000007',
      'Research & Development': 'c0000000-0000-0000-0000-000000000007',
    };
    return departments[name || ''] || departments['Quality Assurance'];
  }

  private resolveUserId(name?: string): string {
    const users: Record<string, string> = {
      'Rajesh Kumar': 'd0000000-0000-0000-0000-000000000001',
      'Srinivas Rao': 'd0000000-0000-0000-0000-000000000002',
      'Priya Sharma': 'd0000000-0000-0000-0000-000000000003',
      'Suresh Reddy': 'd0000000-0000-0000-0000-000000000004',
      'Anitha Rao': 'd0000000-0000-0000-0000-000000000005',
      'Lakshmi Devi': 'd0000000-0000-0000-0000-000000000006',
      'Venkat Naidu': 'd0000000-0000-0000-0000-000000000007',
      'Venkat Rao': 'd0000000-0000-0000-0000-000000000007',
      'Mohammad Ali': 'd0000000-0000-0000-0000-000000000008',
      'Kavitha Krishnan': 'd0000000-0000-0000-0000-000000000009',
      'Kavitha Reddy': 'd0000000-0000-0000-0000-000000000009',
      'Ravi Teja': 'd0000000-0000-0000-0000-000000000010',
      'Deepa Menon': 'd0000000-0000-0000-0000-000000000011',
      'Ramesh Gupta': 'd0000000-0000-0000-0000-000000000012',
      'Suresh Menon': 'd0000000-0000-0000-0000-000000000002',
    };
    return users[name || ''] || users['Priya Sharma'];
  }

  private generateMockData(): ChangeRequest[] {
    return [
      {
        id: 'CC-001',
        changeNumber: 'CC-2025-018',
        title: 'Change Tablet Compression Parameters for Atorvastatin 20mg',
        description: 'Proposal to modify compression force from 15kN to 18kN and pre-compression force from 3kN to 4kN for Atorvastatin 20mg tablets to reduce capping tendency observed in last 3 batches. Process validation protocol to be executed for 3 consecutive batches post-change.',
        justification: 'Capping defect rate increased from 0.2% to 1.8% over last 3 batches (AT-2025-045, AT-2025-046, AT-2025-047). Root cause analysis (DEV-2025-023) identified compression parameters as contributing factor. Change aims to bring capping rate within 0.5% limit.',
        type: ChangeType.PROCESS,
        category: ChangeCategory.PRODUCT,
        classification: ChangeClassification.MAJOR,
        status: ChangeStatus.IMPLEMENTATION,
        priority: ChangePriority.HIGH,
        requestedById: 'USR-003',
        requestedByName: 'Priya Sharma',
        requestedDate: daysAgo(42),
        department: 'Production',
        changeOwnerId: 'USR-003',
        changeOwnerName: 'Priya Sharma',
        qaReviewerId: 'USR-001',
        qaReviewerName: 'Dr. Ramesh Iyer',
        raReviewerId: 'USR-025',
        raReviewerName: 'Suresh Menon',
        plantSite: 'Hyderabad Unit-1',
        affectedAreas: ['Compression Area', 'In-Process QC Lab'],
        targetImplementationDate: daysFromNow(24),
        impactAssessment: {
          productQuality: ImpactRating.MEDIUM,
          patientSafety: ImpactRating.LOW,
          regulatoryCompliance: ImpactRating.MEDIUM,
          validationStatus: ImpactRating.HIGH,
          documentation: ImpactRating.MEDIUM,
          training: ImpactRating.LOW,
          supplierQualification: ImpactRating.NO_IMPACT,
          stability: ImpactRating.LOW,
          overallRiskLevel: 'MEDIUM',
          assessmentSummary: 'Change to compression parameters requires process validation (3 batches) and stability study. Regulatory filing as CBE-30 for US market. Training for compression operators required.',
          assessedBy: 'Dr. Ramesh Iyer',
          assessedDate: daysAgo(34),
        },
        regulatoryFiling: {
          filingRequired: true,
          filingType: FilingType.CBE_30,
          markets: ['US', 'India'],
          filingDetails: 'CBE-30 supplement for change in manufacturing process parameters. ANDA 091234.',
          targetFilingDate: daysFromNow(60),
          filingStatus: 'NOT_STARTED',
        },
        validationRequired: true,
        validationDetails: 'Process Validation Protocol PVP-AT20-003. Three consecutive batches at commercial scale. IPC parameters and dissolution to be monitored.',
        affectedDocuments: [
          { documentId: 'DOC-BMR-AT20', documentNumber: 'BMR-AT20-Rev07', documentTitle: 'Batch Manufacturing Record - Atorvastatin 20mg', documentType: 'BMR', currentVersion: '07', action: 'REVISE', newVersion: '08', status: 'IN_PROGRESS' },
          { documentId: 'DOC-SOP-COMP', documentNumber: 'SOP-PRD-045', documentTitle: 'SOP for Tablet Compression Operation', documentType: 'SOP', currentVersion: '05', action: 'REVISE', newVersion: '06', status: 'PENDING' },
          { documentId: 'DOC-PVP-AT20', documentNumber: 'PVP-AT20-003', documentTitle: 'Process Validation Protocol - Atorvastatin 20mg', documentType: 'Protocol', currentVersion: '01', action: 'CREATE_NEW', status: 'COMPLETED' },
        ],
        affectedProducts: [
          { productName: 'Atorvastatin Calcium Tablets 20mg', productCode: 'AT-20', dosageForm: 'Film-coated Tablets', markets: ['US', 'India', 'EU'], impactDescription: 'Compression parameters change affecting physical attributes. No change to formulation or dissolution.' },
        ],
        affectedEquipment: ['Tablet Press TP-01 (Cadmach CMD-40)', 'Tablet Press TP-02 (Cadmach CMD-40)'],
        affectedProcesses: ['Compression', 'In-Process Testing'],
        implementationPlan: [
          { id: 'T1', taskNumber: 1, title: 'Revise BMR with new parameters', description: 'Update batch manufacturing record with revised compression force parameters', assignedTo: 'Priya Sharma', department: 'Production', dueDate: daysAgo(14), completedDate: daysAgo(17), status: 'COMPLETED' },
          { id: 'T2', taskNumber: 2, title: 'Execute PVP - Batch 1', description: 'Execute first validation batch with revised parameters', assignedTo: 'Priya Sharma', department: 'Production', dueDate: daysAgo(5), completedDate: daysAgo(7), status: 'COMPLETED' },
          { id: 'T3', taskNumber: 3, title: 'Execute PVP - Batch 2', description: 'Execute second validation batch', assignedTo: 'Priya Sharma', department: 'Production', dueDate: daysFromNow(5), status: 'IN_PROGRESS' },
          { id: 'T4', taskNumber: 4, title: 'Execute PVP - Batch 3', description: 'Execute third validation batch', assignedTo: 'Priya Sharma', department: 'Production', dueDate: daysFromNow(15), status: 'NOT_STARTED' },
          { id: 'T5', taskNumber: 5, title: 'Compile Validation Report', description: 'Prepare and compile process validation report (PVR)', assignedTo: 'Kavitha Reddy', department: 'Quality Assurance', dueDate: daysFromNow(25), status: 'NOT_STARTED' },
          { id: 'T6', taskNumber: 6, title: 'Train compression operators', description: 'Conduct training on revised parameters', assignedTo: 'Priya Sharma', department: 'Production', dueDate: daysAgo(10), completedDate: daysAgo(12), status: 'COMPLETED' },
        ],
        trainingRequired: true,
        trainingPlan: [
          { id: 'TR1', trainingTitle: 'Revised Compression Parameters - Atorvastatin 20mg', targetAudience: 'Compression Operators', department: 'Production', trainingType: 'CLASSROOM', dueDate: daysAgo(10), completionStatus: 'COMPLETED', completionPercentage: 100 },
          { id: 'TR2', trainingTitle: 'Updated BMR Rev-08 Read & Understand', targetAudience: 'Production Staff', department: 'Production', trainingType: 'SOP_READ', dueDate: daysAgo(8), completionStatus: 'COMPLETED', completionPercentage: 100 },
        ],
        approvals: [
          { id: 'A1', approverName: 'Priya Sharma', approverId: 'USR-003', role: 'Change Owner', department: 'Production', decision: 'APPROVED', comments: 'Process feasibility confirmed through trial batches.', decisionDate: daysAgo(37) },
          { id: 'A2', approverName: 'Dr. Ramesh Iyer', approverId: 'USR-001', role: 'QA Head', department: 'Quality Assurance', decision: 'APPROVED', comments: 'Approved with condition that PVP must pass for all 3 batches before routine implementation.', decisionDate: daysAgo(32) },
          { id: 'A3', approverName: 'Suresh Menon', approverId: 'USR-025', role: 'RA Manager', department: 'Regulatory Affairs', decision: 'APPROVED', comments: 'CBE-30 filing to be submitted within 30 days of implementation completion.', decisionDate: daysAgo(30) },
          { id: 'A4', approverName: 'Venkat Rao', approverId: 'USR-030', role: 'Plant Head', department: 'Operations', decision: 'APPROVED', decisionDate: daysAgo(27) },
        ],
        relatedDeviations: ['DEV-2025-023'],
        relatedCapas: ['CAPA-2025-001'],
        relatedChanges: [],
        auditTrail: [
          { id: 'AT-C-001', timestamp: daysAgo(42), userId: 'USR-003', userName: 'Priya Sharma', action: 'Change Request Created' },
          { id: 'AT-C-002', timestamp: daysAgo(40), userId: 'USR-003', userName: 'Priya Sharma', action: 'Status Changed', field: 'status', oldValue: 'DRAFT', newValue: 'SUBMITTED' },
          { id: 'AT-C-003', timestamp: daysAgo(34), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'Impact Assessment Completed' },
          { id: 'AT-C-004', timestamp: daysAgo(27), userId: 'USR-030', userName: 'Venkat Rao', action: 'Final Approval Granted', comments: 'All approvals received. Change approved for implementation.' },
          { id: 'AT-C-005', timestamp: daysAgo(20), userId: 'USR-003', userName: 'Priya Sharma', action: 'Implementation Started' },
        ],
        currentWorkflowStep: 'Implementation',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', assignedTo: 'Priya Sharma', completedAt: daysAgo(42) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', assignedTo: 'Dr. Ramesh Iyer', completedAt: daysAgo(34) },
          { stepName: 'QA Review', status: 'COMPLETED', assignedTo: 'Dr. Ramesh Iyer', completedAt: daysAgo(32) },
          { stepName: 'RA Review', status: 'COMPLETED', assignedTo: 'Suresh Menon', completedAt: daysAgo(30) },
          { stepName: 'Approval', status: 'COMPLETED', assignedTo: 'Venkat Rao', completedAt: daysAgo(27) },
          { stepName: 'Implementation', status: 'CURRENT', assignedTo: 'Priya Sharma', startedAt: daysAgo(20) },
          { stepName: 'Verification', status: 'PENDING' },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        attachments: [
          { id: 'ATT-C1', fileName: 'Trial_Batch_Report_AT20.pdf', fileType: 'application/pdf', fileSize: 520000, uploadedBy: 'Priya Sharma', uploadedDate: daysAgo(42), description: 'Trial batch results with revised parameters', category: 'SUPPORTING_DATA' },
          { id: 'ATT-C2', fileName: 'Risk_Assessment_CC2025018.xlsx', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 85000, uploadedBy: 'Dr. Ramesh Iyer', uploadedDate: daysAgo(34), description: 'Quality risk assessment matrix', category: 'RISK_ASSESSMENT' },
        ],
        createdAt: daysAgo(42),
        updatedAt: daysAgo(7),
      },
      {
        id: 'CC-002',
        changeNumber: 'CC-2025-019',
        title: 'Qualification of Alternate API Supplier - Metformin HCl',
        description: 'Qualification of M/s Granules India Ltd as alternate approved supplier for Metformin HCl API. Current sole supplier (Aarti Drugs) has capacity constraints leading to supply delays. Comparability study protocol to be executed covering physicochemical, impurity profile, and formulation compatibility.',
        justification: 'Supply disruption risk. Primary supplier Aarti Drugs delayed last 3 shipments by 2-4 weeks. Single-source risk unacceptable for high-volume product (5 million tablets/month). Second supplier qualification essential for business continuity.',
        type: ChangeType.SUPPLIER,
        category: ChangeCategory.PRODUCT,
        classification: ChangeClassification.MAJOR,
        status: ChangeStatus.PENDING_APPROVAL,
        priority: ChangePriority.HIGH,
        requestedById: 'USR-009',
        requestedByName: 'Deepak Joshi',
        requestedDate: daysAgo(32),
        department: 'Supply Chain',
        changeOwnerId: 'USR-009',
        changeOwnerName: 'Deepak Joshi',
        qaReviewerId: 'USR-002',
        qaReviewerName: 'Lakshmi Devi',
        raReviewerId: 'USR-025',
        raReviewerName: 'Suresh Menon',
        plantSite: 'Hyderabad Unit-1',
        affectedAreas: ['Warehouse', 'Quality Control Lab', 'Production'],
        targetImplementationDate: daysFromNow(60),
        impactAssessment: {
          productQuality: ImpactRating.MEDIUM,
          patientSafety: ImpactRating.LOW,
          regulatoryCompliance: ImpactRating.HIGH,
          validationStatus: ImpactRating.MEDIUM,
          documentation: ImpactRating.MEDIUM,
          training: ImpactRating.LOW,
          supplierQualification: ImpactRating.HIGH,
          stability: ImpactRating.MEDIUM,
          overallRiskLevel: 'MEDIUM',
          assessmentSummary: 'New supplier qualification requires supplier audit, comparability testing, process validation with new API, stability studies, and regulatory filing (CBE-30 for US). Supplier GMP audit completed satisfactorily.',
          assessedBy: 'Lakshmi Devi',
          assessedDate: daysAgo(20),
        },
        regulatoryFiling: {
          filingRequired: true,
          filingType: FilingType.CBE_30,
          markets: ['US', 'India', 'EU'],
          filingDetails: 'CBE-30 for addition of alternate API source. DMF comparison required.',
          targetFilingDate: daysFromNow(120),
          filingStatus: 'NOT_STARTED',
        },
        validationRequired: true,
        validationDetails: 'Comparability study protocol + 3 batches process validation with alternate API source.',
        affectedDocuments: [
          { documentId: 'DOC-ASL', documentNumber: 'ASL-2025-Rev04', documentTitle: 'Approved Supplier List', documentType: 'Register', currentVersion: '03', action: 'REVISE', newVersion: '04', status: 'PENDING' },
          { documentId: 'DOC-SPEC-MET', documentNumber: 'SPEC-RM-MET-001', documentTitle: 'Raw Material Specification - Metformin HCl', documentType: 'Specification', currentVersion: '04', action: 'NO_CHANGE', status: 'COMPLETED' },
        ],
        affectedProducts: [
          { productName: 'Metformin HCl Tablets 500mg', productCode: 'MF-500', dosageForm: 'Film-coated Tablets', markets: ['US', 'India', 'EU', 'Africa'], impactDescription: 'Alternate API source. No change to formulation or process.' },
          { productName: 'Metformin HCl Tablets 1000mg', productCode: 'MF-1000', dosageForm: 'Film-coated Tablets', markets: ['US', 'India'], impactDescription: 'Alternate API source applicable to all strengths.' },
        ],
        affectedEquipment: [],
        affectedProcesses: ['Incoming QC Testing', 'Dispensing', 'Granulation', 'Compression'],
        implementationPlan: [
          { id: 'T1', taskNumber: 1, title: 'Supplier GMP Audit', description: 'Conduct GMP audit of Granules India facility', assignedTo: 'Lakshmi Devi', department: 'Quality Assurance', dueDate: daysAgo(12), completedDate: daysAgo(15), status: 'COMPLETED' },
          { id: 'T2', taskNumber: 2, title: 'Receive and test API samples', description: 'Receive 3 batches of API samples for comparability testing', assignedTo: 'Deepak Joshi', department: 'Supply Chain', dueDate: daysFromNow(20), status: 'NOT_STARTED' },
          { id: 'T3', taskNumber: 3, title: 'Execute Comparability Protocol', description: 'Physicochemical, impurity, and compatibility testing', assignedTo: 'QC Lab', department: 'Quality Control', dueDate: daysFromNow(50), status: 'NOT_STARTED' },
        ],
        trainingRequired: false,
        approvals: [
          { id: 'A1', approverName: 'Deepak Joshi', approverId: 'USR-009', role: 'Change Owner', department: 'Supply Chain', decision: 'APPROVED', decisionDate: daysAgo(30) },
          { id: 'A2', approverName: 'Lakshmi Devi', approverId: 'USR-002', role: 'QA Manager', department: 'Quality Assurance', decision: 'APPROVED', comments: 'Supplier audit satisfactory. Proceed with comparability.', decisionDate: daysAgo(10) },
          { id: 'A3', approverName: 'Suresh Menon', approverId: 'USR-025', role: 'RA Manager', department: 'Regulatory Affairs', decision: 'PENDING' },
          { id: 'A4', approverName: 'Venkat Rao', approverId: 'USR-030', role: 'Plant Head', department: 'Operations', decision: 'PENDING' },
        ],
        relatedDeviations: [],
        relatedCapas: [],
        relatedChanges: [],
        auditTrail: [
          { id: 'AT-C-010', timestamp: daysAgo(32), userId: 'USR-009', userName: 'Deepak Joshi', action: 'Change Request Created' },
          { id: 'AT-C-011', timestamp: daysAgo(20), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'Impact Assessment Completed' },
          { id: 'AT-C-012', timestamp: daysAgo(10), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'QA Review Approved', comments: 'Supplier audit completed successfully. GMP compliance confirmed.' },
        ],
        currentWorkflowStep: 'Approval',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', completedAt: daysAgo(32) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(20) },
          { stepName: 'QA Review', status: 'COMPLETED', completedAt: daysAgo(10) },
          { stepName: 'RA Review', status: 'COMPLETED', completedAt: daysAgo(8) },
          { stepName: 'Approval', status: 'CURRENT', startedAt: daysAgo(8) },
          { stepName: 'Implementation', status: 'PENDING' },
          { stepName: 'Verification', status: 'PENDING' },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        attachments: [
          { id: 'ATT-C3', fileName: 'Granules_India_GMP_Audit_Report.pdf', fileType: 'application/pdf', fileSize: 1200000, uploadedBy: 'Lakshmi Devi', uploadedDate: daysAgo(15), description: 'GMP Audit Report - Granules India Vizag facility', category: 'SUPPORTING_DATA' },
        ],
        createdAt: daysAgo(32),
        updatedAt: daysAgo(8),
      },
      {
        id: 'CC-003',
        changeNumber: 'CC-2025-020',
        title: 'HVAC System Upgrade - Sterile Manufacturing Block',
        description: 'Upgrade of AHU-STR-01 and AHU-STR-02 in Sterile Manufacturing Block from existing Trane units (2015) to new Carrier units with improved HEPA filtration (H14) and energy-efficient VFD motors. Includes requalification of Grade B and Grade C areas.',
        justification: 'Existing AHUs approaching end of service life (10 years). Increased maintenance costs (35% YoY increase). Two EM excursions in last 6 months attributed to aging HEPA filters. New units provide 30% energy savings and improved particle retention.',
        type: ChangeType.EQUIPMENT,
        category: ChangeCategory.SITE,
        classification: ChangeClassification.CRITICAL,
        status: ChangeStatus.APPROVED,
        priority: ChangePriority.URGENT,
        requestedById: 'USR-020',
        requestedByName: 'Mahesh Patil',
        requestedDate: daysAgo(67),
        department: 'Engineering',
        changeOwnerId: 'USR-020',
        changeOwnerName: 'Mahesh Patil',
        qaReviewerId: 'USR-001',
        qaReviewerName: 'Dr. Ramesh Iyer',
        plantSite: 'Hyderabad Unit-2',
        affectedAreas: ['Sterile Manufacturing Block', 'Grade B Area', 'Grade C Area', 'Support Corridors'],
        targetImplementationDate: daysFromNow(45),
        impactAssessment: {
          productQuality: ImpactRating.HIGH,
          patientSafety: ImpactRating.MEDIUM,
          regulatoryCompliance: ImpactRating.HIGH,
          validationStatus: ImpactRating.HIGH,
          documentation: ImpactRating.HIGH,
          training: ImpactRating.MEDIUM,
          supplierQualification: ImpactRating.NO_IMPACT,
          stability: ImpactRating.NO_IMPACT,
          overallRiskLevel: 'HIGH',
          assessmentSummary: 'Critical infrastructure change affecting classified areas. Full requalification of Grade B/C areas required. Production shutdown of 4 weeks planned during installation. All sterile products affected during qualification period.',
          assessedBy: 'Dr. Ramesh Iyer',
          assessedDate: daysAgo(52),
        },
        regulatoryFiling: {
          filingRequired: false,
          filingType: FilingType.NONE,
        },
        validationRequired: true,
        validationDetails: 'IQ/OQ/PQ for both AHU units. Area requalification per Annex 1. Includes airflow visualization, particle counting, HEPA integrity testing (DOP), and 3-day environmental monitoring at rest and in operation.',
        affectedDocuments: [
          { documentId: 'DOC-URS', documentNumber: 'URS-HVAC-STR-001', documentTitle: 'User Requirement Specification - AHU Sterile Block', documentType: 'URS', currentVersion: '01', action: 'CREATE_NEW', status: 'COMPLETED' },
          { documentId: 'DOC-VMP', documentNumber: 'VMP-HVAC-STR-001', documentTitle: 'Validation Master Plan - HVAC Upgrade', documentType: 'VMP', currentVersion: '01', action: 'CREATE_NEW', status: 'COMPLETED' },
        ],
        affectedProducts: [
          { productName: 'All Sterile Injectable Products', productCode: 'MULTI', dosageForm: 'Injectables', markets: ['US', 'India', 'EU'], impactDescription: 'Production halt during upgrade. No impact on approved specifications or processes.' },
        ],
        affectedEquipment: ['AHU-STR-01', 'AHU-STR-02', 'BMS System'],
        affectedProcesses: ['Aseptic Manufacturing', 'Environmental Monitoring', 'Media Fill'],
        implementationPlan: [
          { id: 'T1', taskNumber: 1, title: 'Procurement & FAT', description: 'Factory acceptance testing at Carrier facility', assignedTo: 'Mahesh Patil', department: 'Engineering', dueDate: daysAgo(5), completedDate: daysAgo(10), status: 'COMPLETED' },
          { id: 'T2', taskNumber: 2, title: 'Production shutdown & old unit removal', description: 'Plan production build-up and execute shutdown', assignedTo: 'Mahesh Patil', department: 'Engineering', dueDate: daysFromNow(15), status: 'NOT_STARTED' },
          { id: 'T3', taskNumber: 3, title: 'Installation & commissioning', description: 'Install new AHU units and commission', assignedTo: 'Mahesh Patil', department: 'Engineering', dueDate: daysFromNow(30), status: 'NOT_STARTED' },
          { id: 'T4', taskNumber: 4, title: 'IQ/OQ execution', description: 'Installation and Operational Qualification', assignedTo: 'Kavitha Reddy', department: 'Quality Assurance', dueDate: daysFromNow(40), status: 'NOT_STARTED' },
          { id: 'T5', taskNumber: 5, title: 'PQ & Area Requalification', description: 'Performance qualification and classified area requalification', assignedTo: 'Kavitha Reddy', department: 'Quality Assurance', dueDate: daysFromNow(50), status: 'NOT_STARTED' },
        ],
        trainingRequired: true,
        trainingPlan: [
          { id: 'TR1', trainingTitle: 'New AHU Operation & Alarm Management', targetAudience: 'Engineering Staff', department: 'Engineering', trainingType: 'CLASSROOM', dueDate: daysFromNow(25), completionStatus: 'PENDING', completionPercentage: 0 },
          { id: 'TR2', trainingTitle: 'BMS Interface - Updated HVAC Controls', targetAudience: 'Production & Engineering', department: 'Engineering', trainingType: 'PRACTICAL', dueDate: daysFromNow(35), completionStatus: 'PENDING', completionPercentage: 0 },
        ],
        approvals: [
          { id: 'A1', approverName: 'Mahesh Patil', approverId: 'USR-020', role: 'Change Owner', department: 'Engineering', decision: 'APPROVED', decisionDate: daysAgo(64) },
          { id: 'A2', approverName: 'Dr. Ramesh Iyer', approverId: 'USR-001', role: 'QA Head', department: 'Quality Assurance', decision: 'APPROVED', comments: 'Critical change. Full requalification mandatory before production resumption.', decisionDate: daysAgo(50) },
          { id: 'A3', approverName: 'Venkat Rao', approverId: 'USR-030', role: 'Plant Head', department: 'Operations', decision: 'APPROVED', comments: 'Budget approved. Production build-up plan reviewed.', decisionDate: daysAgo(45) },
        ],
        relatedDeviations: ['DEV-2025-019'],
        relatedCapas: ['CAPA-2025-004'],
        relatedChanges: [],
        auditTrail: [
          { id: 'AT-C-020', timestamp: daysAgo(67), userId: 'USR-020', userName: 'Mahesh Patil', action: 'Change Request Created' },
          { id: 'AT-C-021', timestamp: daysAgo(45), userId: 'USR-030', userName: 'Venkat Rao', action: 'Final Approval Granted' },
        ],
        currentWorkflowStep: 'Approved - Pending Implementation',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', completedAt: daysAgo(67) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(52) },
          { stepName: 'QA Review', status: 'COMPLETED', completedAt: daysAgo(50) },
          { stepName: 'RA Review', status: 'COMPLETED', completedAt: daysAgo(47), comments: 'No regulatory filing required' },
          { stepName: 'Approval', status: 'COMPLETED', completedAt: daysAgo(45) },
          { stepName: 'Implementation', status: 'CURRENT', startedAt: daysAgo(20) },
          { stepName: 'Verification', status: 'PENDING' },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        attachments: [],
        createdAt: daysAgo(67),
        updatedAt: daysAgo(10),
      },
      {
        id: 'CC-004',
        changeNumber: 'CC-2025-021',
        title: 'Update Cleaning Validation Limits for Multi-Product Equipment',
        description: 'Revision of cleaning validation acceptance criteria for shared equipment in OSD Block. Current limits based on 1/1000th of minimum therapeutic dose. Proposed change to MACO (Maximum Allowable Carry Over) calculation based on health-based exposure limits (PDE values) as per EMA guideline.',
        justification: 'EMA Guideline on shared facilities (2014) and updated ICH Q3D require risk-based approach using PDE values for cleaning validation. Current limits are overly conservative for some products, leading to extended cleaning cycles and production delays. PDE-based limits are scientifically justified and regulatory-expected.',
        type: ChangeType.PROCESS,
        category: ChangeCategory.QUALITY_SYSTEM,
        classification: ChangeClassification.MAJOR,
        status: ChangeStatus.QA_REVIEW,
        priority: ChangePriority.MEDIUM,
        requestedById: 'USR-002',
        requestedByName: 'Lakshmi Devi',
        requestedDate: daysAgo(20),
        department: 'Quality Assurance',
        changeOwnerId: 'USR-002',
        changeOwnerName: 'Lakshmi Devi',
        qaReviewerId: 'USR-001',
        qaReviewerName: 'Dr. Ramesh Iyer',
        plantSite: 'Hyderabad Unit-1',
        affectedAreas: ['OSD Manufacturing Block', 'QC Lab'],
        targetImplementationDate: daysFromNow(90),
        impactAssessment: {
          productQuality: ImpactRating.MEDIUM,
          patientSafety: ImpactRating.LOW,
          regulatoryCompliance: ImpactRating.HIGH,
          validationStatus: ImpactRating.HIGH,
          documentation: ImpactRating.HIGH,
          training: ImpactRating.MEDIUM,
          supplierQualification: ImpactRating.NO_IMPACT,
          stability: ImpactRating.NO_IMPACT,
          overallRiskLevel: 'MEDIUM',
          assessmentSummary: 'Change to cleaning validation acceptance criteria across all shared equipment. Toxicology assessment for PDE determination completed by external toxicologist. Re-validation of cleaning procedures for 12 equipment trains required.',
          assessedBy: 'Lakshmi Devi',
          assessedDate: daysAgo(10),
        },
        regulatoryFiling: {
          filingRequired: false,
          filingType: FilingType.NONE,
        },
        validationRequired: true,
        validationDetails: 'Cleaning validation re-execution for all shared equipment using revised MACO limits. Analytical method verification for lower detection limits where needed.',
        affectedDocuments: [
          { documentId: 'DOC-SOP-CV', documentNumber: 'SOP-QA-018', documentTitle: 'Cleaning Validation Policy & Procedure', documentType: 'SOP', currentVersion: '04', action: 'REVISE', status: 'PENDING' },
          { documentId: 'DOC-CV-REPORT', documentNumber: 'CVP-OSD-2025', documentTitle: 'Cleaning Validation Protocol - OSD Shared Equipment', documentType: 'Protocol', currentVersion: '01', action: 'CREATE_NEW', status: 'PENDING' },
        ],
        affectedProducts: [],
        affectedEquipment: ['All shared OSD manufacturing equipment (12 equipment trains)'],
        affectedProcesses: ['Equipment Cleaning', 'Cleaning Verification Sampling', 'Analytical Testing'],
        implementationPlan: [],
        trainingRequired: true,
        approvals: [
          { id: 'A1', approverName: 'Lakshmi Devi', approverId: 'USR-002', role: 'Change Owner', department: 'Quality Assurance', decision: 'APPROVED', decisionDate: daysAgo(15) },
          { id: 'A2', approverName: 'Dr. Ramesh Iyer', approverId: 'USR-001', role: 'QA Head', department: 'Quality Assurance', decision: 'PENDING' },
        ],
        relatedDeviations: [],
        relatedCapas: [],
        relatedChanges: [],
        auditTrail: [
          { id: 'AT-C-030', timestamp: daysAgo(20), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'Change Request Created' },
          { id: 'AT-C-031', timestamp: daysAgo(10), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'Impact Assessment Completed' },
        ],
        currentWorkflowStep: 'QA Review',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', completedAt: daysAgo(20) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(10) },
          { stepName: 'QA Review', status: 'CURRENT', startedAt: daysAgo(8), assignedTo: 'Dr. Ramesh Iyer' },
          { stepName: 'RA Review', status: 'PENDING' },
          { stepName: 'Approval', status: 'PENDING' },
          { stepName: 'Implementation', status: 'PENDING' },
          { stepName: 'Verification', status: 'PENDING' },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        attachments: [
          { id: 'ATT-C5', fileName: 'PDE_Assessment_Report_External_Toxicologist.pdf', fileType: 'application/pdf', fileSize: 890000, uploadedBy: 'Lakshmi Devi', uploadedDate: daysAgo(15), description: 'PDE assessment report from Dr. Subramanian (External Toxicologist)', category: 'SUPPORTING_DATA' },
        ],
        createdAt: daysAgo(20),
        updatedAt: daysAgo(8),
      },
      {
        id: 'CC-005',
        changeNumber: 'CC-2025-015',
        title: 'Minor Label Update - Addition of New Barcode Format',
        description: 'Addition of GS1 DataMatrix barcode on secondary packaging labels for all products destined for EU market. This is a serialization compliance requirement effective Jan 2026. No change to existing label content, only addition of 2D barcode.',
        justification: 'EU FMD (Falsified Medicines Directive) compliance requires unique identifier in DataMatrix format on all prescription medicines. Deadline: January 2026. Early implementation to allow sufficient validation time.',
        type: ChangeType.PACKAGING,
        category: ChangeCategory.REGULATORY_SUBMISSION,
        classification: ChangeClassification.MINOR,
        status: ChangeStatus.CLOSED,
        priority: ChangePriority.MEDIUM,
        requestedById: 'USR-025',
        requestedByName: 'Suresh Menon',
        requestedDate: daysAgo(127),
        department: 'Regulatory Affairs',
        changeOwnerId: 'USR-025',
        changeOwnerName: 'Suresh Menon',
        qaReviewerId: 'USR-002',
        qaReviewerName: 'Lakshmi Devi',
        plantSite: 'Hyderabad Unit-1',
        affectedAreas: ['Packaging Area', 'Artwork Department'],
        targetImplementationDate: daysAgo(22),
        actualImplementationDate: daysAgo(27),
        closedDate: daysAgo(11),
        impactAssessment: {
          productQuality: ImpactRating.NO_IMPACT,
          patientSafety: ImpactRating.NO_IMPACT,
          regulatoryCompliance: ImpactRating.MEDIUM,
          validationStatus: ImpactRating.LOW,
          documentation: ImpactRating.LOW,
          training: ImpactRating.LOW,
          supplierQualification: ImpactRating.NO_IMPACT,
          stability: ImpactRating.NO_IMPACT,
          overallRiskLevel: 'LOW',
          assessmentSummary: 'Low risk change. No impact on product quality or safety. Artwork revision and printer validation required. Label supplier to provide revised proofs.',
          assessedBy: 'Lakshmi Devi',
          assessedDate: daysAgo(117),
        },
        regulatoryFiling: {
          filingRequired: true,
          filingType: FilingType.VARIATION_TYPE_IA,
          markets: ['EU'],
          filingDetails: 'Type IA variation for labeling change. No prior approval required.',
          targetFilingDate: daysAgo(2),
          filingStatus: 'SUBMITTED',
        },
        validationRequired: false,
        affectedDocuments: [
          { documentId: 'DOC-AW', documentNumber: 'AW-EU-MULTI-Rev02', documentTitle: 'Artwork Master - EU Secondary Pack (Multi-product)', documentType: 'Artwork', currentVersion: '01', action: 'REVISE', newVersion: '02', status: 'COMPLETED' },
        ],
        affectedProducts: [
          { productName: 'All EU-marketed products (12 SKUs)', productCode: 'MULTI-EU', dosageForm: 'Various', markets: ['EU'], impactDescription: 'Labeling change only. Addition of DataMatrix barcode on secondary packaging.' },
        ],
        affectedEquipment: ['Label Printer LP-04 (Videojet)'],
        affectedProcesses: ['Secondary Packaging', 'Label Printing'],
        implementationPlan: [
          { id: 'T1', taskNumber: 1, title: 'Artwork revision', description: 'Revise artwork masters for all 12 EU SKUs', assignedTo: 'Artwork Dept', department: 'Packaging', dueDate: daysAgo(95), completedDate: daysAgo(97), status: 'COMPLETED' },
          { id: 'T2', taskNumber: 2, title: 'Printer configuration', description: 'Configure Videojet printer for DataMatrix printing', assignedTo: 'Engineering', department: 'Engineering', dueDate: daysAgo(65), completedDate: daysAgo(70), status: 'COMPLETED' },
          { id: 'T3', taskNumber: 3, title: 'Verification runs', description: 'Execute verification runs for barcode readability', assignedTo: 'Packaging Team', department: 'Packaging', dueDate: daysAgo(40), completedDate: daysAgo(42), status: 'COMPLETED' },
        ],
        trainingRequired: true,
        trainingPlan: [
          { id: 'TR1', trainingTitle: 'GS1 DataMatrix - Label Inspection', targetAudience: 'Packaging Operators', department: 'Packaging', trainingType: 'OJT', dueDate: daysAgo(55), completionStatus: 'COMPLETED', completionPercentage: 100 },
        ],
        approvals: [
          { id: 'A1', approverName: 'Suresh Menon', approverId: 'USR-025', role: 'Change Owner', department: 'Regulatory Affairs', decision: 'APPROVED', decisionDate: daysAgo(124) },
          { id: 'A2', approverName: 'Lakshmi Devi', approverId: 'USR-002', role: 'QA Manager', department: 'Quality Assurance', decision: 'APPROVED', decisionDate: daysAgo(113) },
        ],
        effectivenessReview: {
          reviewDate: daysAgo(16),
          reviewerId: 'USR-002',
          reviewerName: 'Lakshmi Devi',
          criteria: [
            { criterion: 'DataMatrix barcode readable by EU verification systems', met: true, evidence: 'Verification testing confirmed 100% readability across all SKUs' },
            { criterion: 'No label defects during production runs', met: true, evidence: 'First 5 production batches per SKU inspected - no defects' },
            { criterion: 'Regulatory filing submitted', met: true, evidence: 'Type IA variation submitted to EMA' },
          ],
          overallEffective: true,
          summary: 'Change implemented successfully. All effectiveness criteria met. Barcode functionality verified across all SKUs.',
          followUpRequired: false,
        },
        relatedDeviations: [],
        relatedCapas: [],
        relatedChanges: [],
        auditTrail: [
          { id: 'AT-C-040', timestamp: daysAgo(127), userId: 'USR-025', userName: 'Suresh Menon', action: 'Change Request Created' },
          { id: 'AT-C-041', timestamp: daysAgo(11), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'Change Control Closed', comments: 'All tasks complete. Effectiveness confirmed.' },
        ],
        currentWorkflowStep: 'Closed',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', completedAt: daysAgo(127) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(117) },
          { stepName: 'QA Review', status: 'COMPLETED', completedAt: daysAgo(113) },
          { stepName: 'RA Review', status: 'COMPLETED', completedAt: daysAgo(109) },
          { stepName: 'Approval', status: 'COMPLETED', completedAt: daysAgo(109) },
          { stepName: 'Implementation', status: 'COMPLETED', completedAt: daysAgo(27) },
          { stepName: 'Verification', status: 'COMPLETED', completedAt: daysAgo(22) },
          { stepName: 'Effectiveness Check', status: 'COMPLETED', completedAt: daysAgo(16) },
          { stepName: 'Closure', status: 'COMPLETED', completedAt: daysAgo(11) },
        ],
        attachments: [],
        createdAt: daysAgo(127),
        updatedAt: daysAgo(11),
      },
    ];
  }

  private generateId(): string {
    return 'id-' + Math.random().toString(36).substring(2, 11);
  }

  private generateChangeNumber(): string {
    return `CC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }
}
