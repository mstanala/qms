import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';
import {
  ChangeRequest,
  ChangeStatus,
  ChangeClassification,
  ChangeType,
  ChangeCategory,
  ChangePriority,
  ImpactRating,
  FilingType,
  ChangeControlDashboardMetrics,
  ChangeControlListFilter,
} from '../models/change-control.model';

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
  // TODO: Replace mock data with HttpClient calls to Spring Boot API
  // API Base URL: environment.apiUrl + '/api/v1/change-controls'
  private changeRequests: ChangeRequest[] = this.generateMockData();
  private changeRequestsSubject = new BehaviorSubject<ChangeRequest[]>(this.changeRequests);

  // GET /api/v1/change-controls?status=&type=&search=
  getChangeRequests(filter?: ChangeControlListFilter): Observable<ChangeRequest[]> {
    let filtered = [...this.changeRequests];

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        filtered = filtered.filter((cr) => filter.status!.includes(cr.status));
      }
      if (filter.classification && filter.classification.length > 0) {
        filtered = filtered.filter((cr) => filter.classification!.includes(cr.classification));
      }
      if (filter.type && filter.type.length > 0) {
        filtered = filtered.filter((cr) => filter.type!.includes(cr.type));
      }
      if (filter.priority && filter.priority.length > 0) {
        filtered = filtered.filter((cr) => filter.priority!.includes(cr.priority));
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(
          (cr) =>
            cr.title.toLowerCase().includes(search) ||
            cr.changeNumber.toLowerCase().includes(search) ||
            cr.description.toLowerCase().includes(search)
        );
      }
      if (filter.department) {
        filtered = filtered.filter((cr) => cr.department === filter.department);
      }
    }

    return of(filtered).pipe(delay(300));
  }

  // GET /api/v1/change-controls/{id}
  getChangeRequestById(id: string): Observable<ChangeRequest | undefined> {
    const cr = this.changeRequests.find((c) => c.id === id);
    return of(cr).pipe(delay(200));
  }

  // POST /api/v1/change-controls
  createChangeRequest(changeRequest: Partial<ChangeRequest>): Observable<ChangeRequest> {
    const newCR: ChangeRequest = {
      ...changeRequest,
      id: this.generateId(),
      changeNumber: this.generateChangeNumber(),
      status: ChangeStatus.DRAFT,
      currentWorkflowStep: 'Initiation',
      auditTrail: [
        {
          id: this.generateId(),
          timestamp: new Date(),
          userId: 'USR-001',
          userName: 'Current User',
          action: 'Change Request Created',
          comments: 'New change request initiated',
        },
      ],
      workflowHistory: [
        { stepName: 'Initiation', status: 'CURRENT', assignedTo: changeRequest.requestedByName || 'Unassigned', startedAt: new Date() },
        { stepName: 'Impact Assessment', status: 'PENDING' },
        { stepName: 'QA Review', status: 'PENDING' },
        { stepName: 'RA Review', status: 'PENDING' },
        { stepName: 'Approval', status: 'PENDING' },
        { stepName: 'Implementation', status: 'PENDING' },
        { stepName: 'Verification', status: 'PENDING' },
        { stepName: 'Effectiveness Check', status: 'PENDING' },
        { stepName: 'Closure', status: 'PENDING' },
      ],
      approvals: [],
      implementationPlan: [],
      affectedDocuments: [],
      affectedProducts: [],
      affectedEquipment: [],
      affectedProcesses: [],
      relatedDeviations: [],
      relatedCapas: [],
      relatedChanges: [],
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ChangeRequest;

    this.changeRequests.unshift(newCR);
    this.changeRequestsSubject.next(this.changeRequests);
    return of(newCR).pipe(delay(500));
  }

  // PUT /api/v1/change-controls/{id}/status
  updateStatus(id: string, status: ChangeStatus): Observable<ChangeRequest> {
    const cr = this.changeRequests.find((c) => c.id === id);
    if (cr) {
      const oldStatus = cr.status;
      cr.status = status;
      cr.updatedAt = new Date();
      cr.auditTrail.push({
        id: this.generateId(),
        timestamp: new Date(),
        userId: 'USR-001',
        userName: 'Current User',
        action: 'Status Changed',
        field: 'status',
        oldValue: oldStatus,
        newValue: status,
      });
    }
    return of(cr!).pipe(delay(300));
  }

  // GET /api/v1/change-controls/dashboard/metrics
  getDashboardMetrics(): Observable<ChangeControlDashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const openStatuses = [
      ChangeStatus.DRAFT, ChangeStatus.SUBMITTED, ChangeStatus.IMPACT_ASSESSMENT,
      ChangeStatus.QA_REVIEW, ChangeStatus.RA_REVIEW, ChangeStatus.PENDING_APPROVAL,
      ChangeStatus.APPROVED, ChangeStatus.IMPLEMENTATION, ChangeStatus.VERIFICATION,
      ChangeStatus.EFFECTIVENESS_CHECK,
    ];

    const totalOpen = this.changeRequests.filter((cr) => openStatuses.includes(cr.status)).length;
    const totalPendingApproval = this.changeRequests.filter((cr) => cr.status === ChangeStatus.PENDING_APPROVAL).length;
    const totalInImplementation = this.changeRequests.filter((cr) => cr.status === ChangeStatus.IMPLEMENTATION).length;
    const totalOverdue = this.changeRequests.filter(
      (cr) => openStatuses.includes(cr.status) && new Date(cr.targetImplementationDate) < now
    ).length;
    const totalClosedThisMonth = this.changeRequests.filter(
      (cr) => cr.status === ChangeStatus.CLOSED && cr.closedDate && new Date(cr.closedDate) >= startOfMonth
    ).length;
    const totalSubmittedThisMonth = this.changeRequests.filter(
      (cr) => new Date(cr.requestedDate) >= startOfMonth
    ).length;

    // Compute byStatus from actual data
    const statusCounts = new Map<ChangeStatus, number>();
    this.changeRequests.forEach((cr) => statusCounts.set(cr.status, (statusCounts.get(cr.status) || 0) + 1));

    // Compute byType from actual data
    const typeCounts = new Map<ChangeType, number>();
    this.changeRequests.forEach((cr) => typeCounts.set(cr.type, (typeCounts.get(cr.type) || 0) + 1));

    // Compute byClassification from actual data
    const classCounts = new Map<ChangeClassification, number>();
    this.changeRequests.forEach((cr) => classCounts.set(cr.classification, (classCounts.get(cr.classification) || 0) + 1));

    // Compute byPriority from actual data
    const priCounts = new Map<ChangePriority, number>();
    this.changeRequests.forEach((cr) => priCounts.set(cr.priority, (priCounts.get(cr.priority) || 0) + 1));

    // Compute byDepartment from actual data
    const deptCounts = new Map<string, number>();
    this.changeRequests.forEach((cr) => deptCounts.set(cr.department, (deptCounts.get(cr.department) || 0) + 1));

    const metrics: ChangeControlDashboardMetrics = {
      totalOpen,
      totalPendingApproval,
      totalInImplementation,
      totalOverdue,
      totalClosedThisMonth,
      totalSubmittedThisMonth,
      avgCycleTimeDays: 35,
      approvalRate: 87,
      byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      byType: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
      byClassification: Array.from(classCounts.entries()).map(([classification, count]) => ({ classification, count })),
      byPriority: Array.from(priCounts.entries()).map(([priority, count]) => ({ priority, count })),
      byDepartment: Array.from(deptCounts.entries()).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count),
      trendData: [
        { month: 'M-5', submitted: 6, closed: 5, rejected: 1 },
        { month: 'M-4', submitted: 8, closed: 6, rejected: 0 },
        { month: 'M-3', submitted: 5, closed: 7, rejected: 1 },
        { month: 'M-2', submitted: 7, closed: 4, rejected: 2 },
        { month: 'M-1', submitted: 9, closed: 8, rejected: 0 },
        { month: 'This Mo', submitted: totalSubmittedThisMonth, closed: totalClosedThisMonth, rejected: 0 },
      ],
    };
    return of(metrics).pipe(delay(300));
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
    const count = this.changeRequests.length + 1;
    return `CC-2025-${(count + 20).toString().padStart(3, '0')}`;
  }
}
