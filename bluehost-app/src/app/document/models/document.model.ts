export interface QmsDocument {
  id: string;
  documentNumber: string;
  title: string;
  description: string;
  documentType: DocumentType;
  category: string;
  subCategory?: string;
  departmentId: string;
  departmentName: string;
  plantSiteId: string;
  plantSiteName: string;
  owner: UserRef;
  status: DocumentStatus;
  currentVersion: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  nextReviewDate?: Date;
  reviewPeriodMonths: number;
  confidentialityLevel: ConfidentialityLevel;
  regulatoryReference?: string;
  keywords?: string;
  isTemplate: boolean;
  currentWorkflowStep?: string;
  currentCandidateRoles?: string[];
  currentCandidateUsers?: UserRef[];
  reviewCandidateRoles?: string[];
  reviewCandidateUsers?: UserRef[];
  approvalCandidateRoles?: string[];
  approvalCandidateUsers?: UserRef[];
  versions?: DocumentVersion[];
  reviews?: DocumentReview[];
  approvals?: DocumentApproval[];
  distributions?: DocumentDistribution[];
  references?: DocumentReference[];
  auditTrail?: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRef {
  id: string;
  displayName: string;
  email: string;
}

export enum DocumentType {
  SOP = 'SOP',
  WORK_INSTRUCTION = 'WORK_INSTRUCTION',
  BATCH_RECORD = 'BATCH_RECORD',
  PROTOCOL = 'PROTOCOL',
  REPORT = 'REPORT',
  POLICY = 'POLICY',
  FORM = 'FORM',
  SPECIFICATION = 'SPECIFICATION',
  VALIDATION_PROTOCOL = 'VALIDATION_PROTOCOL',
  STANDARD = 'STANDARD',
  GUIDELINE = 'GUIDELINE',
  MANUAL = 'MANUAL',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  EFFECTIVE = 'EFFECTIVE',
  SUPERSEDED = 'SUPERSEDED',
  OBSOLETE = 'OBSOLETE',
  ARCHIVED = 'ARCHIVED',
}

export enum ConfidentialityLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
}

export enum ChangeType {
  NEW = 'NEW',
  MINOR_REVISION = 'MINOR_REVISION',
  MAJOR_REVISION = 'MAJOR_REVISION',
  PERIODIC_REVIEW = 'PERIODIC_REVIEW',
  CORRECTION = 'CORRECTION',
}

export enum ReviewDecision {
  NO_CHANGE_REQUIRED = 'NO_CHANGE_REQUIRED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  OBSOLETE = 'OBSOLETE',
  EXTEND_REVIEW = 'EXTEND_REVIEW',
}

export interface DocumentVersion {
  id: string;
  versionNumber: string;
  majorVersion: number;
  minorVersion: number;
  changeDescription: string;
  changeType: ChangeType;
  status: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  author?: UserRef;
  reviewer?: UserRef;
  approver?: UserRef;
  approvedDate?: Date;
  effectiveDate?: Date;
  supersededDate?: Date;
  createdAt: Date;
}

export interface DocumentReview {
  id: string;
  reviewType: string;
  reviewDueDate: Date;
  reviewCompletedDate?: Date;
  reviewer?: UserRef;
  reviewDecision?: ReviewDecision;
  comments?: string;
  nextReviewDate?: Date;
  status: string;
}

export interface DocumentApproval {
  id: string;
  approver: UserRef;
  role: string;
  approvalOrder: number;
  decision: string;
  comments?: string;
  decisionDate?: Date;
}

export interface DocumentDistribution {
  id: string;
  recipient: UserRef;
  departmentName?: string;
  distributionDate: Date;
  acknowledged: boolean;
  acknowledgedDate?: Date;
  trainingRequired: boolean;
  trainingCompleted: boolean;
}

export interface DocumentReference {
  id: string;
  targetDocumentId: string;
  targetDocumentNumber: string;
  targetDocumentTitle: string;
  referenceType: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  comments?: string;
}

export interface DocumentListFilter {
  status?: DocumentStatus[];
  documentType?: DocumentType[];
  category?: string;
  departmentId?: string;
  confidentialityLevel?: ConfidentialityLevel;
  search?: string;
  reviewDue?: boolean;
}

export interface DocumentDashboardMetrics {
  totalDocuments: number;
  effectiveDocuments: number;
  draftDocuments: number;
  pendingReview: number;
  pendingApproval: number;
  overdueReviews: number;
  expiringNext30Days: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byDepartment: { department: string; count: number }[];
}
