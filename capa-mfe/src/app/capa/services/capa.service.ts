import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
  Capa,
  CapaStatus,
  CapaPriority,
  CapaType,
  CapaSourceType,
  CapaAction,
  ActionStatus,
  CapaDashboardMetrics,
  CapaListFilter,
  RcaMethod,
  RootCauseAnalysis,
  WorkflowStep,
} from '../models/capa.model';

const API_BASE_URL = 'http://localhost:8082/api/v1';

type ApiPage<T> = {
  content?: T[];
};

type ApiCapa = any;
type ApiWorkflowHistory = any;

const CAPA_WORKFLOW_TEMPLATE = [
  'Initiation',
  'QA Review',
  'Root Cause Analysis',
  'Risk Assessment',
  'Action Planning',
  'Action Execution',
  'Effectiveness Check',
  'QA Approval',
  'Closure',
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
export class CapaService {
  private readonly apiUrl = `${API_BASE_URL}/capas`;

  constructor(private http: HttpClient) {}

  getCapas(filter?: CapaListFilter): Observable<Capa[]> {
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '100')
      .set('sort', 'createdAt,desc');

    filter?.status?.forEach((status) => (params = params.append('status', status)));
    filter?.priority?.forEach((priority) => (params = params.append('priority', priority)));
    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.search) params = params.set('search', filter.search);

    return this.http
      .get<ApiPage<ApiCapa>>(this.apiUrl, { headers: this.authHeaders(), params })
      .pipe(map((page) => (page.content || []).map((item) => this.toCapa(item))));
  }

  getCapaById(id: string): Observable<Capa | undefined> {
    return this.http
      .get<ApiCapa>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(
        map((item) => this.toCapa(item)),
        switchMap((capa) =>
          this.getWorkflowHistory(id).pipe(
            map((history) => ({
              ...capa,
              workflowHistory: this.toWorkflowSteps(history, CAPA_WORKFLOW_TEMPLATE, capa.currentWorkflowStep),
            })),
            catchError(() => of({
              ...capa,
              workflowHistory: this.toWorkflowSteps([], CAPA_WORKFLOW_TEMPLATE, capa.currentWorkflowStep),
            }))
          )
        )
      );
  }

  createCapa(capa: Partial<Capa>): Observable<Capa> {
    const payload = {
      title: capa.title,
      description: capa.description,
      type: capa.type,
      priority: capa.priority,
      sourceType: capa.sourceType,
      sourceReference: capa.sourceReference,
      targetCompletionDate: this.toIso(capa.targetCompletionDate || capa.dueDate),
      ownerId: this.resolveUserId((capa as any).ownerName),
      departmentId: this.resolveDepartmentId((capa as any).department || capa.assignedDepartment),
      plantSiteId: this.resolvePlantSiteId((capa as any).plantSite),
      product: capa.product,
      batchNumber: capa.batchNumber,
    };

    return this.http
      .post<ApiCapa>(this.apiUrl, payload, { headers: this.authHeaders() })
      .pipe(map((item) => this.toCapa(item)));
  }

  updateCapaStatus(id: string, status: CapaStatus): Observable<Capa> {
    return this.http
      .patch<ApiCapa>(
        `${this.apiUrl}/${id}/status`,
        { status, comments: `Status changed to ${status}` },
        { headers: this.authHeaders() }
      )
      .pipe(map((item) => this.toCapa(item)));
  }

  getDashboardMetrics(): Observable<CapaDashboardMetrics> {
    return this.http
      .get<Record<string, any>>(`${API_BASE_URL}/dashboard/capa-metrics`, { headers: this.authHeaders() })
      .pipe(map((data) => this.toDashboardMetrics(data)));
  }

  getWorkflowHistory(id: string): Observable<ApiWorkflowHistory[]> {
    return this.http.get<ApiWorkflowHistory[]>(`${this.apiUrl}/${id}/workflow-history`, { headers: this.authHeaders() });
  }

  submitRootCauseAnalysis(id: string, rca: RootCauseAnalysis): Observable<Capa> {
    const payload = {
      method: rca.method,
      description: rca.description,
      rootCauses: rca.rootCauses || [],
      contributingFactors: rca.contributingFactors || [],
      fiveWhyEntries: rca.fiveWhyAnalysis || [],
      fishboneCategories: [],
    };

    return this.http
      .post<ApiCapa>(`${this.apiUrl}/${id}/root-cause-analysis`, payload, { headers: this.authHeaders() })
      .pipe(map((item) => this.toCapa(item)));
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

  private toCapa(item: ApiCapa): Capa {
    const actions = item.actions || [];
    return {
      id: item.id,
      capaNumber: item.capaNumber,
      title: item.title,
      description: item.description,
      type: item.type as CapaType,
      status: item.status as CapaStatus,
      priority: item.priority as CapaPriority,
      sourceType: item.sourceType as CapaSourceType,
      sourceReference: item.sourceReference,
      initiatedDate: this.toDate(item.initiatedDate),
      targetCompletionDate: this.toDate(item.targetCompletionDate),
      actualCompletionDate: item.actualCompletionDate ? this.toDate(item.actualCompletionDate) : undefined,
      dueDate: this.toDate(item.dueDate || item.targetCompletionDate),
      initiatorId: item.initiator?.id || '',
      initiatorName: item.initiator?.displayName || '',
      ownerId: item.owner?.id || '',
      ownerName: item.owner?.displayName || '',
      assignedDepartment: item.departmentName || '',
      rootCauseAnalysis: item.rootCauseAnalysis ? {
        method: item.rootCauseAnalysis.method as RcaMethod,
        description: item.rootCauseAnalysis.description || '',
        rootCauses: item.rootCauseAnalysis.rootCauses || [],
        contributingFactors: item.rootCauseAnalysis.contributingFactors || [],
        fiveWhyAnalysis: item.rootCauseAnalysis.fiveWhyEntries || [],
        completedDate: item.rootCauseAnalysis.completedDate ? this.toDate(item.rootCauseAnalysis.completedDate) : undefined,
        completedBy: item.rootCauseAnalysis.completedBy?.displayName,
      } : undefined,
      riskAssessment: item.riskAssessment ? {
        severity: item.riskAssessment.severity || 0,
        occurrence: item.riskAssessment.occurrence || 0,
        detection: item.riskAssessment.detection || 0,
        rpn: item.riskAssessment.rpn || 0,
        riskLevel: item.riskAssessment.riskLevel,
        justification: item.riskAssessment.justification || '',
      } : undefined,
      correctiveActions: actions.filter((action: any) => action.type === 'CORRECTIVE').map((action: any) => this.toAction(action)),
      preventiveActions: actions.filter((action: any) => action.type === 'PREVENTIVE').map((action: any) => this.toAction(action)),
      effectivenessCheck: item.effectivenessChecks?.[0] ? {
        criteria: item.effectivenessChecks[0].criteria || '',
        checkDate: this.toDate(item.effectivenessChecks[0].checkDate),
        result: item.effectivenessChecks[0].result,
        evidence: item.effectivenessChecks[0].evidence || '',
        verifiedBy: item.effectivenessChecks[0].verifiedBy?.displayName || '',
        comments: item.effectivenessChecks[0].comments || '',
        requiresRecurrence: item.effectivenessChecks[0].requiresRecurrence ?? false,
        recurrenceMonths: item.effectivenessChecks[0].recurrenceMonths,
      } : undefined,
      auditTrail: [],
      currentWorkflowStep: item.currentWorkflowStep || '',
      workflowHistory: [],
      createdAt: this.toDate(item.createdAt),
      updatedAt: this.toDate(item.updatedAt),
      closedAt: item.actualCompletionDate ? this.toDate(item.actualCompletionDate) : undefined,
      plantSite: item.plantSiteName || '',
      department: item.departmentName || '',
      product: item.product,
      batchNumber: item.batchNumber,
    };
  }

  private toWorkflowSteps(history: ApiWorkflowHistory[], template: string[], currentStep?: string): WorkflowStep[] {
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

  private toWorkflowStep(step: ApiWorkflowHistory | undefined, fallbackName: string, currentStep?: string): WorkflowStep {
    const status = (step?.status || (this.normalizeStepName(fallbackName) === this.normalizeStepName(currentStep || '') ? 'CURRENT' : 'PENDING')) as WorkflowStep['status'];
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

  private toAction(action: any): CapaAction {
    return {
      id: action.id,
      actionNumber: action.actionNumber,
      description: action.description,
      type: action.type,
      status: action.status as ActionStatus,
      assignedTo: action.assignedTo?.id || '',
      assignedToName: action.assignedTo?.displayName || '',
      dueDate: this.toDate(action.dueDate),
      completedDate: action.completedDate ? this.toDate(action.completedDate) : undefined,
      evidence: action.evidence,
      verifiedBy: action.verifiedBy?.displayName,
      verifiedDate: action.verifiedDate ? this.toDate(action.verifiedDate) : undefined,
    };
  }

  private toDashboardMetrics(data: any): CapaDashboardMetrics {
    return {
      totalOpen: data.openCapas ?? 0,
      totalOverdue: data.overdueCapas ?? 0,
      totalClosedThisMonth: data.closedCapas ?? 0,
      totalInitiatedThisMonth: data.totalCapas ?? 0,
      avgClosureTimeDays: 0,
      effectivenessRate: 0,
      byStatus: this.toCountArray<CapaStatus>(data.byStatus, 'status'),
      byPriority: this.toCountArray<CapaPriority>(data.byPriority, 'priority'),
      byDepartment: Object.entries(data.byDepartment || {}).map(([department, count]) => ({ department, count: Number(count) })),
      trendData: [{ month: 'Current', initiated: data.totalCapas ?? 0, closed: data.closedCapas ?? 0 }],
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
      'R&D': 'c0000000-0000-0000-0000-000000000007',
      'Research & Development': 'c0000000-0000-0000-0000-000000000007',
    };
    return departments[name || ''] || departments['Quality Assurance'];
  }

  private resolveUserId(name?: string): string {
    const users: Record<string, string> = {
      'Rajesh Kumar': 'd0000000-0000-0000-0000-000000000001',
      'Priya Sharma': 'd0000000-0000-0000-0000-000000000003',
      'Suresh Reddy': 'd0000000-0000-0000-0000-000000000004',
      'Anitha Rao': 'd0000000-0000-0000-0000-000000000005',
      'Lakshmi Devi': 'd0000000-0000-0000-0000-000000000006',
      'Venkat Rao': 'd0000000-0000-0000-0000-000000000007',
      'Mohammad Ali': 'd0000000-0000-0000-0000-000000000008',
      'Kavitha Reddy': 'd0000000-0000-0000-0000-000000000009',
    };
    return users[name || ''] || users['Anitha Rao'];
  }

  private generateMockData(): Capa[] {
    return [
      {
        id: 'CAPA-001',
        capaNumber: 'CAPA-2025-001',
        title: 'OOS Result - Dissolution Test Batch PX-2025-045',
        description:
          'Out of specification result observed during routine dissolution testing for Batch PX-2025-045 of Paracetamol 500mg tablets. Stage 2 testing showed 72% dissolution at 30 minutes against specification of NLT 80%.',
        type: CapaType.BOTH,
        status: CapaStatus.INVESTIGATION,
        priority: CapaPriority.HIGH,
        sourceType: CapaSourceType.OOS_RESULT,
        sourceReference: 'DEV-2025-023',
        initiatedDate: daysAgo(37),
        targetCompletionDate: daysFromNow(24),
        dueDate: daysFromNow(24),
        initiatorId: 'USR-003',
        initiatorName: 'Priya Sharma',
        ownerId: 'USR-005',
        ownerName: 'Rajesh Kumar',
        assignedDepartment: 'Quality Control',
        rootCauseAnalysis: {
          method: RcaMethod.FIVE_WHY,
          description: 'Investigation into dissolution failure',
          rootCauses: ['Granulation moisture content exceeded limits'],
          contributingFactors: [
            'Humidity control system maintenance overdue',
            'SOP not followed for in-process checks',
          ],
          fiveWhyAnalysis: [
            { level: 1, question: 'Why did dissolution fail?', answer: 'Tablet hardness was too high' },
            { level: 2, question: 'Why was hardness too high?', answer: 'Granulation was over-dried then over-compressed' },
            { level: 3, question: 'Why was granulation over-dried?', answer: 'Moisture sensor was giving incorrect readings' },
            { level: 4, question: 'Why was moisture sensor incorrect?', answer: 'Calibration was overdue by 2 weeks' },
            { level: 5, question: 'Why was calibration overdue?', answer: 'Preventive maintenance schedule not tracked properly' },
          ],
        },
        riskAssessment: {
          severity: 4,
          occurrence: 3,
          detection: 2,
          rpn: 24,
          riskLevel: 'HIGH',
          justification: 'Product quality affected, patient safety risk. Detected during QC testing before release.',
        },
        correctiveActions: [
          {
            id: 'CA-001', actionNumber: 'CA-2025-001',
            description: 'Replace moisture sensor in FBD-03 and recalibrate',
            type: 'CORRECTIVE', status: ActionStatus.COMPLETED,
            assignedTo: 'USR-008', assignedToName: 'Venkat Rao',
            dueDate: daysAgo(20), completedDate: daysAgo(23),
            evidence: 'Calibration certificate CAL-2025-156 attached',
            verifiedBy: 'Priya Sharma', verifiedDate: daysAgo(22),
          },
          {
            id: 'CA-002', actionNumber: 'CA-2025-002',
            description: 'Quarantine and reprocess affected batch per SOP-PRD-045',
            type: 'CORRECTIVE', status: ActionStatus.IN_PROGRESS,
            assignedTo: 'USR-010', assignedToName: 'Suresh Reddy',
            dueDate: daysFromNow(7),
          },
        ],
        preventiveActions: [
          {
            id: 'PA-001', actionNumber: 'PA-2025-001',
            description: 'Implement automated calibration tracking system with escalation alerts',
            type: 'PREVENTIVE', status: ActionStatus.PENDING,
            assignedTo: 'USR-012', assignedToName: 'Anil Prasad',
            dueDate: daysFromNow(18),
          },
          {
            id: 'PA-002', actionNumber: 'PA-2025-002',
            description: 'Revise SOP-QC-012 to include mandatory pre-use verification of moisture sensors',
            type: 'PREVENTIVE', status: ActionStatus.PENDING,
            assignedTo: 'USR-005', assignedToName: 'Rajesh Kumar',
            dueDate: daysFromNow(10),
          },
        ],
        auditTrail: [
          { id: 'AT-001', timestamp: daysAgo(37), userId: 'USR-003', userName: 'Priya Sharma', action: 'CAPA Initiated', comments: 'Initiated based on OOS result from DEV-2025-023' },
          { id: 'AT-002', timestamp: daysAgo(36), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'Status Changed', field: 'status', oldValue: 'INITIATED', newValue: 'UNDER_REVIEW' },
          { id: 'AT-003', timestamp: daysAgo(35), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'Assigned Owner', field: 'ownerId', newValue: 'Rajesh Kumar' },
        ],
        currentWorkflowStep: 'Investigation',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', assignedTo: 'Priya Sharma', startedAt: daysAgo(37), completedAt: daysAgo(37) },
          { stepName: 'Review & Assignment', status: 'COMPLETED', assignedTo: 'Dr. Ramesh Iyer', startedAt: daysAgo(36), completedAt: daysAgo(35) },
          { stepName: 'Investigation', status: 'CURRENT', assignedTo: 'Rajesh Kumar', startedAt: daysAgo(35) },
          { stepName: 'Action Planning', status: 'PENDING' },
          { stepName: 'Implementation', status: 'PENDING' },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(37),
        updatedAt: daysAgo(5),
        plantSite: 'Hyderabad Unit-1',
        department: 'Quality Control',
        product: 'Paracetamol 500mg Tablets',
        batchNumber: 'PX-2025-045',
      },
      {
        id: 'CAPA-002',
        capaNumber: 'CAPA-2025-002',
        title: 'FDA 483 Observation - Inadequate Environmental Monitoring',
        description:
          'During FDA inspection, observation cited regarding inadequate environmental monitoring frequency in sterile manufacturing area. Current monitoring frequency does not meet FDA expectations for Grade A zones.',
        type: CapaType.BOTH,
        status: CapaStatus.ACTION_IN_PROGRESS,
        priority: CapaPriority.CRITICAL,
        sourceType: CapaSourceType.REGULATORY_OBSERVATION,
        sourceReference: 'FDA-483-OBS-03',
        initiatedDate: daysAgo(60),
        targetCompletionDate: daysFromNow(5),
        dueDate: daysFromNow(5),
        initiatorId: 'USR-001',
        initiatorName: 'Dr. Ramesh Iyer',
        ownerId: 'USR-002',
        ownerName: 'Lakshmi Devi',
        assignedDepartment: 'Quality Assurance',
        correctiveActions: [
          {
            id: 'CA-003', actionNumber: 'CA-2025-003',
            description: 'Increase viable and non-viable monitoring frequency in Grade A zones to continuous monitoring',
            type: 'CORRECTIVE', status: ActionStatus.COMPLETED,
            assignedTo: 'USR-015', assignedToName: 'Sridhar Rao',
            dueDate: daysAgo(30), completedDate: daysAgo(35),
          },
        ],
        preventiveActions: [
          {
            id: 'PA-003', actionNumber: 'PA-2025-003',
            description: 'Install real-time continuous particle monitoring system in all Grade A/B areas',
            type: 'PREVENTIVE', status: ActionStatus.IN_PROGRESS,
            assignedTo: 'USR-020', assignedToName: 'Mahesh Patil',
            dueDate: daysFromNow(5),
          },
        ],
        auditTrail: [
          { id: 'AT-010', timestamp: daysAgo(60), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'CAPA Initiated', comments: 'Critical - FDA 483 observation response required within 15 business days' },
        ],
        currentWorkflowStep: 'Implementation',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', startedAt: daysAgo(60), completedAt: daysAgo(60) },
          { stepName: 'Investigation', status: 'COMPLETED', startedAt: daysAgo(59), completedAt: daysAgo(52) },
          { stepName: 'Implementation', status: 'CURRENT', startedAt: daysAgo(50) },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(60),
        updatedAt: daysAgo(3),
        plantSite: 'Hyderabad Unit-2',
        department: 'Quality Assurance',
        product: 'Injectable Formulations',
      },
      {
        id: 'CAPA-003',
        capaNumber: 'CAPA-2025-003',
        title: 'Recurring Customer Complaint - Tablet Color Variation',
        description:
          'Three customer complaints received regarding color variation in Metformin 500mg tablets. Visual inspection reveals slight yellow discoloration in tablets from edge of compression zone.',
        type: CapaType.PREVENTIVE,
        status: CapaStatus.INITIATED,
        priority: CapaPriority.MEDIUM,
        sourceType: CapaSourceType.COMPLAINT,
        sourceReference: 'COMPLAINT-2025-018, COMPLAINT-2025-022, COMPLAINT-2025-031',
        initiatedDate: daysAgo(5),
        targetCompletionDate: daysFromNow(55),
        dueDate: daysFromNow(55),
        initiatorId: 'USR-007',
        initiatorName: 'Kavitha Reddy',
        ownerId: 'USR-007',
        ownerName: 'Kavitha Reddy',
        assignedDepartment: 'Production',
        correctiveActions: [],
        preventiveActions: [],
        auditTrail: [
          { id: 'AT-020', timestamp: daysAgo(5), userId: 'USR-007', userName: 'Kavitha Reddy', action: 'CAPA Initiated', comments: 'Recurring complaint pattern identified - 3 similar complaints in 3 months' },
        ],
        currentWorkflowStep: 'Initiation',
        workflowHistory: [
          { stepName: 'Initiation', status: 'CURRENT', assignedTo: 'Kavitha Reddy', startedAt: daysAgo(5) },
          { stepName: 'Review & Assignment', status: 'PENDING' },
          { stepName: 'Investigation', status: 'PENDING' },
          { stepName: 'Action Planning', status: 'PENDING' },
          { stepName: 'Implementation', status: 'PENDING' },
          { stepName: 'Effectiveness Check', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5),
        plantSite: 'Hyderabad Unit-1',
        department: 'Production',
        product: 'Metformin 500mg Tablets',
        batchNumber: 'MF-2025-112',
      },
      {
        id: 'CAPA-004',
        capaNumber: 'CAPA-2025-004',
        title: 'Training Gap - Deviation in Aseptic Gowning Procedure',
        description:
          'Environmental monitoring excursion traced to improper gowning technique by newly trained operator. Gap identified in training effectiveness verification.',
        type: CapaType.CORRECTIVE,
        status: CapaStatus.EFFECTIVENESS_CHECK,
        priority: CapaPriority.HIGH,
        sourceType: CapaSourceType.DEVIATION,
        sourceReference: 'DEV-2025-019',
        initiatedDate: daysAgo(90),
        targetCompletionDate: daysAgo(10),
        dueDate: daysAgo(10),
        initiatorId: 'USR-002',
        initiatorName: 'Lakshmi Devi',
        ownerId: 'USR-018',
        ownerName: 'Ravi Teja',
        assignedDepartment: 'Production',
        correctiveActions: [
          {
            id: 'CA-010', actionNumber: 'CA-2025-010',
            description: 'Retrain all sterile area operators on updated gowning SOP',
            type: 'CORRECTIVE', status: ActionStatus.VERIFIED,
            assignedTo: 'USR-018', assignedToName: 'Ravi Teja',
            dueDate: daysAgo(60), completedDate: daysAgo(63),
            verifiedBy: 'Lakshmi Devi', verifiedDate: daysAgo(61),
          },
        ],
        preventiveActions: [
          {
            id: 'PA-010', actionNumber: 'PA-2025-010',
            description: 'Implement video-based training assessment with scoring rubric',
            type: 'PREVENTIVE', status: ActionStatus.VERIFIED,
            assignedTo: 'USR-025', assignedToName: 'Sunita Rani',
            dueDate: daysAgo(50), completedDate: daysAgo(53),
            verifiedBy: 'Dr. Ramesh Iyer', verifiedDate: daysAgo(49),
          },
        ],
        effectivenessCheck: {
          criteria: 'No gowning-related excursions for 60 days post-training',
          checkDate: daysAgo(7),
          result: 'EFFECTIVE',
          evidence: 'EM data review - zero excursions for 60+ days post-training',
          verifiedBy: 'Dr. Ramesh Iyer',
          comments: 'Training program effective. Recommend quarterly re-assessment.',
          requiresRecurrence: true,
          recurrenceMonths: 3,
        },
        auditTrail: [],
        currentWorkflowStep: 'Effectiveness Check',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', completedAt: daysAgo(90) },
          { stepName: 'Investigation', status: 'COMPLETED', completedAt: daysAgo(80) },
          { stepName: 'Implementation', status: 'COMPLETED', completedAt: daysAgo(49) },
          { stepName: 'Effectiveness Check', status: 'CURRENT', startedAt: daysAgo(7) },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(90),
        updatedAt: daysAgo(7),
        plantSite: 'Hyderabad Unit-2',
        department: 'Production',
        product: 'Injectable Formulations',
      },
      {
        id: 'CAPA-005',
        capaNumber: 'CAPA-2025-005',
        title: 'Supplier Quality Issue - Raw Material Assay Failure',
        description:
          'API supplier delivered batch with assay value at 97.8% against specification of 98.0-102.0%. Material rejected at incoming QC.',
        type: CapaType.BOTH,
        status: CapaStatus.PENDING_CLOSURE,
        priority: CapaPriority.MEDIUM,
        sourceType: CapaSourceType.DEVIATION,
        sourceReference: 'DEV-2025-025',
        initiatedDate: daysAgo(120),
        targetCompletionDate: daysAgo(30),
        dueDate: daysAgo(30),
        initiatorId: 'USR-009',
        initiatorName: 'Deepak Joshi',
        ownerId: 'USR-009',
        ownerName: 'Deepak Joshi',
        assignedDepartment: 'Warehouse',
        correctiveActions: [
          {
            id: 'CA-015', actionNumber: 'CA-2025-015',
            description: 'Issue non-conformance report to supplier and request CAPA',
            type: 'CORRECTIVE', status: ActionStatus.VERIFIED,
            assignedTo: 'USR-009', assignedToName: 'Deepak Joshi',
            dueDate: daysAgo(100), completedDate: daysAgo(105),
            verifiedBy: 'Dr. Ramesh Iyer', verifiedDate: daysAgo(100),
          },
        ],
        preventiveActions: [
          {
            id: 'PA-015', actionNumber: 'PA-2025-015',
            description: 'Implement supplier performance scorecard with quarterly review',
            type: 'PREVENTIVE', status: ActionStatus.VERIFIED,
            assignedTo: 'USR-009', assignedToName: 'Deepak Joshi',
            dueDate: daysAgo(80), completedDate: daysAgo(83),
            verifiedBy: 'Dr. Ramesh Iyer', verifiedDate: daysAgo(79),
          },
        ],
        auditTrail: [],
        currentWorkflowStep: 'Pending Closure',
        workflowHistory: [
          { stepName: 'Initiation', status: 'COMPLETED', completedAt: daysAgo(120) },
          { stepName: 'Investigation', status: 'COMPLETED', completedAt: daysAgo(105) },
          { stepName: 'Implementation', status: 'COMPLETED', completedAt: daysAgo(79) },
          { stepName: 'Effectiveness Check', status: 'COMPLETED', completedAt: daysAgo(50) },
          { stepName: 'Closure', status: 'CURRENT', startedAt: daysAgo(49) },
        ],
        createdAt: daysAgo(120),
        updatedAt: daysAgo(49),
        plantSite: 'Hyderabad Unit-1',
        department: 'Warehouse',
        product: 'Metformin API',
        batchNumber: 'API-SUP-2025-078',
      },
    ];
  }

  private generateId(): string {
    return 'id-' + Math.random().toString(36).substring(2, 11);
  }

  private generateCapaNumber(): string {
    return `CAPA-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }
}
