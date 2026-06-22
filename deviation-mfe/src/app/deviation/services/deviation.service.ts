import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
  Deviation,
  DeviationStatus,
  DeviationClassification,
  DeviationCategory,
  DeviationType,
  ImpactLevel,
  DispositionDecision,
  DeviationAttachment,
  DeviationWorkflowStep,
  DeviationDashboardMetrics,
  DeviationListFilter,
} from '../models/deviation.model';

const API_BASE_URL = 'http://localhost:8082/api/v1';

type ApiPage<T> = {
  content?: T[];
};

type ApiDeviation = any;
type ApiWorkflowHistory = any;
type ApiAttachment = any;

const DEVIATION_WORKFLOW_TEMPLATE = [
  'Reported',
  'QA Review & Classification',
  'Investigation',
  'Impact Assessment',
  'Disposition',
  'CAPA Initiation',
  'Pending Closure',
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
export class DeviationService {
  private readonly apiUrl = `${API_BASE_URL}/deviations`;

  constructor(private http: HttpClient) {}

  getDeviations(filter?: DeviationListFilter): Observable<Deviation[]> {
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '100')
      .set('sort', 'createdAt,desc');

    filter?.status?.forEach((status) => (params = params.append('status', status)));
    filter?.classification?.forEach((classification) => (params = params.append('classification', classification)));
    filter?.category?.forEach((category) => (params = params.append('category', category)));
    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.search) params = params.set('search', filter.search);

    return this.http
      .get<ApiPage<ApiDeviation>>(this.apiUrl, { headers: this.authHeaders(), params })
      .pipe(map((page) => (page.content || []).map((item) => this.toDeviation(item))));
  }

  getDeviationById(id: string): Observable<Deviation | undefined> {
    const params = new HttpParams().set('_ts', Date.now().toString());
    return this.http
      .get<ApiDeviation>(`${this.apiUrl}/${id}`, { headers: this.authHeaders(), params })
      .pipe(
        map((item) => this.toDeviation(item)),
        switchMap((deviation) =>
          this.getWorkflowHistory(id).pipe(
            map((history) => ({
              ...deviation,
              workflowHistory: this.toWorkflowSteps(history, DEVIATION_WORKFLOW_TEMPLATE, deviation.currentWorkflowStep),
            })),
            catchError(() => of({
              ...deviation,
              workflowHistory: this.toWorkflowSteps([], DEVIATION_WORKFLOW_TEMPLATE, deviation.currentWorkflowStep),
            }))
          )
        ),
        switchMap((deviation) =>
          this.getAttachments(id).pipe(
            map((attachments) => ({ ...deviation, attachments })),
            catchError(() => of({ ...deviation, attachments: [] }))
          )
        )
      );
  }

  createDeviation(deviation: Partial<Deviation>): Observable<Deviation> {
    const payload = {
      title: deviation.title,
      description: deviation.description,
      type: deviation.type,
      category: deviation.category,
      occurredDate: this.toIso(deviation.occurredDate),
      detectedDate: this.toIso(deviation.detectedDate),
      targetClosureDate: this.toIso(deviation.targetClosureDate),
      plantSiteId: this.resolvePlantSiteId((deviation as any).plantSite),
      departmentId: this.resolveDepartmentId((deviation as any).department),
      area: deviation.area,
      equipment: deviation.equipment,
      product: deviation.product,
      batchNumber: deviation.batchNumber,
      batchSize: deviation.batchSize,
      affectedBatches: deviation.affectedBatches || [],
      gmpImpact: deviation.gmpImpact ?? false,
      patientSafetyImpact: deviation.patientSafetyImpact ?? false,
      regulatoryImpact: deviation.regulatoryImpact ?? false,
      sourceArea: deviation.sourceArea,
    };

    return this.http
      .post<ApiDeviation>(this.apiUrl, payload, { headers: this.authHeaders() })
      .pipe(map((item) => this.toDeviation(item)));
  }

  updateDeviation(id: string, deviation: Partial<Deviation>): Observable<Deviation> {
    const payload = {
      title: deviation.title,
      description: deviation.description,
      type: deviation.type,
      category: deviation.category,
      targetClosureDate: this.toIso(deviation.targetClosureDate),
      assignedToId: this.resolveUserId((deviation as any).assignedToName),
      area: deviation.area,
      equipment: deviation.equipment,
      product: deviation.product,
      batchNumber: deviation.batchNumber,
      gmpImpact: deviation.gmpImpact ?? false,
      patientSafetyImpact: deviation.patientSafetyImpact ?? false,
      regulatoryImpact: deviation.regulatoryImpact ?? false,
    };

    return this.http
      .put<ApiDeviation>(`${this.apiUrl}/${id}`, payload, { headers: this.authHeaders() })
      .pipe(
        switchMap(() => this.getDeviationById(id)),
        map((item) => {
          if (!item) {
            throw new Error('Deviation was updated but could not be reloaded');
          }
          return item;
        })
      );
  }

  updateDeviationStatus(id: string, status: DeviationStatus): Observable<Deviation> {
    return this.http
      .patch<ApiDeviation>(
        `${this.apiUrl}/${id}/status`,
        { status, comments: `Status changed to ${status}` },
        { headers: this.authHeaders() }
      )
      .pipe(map((item) => this.toDeviation(item)));
  }

  getDashboardMetrics(): Observable<DeviationDashboardMetrics> {
    return this.http
      .get<Record<string, any>>(`${API_BASE_URL}/dashboard/deviation-metrics`, { headers: this.authHeaders() })
      .pipe(map((data) => this.toDashboardMetrics(data)));
  }

  getWorkflowHistory(id: string): Observable<ApiWorkflowHistory[]> {
    return this.http.get<ApiWorkflowHistory[]>(`${this.apiUrl}/${id}/workflow-history`, { headers: this.authHeaders() });
  }

  submitInvestigation(
    id: string,
    investigation: {
      investigatorId: string;
      probableCause?: string;
      rootCause?: string;
      immediateActions?: string[];
      findings?: string;
      conclusion?: string;
      method?: string;
    }
  ): Observable<Deviation> {
    return this.http
      .post<ApiDeviation>(`${this.apiUrl}/${id}/investigation`, investigation, { headers: this.authHeaders() })
      .pipe(
        switchMap(() => this.getDeviationById(id)),
        map((item) => {
          if (!item) {
            throw new Error('Investigation was saved but deviation could not be reloaded');
          }
          return item;
        })
      );
  }

  submitImpactAssessment(id: string, assessment: {
    productQualityImpact: string;
    patientSafetyImpact: string;
    regulatoryImpact: string;
    businessImpact: string;
    overallRiskLevel: string;
    affectedProducts?: string[];
    affectedBatches?: string[];
    batchDisposition?: string;
    justification: string;
  }): Observable<Deviation> {
    return this.http
      .post<ApiDeviation>(`${this.apiUrl}/${id}/impact-assessment`, assessment, { headers: this.authHeaders() })
      .pipe(
        switchMap(() => this.getDeviationById(id)),
        map((item) => {
          if (!item) throw new Error('Impact assessment was saved but deviation could not be reloaded');
          return item;
        })
      );
  }

  submitDisposition(id: string, disposition: {
    decision: string;
    justification: string;
    conditions?: string;
    qaReviewComments?: string;
    capaRequired?: boolean;
    electronicSignature?: { password: string; meaning: string };
  }): Observable<Deviation> {
    return this.http
      .post<ApiDeviation>(`${this.apiUrl}/${id}/disposition`, disposition, { headers: this.authHeaders() })
      .pipe(
        switchMap(() => this.getDeviationById(id)),
        map((item) => {
          if (!item) throw new Error('Disposition was saved but deviation could not be reloaded');
          return item;
        })
      );
  }

  getAttachments(id: string): Observable<DeviationAttachment[]> {
    const params = new HttpParams()
      .set('recordType', 'DEVIATION')
      .set('recordId', id);

    return this.http
      .get<ApiAttachment[]>(`${API_BASE_URL}/attachments`, { headers: this.authHeaders(), params })
      .pipe(map((items) => (items || []).map((item) => this.toAttachment(item))));
  }

  uploadAttachment(id: string, file: File, category?: string, description?: string): Observable<DeviationAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recordType', 'DEVIATION');
    formData.append('recordId', id);
    if (category) formData.append('category', category);
    if (description) formData.append('description', description);

    return this.http
      .post<ApiAttachment>(`${API_BASE_URL}/attachments`, formData, { headers: this.authHeaders() })
      .pipe(map((item) => this.toAttachment(item)));
  }

  getAttachmentDownloadUrl(attachmentId: string): Observable<string> {
    return this.http
      .get<{ url: string }>(`${API_BASE_URL}/attachments/${attachmentId}/download`, { headers: this.authHeaders() })
      .pipe(map((response) => response.url));
  }

  deleteAttachment(attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/attachments/${attachmentId}`, { headers: this.authHeaders() });
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

  private toDeviation(item: ApiDeviation): Deviation {
    return {
      id: item.id,
      deviationNumber: item.deviationNumber,
      title: item.title,
      description: item.description,
      type: item.type as DeviationType,
      category: item.category as DeviationCategory,
      classification: (item.classification || DeviationClassification.MINOR) as DeviationClassification,
      status: item.status as DeviationStatus,
      sourceArea: item.sourceArea || '',
      occurredDate: this.toDate(item.occurredDate),
      reportedDate: this.toDate(item.reportedDate),
      detectedDate: this.toDate(item.detectedDate),
      targetClosureDate: this.toDate(item.targetClosureDate),
      actualClosureDate: item.actualClosureDate ? this.toDate(item.actualClosureDate) : undefined,
      reportedById: item.reportedBy?.id || '',
      reportedByName: item.reportedBy?.displayName || '',
      assignedToId: item.assignedTo?.id || '',
      assignedToName: item.assignedTo?.displayName || '',
      reviewerId: item.reviewer?.id,
      reviewerName: item.reviewer?.displayName,
      approvedById: item.approvedBy?.id,
      approvedByName: item.approvedBy?.displayName,
      plantSite: item.plantSiteName || '',
      department: item.departmentName || '',
      area: item.area || '',
      equipment: item.equipment,
      product: item.product,
      batchNumber: item.batchNumber,
      batchSize: item.batchSize,
      affectedBatches: (item.affectedBatches || []).map((batch: any) => (typeof batch === 'string' ? batch : batch.batchNumber)),
      gmpImpact: item.gmpImpact ?? false,
      patientSafetyImpact: item.patientSafetyImpact ?? false,
      regulatoryImpact: item.regulatoryImpact ?? false,
      investigation: item.investigation ? {
        investigatorId: item.investigation.investigator?.id || '',
        investigatorName: item.investigation.investigator?.displayName || '',
        startDate: this.toDate(item.investigation.startDate),
        completedDate: item.investigation.completedDate ? this.toDate(item.investigation.completedDate) : undefined,
        probableCause: item.investigation.probableCause || '',
        rootCause: item.investigation.rootCause || '',
        immediateActions: item.investigation.immediateActions || [],
        findings: item.investigation.findings || '',
        conclusion: item.investigation.conclusion || '',
        method: item.investigation.method || '',
      } : undefined,
      impactAssessment: item.impactAssessment ? {
        productQualityImpact: item.impactAssessment.productQualityImpact,
        patientSafetyImpact: item.impactAssessment.patientSafetyImpact,
        regulatoryImpact: item.impactAssessment.regulatoryImpact,
        businessImpact: item.impactAssessment.businessImpact,
        overallRiskLevel: item.impactAssessment.overallRiskLevel,
        affectedProducts: item.impactAssessment.affectedProducts || [],
        affectedBatches: item.impactAssessment.affectedBatches || [],
        batchDisposition: item.impactAssessment.batchDisposition || '',
        justification: item.impactAssessment.justification || '',
        assessedBy: item.impactAssessment.assessedBy?.displayName || '',
        assessedDate: this.toDate(item.impactAssessment.assessedDate),
      } : undefined,
      disposition: item.disposition ? {
        decision: item.disposition.decision,
        justification: item.disposition.justification || '',
        conditions: item.disposition.conditions,
        approvedBy: item.disposition.approvedBy?.displayName || '',
        approvedDate: this.toDate(item.disposition.approvedDate),
        qaReviewComments: item.disposition.qaReviewComments || '',
      } : undefined,
      capaRequired: item.capaRequired ?? false,
      capaReference: item.capaNumber,
      auditTrail: [],
      currentWorkflowStep: item.currentWorkflowStep || '',
      workflowHistory: [],
      createdAt: this.toDate(item.createdAt),
      updatedAt: this.toDate(item.updatedAt),
      attachments: [],
    };
  }

  private toWorkflowSteps(history: ApiWorkflowHistory[], template: string[], currentStep?: string): DeviationWorkflowStep[] {
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

  private toWorkflowStep(step: ApiWorkflowHistory | undefined, fallbackName: string, currentStep?: string): DeviationWorkflowStep {
    const status = (step?.status || (this.normalizeStepName(fallbackName) === this.normalizeStepName(currentStep || '') ? 'CURRENT' : 'PENDING')) as DeviationWorkflowStep['status'];
    return {
      stepName: step?.stepName || fallbackName,
      status,
      assignedTo: step?.assignedTo?.displayName,
      startedAt: step?.startedAt ? this.toDate(step.startedAt) : undefined,
      completedAt: step?.completedAt ? this.toDate(step.completedAt) : undefined,
      comments: step?.comments,
    };
  }

  private toAttachment(item: ApiAttachment): DeviationAttachment {
    return {
      id: item.id,
      fileName: item.fileName,
      fileType: item.fileType || '',
      fileSize: item.fileSize || 0,
      uploadedBy: item.uploadedBy?.displayName || '',
      uploadedDate: this.toDate(item.uploadedDate),
      category: item.category,
      description: item.description,
    };
  }

  private normalizeStepName(value: string): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private toDashboardMetrics(data: any): DeviationDashboardMetrics {
    return {
      totalOpen: data.openDeviations ?? 0,
      totalOverdue: data.overdueDeviations ?? 0,
      totalReportedThisMonth: data.totalDeviations ?? 0,
      totalClosedThisMonth: data.closedDeviations ?? 0,
      avgClosureTimeDays: 0,
      criticalOpen: data.byClassification?.CRITICAL ?? 0,
      capaConversionRate: 0,
      byStatus: this.toCountArray<DeviationStatus>(data.byStatus, 'status'),
      byClassification: this.toCountArray<DeviationClassification>(data.byClassification, 'classification'),
      byCategory: this.toCountArray<DeviationCategory>(data.byCategory, 'category'),
      byDepartment: Object.entries(data.byDepartment || {}).map(([department, count]) => ({ department, count: Number(count) })),
      trendData: [{ month: 'Current', reported: data.totalDeviations ?? 0, closed: data.closedDeviations ?? 0 }],
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

  private resolveUserId(name?: string): string | null {
    const users: Record<string, string> = {
      'Rajesh Kumar': 'd0000000-0000-0000-0000-000000000001',
      'Priya Sharma': 'd0000000-0000-0000-0000-000000000002',
      'Lakshmi Devi': 'd0000000-0000-0000-0000-000000000003',
      'Kavitha Reddy': 'd0000000-0000-0000-0000-000000000004',
      'Deepak Joshi': 'd0000000-0000-0000-0000-000000000005',
      'Mahesh Patil': 'd0000000-0000-0000-0000-000000000006',
    };
    return users[name || ''] || null;
  }

  private generateMockData(): Deviation[] {
    return [
      {
        id: 'DEV-001',
        deviationNumber: 'DEV-2025-023',
        title: 'Temperature Excursion in Cold Storage Room CSR-02',
        description:
          'During routine monitoring at 06:00 hrs, temperature in Cold Storage Room CSR-02 was recorded at 9.2°C against the specified range of 2-8°C. The excursion lasted approximately 3.5 hours (02:30 to 06:00 hrs). Total 14 products stored in CSR-02 were affected. The refrigeration unit alarm system failed to trigger alert at the 8°C threshold.',
        type: DeviationType.UNPLANNED,
        category: DeviationCategory.EQUIPMENT,
        classification: DeviationClassification.CRITICAL,
        status: DeviationStatus.INVESTIGATION,
        sourceArea: 'Cold Storage',
        occurredDate: daysAgo(11),
        reportedDate: daysAgo(11),
        detectedDate: daysAgo(11),
        targetClosureDate: daysFromNow(19),
        reportedById: 'USR-014',
        reportedByName: 'Naresh Babu',
        assignedToId: 'USR-005',
        assignedToName: 'Rajesh Kumar',
        reviewerId: 'USR-001',
        reviewerName: 'Dr. Ramesh Iyer',
        plantSite: 'Hyderabad Unit-1',
        department: 'Warehouse',
        area: 'Cold Storage Room CSR-02',
        equipment: 'Refrigeration Unit RU-CSR-02',
        product: 'Multiple Products',
        batchNumber: 'Multiple',
        affectedBatches: ['INS-2025-034', 'INS-2025-036', 'VAC-2025-012'],
        gmpImpact: true,
        patientSafetyImpact: true,
        regulatoryImpact: true,
        investigation: {
          investigatorId: 'USR-005',
          investigatorName: 'Rajesh Kumar',
          startDate: daysAgo(10),
          probableCause: 'Compressor failure in refrigeration unit RU-CSR-02',
          rootCause: 'Compressor motor bearing failure due to lack of preventive maintenance. PM was overdue by 3 weeks.',
          immediateActions: [
            'All affected products moved to backup cold storage CSR-03',
            'Emergency repair initiated on RU-CSR-02 compressor',
            'All affected batches quarantined pending stability assessment',
            'Temperature monitoring increased to every 30 minutes for CSR-03',
          ],
          findings: 'The compressor motor bearing in RU-CSR-02 had degraded, causing intermittent cooling failure. The alarm system threshold was incorrectly configured at 10°C instead of 8°C after the last system update.',
          conclusion: 'Root cause is dual: mechanical failure from missed PM and alarm misconfiguration. Corrective actions needed for both equipment maintenance and alarm system validation.',
          method: 'Five-Why Analysis',
        },
        impactAssessment: {
          productQualityImpact: ImpactLevel.HIGH,
          patientSafetyImpact: ImpactLevel.MEDIUM,
          regulatoryImpact: ImpactLevel.HIGH,
          businessImpact: ImpactLevel.HIGH,
          overallRiskLevel: 'CRITICAL',
          affectedProducts: ['Insulin Injection', 'Hepatitis-B Vaccine'],
          affectedBatches: ['INS-2025-034', 'INS-2025-036', 'VAC-2025-012'],
          batchDisposition: 'Quarantined pending accelerated stability study results',
          justification: 'Temperature excursion beyond validated range for cold chain products. Stability data review required per ICH Q1A guidelines.',
          assessedBy: 'Dr. Ramesh Iyer',
          assessedDate: daysAgo(9),
        },
        capaRequired: true,
        capaReference: 'CAPA-2025-001',
        auditTrail: [
          { id: 'AT-D-001', timestamp: daysAgo(11), userId: 'USR-014', userName: 'Naresh Babu', action: 'Deviation Reported', comments: 'Temperature excursion detected during routine morning check' },
          { id: 'AT-D-002', timestamp: daysAgo(11), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'Immediate Action Taken', comments: 'Products moved to backup cold storage. All affected batches quarantined.' },
          { id: 'AT-D-003', timestamp: daysAgo(11), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'Classification Assigned', field: 'classification', newValue: 'CRITICAL', comments: 'Cold chain breach for temperature-sensitive biologics' },
          { id: 'AT-D-004', timestamp: daysAgo(10), userId: 'USR-005', userName: 'Rajesh Kumar', action: 'Investigation Started', comments: 'Five-Why analysis initiated' },
        ],
        currentWorkflowStep: 'Investigation',
        workflowHistory: [
          { stepName: 'Reporting', status: 'COMPLETED', assignedTo: 'Naresh Babu', startedAt: daysAgo(11), completedAt: daysAgo(11) },
          { stepName: 'Initial Review', status: 'COMPLETED', assignedTo: 'Dr. Ramesh Iyer', startedAt: daysAgo(11), completedAt: daysAgo(11) },
          { stepName: 'Classification', status: 'COMPLETED', assignedTo: 'Dr. Ramesh Iyer', startedAt: daysAgo(11), completedAt: daysAgo(11), comments: 'Classified as CRITICAL' },
          { stepName: 'Investigation', status: 'CURRENT', assignedTo: 'Rajesh Kumar', startedAt: daysAgo(10) },
          { stepName: 'Impact Assessment', status: 'PENDING' },
          { stepName: 'Disposition', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(11),
        updatedAt: daysAgo(9),
        attachments: [
          { id: 'ATT-001', fileName: 'CSR-02_Temperature_Log.pdf', fileType: 'application/pdf', fileSize: 245000, uploadedBy: 'Naresh Babu', uploadedDate: daysAgo(11), description: 'Temperature log showing excursion period' },
          { id: 'ATT-002', fileName: 'Compressor_Inspection_Report.pdf', fileType: 'application/pdf', fileSize: 180000, uploadedBy: 'Rajesh Kumar', uploadedDate: daysAgo(10), description: 'Equipment inspection report for RU-CSR-02' },
        ],
      },
      {
        id: 'DEV-002',
        deviationNumber: 'DEV-2025-024',
        title: 'Batch Record Discrepancy - Missing In-Process Check Entry',
        description:
          'During batch record review for Batch MF-2025-128 (Metformin 500mg), the in-process weight variation check at Stage 3 (compression) was found missing. The operator confirmed that the check was performed but the entry was not recorded in the batch record. Separate loose sheets were found with the data.',
        type: DeviationType.UNPLANNED,
        category: DeviationCategory.DOCUMENTATION,
        classification: DeviationClassification.MAJOR,
        status: DeviationStatus.DISPOSITION,
        sourceArea: 'Production Floor',
        occurredDate: daysAgo(14),
        reportedDate: daysAgo(13),
        detectedDate: daysAgo(13),
        targetClosureDate: daysFromNow(10),
        reportedById: 'USR-003',
        reportedByName: 'Priya Sharma',
        assignedToId: 'USR-007',
        assignedToName: 'Kavitha Reddy',
        reviewerId: 'USR-002',
        reviewerName: 'Lakshmi Devi',
        plantSite: 'Hyderabad Unit-1',
        department: 'Production',
        area: 'Compression Area',
        equipment: 'Tablet Press TP-03',
        product: 'Metformin 500mg Tablets',
        batchNumber: 'MF-2025-128',
        affectedBatches: ['MF-2025-128'],
        gmpImpact: true,
        patientSafetyImpact: false,
        regulatoryImpact: true,
        investigation: {
          investigatorId: 'USR-007',
          investigatorName: 'Kavitha Reddy',
          startDate: daysAgo(12),
          completedDate: daysAgo(8),
          probableCause: 'Operator failed to record in-process data in batch record',
          rootCause: 'Insufficient training on batch record documentation requirements. Operator was newly transferred from packaging area and had not completed the specific training module for compression area documentation.',
          immediateActions: [
            'Loose sheet data verified and attached to batch record with deviation reference',
            'QA overlay performed on the batch record entry',
            'Operator counseled on documentation requirements',
          ],
          findings: 'The in-process weight variation data was found on loose sheets and verified to be within specification. However, the batch record was incomplete which is a GMP documentation failure.',
          conclusion: 'Documentation failure due to training gap. Data integrity not compromised as original data was found and verified. However, this represents a GMP non-compliance for batch record completion.',
          method: 'Root Cause Analysis',
        },
        disposition: {
          decision: DispositionDecision.RELEASE_WITH_CONDITIONS,
          justification: 'In-process data verified from loose sheets and found within specification. QA overlay completed on batch record. No impact on product quality.',
          conditions: 'QA overlay must be completed and signed. Deviation reference must be cross-referenced in batch record.',
          approvedBy: 'Lakshmi Devi',
          approvedDate: daysAgo(7),
          qaReviewComments: 'Data integrity review completed. Original data verified. Batch may be released after QA sign-off on corrected batch record.',
        },
        capaRequired: true,
        capaReference: 'CAPA-2025-003',
        auditTrail: [
          { id: 'AT-D-010', timestamp: daysAgo(13), userId: 'USR-003', userName: 'Priya Sharma', action: 'Deviation Reported', comments: 'Missing entry found during batch record review' },
          { id: 'AT-D-011', timestamp: daysAgo(13), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'Classification Assigned', field: 'classification', newValue: 'MAJOR' },
        ],
        currentWorkflowStep: 'Disposition',
        workflowHistory: [
          { stepName: 'Reporting', status: 'COMPLETED', completedAt: daysAgo(13) },
          { stepName: 'Initial Review', status: 'COMPLETED', completedAt: daysAgo(13) },
          { stepName: 'Classification', status: 'COMPLETED', completedAt: daysAgo(13) },
          { stepName: 'Investigation', status: 'COMPLETED', completedAt: daysAgo(8) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(8) },
          { stepName: 'Disposition', status: 'CURRENT', startedAt: daysAgo(7) },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(13),
        updatedAt: daysAgo(7),
        attachments: [],
      },
      {
        id: 'DEV-003',
        deviationNumber: 'DEV-2025-025',
        title: 'Raw Material COA Mismatch - Starch IP Grade',
        description:
          'Certificate of Analysis (COA) for incoming Starch IP (Batch ST-SUP-2025-089) from supplier MK Chemicals shows moisture content as 14.8% against specification NMT 14.0%. Material was already moved to quarantine area. QC re-testing confirms the OOS result.',
        type: DeviationType.UNPLANNED,
        category: DeviationCategory.MATERIAL,
        classification: DeviationClassification.MAJOR,
        status: DeviationStatus.REPORTED,
        sourceArea: 'Warehouse Receiving',
        occurredDate: daysAgo(3),
        reportedDate: daysAgo(3),
        detectedDate: daysAgo(3),
        targetClosureDate: daysFromNow(27),
        reportedById: 'USR-009',
        reportedByName: 'Deepak Joshi',
        assignedToId: 'USR-009',
        assignedToName: 'Deepak Joshi',
        plantSite: 'Hyderabad Unit-1',
        department: 'Warehouse',
        area: 'Receiving Bay',
        product: 'Starch IP',
        batchNumber: 'ST-SUP-2025-089',
        affectedBatches: ['ST-SUP-2025-089'],
        gmpImpact: true,
        patientSafetyImpact: false,
        regulatoryImpact: false,
        capaRequired: false,
        auditTrail: [
          { id: 'AT-D-020', timestamp: daysAgo(3), userId: 'USR-009', userName: 'Deepak Joshi', action: 'Deviation Reported', comments: 'Material COA shows OOS moisture content. Material quarantined.' },
        ],
        currentWorkflowStep: 'Reporting',
        workflowHistory: [
          { stepName: 'Reporting', status: 'CURRENT', startedAt: daysAgo(3), assignedTo: 'Deepak Joshi' },
          { stepName: 'Initial Review', status: 'PENDING' },
          { stepName: 'Classification', status: 'PENDING' },
          { stepName: 'Investigation', status: 'PENDING' },
          { stepName: 'Impact Assessment', status: 'PENDING' },
          { stepName: 'Disposition', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
        attachments: [],
      },
      {
        id: 'DEV-004',
        deviationNumber: 'DEV-2025-019',
        title: 'Environmental Monitoring Excursion - Sterile Manufacturing Area',
        description:
          'During routine environmental monitoring in Grade B area (Room 204, Sterile Manufacturing Block), settle plate exposure at location SP-204-03 showed colony count of 8 CFU against the action limit of 5 CFU. The excursion was observed during the second shift (14:00 to 22:00 hrs).',
        type: DeviationType.UNPLANNED,
        category: DeviationCategory.ENVIRONMENTAL,
        classification: DeviationClassification.CRITICAL,
        status: DeviationStatus.CLOSED,
        sourceArea: 'Sterile Manufacturing',
        occurredDate: daysAgo(95),
        reportedDate: daysAgo(94),
        detectedDate: daysAgo(94),
        targetClosureDate: daysAgo(50),
        actualClosureDate: daysAgo(55),
        reportedById: 'USR-015',
        reportedByName: 'Sridhar Rao',
        assignedToId: 'USR-002',
        assignedToName: 'Lakshmi Devi',
        reviewerId: 'USR-001',
        reviewerName: 'Dr. Ramesh Iyer',
        approvedById: 'USR-001',
        approvedByName: 'Dr. Ramesh Iyer',
        plantSite: 'Hyderabad Unit-2',
        department: 'Quality Assurance',
        area: 'Room 204 - Grade B Area',
        product: 'Injectable Formulations',
        batchNumber: 'INJ-2025-015',
        affectedBatches: ['INJ-2025-015'],
        gmpImpact: true,
        patientSafetyImpact: true,
        regulatoryImpact: true,
        investigation: {
          investigatorId: 'USR-002',
          investigatorName: 'Lakshmi Devi',
          startDate: daysAgo(93),
          completedDate: daysAgo(85),
          probableCause: 'Improper gowning technique by operator during shift change',
          rootCause: 'Operator Ravi Teja did not follow gowning SOP-STR-005 during shift entry. Video review confirmed incomplete gowning procedure. Training records show operator was newly qualified and had not completed the mandatory 3-day supervised period.',
          immediateActions: [
            'Additional EM samples taken from Grade B area',
            'HVAC system checked and found operational',
            'Operator re-gowned under supervision',
            'Batch INJ-2025-015 quarantined for bioburden testing',
          ],
          findings: 'Root cause confirmed as personnel gowning failure. HVAC and room pressurization verified normal. No equipment or environmental system failure identified.',
          conclusion: 'Personnel error. CAPA initiated for training program improvement. Batch released after sterility testing confirmed compliance.',
          method: 'Investigation Report',
        },
        disposition: {
          decision: DispositionDecision.RELEASE,
          justification: 'Sterility testing of batch INJ-2025-015 passed. Additional EM monitoring showed no further excursions. Root cause identified and CAPA implemented.',
          approvedBy: 'Dr. Ramesh Iyer',
          approvedDate: daysAgo(70),
          qaReviewComments: 'Batch may be released. CAPA-2025-004 addresses training gap. Effectiveness check scheduled.',
        },
        capaRequired: true,
        capaReference: 'CAPA-2025-004',
        auditTrail: [
          { id: 'AT-D-030', timestamp: daysAgo(94), userId: 'USR-015', userName: 'Sridhar Rao', action: 'Deviation Reported' },
          { id: 'AT-D-031', timestamp: daysAgo(55), userId: 'USR-001', userName: 'Dr. Ramesh Iyer', action: 'Deviation Closed', comments: 'All actions complete. CAPA-2025-004 in effectiveness monitoring.' },
        ],
        currentWorkflowStep: 'Closed',
        workflowHistory: [
          { stepName: 'Reporting', status: 'COMPLETED', completedAt: daysAgo(94) },
          { stepName: 'Initial Review', status: 'COMPLETED', completedAt: daysAgo(94) },
          { stepName: 'Classification', status: 'COMPLETED', completedAt: daysAgo(93) },
          { stepName: 'Investigation', status: 'COMPLETED', completedAt: daysAgo(85) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(78) },
          { stepName: 'Disposition', status: 'COMPLETED', completedAt: daysAgo(70) },
          { stepName: 'Closure', status: 'COMPLETED', completedAt: daysAgo(55) },
        ],
        createdAt: daysAgo(94),
        updatedAt: daysAgo(55),
        attachments: [],
      },
      {
        id: 'DEV-005',
        deviationNumber: 'DEV-2025-026',
        title: 'Planned Deviation - Use of Alternate Excipient Supplier',
        description:
          'Request to use alternate approved supplier (Roquette India) for Microcrystalline Cellulose PH-102 in Paracetamol 500mg tablet formulation due to supply shortage from primary supplier (DFE Pharma). Alternate supplier is already approved in the Approved Supplier List (ASL-2024-Rev3).',
        type: DeviationType.PLANNED,
        category: DeviationCategory.MATERIAL,
        classification: DeviationClassification.MINOR,
        status: DeviationStatus.UNDER_REVIEW,
        sourceArea: 'Supply Chain',
        occurredDate: daysAgo(5),
        reportedDate: daysAgo(5),
        detectedDate: daysAgo(5),
        targetClosureDate: daysFromNow(25),
        reportedById: 'USR-009',
        reportedByName: 'Deepak Joshi',
        assignedToId: 'USR-002',
        assignedToName: 'Lakshmi Devi',
        reviewerId: 'USR-001',
        reviewerName: 'Dr. Ramesh Iyer',
        plantSite: 'Hyderabad Unit-1',
        department: 'Warehouse',
        area: 'Supply Chain',
        product: 'Paracetamol 500mg Tablets',
        affectedBatches: [],
        gmpImpact: false,
        patientSafetyImpact: false,
        regulatoryImpact: false,
        capaRequired: false,
        auditTrail: [
          { id: 'AT-D-040', timestamp: daysAgo(5), userId: 'USR-009', userName: 'Deepak Joshi', action: 'Planned Deviation Submitted', comments: 'Supply shortage from primary supplier. Requesting use of alternate approved supplier.' },
          { id: 'AT-D-041', timestamp: daysAgo(5), userId: 'USR-002', userName: 'Lakshmi Devi', action: 'Status Changed', field: 'status', oldValue: 'REPORTED', newValue: 'UNDER_REVIEW', comments: 'Reviewing alternate supplier qualification documents' },
        ],
        currentWorkflowStep: 'Initial Review',
        workflowHistory: [
          { stepName: 'Reporting', status: 'COMPLETED', completedAt: daysAgo(5), assignedTo: 'Deepak Joshi' },
          { stepName: 'Initial Review', status: 'CURRENT', startedAt: daysAgo(5), assignedTo: 'Lakshmi Devi' },
          { stepName: 'Classification', status: 'PENDING' },
          { stepName: 'Investigation', status: 'PENDING' },
          { stepName: 'Impact Assessment', status: 'PENDING' },
          { stepName: 'Disposition', status: 'PENDING' },
          { stepName: 'Closure', status: 'PENDING' },
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5),
        attachments: [],
      },
      {
        id: 'DEV-006',
        deviationNumber: 'DEV-2025-027',
        title: 'Water System Alert - TOC Excursion in PW Loop-2',
        description:
          'Online TOC monitor on Purified Water Loop-2 triggered an alert level at 380 ppb (Alert: 350 ppb, Action: 500 ppb, Spec: NMT 500 ppb). The reading was observed during the night shift at 23:45 hrs. Water system was within specification but exceeded the internal alert limit.',
        type: DeviationType.UNPLANNED,
        category: DeviationCategory.UTILITY,
        classification: DeviationClassification.MINOR,
        status: DeviationStatus.PENDING_CLOSURE,
        sourceArea: 'Utilities',
        occurredDate: daysAgo(16),
        reportedDate: daysAgo(15),
        detectedDate: daysAgo(16),
        targetClosureDate: daysFromNow(4),
        reportedById: 'USR-022',
        reportedByName: 'Raju Naik',
        assignedToId: 'USR-020',
        assignedToName: 'Mahesh Patil',
        plantSite: 'Hyderabad Unit-1',
        department: 'Engineering',
        area: 'Water Treatment Plant',
        equipment: 'PW Loop-2 / TOC Monitor TM-PW-02',
        affectedBatches: [],
        gmpImpact: false,
        patientSafetyImpact: false,
        regulatoryImpact: false,
        capaRequired: false,
        auditTrail: [
          { id: 'AT-D-050', timestamp: daysAgo(15), userId: 'USR-022', userName: 'Raju Naik', action: 'Deviation Reported' },
        ],
        currentWorkflowStep: 'Pending Closure',
        workflowHistory: [
          { stepName: 'Reporting', status: 'COMPLETED', completedAt: daysAgo(15) },
          { stepName: 'Initial Review', status: 'COMPLETED', completedAt: daysAgo(15) },
          { stepName: 'Classification', status: 'COMPLETED', completedAt: daysAgo(14) },
          { stepName: 'Investigation', status: 'COMPLETED', completedAt: daysAgo(9) },
          { stepName: 'Impact Assessment', status: 'COMPLETED', completedAt: daysAgo(8) },
          { stepName: 'Disposition', status: 'COMPLETED', completedAt: daysAgo(6) },
          { stepName: 'Closure', status: 'CURRENT', startedAt: daysAgo(5) },
        ],
        createdAt: daysAgo(15),
        updatedAt: daysAgo(5),
        attachments: [],
      },
    ];
  }

  private generateId(): string {
    return 'id-' + Math.random().toString(36).substring(2, 11);
  }

  private generateDeviationNumber(): string {
    return `DEV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }
}
