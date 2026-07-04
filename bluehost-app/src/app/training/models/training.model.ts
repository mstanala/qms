export interface UserRef {
  id: string;
  displayName: string;
  email: string;
}

export enum TrainingCategory {
  GMP = 'GMP',
  SOP = 'SOP',
  SAFETY = 'SAFETY',
  REGULATORY = 'REGULATORY',
  EQUIPMENT = 'EQUIPMENT',
  QUALITY_SYSTEM = 'QUALITY_SYSTEM',
  DATA_INTEGRITY = 'DATA_INTEGRITY',
  PROCESS = 'PROCESS',
  SOFT_SKILLS = 'SOFT_SKILLS',
}

export enum TrainingType {
  CLASSROOM = 'CLASSROOM',
  ON_THE_JOB = 'ON_THE_JOB',
  SELF_STUDY = 'SELF_STUDY',
  E_LEARNING = 'E_LEARNING',
  EXTERNAL = 'EXTERNAL',
  WORKSHOP = 'WORKSHOP',
}

export enum CurriculumStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UNDER_REVISION = 'UNDER_REVISION',
  RETIRED = 'RETIRED',
}

export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  EXPIRED = 'EXPIRED',
}

export enum AssignmentReason {
  INITIAL = 'INITIAL',
  PERIODIC_RETRAINING = 'PERIODIC_RETRAINING',
  SOP_REVISION = 'SOP_REVISION',
  CAPA_ACTION = 'CAPA_ACTION',
  DEVIATION_FOLLOW_UP = 'DEVIATION_FOLLOW_UP',
  ROLE_CHANGE = 'ROLE_CHANGE',
  NEW_HIRE = 'NEW_HIRE',
  REGULATORY_UPDATE = 'REGULATORY_UPDATE',
}

export enum TrainingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AttendanceStatus {
  REGISTERED = 'REGISTERED',
  ATTENDED = 'ATTENDED',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
}

export interface TrainingCurriculum {
  id: string;
  curriculumNumber: string;
  title: string;
  description?: string;
  category: TrainingCategory;
  trainingType: TrainingType;
  departmentId: string;
  departmentName: string;
  plantSiteId: string;
  plantSiteName: string;
  status: CurriculumStatus;
  durationHours: number;
  validityMonths: number;
  passingScore?: number;
  owner: UserRef;
  relatedDocumentId?: string;
  relatedDocumentNumber?: string;
  regulatoryReference?: string;
  effectiveDate?: Date;
  retiredDate?: Date;
  assignments?: TrainingAssignment[];
  sessions?: TrainingSession[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingAssignment {
  id: string;
  curriculum?: TrainingCurriculum;
  curriculumId: string;
  curriculumTitle: string;
  curriculumNumber: string;
  trainee: UserRef;
  assignedBy: UserRef;
  status: AssignmentStatus;
  reason: AssignmentReason;
  priority: TrainingPriority;
  assignedDate: Date;
  dueDate: Date;
  completedDate?: Date;
  score?: number;
  trainerName?: string;
  trainerSignatureDate?: Date;
  traineeSignatureDate?: Date;
  comments?: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  relatedRecordNumber?: string;
}

export interface TrainingMatrix {
  id: string;
  jobRoleId: string;
  jobRoleName: string;
  curriculumId: string;
  curriculumTitle: string;
  curriculumNumber: string;
  departmentId: string;
  departmentName: string;
  mandatory: boolean;
  frequencyMonths?: number;
}

export interface TrainingSession {
  id: string;
  curriculumId: string;
  curriculumTitle: string;
  sessionDate: Date;
  location?: string;
  instructor: UserRef;
  status: SessionStatus;
  maxAttendees?: number;
  attendees?: TrainingSessionAttendee[];
  createdAt: Date;
}

export interface TrainingSessionAttendee {
  id: string;
  trainee: UserRef;
  attendanceStatus: AttendanceStatus;
  score?: number;
  completedDate?: Date;
}

export interface TrainingDashboardMetrics {
  totalCurricula: number;
  activeCurricula: number;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  complianceRate: number;
  upcomingSessions: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byDepartment: { department: string; compliance: number }[];
}