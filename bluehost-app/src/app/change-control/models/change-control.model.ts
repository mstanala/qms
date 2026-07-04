export interface ChangeRequest {
  id: string;
  changeNumber: string;
  title: string;
  description: string;
  justification: string;
  type: ChangeType;
  category: ChangeCategory;
  classification: ChangeClassification;
  status: ChangeStatus;
  priority: ChangePriority;

  // Originator
  requestedById: string;
  requestedByName: string;
  requestedDate: Date;
  department: string;

  // Assignment
  changeOwnerId: string;
  changeOwnerName: string;
  qaReviewerId?: string;
  qaReviewerName?: string;
  raReviewerId?: string;
  raReviewerName?: string;

  // Location
  plantSite: string;
  affectedAreas: string[];

  // Dates
  targetImplementationDate: Date;
  actualImplementationDate?: Date;
  effectivenessCheckDate?: Date;
  closedDate?: Date;

  // Impact Assessment
  impactAssessment: ChangeImpactAssessment;

  // Regulatory
  regulatoryFiling: RegulatoryFilingRequirement;
  validationRequired: boolean;
  validationDetails?: string;

  // Affected Items
  affectedDocuments: AffectedDocument[];
  affectedProducts: AffectedProduct[];
  affectedEquipment: string[];
  affectedProcesses: string[];

  // Implementation
  implementationPlan: ImplementationTask[];
  trainingRequired: boolean;
  trainingPlan?: TrainingRequirement[];

  // Approval
  approvals: ChangeApproval[];

  // Effectiveness
  effectivenessReview?: EffectivenessReview;

  // References
  relatedDeviations: string[];
  relatedCapas: string[];
  relatedChanges: string[];

  // Audit trail
  auditTrail: ChangeAuditEntry[];

  // Workflow
  currentWorkflowStep: string;
  workflowHistory: ChangeWorkflowStep[];

  // Attachments
  attachments: ChangeAttachment[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum ChangeType {
  PROCESS = 'PROCESS',
  EQUIPMENT = 'EQUIPMENT',
  FACILITY = 'FACILITY',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
  MATERIAL = 'MATERIAL',
  SUPPLIER = 'SUPPLIER',
  REGULATORY = 'REGULATORY',
  PACKAGING = 'PACKAGING',
  METHOD = 'METHOD',
}

export enum ChangeCategory {
  PRODUCT = 'PRODUCT',
  NON_PRODUCT = 'NON_PRODUCT',
  QUALITY_SYSTEM = 'QUALITY_SYSTEM',
  REGULATORY_SUBMISSION = 'REGULATORY_SUBMISSION',
  SITE = 'SITE',
  TECHNOLOGY_TRANSFER = 'TECHNOLOGY_TRANSFER',
}

export enum ChangeClassification {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

export enum ChangeStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IMPACT_ASSESSMENT = 'IMPACT_ASSESSMENT',
  QA_REVIEW = 'QA_REVIEW',
  RA_REVIEW = 'RA_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  IMPLEMENTATION = 'IMPLEMENTATION',
  VERIFICATION = 'VERIFICATION',
  EFFECTIVENESS_CHECK = 'EFFECTIVENESS_CHECK',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ChangePriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface ChangeImpactAssessment {
  productQuality: ImpactRating;
  patientSafety: ImpactRating;
  regulatoryCompliance: ImpactRating;
  validationStatus: ImpactRating;
  documentation: ImpactRating;
  training: ImpactRating;
  supplierQualification: ImpactRating;
  stability: ImpactRating;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assessmentSummary: string;
  assessedBy?: string;
  assessedDate?: Date;
}

export enum ImpactRating {
  NO_IMPACT = 'NO_IMPACT',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface RegulatoryFilingRequirement {
  filingRequired: boolean;
  filingType?: FilingType;
  markets?: string[];
  filingDetails?: string;
  targetFilingDate?: Date;
  filingStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED';
}

export enum FilingType {
  CBE_30 = 'CBE_30',
  CBE_0 = 'CBE_0',
  PAS = 'PAS',
  ANNUAL_REPORT = 'ANNUAL_REPORT',
  VARIATION_TYPE_IA = 'VARIATION_TYPE_IA',
  VARIATION_TYPE_IB = 'VARIATION_TYPE_IB',
  VARIATION_TYPE_II = 'VARIATION_TYPE_II',
  NONE = 'NONE',
}

export interface AffectedDocument {
  documentId: string;
  documentNumber: string;
  documentTitle: string;
  documentType: string;
  currentVersion: string;
  action: 'REVISE' | 'RETIRE' | 'CREATE_NEW' | 'NO_CHANGE';
  newVersion?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface AffectedProduct {
  productName: string;
  productCode: string;
  dosageForm: string;
  markets: string[];
  impactDescription: string;
}

export interface ImplementationTask {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  assignedTo: string;
  department: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  comments?: string;
}

export interface TrainingRequirement {
  id: string;
  trainingTitle: string;
  targetAudience: string;
  department: string;
  trainingType: 'SOP_READ' | 'CLASSROOM' | 'OJT' | 'E_LEARNING' | 'PRACTICAL';
  dueDate: Date;
  completionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completionPercentage: number;
}

export interface ChangeApproval {
  id: string;
  approverName: string;
  approverId: string;
  role: string;
  department: string;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPROVED_WITH_COMMENTS';
  comments?: string;
  decisionDate?: Date;
  electronicSignature?: string;
}

export interface EffectivenessReview {
  reviewDate: Date;
  reviewerId: string;
  reviewerName: string;
  criteria: EffectivenessCriteria[];
  overallEffective: boolean;
  summary: string;
  followUpRequired: boolean;
  followUpActions?: string;
}

export interface EffectivenessCriteria {
  criterion: string;
  met: boolean;
  evidence: string;
}

export interface ChangeAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  comments?: string;
  electronicSignature?: string;
}

export interface ChangeWorkflowStep {
  stepName: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  comments?: string;
}

export interface ChangeAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: Date;
  description?: string;
  category: 'SUPPORTING_DATA' | 'RISK_ASSESSMENT' | 'VALIDATION' | 'REGULATORY' | 'TRAINING' | 'OTHER';
}

export interface ChangeControlListFilter {
  status?: ChangeStatus[];
  classification?: ChangeClassification[];
  type?: ChangeType[];
  priority?: ChangePriority[];
  department?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ChangeControlDashboardMetrics {
  totalOpen: number;
  totalPendingApproval: number;
  totalInImplementation: number;
  totalOverdue: number;
  totalClosedThisMonth: number;
  totalSubmittedThisMonth: number;
  avgCycleTimeDays: number;
  approvalRate: number;
  byStatus: { status: ChangeStatus; count: number }[];
  byType: { type: ChangeType; count: number }[];
  byClassification: { classification: ChangeClassification; count: number }[];
  byPriority: { priority: ChangePriority; count: number }[];
  byDepartment: { department: string; count: number }[];
  trendData: { month: string; submitted: number; closed: number; rejected: number }[];
}
