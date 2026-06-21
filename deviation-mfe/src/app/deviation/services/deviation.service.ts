import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';
import {
  Deviation,
  DeviationStatus,
  DeviationClassification,
  DeviationCategory,
  DeviationType,
  ImpactLevel,
  DispositionDecision,
  DeviationDashboardMetrics,
  DeviationListFilter,
} from '../models/deviation.model';

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
  // TODO: Replace mock data with HttpClient calls to Spring Boot API
  // API Base URL: environment.apiUrl + '/api/v1/deviations'
  private deviations: Deviation[] = this.generateMockData();
  private deviationsSubject = new BehaviorSubject<Deviation[]>(this.deviations);

  // GET /api/v1/deviations?status=&classification=&search=
  getDeviations(filter?: DeviationListFilter): Observable<Deviation[]> {
    let filtered = [...this.deviations];

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        filtered = filtered.filter((d) => filter.status!.includes(d.status));
      }
      if (filter.classification && filter.classification.length > 0) {
        filtered = filtered.filter((d) => filter.classification!.includes(d.classification));
      }
      if (filter.category && filter.category.length > 0) {
        filtered = filtered.filter((d) => filter.category!.includes(d.category));
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.title.toLowerCase().includes(search) ||
            d.deviationNumber.toLowerCase().includes(search) ||
            d.description.toLowerCase().includes(search)
        );
      }
      if (filter.department) {
        filtered = filtered.filter((d) => d.department === filter.department);
      }
    }

    return of(filtered).pipe(delay(300));
  }

  // GET /api/v1/deviations/{id}
  getDeviationById(id: string): Observable<Deviation | undefined> {
    const deviation = this.deviations.find((d) => d.id === id);
    return of(deviation).pipe(delay(200));
  }

  // POST /api/v1/deviations
  createDeviation(deviation: Partial<Deviation>): Observable<Deviation> {
    const newDeviation: Deviation = {
      ...deviation,
      id: this.generateId(),
      deviationNumber: this.generateDeviationNumber(),
      status: DeviationStatus.REPORTED,
      currentWorkflowStep: 'Reporting',
      auditTrail: [
        {
          id: this.generateId(),
          timestamp: new Date(),
          userId: 'USR-001',
          userName: 'Current User',
          action: 'Deviation Reported',
          comments: 'New deviation record created',
        },
      ],
      workflowHistory: [
        {
          stepName: 'Reporting',
          status: 'CURRENT',
          assignedTo: deviation.reportedByName || 'Unassigned',
          startedAt: new Date(),
        },
        { stepName: 'Initial Review', status: 'PENDING' },
        { stepName: 'Classification', status: 'PENDING' },
        { stepName: 'Investigation', status: 'PENDING' },
        { stepName: 'Impact Assessment', status: 'PENDING' },
        { stepName: 'Disposition', status: 'PENDING' },
        { stepName: 'Closure', status: 'PENDING' },
      ],
      affectedBatches: deviation.affectedBatches || [],
      attachments: [],
      capaRequired: false,
      gmpImpact: false,
      patientSafetyImpact: false,
      regulatoryImpact: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Deviation;

    this.deviations.unshift(newDeviation);
    this.deviationsSubject.next(this.deviations);
    return of(newDeviation).pipe(delay(500));
  }

  // PUT /api/v1/deviations/{id}/status
  updateDeviationStatus(id: string, status: DeviationStatus): Observable<Deviation> {
    const deviation = this.deviations.find((d) => d.id === id);
    if (deviation) {
      const oldStatus = deviation.status;
      deviation.status = status;
      deviation.updatedAt = new Date();
      deviation.auditTrail.push({
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
    return of(deviation!).pipe(delay(300));
  }

  // GET /api/v1/deviations/dashboard/metrics
  getDashboardMetrics(): Observable<DeviationDashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const openStatuses = [
      DeviationStatus.REPORTED, DeviationStatus.UNDER_REVIEW, DeviationStatus.CLASSIFIED,
      DeviationStatus.INVESTIGATION, DeviationStatus.IMPACT_ASSESSMENT,
      DeviationStatus.DISPOSITION, DeviationStatus.CAPA_INITIATED, DeviationStatus.PENDING_CLOSURE,
    ];

    const totalOpen = this.deviations.filter((d) => openStatuses.includes(d.status)).length;
    const totalOverdue = this.deviations.filter(
      (d) => openStatuses.includes(d.status) && new Date(d.targetClosureDate) < now
    ).length;
    const totalReportedThisMonth = this.deviations.filter(
      (d) => new Date(d.reportedDate) >= startOfMonth
    ).length;
    const totalClosedThisMonth = this.deviations.filter(
      (d) => d.status === DeviationStatus.CLOSED && d.actualClosureDate && new Date(d.actualClosureDate) >= startOfMonth
    ).length;
    const criticalOpen = this.deviations.filter(
      (d) => d.classification === DeviationClassification.CRITICAL && openStatuses.includes(d.status)
    ).length;

    // Compute byStatus from actual data
    const statusCounts = new Map<DeviationStatus, number>();
    this.deviations.forEach((d) => statusCounts.set(d.status, (statusCounts.get(d.status) || 0) + 1));

    // Compute byClassification from actual data
    const classCounts = new Map<DeviationClassification, number>();
    this.deviations.forEach((d) => classCounts.set(d.classification, (classCounts.get(d.classification) || 0) + 1));

    // Compute byCategory from actual data (includes UTILITY)
    const catCounts = new Map<DeviationCategory, number>();
    this.deviations.forEach((d) => catCounts.set(d.category, (catCounts.get(d.category) || 0) + 1));

    // Compute byDepartment from actual data
    const deptCounts = new Map<string, number>();
    this.deviations.forEach((d) => deptCounts.set(d.department, (deptCounts.get(d.department) || 0) + 1));

    const capaCount = this.deviations.filter((d) => d.capaRequired).length;

    const metrics: DeviationDashboardMetrics = {
      totalOpen,
      totalOverdue,
      totalReportedThisMonth,
      totalClosedThisMonth,
      avgClosureTimeDays: 18,
      criticalOpen,
      capaConversionRate: this.deviations.length > 0 ? Math.round((capaCount / this.deviations.length) * 100) : 0,
      byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      byClassification: Array.from(classCounts.entries()).map(([classification, count]) => ({ classification, count })),
      byCategory: Array.from(catCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      byDepartment: Array.from(deptCounts.entries())
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count),
      trendData: [
        { month: 'M-5', reported: 8, closed: 7 },
        { month: 'M-4', reported: 6, closed: 8 },
        { month: 'M-3', reported: 9, closed: 6 },
        { month: 'M-2', reported: 7, closed: 9 },
        { month: 'M-1', reported: 5, closed: 7 },
        { month: 'This Mo', reported: totalReportedThisMonth, closed: totalClosedThisMonth },
      ],
    };
    return of(metrics).pipe(delay(300));
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
    const count = this.deviations.length + 1;
    return `DEV-2025-${(count + 22).toString().padStart(3, '0')}`;
  }
}
