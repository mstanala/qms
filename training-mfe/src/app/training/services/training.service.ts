import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError, tap } from 'rxjs';
import {
  TrainingCurriculum, TrainingAssignment, TrainingMatrix, TrainingSession,
  TrainingDashboardMetrics, CurriculumStatus, TrainingCategory, TrainingType,
  AssignmentStatus, AssignmentReason, TrainingPriority, SessionStatus, AttendanceStatus,
} from '../models/training.model';

const API_BASE_URL = 'http://localhost:8082/api/v1';

type ApiPage<T> = { content?: T[] };

function daysAgo(days: number): Date {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(9, 0, 0, 0); return d;
}
function daysFromNow(days: number): Date {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(17, 0, 0, 0); return d;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly curriculaUrl = `${API_BASE_URL}/training/curricula`;
  private readonly assignmentsUrl = `${API_BASE_URL}/training/assignments`;
  private readonly matrixUrl = `${API_BASE_URL}/training/matrix`;
  private readonly sessionsUrl = `${API_BASE_URL}/training/sessions`;

  constructor(private http: HttpClient) {}

  getCurricula(): Observable<TrainingCurriculum[]> {
    return this.http
      .get<ApiPage<any>>(this.curriculaUrl, { headers: this.authHeaders(), params: new HttpParams().set('page', '0').set('size', '100') })
      .pipe(map(p => (p.content || []).map((i: any) => this.toCurriculum(i))), catchError(() => of(this.mockCurricula())));
  }

  getCurriculumById(id: string): Observable<TrainingCurriculum | undefined> {
    return this.http
      .get<any>(`${this.curriculaUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(map(i => this.toCurriculum(i)), catchError(() => of(this.mockCurricula().find(c => c.id === id))));
  }

  createCurriculum(data: Partial<TrainingCurriculum>): Observable<TrainingCurriculum> {
    return this.http.post<any>(this.curriculaUrl, data, { headers: this.authHeaders() }).pipe(map(i => this.toCurriculum(i)));
  }

  getAssignments(status?: string): Observable<TrainingAssignment[]> {
    let params = new HttpParams().set('page', '0').set('size', '100');
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiPage<any>>(this.assignmentsUrl, { headers: this.authHeaders(), params })
      .pipe(map(p => (p.content || []).map((i: any) => this.toAssignment(i))), catchError(() => of(this.mockAssignments())));
  }

  getMyAssignments(): Observable<TrainingAssignment[]> {
    const params = new HttpParams().set('page', '0').set('size', '100');
    return this.http
      .get<ApiPage<any>>(`${this.assignmentsUrl}/my`, { headers: this.authHeaders(), params })
      .pipe(
        map(p => (p.content || []).map((i: any) => this.toAssignment(i))),
        catchError(err => { console.error('Failed to fetch my assignments:', err); return of([]); })
      );
  }

  startTraining(id: string): Observable<TrainingAssignment> {
    return this.http
      .patch<any>(`${this.assignmentsUrl}/${id}/start`, {}, { headers: this.authHeaders() })
      .pipe(map(i => this.toAssignment(i)));
  }

  completeAssignment(id: string, score?: number, traineeComments?: string): Observable<TrainingAssignment> {
    return this.http
      .patch<any>(`${this.assignmentsUrl}/${id}/complete`, { score, traineeComments }, { headers: this.authHeaders() })
      .pipe(map(i => this.toAssignment(i)));
  }

  getDocumentAttachments(documentId: string): Observable<any[]> {
    const params = new HttpParams().set('recordType', 'DOCUMENT').set('recordId', documentId);
    return this.http
      .get<any[]>(`${API_BASE_URL}/attachments`, { headers: this.authHeaders(), params })
      .pipe(catchError(() => of([])));
  }

  getAttachmentContent(attachmentId: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/attachments/${attachmentId}/content`, {
      headers: this.authHeaders(),
      responseType: 'blob',
    });
  }

  getMatrix(): Observable<TrainingMatrix[]> {
    return this.http
      .get<any[]>(this.matrixUrl, { headers: this.authHeaders() })
      .pipe(catchError(() => of(this.mockMatrix())));
  }

  getSessions(): Observable<TrainingSession[]> {
    return this.http
      .get<ApiPage<any>>(this.sessionsUrl, { headers: this.authHeaders() })
      .pipe(map(p => (p.content || []).map((i: any) => this.toSession(i))), catchError(() => of(this.mockSessions())));
  }

  getDashboardMetrics(): Observable<TrainingDashboardMetrics> {
    return this.http
      .get<TrainingDashboardMetrics>(`${API_BASE_URL}/training/dashboard`, { headers: this.authHeaders() })
      .pipe(catchError(() => of(this.mockMetrics())));
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private toCurriculum(api: any): TrainingCurriculum {
    return {
      ...api,
      curriculumNumber: api.curriculumNumber || api.curriculumCode,
      effectiveDate: api.effectiveDate ? new Date(api.effectiveDate) : undefined,
      createdAt: new Date(api.createdAt),
      updatedAt: new Date(api.updatedAt),
    };
  }

  private toAssignment(api: any): TrainingAssignment {
    return {
      ...api,
      curriculumNumber: api.curriculumNumber || api.curriculumCode,
      trainee: api.trainee || api.assignedTo,
      reason: api.reason || api.assignmentReason,
      assignedDate: new Date(api.assignedDate || api.createdAt),
      dueDate: new Date(api.dueDate),
      completedDate: api.completedDate ? new Date(api.completedDate) : undefined,
      trainerName: api.trainerName || (api.trainer ? api.trainer.displayName : undefined),
      comments: api.comments || api.traineeComments,
      relatedRecordId: api.relatedRecordId || api.sourceRecordId,
      relatedRecordType: api.relatedRecordType || api.sourceRecordType,
      relatedRecordNumber: api.relatedRecordNumber || api.sourceRecordNumber,
    };
  }

  private toSession(api: any): TrainingSession {
    return { ...api, sessionDate: new Date(api.sessionDate), createdAt: new Date(api.createdAt) };
  }

  private mockCurricula(): TrainingCurriculum[] {
    return [
      {
        id: 'cur-001', curriculumNumber: 'TRN-CUR-001', title: 'GMP Fundamentals for Manufacturing Personnel',
        description: 'Comprehensive GMP training covering Schedule M requirements, personal hygiene, documentation practices, and cleanroom behavior for all manufacturing staff.',
        category: TrainingCategory.GMP, trainingType: TrainingType.CLASSROOM,
        departmentId: 'dept-prod', departmentName: 'Production',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        status: CurriculumStatus.ACTIVE, durationHours: 8, validityMonths: 12, passingScore: 80,
        owner: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        regulatoryReference: 'Schedule M Part I Sec 3, WHO TRS 986 Annex 2',
        effectiveDate: daysAgo(365), createdAt: daysAgo(400), updatedAt: daysAgo(30),
      },
      {
        id: 'cur-002', curriculumNumber: 'TRN-CUR-002', title: 'SOP: Tablet Compression - Cadmach CU-65D',
        description: 'Training on SOP-2025-001 for tablet compression operations including machine setup, IPCs, troubleshooting, and batch record documentation.',
        category: TrainingCategory.SOP, trainingType: TrainingType.ON_THE_JOB,
        departmentId: 'dept-prod', departmentName: 'Production',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        status: CurriculumStatus.ACTIVE, durationHours: 4, validityMonths: 24,
        owner: { id: 'u-001', displayName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com' },
        relatedDocumentId: 'doc-001', relatedDocumentNumber: 'SOP-2025-001',
        effectiveDate: daysAgo(180), createdAt: daysAgo(200), updatedAt: daysAgo(10),
      },
      {
        id: 'cur-003', curriculumNumber: 'TRN-CUR-003', title: 'Data Integrity & ALCOA+ Principles',
        description: 'Training on data integrity requirements covering ALCOA+ principles, electronic records, 21 CFR Part 11, and EU Annex 11 compliance.',
        category: TrainingCategory.DATA_INTEGRITY, trainingType: TrainingType.E_LEARNING,
        departmentId: 'dept-qa', departmentName: 'Quality Assurance',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        status: CurriculumStatus.ACTIVE, durationHours: 6, validityMonths: 12, passingScore: 85,
        owner: { id: 'u-004', displayName: 'Anjali Desai', email: 'anjali.desai@example.com' },
        relatedDocumentId: 'doc-004', relatedDocumentNumber: 'POL-2025-001',
        regulatoryReference: '21 CFR Part 11, EU Annex 11, WHO DI Guidance',
        effectiveDate: daysAgo(90), createdAt: daysAgo(120), updatedAt: daysAgo(5),
      },
      {
        id: 'cur-004', curriculumNumber: 'TRN-CUR-004', title: 'HPLC Operation & Analytical Method Training',
        description: 'Hands-on training on Waters Alliance HPLC system operation, column handling, method execution, and result interpretation for QC analysts.',
        category: TrainingCategory.EQUIPMENT, trainingType: TrainingType.WORKSHOP,
        departmentId: 'dept-qc', departmentName: 'Quality Control',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        status: CurriculumStatus.ACTIVE, durationHours: 16, validityMonths: 24, passingScore: 75,
        owner: { id: 'u-003', displayName: 'Sanjay Reddy', email: 'sanjay.reddy@example.com' },
        relatedDocumentId: 'doc-003', relatedDocumentNumber: 'WI-2025-001',
        effectiveDate: daysAgo(60), createdAt: daysAgo(90), updatedAt: daysAgo(15),
      },
      {
        id: 'cur-005', curriculumNumber: 'TRN-CUR-005', title: 'Deviation Management & CAPA Initiation',
        description: 'Training on deviation reporting, classification, investigation techniques (5-Why, Fishbone), and criteria for CAPA initiation.',
        category: TrainingCategory.QUALITY_SYSTEM, trainingType: TrainingType.CLASSROOM,
        departmentId: 'dept-qa', departmentName: 'Quality Assurance',
        plantSiteId: 'site-hyd', plantSiteName: 'Hyderabad Plant - Unit I',
        status: CurriculumStatus.DRAFT, durationHours: 4, validityMonths: 12, passingScore: 80,
        owner: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        relatedDocumentId: 'doc-005', relatedDocumentNumber: 'SOP-2025-003',
        createdAt: daysAgo(7), updatedAt: daysAgo(1),
      },
      {
        id: 'cur-006', curriculumNumber: 'TRN-CUR-006', title: 'Cleanroom Behavior & Gowning Procedures',
        description: 'Training on cleanroom classification, gowning procedures, environmental monitoring, and aseptic techniques for sterile manufacturing areas.',
        category: TrainingCategory.GMP, trainingType: TrainingType.ON_THE_JOB,
        departmentId: 'dept-prod', departmentName: 'Production',
        plantSiteId: 'site-viz', plantSiteName: 'Visakhapatnam Plant',
        status: CurriculumStatus.ACTIVE, durationHours: 3, validityMonths: 6,
        owner: { id: 'u-005', displayName: 'Venkat Rao', email: 'venkat.rao@example.com' },
        regulatoryReference: 'EU GMP Annex 1, Schedule M Part I Sec 5',
        effectiveDate: daysAgo(240), createdAt: daysAgo(300), updatedAt: daysAgo(45),
      },
    ];
  }

  private mockAssignments(): TrainingAssignment[] {
    return [
      {
        id: 'asgn-001', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals for Manufacturing Personnel', curriculumNumber: 'TRN-CUR-001',
        trainee: { id: 'u-006', displayName: 'Suresh Babu', email: 'suresh.babu@example.com' },
        assignedBy: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        status: AssignmentStatus.COMPLETED, reason: AssignmentReason.PERIODIC_RETRAINING, priority: TrainingPriority.HIGH,
        assignedDate: daysAgo(45), dueDate: daysAgo(15), completedDate: daysAgo(20), score: 92,
        trainerName: 'Priya Sharma',
      },
      {
        id: 'asgn-002', curriculumId: 'cur-003', curriculumTitle: 'Data Integrity & ALCOA+ Principles', curriculumNumber: 'TRN-CUR-003',
        trainee: { id: 'u-006', displayName: 'Suresh Babu', email: 'suresh.babu@example.com' },
        assignedBy: { id: 'u-004', displayName: 'Anjali Desai', email: 'anjali.desai@example.com' },
        status: AssignmentStatus.IN_PROGRESS, reason: AssignmentReason.REGULATORY_UPDATE, priority: TrainingPriority.CRITICAL,
        assignedDate: daysAgo(10), dueDate: daysFromNow(20),
      },
      {
        id: 'asgn-003', curriculumId: 'cur-002', curriculumTitle: 'SOP: Tablet Compression - Cadmach CU-65D', curriculumNumber: 'TRN-CUR-002',
        trainee: { id: 'u-007', displayName: 'Lakshmi Devi', email: 'lakshmi.devi@example.com' },
        assignedBy: { id: 'u-001', displayName: 'Ramesh Kumar', email: 'ramesh.kumar@example.com' },
        status: AssignmentStatus.OVERDUE, reason: AssignmentReason.SOP_REVISION, priority: TrainingPriority.HIGH,
        assignedDate: daysAgo(40), dueDate: daysAgo(10),
      },
      {
        id: 'asgn-004', curriculumId: 'cur-004', curriculumTitle: 'HPLC Operation & Analytical Method Training', curriculumNumber: 'TRN-CUR-004',
        trainee: { id: 'u-008', displayName: 'Kavitha Nair', email: 'kavitha.nair@example.com' },
        assignedBy: { id: 'u-003', displayName: 'Sanjay Reddy', email: 'sanjay.reddy@example.com' },
        status: AssignmentStatus.ASSIGNED, reason: AssignmentReason.NEW_HIRE, priority: TrainingPriority.MEDIUM,
        assignedDate: daysAgo(3), dueDate: daysFromNow(27),
      },
      {
        id: 'asgn-005', curriculumId: 'cur-006', curriculumTitle: 'Cleanroom Behavior & Gowning Procedures', curriculumNumber: 'TRN-CUR-006',
        trainee: { id: 'u-009', displayName: 'Ravi Teja', email: 'ravi.teja@example.com' },
        assignedBy: { id: 'u-005', displayName: 'Venkat Rao', email: 'venkat.rao@example.com' },
        status: AssignmentStatus.COMPLETED, reason: AssignmentReason.INITIAL, priority: TrainingPriority.HIGH,
        assignedDate: daysAgo(60), dueDate: daysAgo(30), completedDate: daysAgo(35), score: 88,
        trainerName: 'Venkat Rao',
      },
      {
        id: 'asgn-006', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals for Manufacturing Personnel', curriculumNumber: 'TRN-CUR-001',
        trainee: { id: 'u-008', displayName: 'Kavitha Nair', email: 'kavitha.nair@example.com' },
        assignedBy: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        status: AssignmentStatus.ASSIGNED, reason: AssignmentReason.NEW_HIRE, priority: TrainingPriority.CRITICAL,
        assignedDate: daysAgo(3), dueDate: daysFromNow(12),
      },
      {
        id: 'asgn-007', curriculumId: 'cur-003', curriculumTitle: 'Data Integrity & ALCOA+ Principles', curriculumNumber: 'TRN-CUR-003',
        trainee: { id: 'u-007', displayName: 'Lakshmi Devi', email: 'lakshmi.devi@example.com' },
        assignedBy: { id: 'u-004', displayName: 'Anjali Desai', email: 'anjali.desai@example.com' },
        status: AssignmentStatus.COMPLETED, reason: AssignmentReason.INITIAL, priority: TrainingPriority.HIGH,
        assignedDate: daysAgo(50), dueDate: daysAgo(20), completedDate: daysAgo(22), score: 95,
        trainerName: 'Anjali Desai',
      },
    ];
  }

  private mockMatrix(): TrainingMatrix[] {
    return [
      { id: 'mx-001', jobRoleId: 'role-op', jobRoleName: 'Production Operator', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals', curriculumNumber: 'TRN-CUR-001', departmentId: 'dept-prod', departmentName: 'Production', mandatory: true, frequencyMonths: 12 },
      { id: 'mx-002', jobRoleId: 'role-op', jobRoleName: 'Production Operator', curriculumId: 'cur-002', curriculumTitle: 'Tablet Compression SOP', curriculumNumber: 'TRN-CUR-002', departmentId: 'dept-prod', departmentName: 'Production', mandatory: true, frequencyMonths: 24 },
      { id: 'mx-003', jobRoleId: 'role-op', jobRoleName: 'Production Operator', curriculumId: 'cur-006', curriculumTitle: 'Cleanroom & Gowning', curriculumNumber: 'TRN-CUR-006', departmentId: 'dept-prod', departmentName: 'Production', mandatory: true, frequencyMonths: 6 },
      { id: 'mx-004', jobRoleId: 'role-qa', jobRoleName: 'QA Specialist', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals', curriculumNumber: 'TRN-CUR-001', departmentId: 'dept-qa', departmentName: 'Quality Assurance', mandatory: true, frequencyMonths: 12 },
      { id: 'mx-005', jobRoleId: 'role-qa', jobRoleName: 'QA Specialist', curriculumId: 'cur-003', curriculumTitle: 'Data Integrity & ALCOA+', curriculumNumber: 'TRN-CUR-003', departmentId: 'dept-qa', departmentName: 'Quality Assurance', mandatory: true, frequencyMonths: 12 },
      { id: 'mx-006', jobRoleId: 'role-qa', jobRoleName: 'QA Specialist', curriculumId: 'cur-005', curriculumTitle: 'Deviation & CAPA', curriculumNumber: 'TRN-CUR-005', departmentId: 'dept-qa', departmentName: 'Quality Assurance', mandatory: true, frequencyMonths: 12 },
      { id: 'mx-007', jobRoleId: 'role-qc', jobRoleName: 'QC Analyst', curriculumId: 'cur-004', curriculumTitle: 'HPLC Operation', curriculumNumber: 'TRN-CUR-004', departmentId: 'dept-qc', departmentName: 'Quality Control', mandatory: true, frequencyMonths: 24 },
      { id: 'mx-008', jobRoleId: 'role-qc', jobRoleName: 'QC Analyst', curriculumId: 'cur-003', curriculumTitle: 'Data Integrity & ALCOA+', curriculumNumber: 'TRN-CUR-003', departmentId: 'dept-qc', departmentName: 'Quality Control', mandatory: true, frequencyMonths: 12 },
      { id: 'mx-009', jobRoleId: 'role-eng', jobRoleName: 'Maintenance Engineer', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals', curriculumNumber: 'TRN-CUR-001', departmentId: 'dept-eng', departmentName: 'Engineering', mandatory: true, frequencyMonths: 12 },
      { id: 'mx-010', jobRoleId: 'role-wh', jobRoleName: 'Warehouse Executive', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals', curriculumNumber: 'TRN-CUR-001', departmentId: 'dept-wh', departmentName: 'Warehouse', mandatory: true, frequencyMonths: 12 },
    ];
  }

  private mockSessions(): TrainingSession[] {
    return [
      {
        id: 'ses-001', curriculumId: 'cur-001', curriculumTitle: 'GMP Fundamentals for Manufacturing Personnel',
        sessionDate: daysFromNow(7), location: 'Training Room A - Hyderabad Plant',
        instructor: { id: 'u-002', displayName: 'Priya Sharma', email: 'priya.sharma@example.com' },
        status: SessionStatus.SCHEDULED, maxAttendees: 25,
        attendees: [
          { id: 'att-001', trainee: { id: 'u-008', displayName: 'Kavitha Nair', email: 'kavitha.nair@example.com' }, attendanceStatus: AttendanceStatus.REGISTERED },
          { id: 'att-002', trainee: { id: 'u-009', displayName: 'Ravi Teja', email: 'ravi.teja@example.com' }, attendanceStatus: AttendanceStatus.REGISTERED },
        ],
        createdAt: daysAgo(14),
      },
      {
        id: 'ses-002', curriculumId: 'cur-004', curriculumTitle: 'HPLC Operation & Analytical Method Training',
        sessionDate: daysFromNow(14), location: 'QC Lab - Hyderabad Plant',
        instructor: { id: 'u-003', displayName: 'Sanjay Reddy', email: 'sanjay.reddy@example.com' },
        status: SessionStatus.SCHEDULED, maxAttendees: 8,
        attendees: [
          { id: 'att-003', trainee: { id: 'u-008', displayName: 'Kavitha Nair', email: 'kavitha.nair@example.com' }, attendanceStatus: AttendanceStatus.REGISTERED },
        ],
        createdAt: daysAgo(7),
      },
      {
        id: 'ses-003', curriculumId: 'cur-003', curriculumTitle: 'Data Integrity & ALCOA+ Principles',
        sessionDate: daysAgo(15), location: 'Online - Teams Meeting',
        instructor: { id: 'u-004', displayName: 'Anjali Desai', email: 'anjali.desai@example.com' },
        status: SessionStatus.COMPLETED, maxAttendees: 50,
        attendees: [
          { id: 'att-004', trainee: { id: 'u-007', displayName: 'Lakshmi Devi', email: 'lakshmi.devi@example.com' }, attendanceStatus: AttendanceStatus.ATTENDED, score: 95, completedDate: daysAgo(15) },
          { id: 'att-005', trainee: { id: 'u-006', displayName: 'Suresh Babu', email: 'suresh.babu@example.com' }, attendanceStatus: AttendanceStatus.ATTENDED, score: 88, completedDate: daysAgo(15) },
        ],
        createdAt: daysAgo(30),
      },
    ];
  }

  private mockMetrics(): TrainingDashboardMetrics {
    return {
      totalCurricula: 18, activeCurricula: 14,
      totalAssignments: 156, completedAssignments: 112, overdueAssignments: 8,
      complianceRate: 87.5, upcomingSessions: 4,
      byCategory: [
        { category: 'GMP', count: 6 }, { category: 'SOP', count: 4 },
        { category: 'DATA_INTEGRITY', count: 2 }, { category: 'EQUIPMENT', count: 3 },
        { category: 'QUALITY_SYSTEM', count: 2 }, { category: 'SAFETY', count: 1 },
      ],
      byStatus: [
        { status: 'COMPLETED', count: 112 }, { status: 'ASSIGNED', count: 22 },
        { status: 'IN_PROGRESS', count: 14 }, { status: 'OVERDUE', count: 8 },
      ],
      byDepartment: [
        { department: 'Production', compliance: 92 }, { department: 'Quality Assurance', compliance: 95 },
        { department: 'Quality Control', compliance: 88 }, { department: 'Engineering', compliance: 78 },
        { department: 'Warehouse', compliance: 82 },
      ],
    };
  }
}