import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';
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
} from '../models/capa.model';

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
  private capas: Capa[] = this.generateMockData();
  private capasSubject = new BehaviorSubject<Capa[]>(this.capas);

  getCapas(filter?: CapaListFilter): Observable<Capa[]> {
    let filtered = [...this.capas];

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        filtered = filtered.filter((c) => filter.status!.includes(c.status));
      }
      if (filter.priority && filter.priority.length > 0) {
        filtered = filtered.filter((c) => filter.priority!.includes(c.priority));
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(search) ||
            c.capaNumber.toLowerCase().includes(search) ||
            c.description.toLowerCase().includes(search)
        );
      }
      if (filter.department) {
        filtered = filtered.filter((c) => c.department === filter.department);
      }
    }

    return of(filtered).pipe(delay(300));
  }

  getCapaById(id: string): Observable<Capa | undefined> {
    const capa = this.capas.find((c) => c.id === id);
    return of(capa).pipe(delay(200));
  }

  createCapa(capa: Partial<Capa>): Observable<Capa> {
    const newCapa: Capa = {
      ...capa,
      id: this.generateId(),
      capaNumber: this.generateCapaNumber(),
      status: CapaStatus.INITIATED,
      currentWorkflowStep: 'Initiation',
      auditTrail: [
        {
          id: this.generateId(),
          timestamp: new Date(),
          userId: 'USR-001',
          userName: 'Current User',
          action: 'CAPA Initiated',
          comments: 'New CAPA record created',
        },
      ],
      workflowHistory: [
        {
          stepName: 'Initiation',
          status: 'CURRENT',
          assignedTo: capa.ownerName || 'Unassigned',
          startedAt: new Date(),
        },
      ],
      correctiveActions: [],
      preventiveActions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Capa;

    this.capas.unshift(newCapa);
    this.capasSubject.next(this.capas);
    return of(newCapa).pipe(delay(500));
  }

  updateCapaStatus(id: string, status: CapaStatus): Observable<Capa> {
    const capa = this.capas.find((c) => c.id === id);
    if (capa) {
      capa.status = status;
      capa.updatedAt = new Date();
      capa.auditTrail.push({
        id: this.generateId(),
        timestamp: new Date(),
        userId: 'USR-001',
        userName: 'Current User',
        action: 'Status Changed',
        field: 'status',
        oldValue: capa.status,
        newValue: status,
      });
    }
    return of(capa!).pipe(delay(300));
  }

  getDashboardMetrics(): Observable<CapaDashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const openStatuses = [
      CapaStatus.INITIATED, CapaStatus.UNDER_REVIEW, CapaStatus.INVESTIGATION,
      CapaStatus.ROOT_CAUSE_IDENTIFIED, CapaStatus.ACTION_PLANNING,
      CapaStatus.ACTION_IN_PROGRESS, CapaStatus.EFFECTIVENESS_CHECK, CapaStatus.PENDING_CLOSURE,
    ];

    const totalOpen = this.capas.filter((c) => openStatuses.includes(c.status)).length;
    const totalOverdue = this.capas.filter(
      (c) => openStatuses.includes(c.status) && new Date(c.dueDate) < now
    ).length;
    const totalClosedThisMonth = this.capas.filter(
      (c) => c.status === CapaStatus.CLOSED && c.closedAt && new Date(c.closedAt) >= startOfMonth
    ).length;
    const totalInitiatedThisMonth = this.capas.filter(
      (c) => new Date(c.initiatedDate) >= startOfMonth
    ).length;

    // Compute byStatus from actual data
    const statusCounts = new Map<CapaStatus, number>();
    this.capas.forEach((c) => statusCounts.set(c.status, (statusCounts.get(c.status) || 0) + 1));

    const metrics: CapaDashboardMetrics = {
      totalOpen,
      totalOverdue,
      totalClosedThisMonth,
      totalInitiatedThisMonth,
      avgClosureTimeDays: 32,
      effectivenessRate: 87,
      byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      byPriority: [
        { priority: CapaPriority.CRITICAL, count: this.capas.filter((c) => c.priority === CapaPriority.CRITICAL && openStatuses.includes(c.status)).length },
        { priority: CapaPriority.HIGH, count: this.capas.filter((c) => c.priority === CapaPriority.HIGH && openStatuses.includes(c.status)).length },
        { priority: CapaPriority.MEDIUM, count: this.capas.filter((c) => c.priority === CapaPriority.MEDIUM && openStatuses.includes(c.status)).length },
        { priority: CapaPriority.LOW, count: this.capas.filter((c) => c.priority === CapaPriority.LOW && openStatuses.includes(c.status)).length },
      ],
      byDepartment: this.computeByDepartment(openStatuses),
      trendData: [
        { month: 'M-5', initiated: 4, closed: 6 },
        { month: 'M-4', initiated: 5, closed: 4 },
        { month: 'M-3', initiated: 3, closed: 5 },
        { month: 'M-2', initiated: 6, closed: 7 },
        { month: 'M-1', initiated: 4, closed: 8 },
        { month: 'This Mo', initiated: totalInitiatedThisMonth, closed: totalClosedThisMonth },
      ],
    };
    return of(metrics).pipe(delay(300));
  }

  private computeByDepartment(openStatuses: CapaStatus[]): { department: string; count: number }[] {
    const deptMap = new Map<string, number>();
    this.capas
      .filter((c) => openStatuses.includes(c.status))
      .forEach((c) => deptMap.set(c.department, (deptMap.get(c.department) || 0) + 1));
    return Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
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
    const count = this.capas.length + 1;
    return `CAPA-2025-${count.toString().padStart(3, '0')}`;
  }
}
